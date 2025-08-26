import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { PageHeader } from "@/components/common/page-header";
import { OrderDetail } from "@/components/orders/order-detail";
import { getCostTypes } from "@/services/cost-types";
import { getOrder } from "@/services/orders";

interface OrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: OrderDetailPageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const order = await getOrder(id);
    if (!order) {
      return {
        title: "Đơn hàng không tồn tại | Container MM",
        description:
          "Không tìm thấy thông tin đơn hàng trong hệ thống quản lý vận tải Container MM.",
        robots: { index: false, follow: false },
      };
    }

    const orderLabel = order.containerCode ?? `#${id}`;
    const title = `Đơn hàng ${orderLabel} - Chi tiết | Container MM`;
    const description = `Thông tin chi tiết đơn hàng ${orderLabel}${order?.customerName ? ` - Khách hàng: ${order.customerName}` : ""
      } trong hệ thống Container MM.`;

    return {
      title,
      description,
      keywords: [
        "đơn hàng",
        "order",
        "vận tải",
        "container",
        "logistics",
        "quản lý đơn hàng",
        orderLabel.toString(),
        ...(order?.customerName ? [order.customerName] : []),
      ],
      openGraph: {
        title: `Đơn hàng ${orderLabel} - Container MM`,
        description,
        type: "article",
        locale: "vi_VN",
      },
      twitter: {
        card: "summary",
        title: `Đơn hàng ${orderLabel} - Container MM`,
        description,
      },
      robots: { index: false, follow: false },
    };
  } catch {
    return {
      title: "Đơn hàng không tồn tại | Container MM",
      description:
        "Không tìm thấy thông tin đơn hàng trong hệ thống quản lý vận tải Container MM.",
      robots: { index: false, follow: false },
    };
  }
}

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps): Promise<ReactElement> {
  const { id } = await params;

  try {
    const [order, costTypesResult] = await Promise.all([
      getOrder(id),
      getCostTypes({ category: ["order"], status: ["active"], per_page: 100 }),
    ]);

    if (!order) return notFound();

    const orderLabel = order.id ?? `#${id}`;

    return (
      <div className="container mx-auto py-6 max-w-4xl space-y-6">
        <PageHeader
          title={`Chi tiết đơn hàng ${orderLabel}`}
          description="Thông tin chi tiết đơn hàng vận chuyển"
          backButton={{
            href: "/orders",
            label: "Quay lại",
          }}
        />

        <OrderDetail order={order} costTypes={costTypesResult.rows} />
      </div>
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Order not found") {
      notFound();
    }
    throw error;
  }
}
