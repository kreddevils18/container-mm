import Link from "next/link";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common/page-header";

/**
 * Not found page for customer edit
 *
 * Displays when a customer ID is invalid or customer doesn't exist
 *
 * @component
 */
export default function CustomerEditNotFound(): ReactElement {
  return (
    <div className="container mx-auto py-6 max-w-2xl space-y-6">
      <PageHeader
        title="Không tìm thấy khách hàng"
        description="Khách hàng không tồn tại hoặc đã bị xóa"
        backButton={{
          href: "/customers",
          label: "Quay lại danh sách",
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Lỗi 404 - Không tìm thấy</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Khách hàng bạn đang tìm không tồn tại hoặc đã bị xóa khỏi hệ thống.
          </p>
          <p className="text-sm text-muted-foreground">
            Vui lòng kiểm tra lại đường dẫn hoặc liên hệ quản trị viên nếu bạn cho rằng đây là lỗi.
          </p>
          <div className="flex gap-2 justify-center">
            <Button asChild>
              <Link href="/customers">Danh sách khách hàng</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/customers/create">Tạo khách hàng mới</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}