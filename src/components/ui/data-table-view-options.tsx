"use client";

import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { MixerHorizontalIcon } from "@radix-ui/react-icons";
import type { Table } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>;
}

const getColumnDisplayName = (columnId: string): string => {
  const displayNames: Record<string, string> = {
    full_name: "Họ và tên",
    email: "Email",
    role: "Vai trò",
    status: "Trạng thái",
    created_at: "Ngày tạo",
    updated_at: "Ngày cập nhật",
    license_plate: "Biển số",
    price: "Giá tiền",
    id: "Mã ID",
    description: "Mô tả",
    start_point: "Điểm bắt đầu",
    end_point: "Điểm kết thúc",
    distance: "Khoảng cách",
    phone: "Số điện thoại",
    address: "Địa chỉ",
    containerCode: "Mã container",
    customerName: "Khách hàng",
    emptyPickupVehiclePlate: "Xe lấy rỗng",
    deliveryVehiclePlate: "Xe hạ hàng",
    emptyPickupDate: "Ngày lấy rỗng",
    deliveryDate: "Ngày hạ hàng",
    createdAt: "Ngày tạo",
  };

  return displayNames[columnId] || columnId;
};

export function DataTableViewOptions<TData>({
  table,
}: DataTableViewOptionsProps<TData>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto hidden h-8 lg:flex"
        >
          <MixerHorizontalIcon className="mr-2 h-4 w-4" />
          Hiển thị
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[150px]">
        <DropdownMenuLabel>Hiển thị cột</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter(
            (column) =>
              typeof column.accessorFn !== "undefined" && column.getCanHide()
          )
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {getColumnDisplayName(column.id)}
              </DropdownMenuCheckboxItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
