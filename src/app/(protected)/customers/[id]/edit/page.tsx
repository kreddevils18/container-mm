import { notFound } from "next/navigation";
import type { ReactElement } from "react";

import { PageHeader } from "@/components/common/page-header";
import { CustomerEditForm } from "@/components/customers/customer-edit-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCustomer } from "@/services/customers/getCustomer";

interface EditCustomerPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditCustomerPage({
  params,
}: EditCustomerPageProps): Promise<ReactElement> {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const customer = await getCustomer(id);

    if (!customer) {
      notFound();
    }

    return (
      <div className="container mx-auto py-6 max-w-2xl space-y-6">
        <PageHeader
          title="Chỉnh sửa khách hàng"
          description={`Cập nhật thông tin khách hàng ${customer.name}`}
          backButton={{
            href: `/customers/${id}`,
            label: "Quay lại",
          }}
        />

        <Card>
          <CardHeader>
            <CardTitle>Thông tin khách hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerEditForm
              customer={customer}
              customerId={id}
            />
          </CardContent>
        </Card>
      </div>
    );
  } catch {
    notFound();
  }
}
