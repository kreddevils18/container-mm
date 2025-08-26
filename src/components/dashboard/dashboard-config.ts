import {
  FileText,
  Package,
  Plus,
  TrendingUp,
  Truck,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";

export interface QuickAction {
  id: string;
  title: string;
  description?: string;
  href: string;
  icon: string;
}

export interface DashboardConfig {
  lists: QuickAction[];
  creates: QuickAction[];
}

export const dashboardConfig: DashboardConfig = {
  lists: [
    {
      id: "orders-list",
      title: "Danh sách đơn hàng",
      description: "Xem và quản lý tất cả đơn hàng vận chuyển",
      href: "/orders",
      icon: "Package",
    },
    {
      id: "customers-list",
      title: "Danh sách khách hàng",
      description: "Quản lý thông tin khách hàng",
      href: "/customers",
      icon: "Users",
    },
    {
      id: "vehicles-list",
      title: "Danh sách xe",
      description: "Quản lý đội xe và trạng thái",
      href: "/vehicles",
      icon: "Truck",
    },
    {
      id: "cost-types",
      title: "Danh sách loại chi phí",
      description: "Theo dõi loại chi phí",
      href: "/costs/types",
      icon: "Wallet",
    },
  ],

  creates: [
    {
      id: "create-order",
      title: "Tạo đơn hàng",
      description: "Tạo đơn hàng vận chuyển mới",
      href: "/orders/create",
      icon: "Plus",
    },
    {
      id: "create-customer",
      title: "Tạo khách hàng",
      description: "Thêm khách hàng mới vào hệ thống",
      href: "/customers/create",
      icon: "Plus",
    },
    {
      id: "create-vehicle",
      title: "Tạo xe",
      description: "Thêm xe mới vào đội xe",
      href: "/vehicles/create",
      icon: "Plus",
    },
    {
      id: "create-cost-type",
      title: "Tạo loại chi phí",
      description: "Tạo loại chi phí mới",
      href: "/costs/types/create",
      icon: "Plus",
    },
  ],
};

export const iconMapping = {
  Package,
  Users,
  UserPlus,
  Truck,
  Plus,
  FileText,
  TrendingUp,
  Wallet,
} as const;

export type IconName = keyof typeof iconMapping;
