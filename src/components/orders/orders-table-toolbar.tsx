"use client";

import type { Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ReactElement } from "react";
import { useRef } from "react";
import { CustomerCombobox } from "@/components/customers/customer-combobox";
import { Button } from "@/components/ui/button";
import { DataTableFacetedFilter } from "@/components/ui/data-table-faceted-filter";
import {
  createTextFilterConfig,
  DataTableTextFilter,
} from "@/components/ui/data-table-text-filter";
import { DataTableViewOptions } from "@/components/ui/data-table-view-options";
import { VehicleCombobox } from "@/components/vehicles/vehicle-combobox";
import { ORDER_STATUS_LABELS } from "@/schemas/order";
import type { OrderRow } from "./order-columns";
import {
  type DateRangePickerRef,
  OrderDateRangePicker,
} from "./order-date-range-picker";

// Order status options for filtering
const ORDER_STATUS_OPTIONS = Object.entries(ORDER_STATUS_LABELS).map(
  ([value, label]) => ({
    label,
    value,
  })
);

interface OrdersTableToolbarProps {
  table: Table<OrderRow>;
  isLoading?: boolean;
}

export const OrdersTableToolbar = ({
  table,
  isLoading = false,
}: OrdersTableToolbarProps): ReactElement => {
  const router = useRouter();
  const sp = useSearchParams();
  const dateRangePickerRef = useRef<DateRangePickerRef>(null);
  const searchConfig = createTextFilterConfig(
    "Tìm kiếm mã container, khách hàng"
  );

  const handleSearchChange = (value: string | null) => {
    const u = new URLSearchParams(sp.toString());
    if (value) u.set("q", value);
    else u.delete("q");
    u.set("page", "1");
    router.replace(`?${u.toString()}`);
  };

  const handleCustomerChange = (customerId: string) => {
    const u = new URLSearchParams(sp.toString());
    if (customerId) u.set("customerId", customerId);
    else u.delete("customerId");
    u.set("page", "1");
    router.replace(`?${u.toString()}`);
  };

  const handleVehicleChange = (vehicleId: string) => {
    const u = new URLSearchParams(sp.toString());
    if (vehicleId) u.set("vehicleId", vehicleId);
    else u.delete("vehicleId");
    u.set("page", "1");
    router.replace(`?${u.toString()}`);
  };

  const clearAllFilters = () => {
    dateRangePickerRef.current?.reset();
    const u = new URLSearchParams(sp.toString());
    u.delete("q");
    u.delete("status");
    u.delete("customerId");
    u.delete("vehicleId");
    u.delete("from");
    u.delete("to");
    u.set("page", "1");
    router.replace(`?${u.toString()}`);
  };

  const hasFilters = Boolean(
    sp.get("q") ||
    sp.getAll("status").length > 0 ||
    sp.get("customerId") ||
    sp.get("vehicleId") ||
    sp.get("from") ||
    sp.get("to")
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[200px_1fr] gap-x-6 gap-y-4 items-center">
        <div className="text-sm font-medium">Tìm kiếm đơn hàng</div>
        <div>
          <DataTableTextFilter
            config={searchConfig}
            value={sp.get("q")}
            onChange={handleSearchChange}
            disabled={isLoading}
            loading={isLoading}
          />
        </div>

        <div className="text-sm font-medium">Trạng thái</div>
        <div>
          <DataTableFacetedFilter
            keyName="status"
            title="Trạng thái"
            options={ORDER_STATUS_OPTIONS}
          />
        </div>

        <div className="text-sm font-medium">Khách hàng</div>
        <div>
          <CustomerCombobox
            value={sp.get("customerId") || ""}
            onValueChange={handleCustomerChange}
            placeholder="Chọn khách hàng..."
            disabled={isLoading}
            width="280px"
          />
        </div>

        <div className="text-sm font-medium">Phương tiện</div>
        <div>
          <VehicleCombobox
            value={sp.get("vehicleId") || ""}
            onValueChange={handleVehicleChange}
            placeholder="Chọn phương tiện..."
            disabled={isLoading}
            width="280px"
          />
        </div>

        <div className="text-sm font-medium">Ngày tạo đơn hàng</div>
        <div>
          <OrderDateRangePicker ref={dateRangePickerRef} />
        </div>

        {hasFilters && (
          <>
            <div></div>
            <div>
              <Button
                variant="ghost"
                onClick={clearAllFilters}
                className="h-8 px-2 lg:px-3"
                disabled={isLoading}
              >
                Xóa bộ lọc
                <X className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </>
        )}
        <div></div>
        <div>
          <DataTableViewOptions table={table} />
        </div>
      </div>
    </div>
  );
};
