"use client";

import type { ReactElement } from "react";
import type { CreateCustomerRequest } from "@/schemas";
import { CustomerForm } from "./customer-form";

const DEFAULT_CUSTOMER_CREATE_DATA: CreateCustomerRequest = {
  name: "",
  email: "",
  address: "",
  phone: "",
  taxId: "",
  status: "active",
};

interface CustomerCreateFormProps {
  action: (formData: FormData) => void;
  state: {
    success?: boolean;
    error?: string;
    fieldErrors?: Record<string, string[]>;
  };
  onSubmit?: (data: CreateCustomerRequest) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const CustomerCreateForm = ({
  action,
  state,
  onSubmit,
  onCancel,
  isLoading = false,
}: CustomerCreateFormProps): ReactElement => {
  return (
    <CustomerForm
      defaultValues={DEFAULT_CUSTOMER_CREATE_DATA}
      action={action}
      state={state}
      onSubmit={onSubmit}
      onCancel={onCancel}
      isLoading={isLoading}
      submitText="Tạo khách hàng"
      submitLoadingText="Đang tạo..."
    />
  );
};
