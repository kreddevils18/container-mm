"use client";

import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common/page-header";

interface CustomerEditErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function CustomerEditError({
  error,
  reset,
}: CustomerEditErrorProps): ReactElement {
  return (
    <div className="container mx-auto py-6 max-w-2xl space-y-6">
      <PageHeader
        title="Lỗi tải dữ liệu"
        description="Đã xảy ra lỗi khi tải thông tin khách hàng"
        backButton={{
          href: "/customers",
          label: "Quay lại danh sách",
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Đã xảy ra lỗi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-destructive/15 p-3">
            <div className="text-sm text-destructive font-medium">
              {error.message || "Không thể tải thông tin khách hàng"}
            </div>
            {error.digest && (
              <div className="text-xs text-destructive/70 mt-1">
                Mã lỗi: {error.digest}
              </div>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            Vui lòng thử lại hoặc liên hệ quản trị viên nếu vấn đề vẫn tiếp tục.
          </p>

          <div className="flex gap-2">
            <Button onClick={reset}>
              Thử lại
            </Button>
            <Button variant="outline" onClick={() => window.history.back()}>
              Quay lại
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}