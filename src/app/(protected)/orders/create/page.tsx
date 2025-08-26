"use client";

import type { ReactElement } from "react";
import { useActionState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { OrderCreateForm } from "@/components/orders/order-create-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type CreateOrderActionState,
  createOrderAction,
} from "../createOrderAction";

export default function CreateOrderPage(): ReactElement {
  const initialState: CreateOrderActionState = {};
  const [state, formAction] = useActionState(createOrderAction, initialState);

  return (
    <div className="container mx-auto py-6 max-w-4xl space-y-6">
      <PageHeader
        title="Tạo đơn hàng mới"
        description="Nhập thông tin để tạo đơn hàng vận chuyển mới"
        backButton={{
          href: "/orders",
          label: "Quay lại",
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Thông tin đơn hàng</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderCreateForm
            action={formAction}
            state={state}
          />
        </CardContent>
      </Card>
    </div>
  );
}
