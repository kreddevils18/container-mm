import type { ReactElement } from "react";
import { AlertTriangle, ArrowLeft, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface DetailErrorStateProps {
  title: string;
  description: string;
  backHref: string;
  entityName: string;
  icon?: LucideIcon;
  cardMessage?: string;
}

/**
 * Error state component for detail pages.
 * 
 * Used when an entity is not found or there's an error loading the data.
 */
export function DetailErrorState({
  title,
  description,
  backHref,
  entityName,
  icon: Icon = AlertTriangle,
  cardMessage,
}: DetailErrorStateProps): ReactElement {
  return (
    <div className="container mx-auto py-12 max-w-2xl">
      <Card>
        <CardContent className="p-8 space-y-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <Icon className="h-8 w-8 text-destructive" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                {title}
              </h1>
              <p className="text-muted-foreground">
                {description}
              </p>
            </div>
            
            {cardMessage && (
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                {cardMessage}
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <Button asChild variant="outline">
              <Link href={backHref}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay về danh sách {entityName}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}