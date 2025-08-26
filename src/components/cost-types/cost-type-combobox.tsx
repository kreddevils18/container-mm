"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import type { CostType } from "@/drizzle/schema";

export interface CostTypeComboboxProps {
  /** Current selected cost type ID */
  value?: string;
  /** Callback when cost type changes */
  onValueChange: (value: string) => void;
  /** Placeholder text when no cost type selected */
  placeholder?: string;
  /** Whether the combobox is disabled */
  disabled?: boolean;
  /** Class name for styling */
  className?: string;
  /** Width of the combobox */
  width?: string;
  /** Maximum number of results to show */
  limit?: number;
  /** Available cost types data */
  costTypes?: CostType[];
}

/**
 * Cost type combobox for selecting cost types with search
 *
 * Features:
 * - Search functionality with debouncing
 * - Vietnamese UI localization
 * - React Hook Form compatible
 * - Category filtering support
 *
 * @component
 * @example
 * ```tsx
 * <CostTypeCombobox
 *   value={selectedCostTypeId}
 *   onValueChange={setSelectedCostTypeId}
 *   placeholder="Chọn loại chi phí..."
 *   costTypes={costTypes}
 * />
 * ```
 */
export const CostTypeCombobox = React.forwardRef<
  React.ComponentRef<typeof Button>,
  CostTypeComboboxProps
>(
  (
    {
      value,
      onValueChange,
      placeholder = "Chọn loại chi phí...",
      disabled = false,
      className,
      width = "300px",
      limit = 20,
      costTypes = [],
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [selectedCostType, setSelectedCostType] = React.useState<CostType | null>(null);

    // Debounce search query to avoid excessive filtering
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    // Filter cost types based on search query
    const filteredCostTypes = React.useMemo(() => {
      if (!debouncedSearchQuery.trim()) {
        return costTypes.slice(0, limit);
      }

      const query = debouncedSearchQuery.toLowerCase().trim();
      return costTypes
        .filter((costType) => {
          return (
            costType.name.toLowerCase().includes(query) ||
            (costType.description?.toLowerCase().includes(query)) ||
            (costType.category === "vehicle" ? "phương tiện" : "đơn hàng").includes(query)
          );
        })
        .slice(0, limit);
    }, [costTypes, debouncedSearchQuery, limit]);

    // Find selected cost type when value changes
    React.useEffect(() => {
      if (value && value !== selectedCostType?.id) {
        const found = costTypes.find(costType => costType.id === value);
        setSelectedCostType(found || null);
      } else if (!value) {
        setSelectedCostType(null);
      }
    }, [value, costTypes, selectedCostType?.id]);

    const handleSelect = (costTypeId: string): void => {
      const costType = filteredCostTypes.find((c) => c.id === costTypeId);
      
      if (costTypeId === value) {
        // Deselect if clicking the same cost type
        onValueChange("");
        setSelectedCostType(null);
      } else {
        onValueChange(costTypeId);
        setSelectedCostType(costType || null);
      }
      
      setOpen(false);
    };

    const handleSearchChange = (searchValue: string): void => {
      setSearchQuery(searchValue);
    };

    const formatCostTypeDisplay = (costType: CostType): string => {
      return costType.name;
    };

    const formatCostTypeSecondary = (costType: CostType): string => {
      const categoryLabel = costType.category === "vehicle" ? "Phương tiện" : "Đơn hàng";
      const parts = [categoryLabel];
      if (costType.description) {
        parts.push(costType.description);
      }
      return parts.join(" • ");
    };

    const getEmptyMessage = (): string => {
      if (searchQuery.trim()) return "Không tìm thấy loại chi phí";
      return "Chưa có loại chi phí";
    };

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "justify-between",
              !selectedCostType && "text-muted-foreground",
              className
            )}
            style={{ width }}
          >
            <span className="truncate">
              {selectedCostType 
                ? formatCostTypeDisplay(selectedCostType)
                : placeholder
              }
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" style={{ width }}>
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Tìm kiếm loại chi phí..."
              className="h-9"
              value={searchQuery}
              onValueChange={handleSearchChange}
            />
            <CommandList>
              <CommandEmpty>{getEmptyMessage()}</CommandEmpty>
              <CommandGroup>
                {filteredCostTypes.map((costType) => (
                  <CommandItem
                    key={costType.id}
                    value={costType.id}
                    onSelect={handleSelect}
                    className="flex flex-col items-start space-y-1 px-3 py-2"
                  >
                    <div className="flex w-full items-center justify-between">
                      <div className="flex flex-col">
                        <span className="truncate font-medium">
                          {formatCostTypeDisplay(costType)}
                        </span>
                        <span className="truncate text-sm text-muted-foreground">
                          {formatCostTypeSecondary(costType)}
                        </span>
                      </div>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4 shrink-0",
                          value === costType.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
);

CostTypeCombobox.displayName = "CostTypeCombobox";

export default CostTypeCombobox;