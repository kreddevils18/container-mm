import type { ReactElement } from "react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderEditForm } from "@/components/orders/order-edit-form";
import { getOrder } from "@/services/orders";

interface EditOrderPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditOrderPage({
  params,
}: EditOrderPageProps): Promise<ReactElement> {
  const { id } = await params;
  
  let order: Awaited<ReturnType<typeof getOrder>> | null = null;
  try {
    order = await getOrder(id);
  } catch {
    redirect("/orders");
  }

  if (!order) {
    redirect("/orders");
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl space-y-6">
      <PageHeader
        title="Chỉnh sửa đơn hàng"
        description={`Cập nhật thông tin đơn hàng #${order.id}`}
        backButton={{
          href: `/orders/${id}`,
          label: "Quay lại",
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Thông tin đơn hàng</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderEditForm
            order={order}
            orderId={id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
