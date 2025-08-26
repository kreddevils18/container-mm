"use client";

import { useActionState } from "react";
import type { ReactElement } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CostTypeCreateForm } from "@/components/cost-types/cost-type-create-form";
import { createCostTypeAction, type CreateCostTypeActionState } from "../actions";

export default function CreateCostTypePage(): ReactElement {
  const initialState: CreateCostTypeActionState = {};
  const [state, formAction] = useActionState(createCostTypeAction, initialState);

  return (
    <div className="container mx-auto py-6 max-w-2xl space-y-6">
      <PageHeader
        title="Thêm loại chi phí mới"
        description="Nhập thông tin để tạo loại chi phí mới"
        backButton={{
          href: "/costs/types",
          label: "Quay lại",
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Thông tin loại chi phí</CardTitle>
        </CardHeader>
        <CardContent>
          <CostTypeCreateForm
            action={formAction}
            state={state}
          />
        </CardContent>
      </Card>
    </div>
  );
}