"use client";

import type { ReactElement } from "react";
import { useActionState } from "react";

import { CustomerForm } from "./customer-form";
import type { Customer } from "@/drizzle/schema";
import type { CreateCustomerRequest } from "@/schemas";
import {
  type UpdateCustomerActionState,
  updateCustomerAction,
} from "@/app/(protected)/customers/updateCustomerAction";

interface CustomerEditFormProps {
  customer: Customer;
  customerId: string;
}

export function CustomerEditForm({
  customer,
  customerId,
}: CustomerEditFormProps): ReactElement {
  const initialState: UpdateCustomerActionState = {};
  const [state, formAction] = useActionState(
    updateCustomerAction.bind(null, { customerId }),
    initialState
  );

  const defaultValues: CreateCustomerRequest = {
    name: customer.name,
    email: customer.email || "",
    address: customer.address,
    phone: customer.phone || "",
    taxId: customer.taxId || "",
    status: customer.status,
  };

  return (
    <CustomerForm
      defaultValues={defaultValues}
      action={formAction}
      state={state}
      submitText="Cập nhật"
      submitLoadingText="Đang cập nhật..."
    />
  );
}