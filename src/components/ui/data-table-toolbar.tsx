"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import type { Table } from "@tanstack/react-table";
import type { ReactElement } from "react";
import { useId } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTableViewOptions } from "./data-table-view-options";

/**
 * Basic data table toolbar with vertical layout and search functionality.
 *
 * Provides a simple toolbar with optional search field and filter clearing.
 * Uses vertical layout with labels above components for better organization.
 *
 * @component
 * @example
 * ```tsx
 * <DataTableToolbar
 *   table={table}
 *   searchKey="name"
 *   searchPlaceholder="Tìm kiếm theo tên..."
 * />
 * ```
 */
interface DataTableToolbarProps<TData> {
  /** The table instance from @tanstack/react-table */
  table: Table<TData>;
  /** Column key to search in */
  searchKey?: string;
  /** Placeholder text for search input */
  searchPlaceholder?: string;
  /** Label for search field */
  searchLabel?: string;
}

export function DataTableToolbar<TData>({
  table,
  searchKey,
  searchPlaceholder = "Tìm kiếm...",
  searchLabel = "Tìm kiếm",
}: DataTableToolbarProps<TData>): ReactElement {
  const searchInputId = useId();
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="space-y-4">
      {searchKey && (
        <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
          <Label htmlFor={searchInputId} className="text-sm font-medium">
            {searchLabel}
          </Label>
          <Input
            id={searchInputId}
            placeholder={searchPlaceholder}
            value={
              (table.getColumn(searchKey)?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn(searchKey)?.setFilterValue(event.target.value)
            }
            className="h-8 w-[200px] lg:w-[250px]"
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isFiltered && (
            <Button
              variant="outline"
              onClick={() => table.resetColumnFilters()}
              className="h-8 px-2 lg:px-3"
            >
              Xóa bộ lọc
              <Cross2Icon className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}
