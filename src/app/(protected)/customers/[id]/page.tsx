import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { PageHeader } from "@/components/common/page-header";
import { CustomerDetail } from "@/components/customers/customer-detail";
import { getCustomer } from "@/services/customers";

interface CustomerDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata(
  { params }: CustomerDetailPageProps
): Promise<Metadata> {
  const { id } = await params;

  try {
    const customer = await getCustomer(id);
    if (!customer) {
      return {
        title: "Khách hàng không tồn tại | Container MM",
        description:
          "Không tìm thấy thông tin khách hàng trong hệ thống quản lý vận tải Container MM.",
        robots: { index: false, follow: false },
      };
    }

    const title = `${customer.name} - Chi tiết khách hàng | Container MM`;
    const description = `Thông tin chi tiết của khách hàng ${customer.name} - Địa chỉ: ${customer.address}. Hệ thống quản lý vận tải Container MM.`;

    return {
      title,
      description,
      keywords: [
        "khách hàng",
        customer.name,
        "vận tải",
        "container",
        "logistics",
        "quản lý khách hàng",
      ],
      openGraph: {
        title: `${customer.name} - Container MM`,
        description: `Thông tin khách hàng: ${customer.name}, địa chỉ tại ${customer.address}`,
        type: "profile",
        locale: "vi_VN",
      },
      twitter: {
        card: "summary",
        title: `${customer.name} - Container MM`,
        description: `Thông tin khách hàng: ${customer.name}`,
      },
      robots: { index: false, follow: false },
    };
  } catch {
    return {
      title: "Khách hàng không tồn tại | Container MM",
      description:
        "Không tìm thấy thông tin khách hàng trong hệ thống quản lý vận tải Container MM.",
      robots: { index: false, follow: false },
    };
  }
}

export default async function CustomerDetailPage({
  params,
}: CustomerDetailPageProps): Promise<ReactElement> {
  const { id } = await params;

  try {
    const customer = await getCustomer(id);
    if (!customer) {
      return notFound()
    }

    return (
      <div className="container mx-auto py-6 max-w-4xl space-y-6">
        <PageHeader
          title={customer?.name}
          description="Chi tiết thông tin khách hàng"
          backButton={{
            href: "/customers",
            label: "Quay lại",
          }}
        />

        <CustomerDetail customer={customer} />
      </div>
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Customer not found") {
      notFound();
    }
    throw error;
  }
}
