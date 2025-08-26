import type { ReactElement } from "react";
import Link from "next/link";
import { ArrowLeft, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Not found page for customer detail routes.
 * 
 * Displayed when a customer ID is valid but the customer doesn't exist
 * in the database. Provides user-friendly messaging and navigation options.
 */
export default function CustomerNotFound(): ReactElement {
  return (
    <div className="container mx-auto py-12 max-w-2xl">
      <Card>
        <CardContent className="p-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <UserX className="h-8 w-8 text-muted-foreground" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Không tìm thấy khách hàng
            </h1>
            <p className="text-muted-foreground">
              Khách hàng không tồn tại hoặc đã bị xóa khỏi hệ thống.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="default">
              <Link href="/customers">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay về danh sách khách hàng
              </Link>
            </Button>
            
            <Button asChild variant="outline">
              <Link href="/customers/create">
                Tạo khách hàng mới
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}