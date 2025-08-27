"use client";

import type { Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import type { ReactElement } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DataTableFacetedFilter } from "@/components/ui/data-table-faceted-filter";
import { DataTableTextFilter, createTextFilterConfig } from "@/components/ui/data-table-text-filter";
import { DataTableViewOptions } from "@/components/ui/data-table-view-options";
import type { CostType } from "@/drizzle/schema";

const COST_TYPE_STATUS_OPTIONS = [
  {
    label: "Hoạt động",
    value: "active",
  },
  {
    label: "Không hoạt động",
    value: "inactive",
  },
];

const COST_TYPE_CATEGORY_OPTIONS = [
  {
    label: "Phương tiện",
    value: "vehicle",
  },
  {
    label: "Đơn hàng",
    value: "order",
  },
];

interface CostTypesTableToolbarProps {
  table: Table<CostType>;
  isLoading?: boolean;
}

export const CostTypesTableToolbar = ({
  table,
  isLoading = false,
}: CostTypesTableToolbarProps): ReactElement => {
  const router = useRouter();
  const sp = useSearchParams();
  const searchConfig = createTextFilterConfig("Tìm kiếm tên loại chi phí...");
  const handleSearchChange = (value: string | null) => {
    const u = new URLSearchParams(sp.toString());
    if (value) u.set("q", value);
    else u.delete("q");
    u.set("page", "1");
    router.replace(`?${u.toString()}`);
  };

  const clearAllFilters = () => {
    const u = new URLSearchParams(sp.toString());
    u.delete("q");
    u.delete("status");
    u.delete("category");
    u.set("page", "1");
    router.replace(`?${u.toString()}`);
  };

  const hasFilters = Boolean(
    sp.get("q") || 
    sp.getAll("status").length > 0 ||
    sp.getAll("category").length > 0
  );

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <DataTableTextFilter
          config={searchConfig}
          value={sp.get("q")}
          onChange={handleSearchChange}
          disabled={isLoading}
          loading={isLoading}
        />
        <DataTableFacetedFilter
          keyName="status"
          title="Trạng thái"
          options={COST_TYPE_STATUS_OPTIONS}
        />
        <DataTableFacetedFilter
          keyName="category"
          title="Danh mục"
          options={COST_TYPE_CATEGORY_OPTIONS}
        />
        {hasFilters && (
          <Button
            variant="ghost"
            onClick={clearAllFilters}
            className="h-8 px-2 lg:px-3"
            disabled={isLoading}
          >
            Xóa bộ lọc
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} context="cost-type" />
    </div>
  );
};