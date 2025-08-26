"use client";

import {
  flexRender,
  getCoreRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
import type { Vehicle } from "@/drizzle/schema";
import { vehicleColumns } from "./vehicle-columns";
import { VehiclesTableToolbar } from "./vehicles-table-toolbar";

interface VehiclesTableProps {
  data: {
    rows: Vehicle[];
    pagination: {
      page: number;
      perPage: number;
      total: number;
      totalPages: number;
    };
  };
}

export function VehiclesDataTable({ data }: VehiclesTableProps): ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { rows, pagination } = data;

  // Giống CustomersDataTable: đọc sort từ URL
  const sortParam = searchParams.get("sort");
  const initialSorting: SortingState = React.useMemo(() => {
    if (!sortParam) return [];
    const [id, order] = sortParam.split(".");
    if (!id) return [];
    return [{ id, desc: order === "desc" }];
  }, [sortParam]);

  const [sorting, setSorting] = React.useState<SortingState>(initialSorting);

  React.useEffect(() => {
    if (!sorting.length) return;

    const s = sorting[0];
    const current = new URLSearchParams(searchParams.toString());
    current.set("sort", `${s?.id}.${s?.desc ? "desc" : "asc"}`);
    current.set("page", "1");

    const qs = current.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [sorting, searchParams, router, pathname]);

  const table = useReactTable({
    data: rows ?? [],
    columns: vehicleColumns,
    getCoreRowModel: getCoreRowModel(),
    state: { sorting },
    onSortingChange: setSorting,
    manualSorting: true,
    manualFiltering: true,
    manualPagination: true,
    pageCount: pagination?.totalPages ?? 1,
  });

  return (
    <div className="space-y-3">
      <VehiclesTableToolbar table={table} />

      <div className="rounded-md border overflow-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
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
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
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
                  colSpan={vehicleColumns.length}
                  className="h-24 text-center"
                >
                  Không có dữ liệu phương tiện.
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
