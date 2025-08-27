"use client";

import { Plus } from "lucide-react";
import type { ReactElement } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Cost, CostType } from "@/drizzle/schema";
import { CostCreateDialog } from "./cost-create-dialog";
import { CostEditDialog } from "./cost-edit-dialog";
import { CostTable } from "./cost-table";
import { VehicleDetailExportButton } from "../vehicles/vehicle-detail-export-button";

interface CostSectionProps {
  title: string;
  entityId: string;
  entityType: "order" | "vehicle";
  costs: Cost[];
  costTypes: CostType[];
  allowEditing?: boolean;
  showCreateButton?: boolean;
  onCostChange?: () => void;
  isLoading?: boolean;
}

export function CostSection({
  title,
  entityId,
  entityType,
  costs,
  costTypes,
  allowEditing = true,
  showCreateButton = true,
  onCostChange,
  isLoading = false,
}: CostSectionProps): ReactElement {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<Cost | null>(null);

  const handleCostCreated = (): void => {
    setIsCreateDialogOpen(false);
    onCostChange?.();
  };

  const handleCostUpdated = (): void => {
    setEditingCost(null);
    onCostChange?.();
  };

  const handleCostDeleted = (): void => {
    onCostChange?.();
  };

  const handleEditCost = (cost: Cost): void => {
    if (allowEditing) {
      setEditingCost(cost);
    }
  };

  const filteredCostTypes = costTypes.filter(
    (costType) =>
      costType.category === entityType && costType.status === "active"
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>
            Quản lý chi phí {entityType === "order" ? "đơn hàng" : "xe"}
          </CardDescription>
        </div>
        <div className="flex gap-2">
          {entityType === "vehicle" && costs.length > 0 && (
            <VehicleDetailExportButton vehicleId={entityId} />
          )}
          
          {allowEditing && showCreateButton && (
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Thêm chi phí
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <CostTable
          costs={costs}
          costTypes={costTypes}
          entityId={entityId}
          entityType={entityType}
          isLoading={isLoading}
          showActions={allowEditing}
          onEdit={handleEditCost}
          onDelete={handleCostDeleted}
        />
      </CardContent>

      {allowEditing && (
        <CostCreateDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          entityId={entityId}
          entityType={entityType}
          costTypes={filteredCostTypes}
          onSuccess={handleCostCreated}
        />
      )}

      {allowEditing && editingCost && (
        <CostEditDialog
          open={Boolean(editingCost)}
          onOpenChange={(open) => !open && setEditingCost(null)}
          cost={editingCost}
          costTypes={filteredCostTypes}
          onSuccess={handleCostUpdated}
        />
      )}
    </Card>
  );
}
