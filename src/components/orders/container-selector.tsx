"use client";

import { Minus, Package, Plus } from "lucide-react";
import type { ReactElement } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CONTAINER_TYPE_DIMENSIONS } from "@/schemas/order";

interface ContainerData {
  containerType: "D2" | "D4" | "R2" | "R4";
  quantity: number;
}

interface ContainerSelectorProps {
  value: ContainerData[];
  onChange: (containers: ContainerData[]) => void;
  disabled?: boolean;
}

export const ContainerSelector = ({
  value,
  onChange,
  disabled = false,
}: ContainerSelectorProps): ReactElement => {
  const containerTypes: Array<"D2" | "D4" | "R2" | "R4"> = [
    "D2",
    "D4",
    "R2",
    "R4",
  ];

  const getQuantity = (type: "D2" | "D4" | "R2" | "R4"): number => {
    const container = value.find((c) => c.containerType === type);
    return container?.quantity || 0;
  };

  const updateQuantity = (
    type: "D2" | "D4" | "R2" | "R4",
    newQuantity: number
  ): void => {
    const updatedContainers = [...value];
    const existingIndex = updatedContainers.findIndex(
      (c) => c.containerType === type
    );

    if (newQuantity === 0) {
      if (existingIndex >= 0) {
        updatedContainers.splice(existingIndex, 1);
      }
    } else {
      if (existingIndex >= 0 && updatedContainers[existingIndex]) {
        updatedContainers[existingIndex]!.quantity = newQuantity;
      } else {
        updatedContainers.push({ containerType: type, quantity: newQuantity });
      }
    }

    onChange(updatedContainers);
  };

  const incrementQuantity = (type: "D2" | "D4" | "R2" | "R4"): void => {
    const currentQuantity = getQuantity(type);
    updateQuantity(type, currentQuantity + 1);
  };

  const decrementQuantity = (type: "D2" | "D4" | "R2" | "R4"): void => {
    const currentQuantity = getQuantity(type);
    if (currentQuantity > 0) {
      updateQuantity(type, currentQuantity - 1);
    }
  };

  const totalContainers = value.reduce(
    (sum, container) => sum + container.quantity,
    0
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Quản lý Container
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {containerTypes.map((type) => {
          const quantity = getQuantity(type);
          return (
            <div
              key={type}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <Package className="h-10 w-10 text-muted-foreground" />
                <div>
                  <div className="font-medium text-base">{type}</div>
                  <div className="text-sm text-muted-foreground">
                    {CONTAINER_TYPE_DIMENSIONS[type]}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground mr-2">
                  Số lượng
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => decrementQuantity(type)}
                  disabled={disabled || quantity === 0}
                  type="button"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="min-w-[2rem] text-center font-medium">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => incrementQuantity(type)}
                  disabled={disabled}
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}

        <div className="border-t pt-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">Tổng kết</span>
            <span className="font-semibold">
              Tổng: {totalContainers} containers
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
