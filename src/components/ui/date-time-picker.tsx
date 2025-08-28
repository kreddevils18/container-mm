"use client";

import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import type { ReactElement } from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const DateTimePicker = ({
  value,
  onChange,
  placeholder = "Chọn ngày và giờ...",
  disabled = false,
}: DateTimePickerProps): ReactElement => {
  const [open, setOpen] = useState(false);
  const [timeValue, setTimeValue] = useState(() => {
    if (!value) return "09:00";
    const date = new Date(value);
    return format(date, "HH:mm");
  });

  const selectedDate = value ? new Date(value) : undefined;

  const handleDateSelect = (date: Date | undefined): void => {
    if (date) {
      const [hours, minutes] = timeValue.split(":");
      date.setHours(parseInt(hours ?? "0", 10), parseInt(minutes ?? "0", 10), 0, 0);
      onChange(date.toISOString());
      setOpen(false);
    }
  };

  const handleTimeChange = (time: string): void => {
    setTimeValue(time);
    if (selectedDate) {
      const [hours, minutes] = time.split(":");
      const newDate = new Date(selectedDate);
      newDate.setHours(parseInt(hours ?? "0", 10), parseInt(minutes ?? "0", 10), 0, 0);
      onChange(newDate.toISOString());
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? (
            format(selectedDate, "PPP HH:mm", { locale: vi })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="border-b p-3">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Input
              type="time"
              value={timeValue}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="w-auto"
            />
          </div>
        </div>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          disabled={(date) => date < new Date("1900-01-01")}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};