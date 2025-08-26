"use client";

import Link from "next/link";
import type { ReactElement, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface QuickActionButtonProps {
  title: string;
  description?: string;
  href: string;
  icon: ReactNode;
  variant?: "default" | "outline" | "secondary" | "ghost";
}

export const QuickActionButton = ({
  title,
  description,
  href,
  icon,
  variant = "outline",
}: QuickActionButtonProps): ReactElement => {
  return (
    <Button
      variant={variant}
      size="lg"
      className="h-auto p-6 flex flex-col gap-3 text-left justify-start items-start"
      asChild
    >
      <Link href={href}>
        <div className="w-full flex items-center gap-3">
          <div className="flex-shrink-0">{icon}</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-foreground truncate">
              {title}
            </div>
            {description && (
              <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {description}
              </div>
            )}
          </div>
        </div>
      </Link>
    </Button>
  );
};
