"use client";

import type { Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactElement } from "react";
import { startTransition, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { DataTableFacetedFilter } from "@/components/ui/data-table-faceted-filter";
import {
  createTextFilterConfig,
  DataTableTextFilter,
} from "@/components/ui/data-table-text-filter";
import { DataTableViewOptions } from "@/components/ui/data-table-view-options";
import type { Customer } from "@/drizzle/schema";
import { CUSTOMER_STATUS_OPTIONS } from "./customer-status-badge";

interface CustomersTableToolbarProps {
  table: Table<Customer>;
  isLoading?: boolean;
}

export const CustomersTableToolbar = ({
  table,
  isLoading = false,
}: CustomersTableToolbarProps): ReactElement => {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const searchConfig = useMemo(
    () => createTextFilterConfig("Tìm kiếm tên khách hàng, email..."),
    []
  );

  const replaceWithParams = useCallback(
    (u: URLSearchParams) => {
      if (u.get("page") === "1") u.delete("page");
      const qs = u.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router]
  );

  const handleSearchChange = useCallback(
    (value: string | null) => {
      startTransition(() => {
        const u = new URLSearchParams(sp.toString());
        const v = value?.trim() ?? "";
        if (v) u.set("q", v);
        else u.delete("q");
        u.set("page", "1");
        replaceWithParams(u);
      });
    },
    [sp, replaceWithParams]
  );

  const clearAllFilters = useCallback(() => {
    startTransition(() => {
      const u = new URLSearchParams(sp.toString());
      u.delete("q");
      u.delete("status");
      u.set("page", "1");
      replaceWithParams(u);
    });
  }, [sp, replaceWithParams]);

  const hasFilters =
    (sp.get("q")?.trim().length ?? 0) > 0 || sp.getAll("status").length > 0;

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
          options={CUSTOMER_STATUS_OPTIONS}
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
      <DataTableViewOptions table={table} context="customer" />
    </div>
  );
};
