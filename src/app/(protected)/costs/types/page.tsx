import { Plus } from "lucide-react";
import Link from "next/link";
import { type ReactElement, Suspense } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { getCostTypes } from "@/services/cost-types";
import { CostTypesExportButton } from "@/components/cost-types/cost-types-export-button";
import { CostTypesDataTable } from "@/components/cost-types/cost-types-data-table";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CostTypesPage({
  searchParams,
}: PageProps): Promise<ReactElement> {
  const data = await getCostTypes(await searchParams);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý loại chi phí"
        description="Danh sách và quản lý các loại chi phí trong hệ thống"
        actions={
          <div className="flex items-center gap-2">
            <CostTypesExportButton />
            <CreateCostTypeButton />
          </div>
        }
      />

      <Suspense fallback={<TableSkeleton />}>
        <CostTypesDataTable data={data} />
      </Suspense>
    </div>
  );
}

function CreateCostTypeButton(): ReactElement {
  return (
    <Button asChild size="sm">
      <Link href="/costs/types/create">
        <Plus className="mr-2 h-4 w-4" />
        Thêm loại chi phí
      </Link>
    </Button>
  );
}
