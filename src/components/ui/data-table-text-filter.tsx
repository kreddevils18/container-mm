"use client";

import { Search, X } from "lucide-react";
import type * as React from "react";
import {
  type ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

export interface DataTableTextFilterConfig {
  placeholder: string;
  debounceMs?: number;
  maxWidth?: string;
  showClearButton?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

export interface DataTableTextFilterProps {
  config: DataTableTextFilterConfig;
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  loading?: boolean;
}

export const DataTableTextFilter = ({
  value,
  onChange,
  config,
  disabled = false,
  loading = false,
}: DataTableTextFilterProps): ReactElement => {
  const [localValue, setLocalValue] = useState<string>(value ?? "");
  const debouncedValue = useDebounce(localValue, config.debounceMs ?? 300);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if ((value ?? "") !== localValue) {
      setLocalValue(value ?? "");
    }
  }, [value]);

  useEffect(() => {
    const next = debouncedValue.trim();
    if (next !== (value ?? "")) {
      onChange(next.length > 0 ? next : null);
    }
  }, [debouncedValue]);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      setLocalValue(event.target.value);
    },
    []
  );

  const handleClear = useCallback((): void => {
    setLocalValue("");
    onChange(null);
    inputRef.current?.focus();
  }, [onChange]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>): void => {
      if (event.key === "Escape" && localValue) {
        event.preventDefault();
        handleClear();
      }
    },
    [handleClear, localValue]
  );

  const {
    placeholder,
    maxWidth = "max-w-sm",
    showClearButton = true,
    icon: IconComponent = Search,
    className,
  } = config;

  const hasValue = localValue.length > 0;
  const showClear = showClearButton && hasValue && !disabled;

  return (
    <div className={cn("relative w-full", maxWidth, className)}>
      <div className="relative">
        <IconComponent
          className={cn(
            "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors",
            loading && "animate-pulse",
            disabled && "opacity-50"
          )}
          aria-hidden="true"
        />

        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={localValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className={cn(
            "pl-10 transition-all duration-200",
            showClear && "pr-10",
            loading && "opacity-75"
          )}
          disabled={disabled}
          autoComplete="off"
          spellCheck={false}
          aria-label={placeholder}
          data-testid="data-table-text-filter-input"
        />

        {showClear && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0",
              "hover:bg-muted/50 focus-visible:ring-1 focus-visible:ring-ring",
              "transition-all duration-200"
            )}
            onClick={handleClear}
            disabled={disabled}
            tabIndex={-1}
            aria-label="Xóa tìm kiếm"
            data-testid="data-table-text-filter-clear"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        )}
      </div>

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {loading && "Đang tìm kiếm..."}
        {hasValue && !loading && `Đã nhập: ${localValue}`}
      </div>
    </div>
  );
};

export const createTextFilterConfig = (
  placeholder: string,
  options: Partial<Omit<DataTableTextFilterConfig, "placeholder">> = {}
): DataTableTextFilterConfig => ({
  placeholder,
  debounceMs: 300,
  maxWidth: "max-w-sm",
  showClearButton: true,
  icon: Search,
  ...options,
});

/**
 * Pre-configured filter configurations for different languages
 */
export const DATA_TABLE_TEXT_FILTER_DEFAULTS = {
  VIETNAMESE: createTextFilterConfig("Tìm kiếm..."),
  ENGLISH: createTextFilterConfig("Search..."),
} as const;

/**
 * Get text filter configuration based on locale
 */
export const getTextFilterConfig = (locale: string = "vi"): DataTableTextFilterConfig => {
  return locale.startsWith("vi") 
    ? DATA_TABLE_TEXT_FILTER_DEFAULTS.VIETNAMESE
    : DATA_TABLE_TEXT_FILTER_DEFAULTS.ENGLISH;
};
