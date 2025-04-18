import React, { useState } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Group, Memory, User, GroupMember } from "@shared/schema";
import Sidebar from "@/components/layout/sidebar";
import TopNavbar from "@/components/layout/top-navbar";
import MobileNav from "@/components/layout/mobile-nav";
import MemoryCard from "@/components/memory/memory-card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CalendarIcon, Clock, Loader2, MoreVertical, Settings, Share, Users } from "lucide-react";
import { format } from "date-fns";

export default function GroupDetailsPage() {
  const [, params] = useRoute<{ id: string }>("/groups/:id");
  const groupId = parseInt(params?.id || "0");
  const { user } = useAuth();
  const { toast } = useToast();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  
  // Fetch group details
  const { data: group, isLoading: groupLoading } = useQuery<Group>({
    queryKey: [`/api/groups/${groupId}`],
  });
  
  // Fetch group members
  const { data: members, isLoading: membersLoading } = useQuery<GroupMember[]>({
    queryKey: [`/api/groups/${groupId}/members`],
  });
  
  // Fetch group memories
  const { data: memories, isLoading: memoriesLoading } = useQuery<Memory[]>({
    queryKey: [`/api/groups/${groupId}/memories`],
  });
  
  // Fetch all users (for member display and invites)
  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Leave group mutation
  const leaveGroupMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/groups/${groupId}/leave`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Left group",
        description: "You have successfully left the group",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users/groups'] });
      window.location.href = "/groups"; // Navigate back to groups page
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to leave group",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Invite user to group mutation
  const inviteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("POST", `/api/groups/${groupId}/invite/${userId}`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Invitation sent",
        description: "The user has been invited to join the group",
      });
      setInviteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send invitation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get user details by ID
  const getUserById = (userId: number) => {
    return users?.find(u => u.id === userId);
  };

  // Check if current user is admin
  const isCurrentUserAdmin = () => {
    if (!members || !user) return false;
    const userMembership = members.find(m => m.userId === user.id);
    return userMembership?.role === "admin";
  };

  // Get role of a user in the group
  const getUserRole = (userId: number) => {
    if (!members) return null;
    return members.find(m => m.userId === userId)?.role;
  };

  // Handle leaving group
  const handleLeaveGroup = () => {
    leaveGroupMutation.mutate();
  };

  // Remove user from group mutation
  const removeUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("DELETE", `/api/groups/${groupId}/members/${userId}`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Member removed",
        description: "The member has been removed from the group",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}/members`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove member",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (groupLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-col md:pl-64 flex-1 overflow-hidden">
          <TopNavbar />
          <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-4 md:p-6">
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </main>
          <MobileNav />
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-col md:pl-64 flex-1 overflow-hidden">
          <TopNavbar />
          <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-4 md:p-6">
            <div className="max-w-4xl mx-auto text-center py-12">
              <h1 className="text-2xl font-bold mb-4">Group Not Found</h1>
              <p className="mb-6">The group you're looking for doesn't exist or you don't have permission to view it.</p>
              <Button onClick={() => window.history.back()}>Go Back</Button>
            </div>
          </main>
          <MobileNav />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex flex-col md:pl-64 flex-1 overflow-hidden">
        <TopNavbar />
        
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-4 md:p-6">
          <div className="max-w-6xl mx-auto">
            {/* Group header */}
            <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow mb-6 overflow-hidden">
              {group.avatar ? (
                <div className="h-48 w-full relative">
                  <img 
                    src={group.avatar} 
                    alt={group.name} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>
              ) : (
                <div className="h-48 w-full bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center">
                  <Users className="h-20 w-20 text-primary/30" />
                </div>
              )}
              
              <div className="p-6 relative">
                {/* Options menu for admins */}
                {isCurrentUserAdmin() && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="absolute right-4 top-4"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        Edit Group
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setMembersDialogOpen(true)}>
                        <Users className="mr-2 h-4 w-4" />
                        Manage Members
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setInviteDialogOpen(true)}>
                        <Share className="mr-2 h-4 w-4" />
                        Invite Members
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                
                <div className="flex flex-col md:flex-row md:items-center">
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold">{group.name}</h1>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Users className="mr-1 h-4 w-4" />
                        <span>{members?.length || 0} members</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="mr-1 h-4 w-4" />
                        <span>Created {format(new Date(group.createdAt), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                    <p className="mt-4 text-slate-600 dark:text-slate-300">{group.description}</p>
                  </div>
                  
                  <div className="mt-4 md:mt-0 md:ml-4 flex flex-wrap gap-2">
                    <Button onClick={() => setInviteDialogOpen(true)}>
                      <Share className="mr-2 h-4 w-4" />
                      Invite
                    </Button>
                    <Button variant="outline" onClick={handleLeaveGroup} disabled={leaveGroupMutation.isPending}>
                      {leaveGroupMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Leave Group
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Group content */}
            <Tabs defaultValue="memories" className="w-full">
              <TabsList className="w-full mb-6">
                <TabsTrigger value="memories" className="flex-1">Memories</TabsTrigger>
                <TabsTrigger value="members" className="flex-1">Members</TabsTrigger>
                <TabsTrigger value="calendar" className="flex-1">Calendar</TabsTrigger>
              </TabsList>
              
              <TabsContent value="memories" className="mt-0">
                {memoriesLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="bg-white dark:bg-slate-800 rounded-lg shadow h-64 animate-pulse" />
                    ))}
                  </div>
                ) : !memories || memories.length === 0 ? (
                  <Card>
                    <CardHeader className="text-center">
                      <CardTitle>No Memories Yet</CardTitle>
                      <CardDescription>
                        Be the first to share a memory with this group!
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center pb-6">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button>Create Memory</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[550px]">
                          <DialogHeader>
                            <DialogTitle>Create New Memory</DialogTitle>
                          </DialogHeader>
                          {/* Memory form would be here, but already exists */}
                        </DialogContent>
                      </Dialog>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {memories.map(memory => (
                      <MemoryCard
                        key={memory.id}
                        memory={memory}
                        user={getUserById(memory.userId)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="members" className="mt-0">
                {membersLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="bg-white dark:bg-slate-800 rounded-lg p-4 flex items-center animate-pulse">
                        <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-700 mr-4" />
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : !members || members.length === 0 ? (
                  <Card>
                    <CardHeader className="text-center">
                      <CardTitle>No Members</CardTitle>
                      <CardDescription>
                        This group doesn't have any members yet. Invite some friends!
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {members.map(member => {
                      const memberUser = getUserById(member.userId);
                      if (!memberUser) return null;
                      
                      return (
                        <Card key={member.id} className="flex items-center p-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={memberUser.avatar || ""} alt={memberUser.username} />
                            <AvatarFallback>
                              {memberUser.username.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-4 flex-1">
                            <div className="font-medium">{memberUser.displayName || memberUser.username}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                              <span className="capitalize">{member.role}</span>
                              <span>•</span>
                              <span>Joined {format(new Date(member.joinedAt), 'MMM d, yyyy')}</span>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="calendar" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CalendarIcon className="mr-2 h-5 w-5" />
                      Group Calendar
                    </CardTitle>
                    <CardDescription>
                      View memories organized by date
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-center py-12 text-muted-foreground">
                      Calendar view is coming soon! Check back later.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
        
        <MobileNav />
      </div>
      
      {/* Invite Members Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Invite Members</DialogTitle>
            <DialogDescription>
              Invite friends to join this group
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[400px] overflow-y-auto mt-4">
            <div className="space-y-2">
              {users?.filter(u => !members?.some(m => m.userId === u.id)).map(user => (
                <div key={user.id} className="flex items-center p-2 hover:bg-accent rounded-md">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar || ""} alt={user.username} />
                    <AvatarFallback>
                      {user.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-3 flex-1">
                    <div className="font-medium">{user.displayName || user.username}</div>
                    <div className="text-xs text-muted-foreground">@{user.username}</div>
                  </div>
                  <Button 
                    size="sm"
                    onClick={() => inviteUserMutation.mutate(user.id)}
                    disabled={inviteUserMutation.isPending}
                  >
                    {inviteUserMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Invite"
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Manage Members Dialog */}
      <Dialog open={membersDialogOpen} onOpenChange={setMembersDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Manage Members</DialogTitle>
            <DialogDescription>
              Add or remove members from this group
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[400px] overflow-y-auto mt-4">
            <div className="space-y-2">
              {members?.map(member => {
                const memberUser = getUserById(member.userId);
                if (!memberUser) return null;
                
                const isAdmin = member.role === "admin";
                const isCurrentUser = memberUser.id === user?.id;
                
                return (
                  <div key={member.id} className="flex items-center p-2 hover:bg-accent rounded-md">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={memberUser.avatar || ""} alt={memberUser.username} />
                      <AvatarFallback>
                        {memberUser.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-3 flex-1">
                      <div className="font-medium">{memberUser.displayName || memberUser.username}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className="capitalize">{member.role}</span>
                        {isCurrentUser && <span className="ml-1">(You)</span>}
                      </div>
                    </div>
                    
                    {isCurrentUserAdmin() && !isCurrentUser && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              // Would toggle admin rights in production
                              toast({
                                title: isAdmin ? "Admin rights removed" : "Made admin",
                                description: `${memberUser.username} is now a ${isAdmin ? 'member' : 'admin'}`
                              });
                            }}
                          >
                            {isAdmin ? "Remove Admin" : "Make Admin"}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-500"
                            onClick={() => removeUserMutation.mutate(member.userId)}
                          >
                            Remove from Group
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setInviteDialogOpen(true)}>
              Invite Members
            </Button>
            <Button variant="outline" onClick={() => setMembersDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
