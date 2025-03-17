
import * as React from "react";
import { format, parse } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface DatePickerProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Select date",
  className,
  disabled = false,
  required = false,
}: DatePickerProps) {
  const [inputValue, setInputValue] = React.useState<string>(
    date ? format(date, "yyyy-MM-dd") : ""
  );
  const [isOpen, setIsOpen] = React.useState(false);

  // Update input value when date changes externally
  React.useEffect(() => {
    if (date) {
      setInputValue(format(date, "yyyy-MM-dd"));
    } else {
      setInputValue("");
    }
  }, [date]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Try to parse the date
    try {
      if (value) {
        // This handles the default input format (yyyy-MM-dd)
        const parsedDate = parse(value, "yyyy-MM-dd", new Date());
        
        // Check if it's a valid date
        if (!isNaN(parsedDate.getTime())) {
          onDateChange(parsedDate);
        }
      } else {
        // Empty input
        onDateChange(undefined);
      }
    } catch (error) {
      // Invalid date format, don't update the date
      console.log("Invalid date format");
    }
  };

  const handleCalendarSelect = (selectedDate: Date | undefined) => {
    onDateChange(selectedDate);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      <div className="flex">
        <Input
          type="date"
          value={inputValue}
          onChange={handleInputChange}
          disabled={disabled}
          required={required}
          className={cn("rounded-r-none", className)}
        />
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="rounded-l-none border-l-0"
              disabled={disabled}
              onClick={() => setIsOpen(true)}
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleCalendarSelect}
              disabled={(date) =>
                disabled || date > new Date() || date < new Date("1900-01-01")
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
