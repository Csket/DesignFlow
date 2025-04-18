import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Users, Home, UserCircle, Group, LogOut } from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/calendar", label: "Calendar", icon: Calendar },
    { href: "/friends", label: "Friends", icon: Users },
    { href: "/groups", label: "Groups", icon: Group },
    { href: "/profile", label: "Profile", icon: UserCircle },
  ];

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-neutral-200 dark:bg-slate-900 dark:border-slate-800">
      <div className="flex-1 flex flex-col min-h-0">
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-neutral-200 dark:border-slate-800">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <h1 className="ml-2 text-xl font-semibold text-slate-900 dark:text-white">MemoryLane</h1>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
              >
                <a className={cn(
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                )}>
                  <Icon className={cn(
                    "mr-3 h-5 w-5",
                    isActive 
                      ? "text-primary" 
                      : "text-slate-400 group-hover:text-slate-500 dark:text-slate-500 dark:group-hover:text-slate-300"
                  )} />
                  {item.label}
                </a>
              </Link>
            );
          })}
        </nav>
        
        {/* User profile */}
        <div className="flex items-center p-4 border-t border-neutral-200 dark:border-slate-800">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.avatar || ""} alt={user?.username || ""} />
            <AvatarFallback>
              {user?.username?.substring(0, 2).toUpperCase() || "UN"}
            </AvatarFallback>
          </Avatar>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{user?.displayName || user?.username}</p>
            <p className="text-xs text-slate-500 truncate">@{user?.username}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5 text-slate-500" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
