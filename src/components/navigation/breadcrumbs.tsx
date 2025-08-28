"use client";

import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactElement } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Route labels mapping for Vietnamese translations
const routeLabels: Record<string, string> = {
  // Main routes
  orders: "Đơn hàng",
  customers: "Khách hàng",
  users: "Người dùng",
  vehicles: "Xe tải",
  routes: "Tuyến đường",
  "cost-types": "Loại chi phí",
  revenue: "Doanh thu",
  settings: "Cài đặt",

  // Actions
  create: "Tạo mới",
  edit: "Chỉnh sửa",
  view: "Chi tiết",

  // Reports
  reports: "Báo cáo",
  costs: "Chi phí",
  overview: "Tổng quan",
  types: "Loại chi phí",

  // Other
  profile: "Hồ sơ",
  dashboard: "Bảng điều khiển",
};

interface BreadcrumbItemData {
  label: string;
  href?: string;
  isLast: boolean;
}

function generateBreadcrumbs(pathname: string): BreadcrumbItemData[] {
  const paths = pathname.split("/").filter(Boolean);
  const breadcrumbs: BreadcrumbItemData[] = [];

  // Always start with home
  if (pathname !== "/") {
    breadcrumbs.push({ label: "", href: "/", isLast: false });
  }

  let currentPath = "";
  paths.forEach((path, index) => {
    currentPath += `/${path}`;
    const isLast = index === paths.length - 1;

    // Get label from mapping or use path
    const label = routeLabels[path] || path;

    if (isLast) {
      breadcrumbs.push({
        label,
        isLast: true,
      });
    } else {
      breadcrumbs.push({
        label,
        href: currentPath,
        isLast: false,
      });
    }
  });

  return breadcrumbs;
}

export function Breadcrumbs(): ReactElement | null {
  const pathname = usePathname();
  const breadcrumbs = generateBreadcrumbs(pathname);

  // Don't show breadcrumbs on home page
  if (pathname === "/") {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => (
          <div key={`breadcrumb-${crumb.href || crumb.label}`} className="flex items-center">
            <BreadcrumbItem>
              {crumb.href ? (
                <BreadcrumbLink asChild>
                  <Link href={crumb.href}>
                    {index === 0 && <Home className="mr-2 h-4 w-4" />}
                    {crumb.label}
                  </Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>

            {index < breadcrumbs.length - 1 && (
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
            )}
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
