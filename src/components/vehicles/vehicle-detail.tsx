"use client";

import { CreditCard, Hash, Phone, User } from "lucide-react";
import type { ReactElement } from "react";
import { useState, useEffect, useCallback } from "react";
import { CostSection } from "@/components/costs/cost-section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Vehicle, Cost, CostType } from "@/drizzle/schema";
import { VehicleStatusBadge } from "./vehicle-status-badge";

interface VehicleDetailProps {
  vehicle: Vehicle;
  costTypes: CostType[];
}

export function VehicleDetail({ vehicle, costTypes }: VehicleDetailProps): ReactElement {
  const [vehicleCosts, setVehicleCosts] = useState<Cost[]>([]);
  const [isLoadingCosts, setIsLoadingCosts] = useState(true);

  const handleCostRefresh = useCallback(async (): Promise<void> => {
    setIsLoadingCosts(true);
    try {
      const response = await fetch(`/api/vehicles/${vehicle.id}/costs`);
      if (response.ok) {
        const result = await response.json();
        setVehicleCosts(result.data.costs || []);
      }
    } catch {
      // Error handling is managed by the cost components
      setVehicleCosts([]);
    } finally {
      setIsLoadingCosts(false);
    }
  }, [vehicle.id]);

  useEffect(() => {
    handleCostRefresh();
  }, [handleCostRefresh]);

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Thông tin phương tiện
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-mono font-medium text-lg uppercase">
                {vehicle.licensePlate}
              </p>
              <p className="text-sm text-muted-foreground">Biển số xe</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-4 w-4 text-muted-foreground" />
            <div>
              <VehicleStatusBadge status={vehicle.status} />
              <p className="text-sm text-muted-foreground">Trạng thái</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Thông tin tài xế
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">{vehicle.driverName}</p>
              <p className="text-sm text-muted-foreground">Tên tài xế</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-mono font-medium">{vehicle.driverPhone}</p>
              <p className="text-sm text-muted-foreground">Số điện thoại</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-mono font-medium">{vehicle.driverIdCard}</p>
              <p className="text-sm text-muted-foreground">Số chứng minh thư</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <CostSection
        title="Chi phí phương tiện"
        entityId={vehicle.id}
        entityType="vehicle"
        costs={vehicleCosts}
        costTypes={costTypes}
        allowEditing={true}
        showCreateButton={true}
        isLoading={isLoadingCosts}
        onCostChange={handleCostRefresh}
      />
    </div>
  );
}
