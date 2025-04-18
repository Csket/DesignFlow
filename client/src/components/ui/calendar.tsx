import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Memory } from "@shared/schema";

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  showMemoryDots?: boolean;
  memoryDates?: Date[];
  memories?: Memory[];
};

function Calendar({
  className,
  classNames,
  showMemoryDots = false,
  memoryDates = [],
  memories = [],
  ...props
}: CalendarProps) {
  // Create a map of date strings to memory data
  const memoryDateMap = React.useMemo(() => {
    if (!memoryDates) return new Map<string, { hasMemory: boolean, imageUrl?: string }>();
    
    const map = new Map<string, { hasMemory: boolean, imageUrl?: string }>();
    
    // First add entries for dates with memories (dot indicator)
    memoryDates.forEach(date => {
      // Ensure date is a valid Date object
      if (date instanceof Date && !isNaN(date.getTime())) {
        const dateStr = date.toISOString().split('T')[0];
        map.set(dateStr, { hasMemory: true });
      }
    });
    
    // Then add image URLs for dates that have memories with images
    if (memories && memories.length > 0) {
      console.log("Processing memories for calendar images:", memories);
      memories.forEach(memory => {
        console.log("Checking memory:", memory.id, memory.title, "images:", memory.images);
        if (memory.date && memory.images && memory.images.length > 0) {
          const date = new Date(memory.date);
          if (!isNaN(date.getTime())) {
            const dateStr = date.toISOString().split('T')[0];
            console.log("Found memory with image for date:", dateStr, "image:", memory.images[0]);
            
            // Use the first image as the preview
            map.set(dateStr, { 
              hasMemory: true, 
              imageUrl: memory.images[0] 
            });
          }
        }
      });
    }
    
    console.log("Final memory date map:", Array.from(map.entries()));
    return map;
  }, [memoryDates, memories]);

  // Custom day renderer to add memory indicators and images
  const renderDay = React.useCallback((props: any) => {
    const { date, children } = props;
    
    // If date is not a valid Date object, just render the cell without memory indicator
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return children;
    }
    
    try {
      // Format date to YYYY-MM-DD for lookup in the memory map
      const dateStr = date.toISOString().split('T')[0];
      const memoryData = memoryDateMap.get(dateStr);
      
      if (memoryData && showMemoryDots) {
        // If there's an image for this date, show it as background
        if (memoryData.imageUrl) {
          return (
            <div className="relative w-full h-full flex items-center justify-center">
              <div 
                className="absolute inset-1 rounded-sm bg-cover bg-center opacity-25 hover:opacity-75 transition-opacity"
                style={{ backgroundImage: `url(${memoryData.imageUrl})` }}
              ></div>
              {/* Original day content */}
              {children}
              {/* Show the memory dot only if there's no image */}
              {!memoryData.imageUrl && <div className="has-memory-indicator"></div>}
            </div>
          );
        } else {
          // If no image, just add the has-memory class for the dot
          return React.cloneElement(children as React.ReactElement, {
            className: `${(children as React.ReactElement).props.className} has-memory`
          });
        }
      }
    } catch (error) {
      console.error("Error in calendar day rendering:", error);
      // Fallback to just returning the children if there's an error
    }
    
    // Return the unmodified children if there's no memory or if there was an error
    return children;
  }, [memoryDateMap, showMemoryDots]);

  return (
    <DayPicker
      showOutsideDays={true}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
        Day: renderDay
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
