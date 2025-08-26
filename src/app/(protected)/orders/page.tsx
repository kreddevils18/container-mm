import { Plus } from "lucide-react";
import Link from "next/link";
import { type ReactElement, Suspense } from "react";
import { PageHeader } from "@/components/common/page-header";
import { OrdersDataTable } from "@/components/orders/orders-data-table";
import { OrdersExportButton } from "@/components/orders/orders-export-button";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { getOrders } from "@/services/orders";

export default async function OrdersPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<ReactElement> {
  const sp = (await searchParams) ?? {};
  const data = await getOrders(sp);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý đơn hàng"
        description="Danh sách và quản lý đơn hàng container"
        actions={
          <div className="flex items-center gap-2">
            <OrdersExportButton />
            <CreateOrderButton />
          </div>
        }
      />

      <Suspense fallback={<TableSkeleton />}>
        <OrdersDataTable data={data} />
      </Suspense>
    </div>
  );
}

function CreateOrderButton(): ReactElement {
  return (
    <Button asChild size="sm">
      <Link href="/orders/create">
        <Plus className="mr-2 h-4 w-4" />
        Tạo đơn hàng
      </Link>
    </Button>
  );
}
