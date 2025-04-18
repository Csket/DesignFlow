import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, addMonths, subMonths, isSameDay, isSameMonth, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Memory } from "@shared/schema";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Sidebar from "@/components/layout/sidebar";
import TopNavbar from "@/components/layout/top-navbar";
import MobileNav from "@/components/layout/mobile-nav";
import MemoryCard from "@/components/memory/memory-card";
import { getCalendarDays } from "@/lib/date-utils";
import { useAuth } from "@/hooks/use-auth";

export default function CalendarPage() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<"month" | "day" | "list">("month");
  
  // Fetch all memories
  const { data: memories, isLoading } = useQuery<Memory[]>({
    queryKey: ['/api/memories'],
  });
  
  // Get users to display with memories
  const { data: users } = useQuery<any[]>({
    queryKey: ['/api/users'],
  });

  // Memory dates for calendar dots
  const memoryDates = useMemo(() => {
    if (!memories) return [];
    
    // Log the memories data for debugging
    console.log("Memories data:", memories);
    
    return memories.map(memory => new Date(memory.date));
  }, [memories]);

  // Filtered memories for the selected date or month
  const filteredMemories = useMemo(() => {
    if (!memories) return [];
    
    if (view === "day") {
      // For day view, show memories from the selected date
      return memories.filter(memory => 
        isSameDay(parseISO(memory.date.toString()), selectedDate)
      );
    } else {
      // For month view or list view, show memories from the current month
      return memories.filter(memory => 
        isSameMonth(parseISO(memory.date.toString()), currentMonth)
      ).sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    }
  }, [memories, selectedDate, currentMonth, view]);

  // Get a user by ID
  const getUserById = (userId: number) => {
    return users?.find(user => user.id === userId);
  };

  // Navigation handlers
  const goToPreviousMonth = () => {
    setCurrentMonth(prevMonth => subMonths(prevMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    setView("day");
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex flex-col md:pl-64 flex-1 overflow-hidden">
        <TopNavbar />
        
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-4 md:p-6">
          <div className="max-w-6xl mx-auto">
            {/* Calendar header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <h1 className="text-2xl font-bold mb-2 sm:mb-0">Calendar</h1>
              
              <div className="flex items-center space-x-2">
                <div className="mr-2">
                  <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
                    <button 
                      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${view === 'month' ? 'bg-background text-foreground shadow-sm' : ''}`}
                      onClick={() => setView('month')}
                    >
                      Month
                    </button>
                    <button 
                      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${view === 'day' ? 'bg-background text-foreground shadow-sm' : ''}`}
                      onClick={() => setView('day')}
                    >
                      Day
                    </button>
                    <button 
                      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${view === 'list' ? 'bg-background text-foreground shadow-sm' : ''}`}
                      onClick={() => setView('list')}
                    >
                      List
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={goToToday}>
                    Today
                  </Button>
                  <Button variant="outline" size="icon" onClick={goToNextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Calendar view */}
              <div className={view === "list" ? "md:col-span-12" : "md:col-span-8"}>
                <Tabs value={view} onValueChange={(v) => setView(v as any)}>
                  <TabsList className="hidden">
                    <TabsTrigger value="month">Month</TabsTrigger>
                    <TabsTrigger value="day">Day</TabsTrigger>
                    <TabsTrigger value="list">List</TabsTrigger>
                  </TabsList>
                  <TabsContent value="month" className="mt-0">
                    <Card>
                      <CardContent className="p-1 sm:p-3">
                        <div className="text-center py-2 border-b mb-2">
                          <h2 className="text-lg font-medium">{format(currentMonth, 'MMMM yyyy')}</h2>
                        </div>
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={handleDateSelect}
                          month={currentMonth}
                          onMonthChange={setCurrentMonth}
                          className="w-full"
                          showMemoryDots
                          memoryDates={memoryDates}
                          memories={memories}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="day" className="mt-0">
                    <Card className="mb-6">
                      <CardContent className="p-4">
                        <h2 className="text-lg font-medium mb-2">{format(selectedDate, 'MMMM d, yyyy')}</h2>
                        <div className="grid grid-cols-7 gap-2">
                          {getCalendarDays(currentMonth).slice(0, 7).map((_, i) => (
                            <div key={i} className="text-center text-xs font-medium text-muted-foreground">
                              {format(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1), 'EEE')}
                            </div>
                          ))}
                          {getCalendarDays(currentMonth).map((day, i) => {
                            const isSelected = isSameDay(day, selectedDate);
                            const isCurrentMonth = isSameMonth(day, currentMonth);
                            const hasMemory = memoryDates.some(memDate => isSameDay(memDate, day));
                            
                            // Check if there's a memory with an image on this day
                            const memoryWithImage = memories?.find(memory => 
                              isSameDay(new Date(memory.date), day) && 
                              memory.images && 
                              memory.images.length > 0
                            );
                            
                            return (
                              <button
                                key={i}
                                className={`
                                  aspect-square rounded-md flex items-center justify-center text-sm relative
                                  ${!isCurrentMonth ? 'text-muted-foreground opacity-50' : ''}
                                  ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}
                                  ${hasMemory && !isSelected && !memoryWithImage ? 'relative has-memory' : ''}
                                `}
                                onClick={() => handleDateSelect(day)}
                              >
                                {memoryWithImage && memoryWithImage.images && memoryWithImage.images.length > 0 && !isSelected && (
                                  <div 
                                    className="absolute inset-1 rounded-sm bg-cover bg-center opacity-25 hover:opacity-75 transition-opacity"
                                    style={{ backgroundImage: `url(${memoryWithImage.images[0]})` }}
                                  ></div>
                                )}
                                {format(day, 'd')}
                              </button>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <div className="space-y-4">
                      {filteredMemories.length === 0 ? (
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 text-center">
                          <h3 className="font-medium mb-2">No memories for {format(selectedDate, 'MMMM d, yyyy')}</h3>
                          <p className="text-sm text-muted-foreground">Create a new memory for this date!</p>
                        </div>
                      ) : (
                        filteredMemories.map(memory => (
                          <MemoryCard
                            key={memory.id}
                            memory={memory}
                            user={getUserById(memory.userId)}
                          />
                        ))
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="list" className="mt-0">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
                      <h2 className="text-lg font-medium mb-4">{format(currentMonth, 'MMMM yyyy')} Memories</h2>
                      
                      {filteredMemories.length === 0 ? (
                        <div className="text-center py-6">
                          <p className="text-muted-foreground">No memories for this month</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {filteredMemories.map(memory => (
                            <div key={memory.id} className="flex items-center p-3 hover:bg-accent rounded-md">
                              <div className="w-16 text-center">
                                <div className="text-sm font-medium">{format(new Date(memory.date), 'd')}</div>
                                <div className="text-xs text-muted-foreground">{format(new Date(memory.date), 'EEE')}</div>
                              </div>
                              <div className="ml-4 flex-1">
                                <div className="font-medium">{memory.title}</div>
                                <div className="text-xs text-muted-foreground">{memory.content.substring(0, 60)}...</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              
              {/* Memory previews - only show on month and day view */}
              {view !== "list" && (
                <div className="md:col-span-4">
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="text-md font-medium mb-3">
                        {view === "month" 
                          ? `Memories in ${format(currentMonth, 'MMMM')}` 
                          : `Memories on ${format(selectedDate, 'MMMM d')}`}
                      </h3>
                      
                      {isLoading ? (
                        <div className="animate-pulse space-y-3">
                          <div className="h-20 bg-muted rounded-md"></div>
                          <div className="h-20 bg-muted rounded-md"></div>
                        </div>
                      ) : filteredMemories.length === 0 ? (
                        <div className="text-center py-6">
                          <p className="text-muted-foreground">No memories found</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                          {filteredMemories.map(memory => (
                            <div 
                              key={memory.id} 
                              className="p-3 rounded-md border hover:bg-accent cursor-pointer"
                              onClick={() => {
                                setSelectedDate(new Date(memory.date));
                                setView("day");
                              }}
                            >
                              <div className="font-medium line-clamp-1">{memory.title}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {format(new Date(memory.date), 'MMM d, yyyy')}
                              </div>
                              <div className="text-sm line-clamp-2 mt-1">{memory.content}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </main>
        
        <MobileNav />
      </div>
    </div>
  );
}
