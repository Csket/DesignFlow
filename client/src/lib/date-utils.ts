import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths 
} from 'date-fns';

/**
 * Get an array of dates for a calendar month
 * @param date The reference date (any date in the target month)
 * @returns Array of dates for the calendar, including dates from previous/next months to fill the grid
 */
export function getCalendarDays(date: Date): Date[] {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  
  // Get all days in the month
  const monthDays = eachDayOfInterval({ start, end });
  
  // Determine the first day of the week (0 = Sunday)
  const firstDayOfWeek = start.getDay();
  
  // Get days from previous month to fill in the first row
  const previousMonthDays = [];
  if (firstDayOfWeek > 0) {
    const prevMonth = subMonths(start, 1);
    const prevMonthEnd = endOfMonth(prevMonth);
    const startDay = new Date(prevMonthEnd);
    startDay.setDate(prevMonthEnd.getDate() - firstDayOfWeek + 1);
    
    previousMonthDays.push(
      ...eachDayOfInterval({ 
        start: startDay, 
        end: prevMonthEnd 
      })
    );
  }
  
  // Get days from next month to fill in the last row
  const totalDaysNeeded = 42; // 6 rows of 7 days
  const nextMonthDays = [];
  const daysToAdd = totalDaysNeeded - (previousMonthDays.length + monthDays.length);
  
  if (daysToAdd > 0) {
    const nextMonth = addMonths(start, 1);
    const nextMonthStart = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1);
    const nextMonthEnd = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), daysToAdd);
    
    nextMonthDays.push(
      ...eachDayOfInterval({ 
        start: nextMonthStart, 
        end: nextMonthEnd 
      })
    );
  }
  
  // Combine all days
  return [...previousMonthDays, ...monthDays, ...nextMonthDays];
}

/**
 * Checks if a memory date is on a specific day
 * @param memories Array of memory dates
 * @param day The day to check
 * @returns boolean indicating if there's a memory on that day
 */
export function hasMemoryOnDay(memories: Date[], day: Date): boolean {
  return memories.some(memoryDate => isSameDay(memoryDate, day));
}

/**
 * Get human-readable relative time (today, yesterday, etc.)
 * @param date The date to format
 * @returns Formatted date string
 */
export function getRelativeTimeString(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (isSameDay(date, today)) {
    return 'Today';
  } else if (isSameDay(date, yesterday)) {
    return 'Yesterday';
  } else if (date.getTime() > today.getTime() - 7 * 24 * 60 * 60 * 1000) {
    return format(date, 'EEEE'); // Day of week
  } else if (isSameMonth(date, today)) {
    return format(date, 'MMMM d'); // Month day
  } else {
    return format(date, 'MMMM d, yyyy'); // Full date
  }
}
