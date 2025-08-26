import { Plus } from "lucide-react";
import Link from "next/link";
import type { ReactElement } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { VehiclesDataTable } from "@/components/vehicles/vehicles-data-table";
import { VehiclesExportButton } from "@/components/vehicles/vehicles-export-button";
import { getVehicles } from "@/services/vehicles";

export default async function VehiclesPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<ReactElement> {
  const sp = (await searchParams) ?? {}
  const data = await getVehicles(sp);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý phương tiện"
        description="Danh sách và quản lý thông tin phương tiện vận tải"
        actions={
          <div className="flex items-center gap-2">
            <VehiclesExportButton />
            <CreateVehicleButton />
          </div>
        }
      />

      <VehiclesDataTable data={data} />
    </div>
  );
}

function CreateVehicleButton(): ReactElement {
  return (
    <Button asChild size="sm">
      <Link href="/vehicles/create">
        <Plus className="mr-2 h-4 w-4" />
        Thêm phương tiện
      </Link>
    </Button>
  );
}
