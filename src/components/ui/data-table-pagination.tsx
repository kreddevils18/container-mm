"use client";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon,
} from "@radix-ui/react-icons";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DataTablePaginationProps {
  pagination?: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
  selectedCount?: number;
}

export function DataTablePagination({
  pagination,
  selectedCount = 0,
}: DataTablePaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Provide default values if pagination is undefined
  const defaultPagination = {
    page: 1,
    perPage: 10,
    total: 0,
    totalPages: 1,
  };

  const paginationData = pagination || defaultPagination;

  const gotoPage = (page: number) => {
    const current = new URLSearchParams(searchParams.toString());
    current.set("page", String(page));
    router.replace(`?${current.toString()}`);
  };

  const changePageSize = (perPage: string) => {
    const current = new URLSearchParams(searchParams.toString());
    current.set("per_page", perPage);
    current.set("page", "1");
    router.replace(`?${current.toString()}`);
  };

  const canPreviousPage = paginationData.page > 1;
  const canNextPage = paginationData.page < paginationData.totalPages;

  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex-1 text-sm text-muted-foreground">
        {selectedCount} / {paginationData.total} hàng được chọn.
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Số hàng mỗi trang</p>
          <Select
            value={`${paginationData.perPage}`}
            onValueChange={changePageSize}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={paginationData.perPage} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Trang {paginationData.page} / {paginationData.totalPages}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => gotoPage(1)}
            disabled={!canPreviousPage}
          >
            <span className="sr-only">Trang đầu</span>
            <DoubleArrowLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => gotoPage(paginationData.page - 1)}
            disabled={!canPreviousPage}
          >
            <span className="sr-only">Trang trước</span>
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => gotoPage(paginationData.page + 1)}
            disabled={!canNextPage}
          >
            <span className="sr-only">Trang sau</span>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => gotoPage(paginationData.totalPages)}
            disabled={!canNextPage}
          >
            <span className="sr-only">Trang cuối</span>
            <DoubleArrowRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
