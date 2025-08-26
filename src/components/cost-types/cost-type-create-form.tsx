"use client";

import type { ReactElement } from "react";

import { CostTypeForm } from "./cost-type-form";
import type { CreateCostTypeRequest } from "@/schemas/cost-type";

const DEFAULT_COST_TYPE_CREATE_DATA: CreateCostTypeRequest = {
  name: "",
  description: "",
  category: "vehicle",
  status: "active",
};

interface CostTypeCreateFormProps {
  /** Server action for form submission */
  action?: (formData: FormData) => void;
  /** Server state from form action */
  state?: {
    success?: boolean;
    error?: string;
    fieldErrors?: Record<string, string[]>;
  };
  /** Client-side submit handler */
  onSubmit?: (data: CreateCostTypeRequest) => Promise<void>;
  /** Cancel handler */
  onCancel?: () => void;
  /** Loading state */
  isLoading?: boolean;
}

export const CostTypeCreateForm = ({
  action,
  state,
  onSubmit,
  onCancel,
  isLoading = false,
}: CostTypeCreateFormProps): ReactElement => {
  return (
    <CostTypeForm
      defaultValues={DEFAULT_COST_TYPE_CREATE_DATA}
      {...(action && { action })}
      {...(state && { state })}
      {...(onSubmit && { onSubmit })}
      {...(onCancel && { onCancel })}
      {...(isLoading !== undefined && { isLoading })}
      submitText="Tạo loại chi phí"
      submitLoadingText="Đang tạo..."
    />
  );
};