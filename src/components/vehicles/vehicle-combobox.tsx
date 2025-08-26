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
import { searchVehicles } from "@/services/vehicles/searchVehicles";
import type { VehicleSearchResult } from "@/app/api/vehicles/search/route";

export interface VehicleComboboxProps {
  /** Current selected vehicle ID */
  value?: string;
  /** Callback when vehicle changes */
  onValueChange: (value: string) => void;
  /** Placeholder text when no vehicle selected */
  placeholder?: string;
  /** Whether the combobox is disabled */
  disabled?: boolean;
  /** Class name for styling */
  className?: string;
  /** Width of the combobox */
  width?: string;
  /** Maximum number of results to show */
  limit?: number;
}

/**
 * Vehicle search combobox with high-performance Vietnamese text search
 *
 * Features:
 * - PostgreSQL Full-Text Search with Vietnamese support
 * - Debounced search (300ms) with request cancellation
 * - Multi-field display (licensePlate, driverName, driverPhone)
 * - Vietnamese UI localization
 * - Sub-150ms response time target
 * - React Hook Form compatible
 *
 * @component
 * @example
 * ```tsx
 * <VehicleCombobox
 *   value={selectedVehicleId}
 *   onValueChange={setSelectedVehicleId}
 *   placeholder="Chọn phương tiện..."
 * />
 * ```
 */
export const VehicleCombobox = React.forwardRef<
  React.ComponentRef<typeof Button>,
  VehicleComboboxProps
>(
  (
    {
      value,
      onValueChange,
      placeholder = "Chọn phương tiện...",
      disabled = false,
      className,
      width = "300px",
      limit = 20,
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [isSearching, setIsSearching] = React.useState(false);
    const [searchResults, setSearchResults] = React.useState<VehicleSearchResult[]>([]);
    const [selectedVehicle, setSelectedVehicle] = React.useState<VehicleSearchResult | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    // Debounce search query to avoid excessive API calls
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    // AbortController ref for canceling requests
    const abortControllerRef = React.useRef<AbortController | null>(null);

    const loadRecentVehicles = React.useCallback(async (): Promise<void> => {
      try {
        setIsSearching(true);
        setError(null);

        // Cancel previous request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        // Create new AbortController
        abortControllerRef.current = new AbortController();

        const response = await searchVehicles("", {
          limit,
          signal: abortControllerRef.current.signal,
        });

        setSearchResults(response.results);
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          setError("Không thể tải danh sách phương tiện");
        }
      } finally {
        setIsSearching(false);
      }
    }, [limit]);

    const performSearch = React.useCallback(async (query: string): Promise<void> => {
      try {
        setIsSearching(true);
        setError(null);

        // Cancel previous request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        // Create new AbortController
        abortControllerRef.current = new AbortController();

        const response = await searchVehicles(query, {
          limit,
          signal: abortControllerRef.current.signal,
        });

        setSearchResults(response.results);
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          setError("Lỗi tìm kiếm phương tiện");
        }
      } finally {
        setIsSearching(false);
      }
    }, [limit]);

    // Load initial recent vehicles when opening
    React.useEffect(() => {
      if (open && searchResults.length === 0 && !searchQuery) {
        loadRecentVehicles();
      }
    }, [open, searchResults.length, searchQuery, loadRecentVehicles]);

    // Perform search when debounced query changes
    React.useEffect(() => {
      if (debouncedSearchQuery.trim()) {
        performSearch(debouncedSearchQuery);
      } else if (open) {
        loadRecentVehicles();
      }
    }, [debouncedSearchQuery, open, performSearch, loadRecentVehicles]);

    // Find selected vehicle when value changes
    React.useEffect(() => {
      if (value && value !== selectedVehicle?.id) {
        // Try to find in current results first
        const found = searchResults.find(vehicle => vehicle.id === value);
        if (found) {
          setSelectedVehicle(found);
        } else if (value) {
          // If not found, could fetch single vehicle by ID
          // For now, keep existing selected vehicle or clear
          setSelectedVehicle(null);
        }
      } else if (!value) {
        setSelectedVehicle(null);
      }
    }, [value, searchResults, selectedVehicle?.id]);

    const handleSelect = (vehicleId: string): void => {
      const vehicle = searchResults.find((v) => v.id === vehicleId);
      
      if (vehicleId === value) {
        // Deselect if clicking the same vehicle
        onValueChange("");
        setSelectedVehicle(null);
      } else {
        onValueChange(vehicleId);
        setSelectedVehicle(vehicle || null);
      }
      
      setOpen(false);
    };

    const handleSearchChange = (searchValue: string): void => {
      setSearchQuery(searchValue);
    };

    // Cleanup on unmount
    React.useEffect(() => {
      return () => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    }, []);

    const formatVehicleDisplay = (vehicle: VehicleSearchResult): string => {
      return `${vehicle.licensePlate} - ${vehicle.driverName}`;
    };

    const formatVehicleSecondary = (vehicle: VehicleSearchResult): string => {
      return vehicle.driverPhone;
    };

    const getEmptyMessage = (): string => {
      if (error) return error;
      if (isSearching) return "Đang tìm kiếm...";
      if (searchQuery.trim()) return "Không tìm thấy phương tiện";
      return "Chưa có phương tiện";
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
              !selectedVehicle && "text-muted-foreground",
              className
            )}
            style={{ width }}
          >
            <span className="truncate">
              {selectedVehicle 
                ? formatVehicleDisplay(selectedVehicle)
                : placeholder
              }
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" style={{ width }}>
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Tìm kiếm phương tiện..."
              className="h-9"
              value={searchQuery}
              onValueChange={handleSearchChange}
            />
            <CommandList>
              <CommandEmpty>{getEmptyMessage()}</CommandEmpty>
              <CommandGroup>
                {searchResults.map((vehicle) => (
                  <CommandItem
                    key={vehicle.id}
                    value={vehicle.id}
                    onSelect={handleSelect}
                    className="flex flex-col items-start space-y-1 px-3 py-2"
                  >
                    <div className="flex w-full items-center justify-between">
                      <div className="flex flex-col">
                        <span className="truncate font-medium">
                          {formatVehicleDisplay(vehicle)}
                        </span>
                        <span className="truncate text-sm text-muted-foreground">
                          {formatVehicleSecondary(vehicle)}
                        </span>
                      </div>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4 shrink-0",
                          value === vehicle.id ? "opacity-100" : "opacity-0"
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

VehicleCombobox.displayName = "VehicleCombobox";

export default VehicleCombobox;