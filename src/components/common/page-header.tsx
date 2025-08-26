"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactElement, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  backButton?: {
    href: string;
    label?: string;
  };
  className?: string;
  actions?: ReactNode;
}

export const PageHeader = ({
  title,
  description,
  backButton,
  className,
  actions,
}: PageHeaderProps): ReactElement => {
  const router = useRouter();

  const handleBackClick = (): void => {
    if (backButton?.href) {
      router.push(backButton.href);
    } else {
      router.back();
    }
  };

  return (
    <div
      className={cn("flex justify-between items-start space-y-4", className)}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground mt-1 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>

      {backButton && (
        <div className="flex items-center space-x-2">
          {backButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackClick}
              className="h-8 px-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              {backButton.label || "Quay lại"}
            </Button>
          )}
        </div>
      )}
      {actions && <div className="flex items-center space-x-2">{actions}</div>}
    </div>
  );
};

export default PageHeader;
