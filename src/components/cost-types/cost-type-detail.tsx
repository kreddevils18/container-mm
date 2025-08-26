import { FileText, Package, Truck } from "lucide-react";
import type { ReactElement } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CostType } from "@/drizzle/schema";
import { CostTypeCategoryBadge } from "./cost-type-category-badge";
import { CostTypeStatusBadge } from "./cost-type-status-badge";

interface CostTypeDetailProps {
  costType: CostType;
}

export function CostTypeDetail({
  costType,
}: CostTypeDetailProps): ReactElement {
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
              {costType.category === "vehicle" ? (
                <Truck className="h-4 w-4" />
              ) : (
                <Package className="h-4 w-4" />
              )}
            </div>
            <div>
              <p className="font-medium">{costType.name}</p>
              <p className="text-sm text-muted-foreground">Tên loại chi phí</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-4 w-4 text-muted-foreground" />
            <div>
              <CostTypeCategoryBadge
                category={costType.category as "vehicle" | "order"}
              />
              <p className="text-sm text-muted-foreground">Danh mục</p>
            </div>
          </div>

          {costType.description && (
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">{costType.description}</p>
                <p className="text-sm text-muted-foreground">Mô tả</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="h-4 w-4 text-muted-foreground" />
            <div>
              <CostTypeStatusBadge status={costType.status} />
              <p className="text-sm text-muted-foreground">Trạng thái</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
