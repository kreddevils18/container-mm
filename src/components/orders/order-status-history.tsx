import { Clock, User } from "lucide-react";
import type { ReactElement } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ORDER_STATUS_LABELS } from "@/schemas/order";
import { OrderStatusBadge } from "./order-status-badge";

export interface StatusHistoryItem {
  id: string;
  previousStatus: keyof typeof ORDER_STATUS_LABELS | null;
  newStatus: keyof typeof ORDER_STATUS_LABELS;
  changedBy: string | null;
  changedByName: string | null;
  changedAt: Date;
}

interface OrderStatusHistoryProps {
  statusHistory: StatusHistoryItem[];
}

function fmtDateTime(input: Date): string {
  return input.toLocaleString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OrderStatusHistory({
  statusHistory,
}: OrderStatusHistoryProps): ReactElement {
  if (statusHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Lịch sử trạng thái
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Chưa có thay đổi trạng thái nào
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Lịch sử trạng thái
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {statusHistory.map((item, index) => (
            <div
              key={item.id}
              className={`relative flex gap-4 ${index !== statusHistory.length - 1 ? "pb-4" : ""
                }`}
            >
              {index !== statusHistory.length - 1 && (
                <div className="absolute left-2 top-6 bottom-0 w-px bg-border" />
              )}

              <div className="relative flex h-4 w-4 items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-primary" />
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  {item.previousStatus ? (
                    <div className="flex items-center gap-2">
                      <OrderStatusBadge status={item.previousStatus} />
                      <span className="text-muted-foreground">→</span>
                      <OrderStatusBadge status={item.newStatus} />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Trạng thái ban đầu:
                      </span>
                      <OrderStatusBadge status={item.newStatus} />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{fmtDateTime(item.changedAt)}</span>
                  </div>

                  {item.changedByName && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{item.changedByName}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
