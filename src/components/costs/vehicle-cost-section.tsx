"use client";

import { DollarSign, Plus } from "lucide-react";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VehicleCostDialog } from "./vehicle-cost-dialog";
import { VehicleCostEditDialog } from "./vehicle-cost-edit-dialog";
import { VehicleCostsTable } from "./vehicle-costs-table";

interface CostType {
  id: string;
  name: string;
  category: "vehicle" | "order";
  status: "active" | "inactive";
}

interface CostWithDetails {
  id: string;
  costTypeId: string;
  costTypeName: string;
  costTypeCategory: "vehicle" | "order";
  vehicleId: string | null;
  orderId: string | null;
  amount: string;
  costDate: string;
  paymentDate?: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

interface VehicleCostSectionProps {
  vehicleId: string;
}

export function VehicleCostSection({
  vehicleId,
}: VehicleCostSectionProps): ReactElement {
  const [showCreateCostDialog, setShowCreateCostDialog] = useState(false);
  const [showEditCostDialog, setShowEditCostDialog] = useState(false);
  const [editingCost, setEditingCost] = useState<CostWithDetails | null>(null);
  const [costTypes, setCostTypes] = useState<CostType[]>([]);
  const [isLoadingCostTypes, setIsLoadingCostTypes] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchCostTypes = async (): Promise<void> => {
      try {
        setIsLoadingCostTypes(true);
        const response = await fetch(
          "/api/costs/types?category=vehicle&status=active"
        );
        const result = await response.json();

        if (response.ok) {
          setCostTypes(result.data || []);
        } else {
          setCostTypes([]);
        }
      } catch (_error) {
        setCostTypes([]);
      } finally {
        setIsLoadingCostTypes(false);
      }
    };

    fetchCostTypes();
  }, []);

  const handleCostCreated = (): void => {
    setRefreshTrigger((prev) => prev + 1);
    setShowCreateCostDialog(false);
  };

  const handleCreateCostClick = (): void => {
    setShowCreateCostDialog(true);
  };

  const handleEditCost = (cost: CostWithDetails): void => {
    setEditingCost(cost);
    setShowEditCostDialog(true);
  };

  const handleCostUpdated = (): void => {
    setRefreshTrigger((prev) => prev + 1);
    setShowEditCostDialog(false);
    setEditingCost(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Chi phí phương tiện
            </div>
            <Button
              onClick={handleCreateCostClick}
              size="sm"
              disabled={isLoadingCostTypes}
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm chi phí
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <VehicleCostsTable
            vehicleId={vehicleId}
            refreshTrigger={refreshTrigger}
            onEdit={handleEditCost}
            showActions={true}
          />
        </CardContent>
      </Card>

      <VehicleCostDialog
        vehicleId={vehicleId}
        isOpen={showCreateCostDialog}
        onOpenChange={setShowCreateCostDialog}
        costTypes={costTypes}
        onSuccess={handleCostCreated}
      />

      <VehicleCostEditDialog
        cost={editingCost}
        isOpen={showEditCostDialog}
        onOpenChange={setShowEditCostDialog}
        costTypes={costTypes}
        onSuccess={handleCostUpdated}
      />
    </>
  );
}
