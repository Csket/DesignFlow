import React from "react";
import { Link, useLocation } from "wouter";
import { Calendar, Home, Users, Group, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import MemoryForm from "../memory/memory-form";

export function MobileNav() {
  const [location] = useLocation();
  const [memoryDialogOpen, setMemoryDialogOpen] = React.useState(false);

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/calendar", label: "Calendar", icon: Calendar },
    { href: "/friends", label: "Friends", icon: Users },
    { href: "/groups", label: "Groups", icon: Group },
    { href: "/profile", label: "Profile", icon: UserCircle },
  ];

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-10">
        <div className="flex justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <div key={item.href} className="w-full text-center">
                <Link href={item.href}>
                  <div className="flex flex-col items-center py-2 px-3 cursor-pointer">
                    <Icon className={cn(
                      "h-6 w-6",
                      isActive 
                        ? "text-primary" 
                        : "text-slate-500 dark:text-slate-400"
                    )} />
                    <span className={cn(
                      "text-xs mt-1",
                      isActive 
                        ? "text-primary font-medium" 
                        : "text-slate-500 dark:text-slate-400"
                    )}>
                      {item.label}
                    </span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating add button - centered at bottom */}
      <Dialog open={memoryDialogOpen} onOpenChange={setMemoryDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            className="md:hidden fixed bottom-16 left-1/2 transform -translate-x-1/2 z-20 rounded-full shadow-lg" 
            size="icon"
          >
            <span className="material-icons text-lg">add</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Create New Memory</DialogTitle>
          </DialogHeader>
          <MemoryForm onSuccess={() => setMemoryDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}

export default MobileNav;
