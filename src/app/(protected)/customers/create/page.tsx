"use client";

import { useActionState } from "react";
import type { ReactElement } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerCreateForm } from "@/components/customers/customer-create-form";
import { createCustomerAction, type CreateCustomerActionState } from "../createCustomerAction";

export default function CreateCustomerPage(): ReactElement {
  const initialState: CreateCustomerActionState = {};
  const [state, formAction] = useActionState(createCustomerAction, initialState);

  return (
    <div className="container mx-auto py-6 max-w-2xl space-y-6">
      <PageHeader
        title="Thêm khách hàng mới"
        description="Nhập thông tin để tạo khách hàng mới"
        backButton={{
          href: "/customers",
          label: "Quay lại",
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Thông tin khách hàng</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerCreateForm
            action={formAction}
            state={state}
          />
        </CardContent>
      </Card>
    </div>
  );
}
