"use client"

import * as React from "react"
import { addDays, format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"
import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function DatepickerHistorical({
  className,
}: React.HTMLAttributes<HTMLDivElement>) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: addDays(new Date(),-7),
    to: new Date(),
  })
  const pathName = usePathname();
  const router = useRouter();

  const handleValueChange = (query: DateRange) => {
    const params = new URLSearchParams(window.location.search);
    var dateto = null;

    if (query?.to){

    dateto = new Date(query.to.getTime());
    dateto.setDate(dateto.getDate() + 1);
    }

    params.set('datefrom', query?.from?.toLocaleDateString('sv-SE') ?? "");
    params.set('dateto', dateto?.toLocaleDateString('sv-SE') ?? "");

    const queryString = params.toString();
    const updatedPath = `${pathName}${queryString ? `?${queryString}` : ''}`
    router.push(updatedPath);
  };
  
  useEffect(() => {
      // Fix: Add null check before calling handleValueChange
      if (date) {
        handleValueChange(date);
      }
    }, [date]);

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex flex-col space-y-2 p-2">
            <Select
              onValueChange={(value) => {
                const newDate = addDays(new Date(), -parseInt(value))
                setDate({ from: newDate, to: new Date() })
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a preset" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="0">1 Day</SelectItem>
                <SelectItem value="5">5 Days</SelectItem>
                <SelectItem value="92">3 Months</SelectItem>
                <SelectItem value="184">6 Months</SelectItem>
                <SelectItem value="100000">YTD</SelectItem>
                <SelectItem value="366">1 Years</SelectItem>
                <SelectItem value="1830">5 Years </SelectItem>
              </SelectContent>
            </Select>
            <div className="rounded-md border">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
                disabled={(date) =>
                  date > new Date() || date < new Date("1900-01-01")
                }
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
