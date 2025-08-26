import { notFound } from "next/navigation";
import type { ReactElement } from "react";

import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VehicleEditForm } from "@/components/vehicles/vehicle-edit-form";
import { getVehicle } from "@/services/vehicles/getVehicle";

interface EditVehiclePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditVehiclePage({
  params,
}: EditVehiclePageProps): Promise<ReactElement> {
  const { id } = await params;

  try {
    const vehicle = await getVehicle(id);
    if (!vehicle) notFound()

    return (
      <div className="container mx-auto py-6 max-w-2xl space-y-6">
        <PageHeader
          title="Chỉnh sửa phương tiện"
          description={`Cập nhật thông tin phương tiện ${vehicle.licensePlate}`}
          backButton={{
            href: `/vehicles/${id}`,
            label: "Quay lại",
          }}
        />

        <Card>
          <CardHeader>
            <CardTitle>Thông tin phương tiện</CardTitle>
          </CardHeader>
          <CardContent>
            <VehicleEditForm
              vehicle={vehicle}
              vehicleId={id}
            />
          </CardContent>
        </Card>
      </div>
    );
  } catch (_error) {
    notFound();
  }
}