import React, { useState } from "react";
import { Link } from "wouter";
import { Menu, Search, Bell, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Sidebar from "./sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import MemoryForm from "../memory/memory-form";

export function TopNavbar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [memoryDialogOpen, setMemoryDialogOpen] = useState(false);

  return (
    <div className="sticky top-0 z-10 flex-shrink-0 h-16 bg-white dark:bg-slate-900 border-b border-neutral-200 dark:border-slate-800 flex">
      <div className="flex-1 px-4 flex justify-between">
        <div className="flex-1 flex items-center">
          {/* Mobile menu button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open sidebar</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <Sidebar />
            </SheetContent>
          </Sheet>

          <div className="max-w-2xl w-full ml-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search memories, friends, or groups..."
                className="pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        <div className="ml-4 flex items-center md:ml-6">
          {/* Notification dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500"></span>
                <span className="sr-only">View notifications</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="p-2">
                <h3 className="text-sm font-medium mb-1">Notifications</h3>
                <div className="text-xs text-slate-500 mb-2">
                  You have 3 unread notifications
                </div>
                
                <div className="space-y-2">
                  {/* Sample notifications - would be dynamic in real app */}
                  <div className="p-2 rounded hover:bg-slate-50 cursor-pointer">
                    <div className="text-sm">Jane liked your memory</div>
                    <div className="text-xs text-slate-500">2 hours ago</div>
                  </div>
                  <div className="p-2 rounded hover:bg-slate-50 cursor-pointer">
                    <div className="text-sm">New friend request from Mike</div>
                    <div className="text-xs text-slate-500">Yesterday</div>
                  </div>
                  <div className="p-2 rounded hover:bg-slate-50 cursor-pointer">
                    <div className="text-sm">You were invited to "Travel Group"</div>
                    <div className="text-xs text-slate-500">2 days ago</div>
                  </div>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Create memory button */}
          <Dialog open={memoryDialogOpen} onOpenChange={setMemoryDialogOpen}>
            <DialogTrigger asChild>
              <Button className="ml-4" variant="default">
                <Plus className="mr-2 h-4 w-4" />
                New Memory
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Create New Memory</DialogTitle>
              </DialogHeader>
              <MemoryForm onSuccess={() => setMemoryDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}

export default TopNavbar;
