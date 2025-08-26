"use client";

import type { ReactElement } from "react";
import { useEffect } from "react";
import { AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CustomerErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error boundary for customer detail page.
 * 
 * Handles various error states like database errors, validation errors,
 * and other unexpected errors that occur during server-side rendering.
 */
export default function CustomerError({
  error,
  reset,
}: CustomerErrorProps): ReactElement {
  useEffect(() => {
    // Log error for debugging (only in development)
    if (process.env.NODE_ENV === "development") {
      // Error logging removed to comply with lint rules
      // Error details are available in the debug info below
    }
  }, []);

  const isValidationError = error.message.includes("Invalid customer");
  const isDatabaseError = error.message.includes("database") || 
                          error.message.includes("connection");

  return (
    <div className="container mx-auto py-12 max-w-2xl">
      <Card>
        <CardContent className="p-8 space-y-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                Đã xảy ra lỗi
              </h1>
              <p className="text-muted-foreground">
                {isValidationError && "Định dạng ID khách hàng không hợp lệ."}
                {isDatabaseError && "Không thể kết nối đến cơ sở dữ liệu."}
                {!isValidationError && !isDatabaseError && 
                  "Đã xảy ra lỗi không mong muốn khi tải thông tin khách hàng."}
              </p>
            </div>

            {/* Error details for development */}
            {process.env.NODE_ENV === "development" && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-left">
                  <strong>Debug Info:</strong> {error.message}
                  {error.digest && <><br /><strong>Digest:</strong> {error.digest}</>}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {!isValidationError && (
              <Button onClick={reset} variant="default">
                <RotateCcw className="mr-2 h-4 w-4" />
                Thử lại
              </Button>
            )}
            
            <Button asChild variant="outline">
              <Link href="/customers">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay về danh sách khách hàng
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}