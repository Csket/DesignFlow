import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Memory } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/ui/file-upload";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Sidebar from "@/components/layout/sidebar";
import TopNavbar from "@/components/layout/top-navbar";
import MobileNav from "@/components/layout/mobile-nav";
import MemoryCard from "@/components/memory/memory-card";
import { Calendar, Camera, Edit, MapPin, User, Users } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarFile, setAvatarFile] = useState<File[]>([]);

  // Fetch user memories
  const { data: memories, isLoading: memoriesLoading } = useQuery<Memory[]>({
    queryKey: ['/api/memories/user', user?.id],
  });

  // Mutation to update profile
  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      let avatarUrl = user?.avatar;
      
      // Upload new avatar if one was selected
      if (avatarFile.length > 0) {
        const formData = new FormData();
        formData.append('files', avatarFile[0]);
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        
        if (!uploadRes.ok) {
          throw new Error("Failed to upload avatar");
        }
        
        const uploadData = await uploadRes.json();
        avatarUrl = uploadData.urls[0];
      }
      
      const res = await apiRequest("PUT", "/api/user", {
        displayName,
        bio,
        avatar: avatarUrl
      });
      
      return await res.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["/api/user"], updatedUser);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      setEditMode(false);
      setAvatarFile([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate();
  };

  // Stats for display
  const stats = [
    { label: "Memories", value: memories?.length || 0, icon: Calendar },
    { label: "Friends", value: 0, icon: Users }, // Would use real data in production
    { label: "Groups", value: 0, icon: User }, // Would use real data in production
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex flex-col md:pl-64 flex-1 overflow-hidden">
        <TopNavbar />
        
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            {/* Profile header */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow mb-6 p-6 relative">
              {!editMode && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-4 top-4"
                  onClick={() => setEditMode(true)}
                >
                  <Edit className="h-5 w-5" />
                </Button>
              )}
              
              <div className="md:flex items-center">
                <div className="relative mb-4 md:mb-0 md:mr-6">
                  {editMode ? (
                    <div className="relative w-24 h-24 md:w-32 md:h-32">
                      <div className="w-full h-full rounded-full overflow-hidden">
                        <Avatar className="w-full h-full">
                          <AvatarImage 
                            src={avatarFile.length > 0 ? URL.createObjectURL(avatarFile[0]) : user?.avatar || ""} 
                            alt={user?.username || ""} 
                          />
                          <AvatarFallback className="text-2xl">
                            {user?.username?.substring(0, 2).toUpperCase() || "UN"}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                        <FileUpload
                          multiple={false}
                          accept={{ 'image/*': [] }}
                          onFilesSelected={setAvatarFile}
                          value={avatarFile}
                          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                        />
                        <Camera className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  ) : (
                    <Avatar className="w-24 h-24 md:w-32 md:h-32">
                      <AvatarImage src={user?.avatar || ""} alt={user?.username || ""} />
                      <AvatarFallback className="text-2xl">
                        {user?.username?.substring(0, 2).toUpperCase() || "UN"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
                
                <div className="flex-1">
                  {editMode ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input
                          id="displayName"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Your display name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="Write a little about yourself"
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleSaveProfile} disabled={updateProfileMutation.isPending}>
                          {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
                        </Button>
                        <Button variant="outline" onClick={() => setEditMode(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h1 className="text-2xl font-bold">{user?.displayName || user?.username}</h1>
                      <p className="text-sm text-muted-foreground mb-2">@{user?.username}</p>
                      {bio && <p className="text-sm mb-4">{bio}</p>}
                      
                      <div className="flex flex-wrap gap-6 mt-4">
                        {stats.map((stat, index) => {
                          const StatIcon = stat.icon;
                          return (
                            <div key={index} className="flex items-center gap-2">
                              <StatIcon className="h-5 w-5 text-primary" />
                              <div>
                                <div className="font-medium">{stat.value}</div>
                                <div className="text-xs text-muted-foreground">{stat.label}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Tabs for different content */}
            <Tabs defaultValue="memories" className="w-full">
              <TabsList className="w-full mb-6">
                <TabsTrigger value="memories" className="flex-1">Memories</TabsTrigger>
                <TabsTrigger value="friends" className="flex-1">Friends</TabsTrigger>
                <TabsTrigger value="groups" className="flex-1">Groups</TabsTrigger>
              </TabsList>
              
              <TabsContent value="memories" className="mt-0">
                {memoriesLoading ? (
                  <div className="grid grid-cols-1 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Card key={i}>
                        <CardHeader className="p-4 skeleton-pulse" />
                        <CardContent className="p-4 h-40 skeleton-pulse" />
                      </Card>
                    ))}
                  </div>
                ) : memories && memories.length > 0 ? (
                  <div className="space-y-4">
                    {memories.map(memory => (
                      <MemoryCard
                        key={memory.id}
                        memory={memory}
                        user={
                          user
                            ? {
                                ...user,
                                displayName: user.displayName ?? undefined,
                                avatar: user.avatar ?? undefined,
                              }
                            : undefined
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>No Memories Yet</CardTitle>
                      <CardDescription>
                        You haven't created any memories. Click "New Memory" to get started!
                      </CardDescription>
                    </CardHeader>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="friends">
                <Card>
                  <CardHeader>
                    <CardTitle>Friends</CardTitle>
                    <CardDescription>
                      Connect with other people to see their memories.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>You don't have any friends yet. Search for users to add them as friends.</p>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="groups">
                <Card>
                  <CardHeader>
                    <CardTitle>Groups</CardTitle>
                    <CardDescription>
                      Join or create groups to share memories with specific people.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>You haven't joined any groups yet. Create a group or search for existing ones.</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
        
        <MobileNav />
      </div>
    </div>
  );
}
