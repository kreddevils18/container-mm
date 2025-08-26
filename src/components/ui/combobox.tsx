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
import { validateComboboxOptions } from "@/lib/utils/option-validation";

export interface ComboboxOption {
  value: string;
  label: string;
  data?: unknown;
}

export interface ComboboxProps {
  /** Current selected value */
  value?: string;
  /** Callback when value changes */
  onValueChange: (value: string) => void;
  /** Options to display */
  options: ComboboxOption[];
  /** Placeholder text */
  placeholder?: string;
  /** Text to show when no results found */
  emptyText?: string;
  /** Whether the combobox is disabled */
  disabled?: boolean;
  /** Class name for styling */
  className?: string | undefined;
  /** Whether the combobox is loading */
  isLoading?: boolean;
  /** Search placeholder text */
  searchPlaceholder?: string;
  /** Width of the combobox */
  width?: string;
  /** Callback when search term changes */
  onSearchChange?: ((searchTerm: string) => void) | undefined;
}

/**
 * Combobox component built with shadcn/ui patterns
 *
 * Provides an autocomplete input with a list of suggestions, functioning as a command palette.
 * Allows users to efficiently search and select from a predefined list of options.
 *
 * @component
 * @example
 * ```tsx
 * <Combobox
 *   value={selectedValue}
 *   onValueChange={setSelectedValue}
 *   options={frameworks}
 *   placeholder="Select framework..."
 *   searchPlaceholder="Search framework..."
 * />
 * ```
 */
export const Combobox = React.forwardRef<
  React.ElementRef<typeof Button>,
  ComboboxProps
>(
  (
    {
      value,
      onValueChange,
      options,
      placeholder = "Select option...",
      emptyText = "No results found.",
      disabled = false,
      className,
      isLoading = false,
      searchPlaceholder = "Search...",
      width = "200px",
      onSearchChange,
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState("");

    // Validate options to ensure unique keys and prevent React warnings
    const validatedOptions = React.useMemo(() => {
      return validateComboboxOptions(options, "combobox");
    }, [options]);

    // Find the selected option
    const selectedOption = validatedOptions.find(
      (option) => option.value === value
    );

    const handleSelect = (currentValue: string): void => {
      if (currentValue === value) {
        onValueChange(""); // Deselect if clicking the same item
      } else {
        onValueChange(currentValue);
      }
      setOpen(false);
    };

    const handleSearchChange = (value: string): void => {
      setSearchTerm(value);
      if (onSearchChange) {
        onSearchChange(value);
      }
    };

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || isLoading}
            className={cn(
              "justify-between",
              !selectedOption && "text-muted-foreground",
              className
            )}
            style={{ width }}
          >
            <span className="truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" style={{ width }}>
          <Command>
            <CommandInput
              placeholder={searchPlaceholder}
              className="h-9"
              value={searchTerm}
              onValueChange={handleSearchChange}
            />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {validatedOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={handleSelect}
                  >
                    <span className="truncate">{option.label}</span>
                    <Check
                      className={cn(
                        "ml-auto",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
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
Combobox.displayName = "Combobox";

export default Combobox;
