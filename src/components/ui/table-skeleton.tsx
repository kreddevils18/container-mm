import type { ReactElement } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function TableSkeleton(): ReactElement {
  return (
    <div className="space-y-4">
      {/* Toolbar skeleton */}
      <div className="space-y-3">
        <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
          <Skeleton className="h-4 w-[120px]" />
          <Skeleton className="h-8 w-[300px]" />
        </div>
        <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
          <Skeleton className="h-4 w-[80px]" />
          <Skeleton className="h-8 w-[150px]" />
        </div>
        <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
          <Skeleton className="h-4 w-[120px]" />
          <Skeleton className="h-8 w-[150px]" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="space-y-3">
        {/* Header */}
        <div className="grid grid-cols-4 gap-4 border-b pb-2">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[80px]" />
          <Skeleton className="h-4 w-[90px]" />
          <Skeleton className="h-4 w-[80px]" />
        </div>

        {/* Rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={`skeleton-row-${i}`} className="grid grid-cols-4 gap-4 py-2">
            <div className="space-y-1">
              <Skeleton className="h-4 w-[120px]" />
              <Skeleton className="h-3 w-[150px]" />
            </div>
            <Skeleton className="h-6 w-[80px]" />
            <Skeleton className="h-6 w-[90px]" />
            <Skeleton className="h-4 w-[70px]" />
          </div>
        ))}
      </div>
    </div>
  );
}
