"use client";

import {
  flexRender,
  getCoreRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useRouter, useSearchParams } from "next/navigation";
import type { ReactElement } from "react";
import * as React from "react";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type OrderRow, orderColumns } from "./order-columns";
import { OrdersTableToolbar } from "./orders-table-toolbar";

interface OrdersTableProps {
  data: {
    rows: OrderRow[];
    pagination: {
      page: number;
      perPage: number;
      total: number;
      totalPages: number;
    };
  };
}

export function OrdersDataTable({ data }: OrdersTableProps): ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { rows, pagination } = data;
  const sortParam = searchParams.get("sort");
  const [sorting, setSorting] = React.useState<SortingState>(() => {
    if (sortParam) {
      const [id, desc] = sortParam.split(".");
      if (id) {
        return [{ id, desc: desc === "desc" }];
      }
    }
    return [];
  });

  React.useEffect(() => {
    if (!sorting.length) return;
    const s = sorting[0];
    if (s?.id) {
      const current = new URLSearchParams(searchParams.toString());
      current.set("sort", `${s.id}.${s.desc ? "desc" : "asc"}`);
      current.set("page", "1");
      router.replace(`?${current.toString()}`);
    }
  }, [sorting, searchParams, router]);

  const table = useReactTable({
    data: rows || [],
    columns: orderColumns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    manualSorting: true,
    manualFiltering: true,
    manualPagination: true,
    pageCount: pagination?.totalPages || 1,
  });

  return (
    <div className="space-y-3">
      <OrdersTableToolbar table={table} />

      <div className="rounded-md border overflow-auto">
        <Table>
          <TableHeader>
            {table?.getHeaderGroups()?.map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table?.getRowModel()?.rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={orderColumns.length}
                  className="h-24 text-center"
                >
                  Không có dữ liệu đơn hàng.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination pagination={pagination} selectedCount={0} />
    </div>
  );
}
