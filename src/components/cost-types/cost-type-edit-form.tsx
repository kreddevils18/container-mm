"use client";

import type { ReactElement } from "react";
import { useActionState } from "react";

import { CostTypeForm } from "./cost-type-form";
import type { CostType } from "@/drizzle/schema";
import type { CreateCostTypeRequest } from "@/schemas/cost-type";
import {
  type UpdateCostTypeActionState,
  updateCostTypeAction,
} from "@/app/(protected)/costs/types/updateCostTypeAction";

interface CostTypeEditFormProps {
  costType: CostType;
  costTypeId: string;
}

export function CostTypeEditForm({
  costType,
  costTypeId,
}: CostTypeEditFormProps): ReactElement {
  const initialState: UpdateCostTypeActionState = {};
  const [state, formAction] = useActionState(
    updateCostTypeAction.bind(null, costTypeId),
    initialState
  );

  const defaultValues: CreateCostTypeRequest = {
    name: costType.name,
    description: costType.description || "",
    category: costType.category as "vehicle" | "order",
    status: costType.status,
  };

  return (
    <CostTypeForm
      defaultValues={defaultValues}
      action={formAction}
      state={state}
      submitText="Cập nhật"
      submitLoadingText="Đang cập nhật..."
    />
  );
}