"use client";

import type { ReactElement, ReactNode } from "react";

interface QuickActionCategoryProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export const QuickActionCategory = ({
  title,
  description,
  children,
}: QuickActionCategoryProps): ReactElement => {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {children}
      </div>
    </div>
  );
};
