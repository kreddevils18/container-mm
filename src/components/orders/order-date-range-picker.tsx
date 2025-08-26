"use client";

import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface DateRangePickerRef {
  reset: () => void;
}

export const OrderDateRangePicker = React.forwardRef<DateRangePickerRef>(
  (_, ref) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const dateId = React.useId();
    
    // Initialize date range from URL parameters
    const [date, setDate] = React.useState<DateRange | undefined>(() => {
      const from = searchParams.get("from");
      const to = searchParams.get("to");
      return {
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
      };
    });

    // Update URL when date changes
    React.useEffect(() => {
      const params = new URLSearchParams(searchParams.toString());
      
      if (date?.from) {
        params.set("from", date.from.toISOString());
      } else {
        params.delete("from");
      }
      
      if (date?.to) {
        params.set("to", date.to.toISOString());
      } else {
        params.delete("to");
      }
      
      params.set("page", "1");
      router.replace(`?${params.toString()}`);
    }, [date, router, searchParams]);

    const reset = React.useCallback(() => {
      setDate(undefined);
    }, []);

    React.useImperativeHandle(ref, () => ({ reset }));

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={dateId}
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "dd/MM/yyyy", { locale: vi })} -{" "}
                  {format(date.to, "dd/MM/yyyy", { locale: vi })}
                </>
              ) : (
                format(date.from, "dd/MM/yyyy", { locale: vi })
              )
            ) : (
              <span>Chọn ngày tạo đơn</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus={true}
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    );
  }
);

OrderDateRangePicker.displayName = "OrderDateRangePicker";