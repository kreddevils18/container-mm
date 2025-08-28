"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";
import type { VehicleSearchResult } from "@/app/api/vehicles/search/route";
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
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { getVehicleById } from "@/services/vehicles/getVehicleById";
import { searchVehicles } from "@/services/vehicles/searchVehicles";

export interface VehicleComboboxProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  width?: string;
  limit?: number;
}

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
    const [searchResults, setSearchResults] = React.useState<
      VehicleSearchResult[]
    >([]);
    const [selectedVehicle, setSelectedVehicle] =
      React.useState<VehicleSearchResult | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const abortControllerRef = React.useRef<AbortController | null>(null);

    const loadRecentVehicles = React.useCallback(async (): Promise<void> => {
      try {
        setIsSearching(true);
        setError(null);

        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

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

    const performSearch = React.useCallback(
      async (query: string): Promise<void> => {
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
      },
      [limit]
    );

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

    // Load vehicle details khi có value nhưng chưa có selectedVehicle
    const loadVehicleById = React.useCallback(
      async (vehicleId: string): Promise<void> => {
        try {
          const found = searchResults.find(
            (vehicle) => vehicle.id === vehicleId
          );
          if (found) {
            setSelectedVehicle(found);
            return;
          }

          setIsSearching(true);
          setError(null);

          const vehicle = await getVehicleById(vehicleId);
          if (vehicle) {
            setSelectedVehicle(vehicle);
          } else {
            setSelectedVehicle(null);
          }
        } catch (_error) {
          setSelectedVehicle(null);
        } finally {
          setIsSearching(false);
        }
      },
      [searchResults]
    );

    // Find selected vehicle when value changes
    React.useEffect(() => {
      if (value && value !== selectedVehicle?.id) {
        void loadVehicleById(value);
      } else if (!value) {
        setSelectedVehicle(null);
      }
    }, [value, selectedVehicle?.id, loadVehicleById]);

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
                : placeholder}
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
