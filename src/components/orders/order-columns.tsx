"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ORDER_STATUS_LABELS } from "@/schemas/order";
import { OrderActions } from "./order-actions";
import { OrderStatusBadge } from "./order-status-badge";

export interface OrderRow {
  id: string;
  containerCode: string | null;
  customerId: string;
  customerName: string;
  emptyPickupVehicleId: string | null;
  emptyPickupVehiclePlate: string | null;
  deliveryVehicleId: string | null;
  deliveryVehiclePlate: string | null;
  emptyPickupDate: Date | null;
  emptyPickupStart: string | null;
  emptyPickupEnd: string | null;
  deliveryDate: Date | null;
  deliveryStart: string | null;
  deliveryEnd: string | null;
  status: "created" | "pending" | "in_progress" | "completed" | "cancelled";
  price: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const orderColumns: ColumnDef<OrderRow>[] = [
  {
    accessorKey: "containerCode",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0 font-medium"
        >
          Mã container
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const containerCode = row.getValue("containerCode") as string | null;
      return (
        <div className="font-mono text-sm">
          {containerCode || (
            <span className="text-muted-foreground">Chưa có</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "customerName",
    header: "Khách hàng",
    cell: ({ row }) => (
      <div className="font-medium max-w-[150px] truncate">
        {row.getValue("customerName")}
      </div>
    ),
  },
  {
    accessorKey: "emptyPickupVehiclePlate",
    header: "Xe lấy rỗng",
    cell: ({ row }) => {
      const plate = row.getValue("emptyPickupVehiclePlate") as string | null;
      return (
        <div className="font-mono text-sm">
          {plate || <span className="text-muted-foreground">Chưa có</span>}
        </div>
      );
    },
  },
  {
    accessorKey: "deliveryVehiclePlate",
    header: "Xe hạ hàng",
    cell: ({ row }) => {
      const plate = row.getValue("deliveryVehiclePlate") as string | null;
      return (
        <div className="font-mono text-sm">
          {plate || <span className="text-muted-foreground">Chưa có</span>}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const status = row.getValue("status") as keyof typeof ORDER_STATUS_LABELS;
      return <OrderStatusBadge status={status} />;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "price",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0 font-medium"
        >
          Giá tiền
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("price"));
      return (
        <div className="font-mono text-sm">
          {new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(price)}
        </div>
      );
    },
  },
  {
    accessorKey: "emptyPickupDate",
    header: "Ngày lấy rỗng",
    cell: ({ row }) => {
      const date = row.getValue("emptyPickupDate") as Date | null;
      if (!date) {
        return <span className="text-muted-foreground text-sm">Chưa có</span>;
      }
      return (
        <div className="text-sm">
          {new Date(date).toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })}
        </div>
      );
    },
  },
  {
    accessorKey: "deliveryDate",
    header: "Ngày hạ hàng",
    cell: ({ row }) => {
      const date = row.getValue("deliveryDate") as Date | null;
      if (!date) {
        return <span className="text-muted-foreground text-sm">Chưa có</span>;
      }
      return (
        <div className="text-sm">
          {new Date(date).toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })}
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0 font-medium"
        >
          Ngày tạo
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      return (
        <div className="text-sm">
          {date.toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })}
        </div>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => <OrderActions order={row.original} />,
  },
];
