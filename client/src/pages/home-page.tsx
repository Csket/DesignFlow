import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Memory, User } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import MemoryCard from "@/components/memory/memory-card";
import Sidebar from "@/components/layout/sidebar";
import TopNavbar from "@/components/layout/top-navbar";
import MobileNav from "@/components/layout/mobile-nav";
import { useAuth } from "@/hooks/use-auth";
import { getRelativeTimeString } from "@/lib/date-utils";

export default function HomePage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<"all" | "mine" | "friends">("all");

  // Fetch memories
  const { data: memories, isLoading: memoriesLoading } = useQuery<Memory[]>({
    queryKey: ['/api/memories'],
  });

  // Fetch users (to display with memories)
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Group memories by date for display
  const groupedMemories = React.useMemo(() => {
    if (!memories) return [];
    
    // Filter memories based on selection
    const filteredMemories = memories.filter(memory => {
      if (filter === "mine") return memory.userId === user?.id;
      // For 'all' and 'friends', we'd actually have more complex logic
      // to filter based on friend connections, but for simplicity:
      return true;
    });
    
    // Sort by date (newest first)
    const sortedMemories = [...filteredMemories].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    // Group by date
    const groups: { date: string; memories: Memory[] }[] = [];
    sortedMemories.forEach(memory => {
      const dateStr = getRelativeTimeString(new Date(memory.date));
      const existingGroup = groups.find(g => g.date === dateStr);
      
      if (existingGroup) {
        existingGroup.memories.push(memory);
      } else {
        groups.push({ date: dateStr, memories: [memory] });
      }
    });
    
    return groups;
  }, [memories, filter, user?.id]);

  // Get user details for a memory
  const getUserForMemory = (memory: Memory) => {
    const u = users?.find(u => u.id === memory.userId);
    if (!u) return undefined;
    return {
      ...u,
      displayName: u.displayName ?? undefined,
      avatar: u.avatar ?? undefined,
    };
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex flex-col md:pl-64 flex-1 overflow-hidden">
        <TopNavbar />
        
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            {/* Filter buttons */}
            <div className="mb-6 flex space-x-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  filter === "all"
                    ? "bg-primary text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200"
                }`}
              >
                All Memories
              </button>
              <button
                onClick={() => setFilter("mine")}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  filter === "mine"
                    ? "bg-primary text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200"
                }`}
              >
                My Memories
              </button>
              <button
                onClick={() => setFilter("friends")}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  filter === "friends"
                    ? "bg-primary text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200"
                }`}
              >
                Friends Only
              </button>
            </div>
            
            {/* Loading skeleton */}
            {(memoriesLoading || usersLoading) && (
              <div className="space-y-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
                    <div className="p-4 flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-48 w-full" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-6 w-2/3" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Empty state */}
            {!memoriesLoading && groupedMemories.length === 0 && (
              <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg shadow">
                <div className="text-4xl mb-4">📷</div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">No memories found</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {filter === "mine"
                    ? "You haven't created any memories yet. Click 'New Memory' to get started!"
                    : filter === "friends"
                    ? "No memories from friends yet. Connect with more friends to see their memories."
                    : "There are no memories to display. Be the first to create a memory!"}
                </p>
              </div>
            )}
            
            {/* Memory list */}
            {!memoriesLoading && groupedMemories.length > 0 && (
              <div className="space-y-8">
                {groupedMemories.map((group, groupIndex) => (
                  <div key={`${group.date}-${groupIndex}`} className="space-y-4">
                    <h2 className="text-md font-medium text-slate-500 dark:text-slate-400">
                      {group.date}
                    </h2>
                    <div className="space-y-4">
                      {group.memories.map(memory => (
                        <MemoryCard
                          key={memory.id}
                          memory={memory}
                          user={getUserForMemory(memory)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
        
        <MobileNav />
      </div>
    </div>
  );
}
