import { Plus } from "lucide-react";
import Link from "next/link";
import { type ReactElement, Suspense } from "react";
import { PageHeader } from "@/components/common/page-header";
import { CustomersDataTable } from "@/components/customers/customers-data-table";
import { CustomersExportButton } from "@/components/customers/customers-export-button";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { getCustomers } from "@/services/customers";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}): Promise<ReactElement> {
  const sp = (await searchParams) ?? {};
  const data = await getCustomers(sp);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý khách hàng"
        description="Danh sách và quản lý thông tin khách hàng"
        actions={
          <div className="flex items-center gap-2">
            <CustomersExportButton />
            <CreateCustomerButton />
          </div>
        }
      />

      <Suspense fallback={<TableSkeleton />}>
        <CustomersDataTable data={data} />
      </Suspense>
    </div>
  );
}

function CreateCustomerButton(): ReactElement {
  return (
    <Button asChild size="sm">
      <Link href="/customers/create">
        <Plus className="mr-2 h-4 w-4" />
        Thêm khách hàng
      </Link>
    </Button>
  );
}
