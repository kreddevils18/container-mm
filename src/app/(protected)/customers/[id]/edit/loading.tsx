import type { ReactElement } from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/common/page-header";

export default function CustomerEditLoading(): ReactElement {
  return (
    <div className="container mx-auto py-6 max-w-2xl space-y-6">
      <PageHeader
        title="Chỉnh sửa khách hàng"
        description="Đang tải thông tin khách hàng..."
        backButton={{
          href: "/customers",
          label: "Quay lại",
        }}
      />

      <Card>
        <CardHeader>
          <div className="h-6 w-48 animate-pulse bg-muted rounded" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="h-4 w-24 animate-pulse bg-muted rounded" />
              <div className="h-10 w-full animate-pulse bg-muted rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-24 animate-pulse bg-muted rounded" />
              <div className="h-10 w-full animate-pulse bg-muted rounded" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="h-4 w-16 animate-pulse bg-muted rounded" />
            <div className="h-10 w-full animate-pulse bg-muted rounded" />
          </div>

          <div className="space-y-2">
            <div className="h-4 w-20 animate-pulse bg-muted rounded" />
            <div className="h-10 w-full animate-pulse bg-muted rounded" />
          </div>

          <div className="flex justify-end gap-2">
            <div className="h-10 w-16 animate-pulse bg-muted rounded" />
            <div className="h-10 w-28 animate-pulse bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}