"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";
import type { CustomerSearchResult } from "@/app/api/customers/search/route";
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
import { getCustomerById } from "@/services/customers/getCustomerById";
import { searchCustomers } from "@/services/customers/searchCustomers";

export interface CustomerComboboxProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  width?: string;
  limit?: number;
}

export const CustomerCombobox = React.forwardRef<
  React.ComponentRef<typeof Button>,
  CustomerComboboxProps
>(
  (
    {
      value,
      onValueChange,
      placeholder = "Chọn khách hàng...",
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
      CustomerSearchResult[]
    >([]);
    const [selectedCustomer, setSelectedCustomer] =
      React.useState<CustomerSearchResult | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const abortControllerRef = React.useRef<AbortController | null>(null);

    const cancelInFlight = React.useCallback(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }, []);

    const loadRecentCustomers = React.useCallback(async (): Promise<void> => {
      try {
        setIsSearching(true);
        setError(null);
        cancelInFlight();
        abortControllerRef.current = new AbortController();

        const response = await searchCustomers("", {
          limit,
          signal: abortControllerRef.current.signal,
        });
        setSearchResults(response.results);
      } catch (err) {
        if (!(err instanceof Error && err.name === "AbortError")) {
          setError("Không thể tải danh sách khách hàng");
        }
      } finally {
        setIsSearching(false);
      }
    }, [limit, cancelInFlight]);

    const performSearch = React.useCallback(
      async (query: string): Promise<void> => {
        try {
          setIsSearching(true);
          setError(null);
          cancelInFlight();
          abortControllerRef.current = new AbortController();

          const response = await searchCustomers(query, {
            limit,
            signal: abortControllerRef.current.signal,
          });
          setSearchResults(response.results);
        } catch (err) {
          if (!(err instanceof Error && err.name === "AbortError")) {
            setError("Lỗi tìm kiếm khách hàng");
          }
        } finally {
          setIsSearching(false);
        }
      },
      [limit, cancelInFlight]
    );

    React.useEffect(() => {
      if (open && searchResults.length === 0 && !searchQuery) {
        void loadRecentCustomers();
      }
    }, [open, searchResults.length, searchQuery, loadRecentCustomers]);

    React.useEffect(() => {
      if (debouncedSearchQuery.trim()) {
        void performSearch(debouncedSearchQuery);
      } else if (open) {
        void loadRecentCustomers();
      }
    }, [debouncedSearchQuery, open, performSearch, loadRecentCustomers]);

    const loadCustomerById = React.useCallback(
      async (customerId: string): Promise<void> => {
        try {
          const found = searchResults.find((c) => c.id === customerId);
          if (found) {
            setSelectedCustomer(found);
            return;
          }

          // Nếu không tìm thấy, gọi API lấy customer theo ID
          setIsSearching(true);
          setError(null);

          const customer = await getCustomerById(customerId);
          if (customer) {
            setSelectedCustomer(customer);
          } else {
            setSelectedCustomer(null);
          }
        } catch (_err) {
          setSelectedCustomer(null);
        } finally {
          setIsSearching(false);
        }
      },
      [searchResults]
    );

    // Đồng bộ selected khi value đổi
    React.useEffect(() => {
      if (value && value !== selectedCustomer?.id) {
        void loadCustomerById(value);
      } else if (!value) {
        setSelectedCustomer(null);
      }
    }, [value, selectedCustomer?.id, loadCustomerById]);

    // Cleanup on unmount
    React.useEffect(() => {
      return () => cancelInFlight();
    }, [cancelInFlight]);

    const handleSelect = (customerId: string): void => {
      const customer = searchResults.find((c) => c.id === customerId);
      if (customerId === value) {
        onValueChange("");
        setSelectedCustomer(null);
      } else {
        onValueChange(customerId);
        setSelectedCustomer(customer ?? null);
      }
      setOpen(false);
    };

    const handleSearchChange = (v: string): void => {
      setSearchQuery(v);
    };

    const formatCustomerDisplay = (customer: CustomerSearchResult): string => {
      const parts = [customer.name];
      if (customer.email) parts.push(`(${customer.email})`);
      return parts.join(" ");
    };

    const formatCustomerSecondary = (
      customer: CustomerSearchResult
    ): string => {
      const parts: string[] = [];
      if (customer.phone) parts.push(customer.phone);
      if (customer.address) parts.push(customer.address);
      return parts.join(" • ");
    };

    const getEmptyMessage = (): string => {
      if (error) return error;
      if (isSearching) return "Đang tìm kiếm...";
      if (searchQuery.trim()) return "Không tìm thấy khách hàng";
      return "Chưa có khách hàng";
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
              !selectedCustomer && "text-muted-foreground",
              className
            )}
            style={{ width }}
          >
            <span className="truncate">
              {selectedCustomer
                ? formatCustomerDisplay(selectedCustomer)
                : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" style={{ width }}>
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Tìm kiếm khách hàng..."
              className="h-9"
              value={searchQuery}
              onValueChange={handleSearchChange}
            />
            <CommandList>
              <CommandEmpty>{getEmptyMessage()}</CommandEmpty>
              <CommandGroup>
                {searchResults.map((customer) => (
                  <CommandItem
                    key={customer.id}
                    value={customer.id}
                    onSelect={handleSelect}
                    className="flex flex-col items-start space-y-1 px-3 py-2"
                  >
                    <div className="flex w-full items-center justify-between">
                      <div className="flex flex-col">
                        <span className="truncate font-medium">
                          {formatCustomerDisplay(customer)}
                        </span>
                        {formatCustomerSecondary(customer) && (
                          <span className="truncate text-sm text-muted-foreground">
                            {formatCustomerSecondary(customer)}
                          </span>
                        )}
                      </div>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4 shrink-0",
                          value === customer.id ? "opacity-100" : "opacity-0"
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

CustomerCombobox.displayName = "CustomerCombobox";
export default CustomerCombobox;
