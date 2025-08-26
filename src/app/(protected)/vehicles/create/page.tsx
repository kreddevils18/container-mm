"use client";

import { useActionState } from "react";
import type { ReactElement } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VehicleCreateForm } from "@/components/vehicles/vehicle-create-form";
import { createVehicleAction, type CreateVehicleActionState } from "../actions";

export default function CreateVehiclePage(): ReactElement {
  const initialState: CreateVehicleActionState = {};
  const [state, formAction] = useActionState(createVehicleAction, initialState);

  return (
    <div className="container mx-auto py-6 max-w-2xl space-y-6">
      <PageHeader
        title="Thêm phương tiện mới"
        description="Nhập thông tin để tạo phương tiện vận tải mới"
        backButton={{
          href: "/vehicles",
          label: "Quay lại",
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Thông tin phương tiện</CardTitle>
        </CardHeader>
        <CardContent>
          <VehicleCreateForm
            action={formAction}
            state={state}
          />
        </CardContent>
      </Card>
    </div>
  );
}