import { Mail, MapPin, Phone } from "lucide-react";
import type { ReactElement } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Customer } from "@/drizzle/schema";
import { CustomerStatusBadge } from "./customer-status-badge";

interface CustomerDetailProps {
  customer: Customer;
}

export function CustomerDetail({
  customer,
}: CustomerDetailProps): ReactElement {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Thông tin cơ bản
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-full">
              <span className="text-sm font-medium">{customer.name[0]}</span>
            </div>
            <div>
              <p className="font-medium">{customer.name}</p>
              <p className="text-sm text-muted-foreground">Tên khách hàng</p>
            </div>
          </div>

          {customer.email && (
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">{customer.email}</p>
                <p className="text-sm text-muted-foreground">Email</p>
              </div>
            </div>
          )}

          {customer.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">{customer.phone}</p>
                <p className="text-sm text-muted-foreground">Số điện thoại</p>
              </div>
            </div>
          )}

          {customer.taxId && (
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">{customer.taxId}</p>
                <p className="text-sm text-muted-foreground">Mã số thuế</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">{customer.address}</p>
              <p className="text-sm text-muted-foreground">Địa chỉ</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-4 w-4 text-muted-foreground" />
            <div>
              <CustomerStatusBadge status={customer.status} />
              <p className="text-sm text-muted-foreground">Trạng thái</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
