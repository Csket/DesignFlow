import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Group, InsertGroup } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Sidebar from "@/components/layout/sidebar";
import TopNavbar from "@/components/layout/top-navbar";
import MobileNav from "@/components/layout/mobile-nav";
import { FileUpload } from "@/components/ui/file-upload";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Search, Users } from "lucide-react";

export default function GroupsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [avatarFile, setAvatarFile] = useState<File[]>([]);

  // Fetch all groups
  const { data: groups, isLoading } = useQuery<Group[]>({
    queryKey: ['/api/groups'],
  });

  // Fetch user groups (groups the current user is a member of)
  const { data: userGroups, isLoading: userGroupsLoading } = useQuery<Group[]>({
    queryKey: ['/api/users/groups'],
  });

  // Form schema for group creation
  const formSchema = z.object({
    name: z.string().min(3, "Group name must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
  });

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      // First upload the avatar if there is one
      let avatarUrl = "";
      
      if (avatarFile.length > 0) {
        const formData = new FormData();
        formData.append('files', avatarFile[0]);
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        
        if (!uploadRes.ok) {
          throw new Error("Failed to upload group avatar");
        }
        
        const uploadData = await uploadRes.json();
        avatarUrl = uploadData.urls[0];
      }
      
      const groupData: InsertGroup = {
        name: data.name,
        description: data.description,
        createdBy: user?.id as number,
        avatar: avatarUrl,
      };
      
      const res = await apiRequest("POST", "/api/groups", groupData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Group created",
        description: "Your group has been created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/groups'] });
      setCreateDialogOpen(false);
      form.reset();
      setAvatarFile([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create group",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Function to handle form submission
  function onSubmit(data: z.infer<typeof formSchema>) {
    createGroupMutation.mutate(data);
  }

  // Join group mutation
  const joinGroupMutation = useMutation({
    mutationFn: async (groupId: number) => {
      const res = await apiRequest("POST", `/api/groups/${groupId}/join`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Group joined",
        description: "You have successfully joined the group!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/groups'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to join group",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter groups based on search term
  const filteredGroups = React.useMemo(() => {
    if (!groups || !searchTerm) return groups || [];
    
    return groups.filter(group => 
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (group.description && group.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [groups, searchTerm]);

  // Check if the user is a member of a group
  const isUserInGroup = (groupId: number) => {
    return userGroups?.some(g => g.id === groupId);
  };

  // Group card component
  const GroupCard = ({ group }: { group: Group }) => {
    const isMember = isUserInGroup(group.id);
    const isCreator = group.createdBy === user?.id;
    
    return (
      <Card className="overflow-hidden">
        <div className="aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
          {group.avatar ? (
            <img 
              src={group.avatar} 
              alt={group.name} 
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Users className="h-12 w-12 text-slate-300 dark:text-slate-600" />
            </div>
          )}
        </div>
        <CardHeader className="pb-2">
          <CardTitle>{group.name}</CardTitle>
          <CardDescription>
            {group.description?.substring(0, 100)}
            {group.description && group.description.length > 100 ? "..." : ""}
          </CardDescription>
        </CardHeader>
        <CardFooter className="pt-2 flex justify-between">
          {isMember || isCreator ? (
            <Link href={`/groups/${group.id}`}>
              <Button variant="outline">
                View Group
              </Button>
            </Link>
          ) : (
            <Button 
              onClick={() => joinGroupMutation.mutate(group.id)}
              disabled={joinGroupMutation.isPending}
            >
              {joinGroupMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Join Group
            </Button>
          )}
          <div className="text-sm text-muted-foreground">
            {/* Would show member count here in production */}
            Members: {Math.floor(Math.random() * 50) + 1} {/* Placeholder for demo */}
          </div>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex flex-col md:pl-64 flex-1 overflow-hidden">
        <TopNavbar />
        
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-4 md:p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <h1 className="text-2xl font-bold mb-2 sm:mb-0">Groups</h1>
              
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Group
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[550px]">
                  <DialogHeader>
                    <DialogTitle>Create New Group</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Group Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter a name for your group" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="What's this group about?" 
                                className="min-h-[100px]" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="space-y-2">
                        <Label>Group Avatar</Label>
                        <FileUpload
                          multiple={false}
                          accept={{
                            'image/*': []
                          }}
                          onFilesSelected={setAvatarFile}
                          value={avatarFile}
                          previewImages
                        />
                      </div>
                      
                      <div className="flex gap-3 justify-end">
                        <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createGroupMutation.isPending}>
                          {createGroupMutation.isPending ? "Creating..." : "Create Group"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="mb-6">
              <div className="relative max-w-md mx-auto mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input 
                  type="text"
                  placeholder="Search groups..."
                  className="pl-10 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="w-full max-w-md mx-auto">
                  <TabsTrigger value="all" className="flex-1">All Groups</TabsTrigger>
                  <TabsTrigger value="myGroups" className="flex-1">My Groups</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="mt-6">
                  {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i} className="overflow-hidden">
                          <div className="aspect-video w-full bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
                          <CardHeader className="pb-2">
                            <div className="h-6 w-2/3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-2"></div>
                            <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                          </CardHeader>
                          <CardFooter className="pt-2">
                            <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  ) : filteredGroups && filteredGroups.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {filteredGroups.map(group => (
                        <GroupCard key={group.id} group={group} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Groups Found</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {searchTerm 
                          ? `No groups matching "${searchTerm}"` 
                          : "There are no groups available yet. Create the first one!"}
                      </p>
                      <Button onClick={() => setCreateDialogOpen(true)}>
                        Create Group
                      </Button>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="myGroups" className="mt-6">
                  {userGroupsLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="overflow-hidden">
                          <div className="aspect-video w-full bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
                          <CardHeader className="pb-2">
                            <div className="h-6 w-2/3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-2"></div>
                            <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                          </CardHeader>
                          <CardFooter className="pt-2">
                            <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  ) : userGroups && userGroups.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {userGroups.map(group => (
                        <GroupCard key={group.id} group={group} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">You're Not In Any Groups</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Join an existing group or create a new one to get started.
                      </p>
                      <div className="space-x-4">
                        <Button 
                          variant="outline" 
                          onClick={() => document.getElementById('all-groups-tab')?.click()}
                        >
                          Browse Groups
                        </Button>
                        <Button onClick={() => setCreateDialogOpen(true)}>
                          Create Group
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
        
        <MobileNav />
      </div>
    </div>
  );
}
