import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User, Friend } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Sidebar from "@/components/layout/sidebar";
import TopNavbar from "@/components/layout/top-navbar";
import MobileNav from "@/components/layout/mobile-nav";
import { Check, Search, UserPlus, X } from "lucide-react";

export default function FriendsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Fetch all users
  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });
  
  // Fetch friend requests and friendships
  const { data: friends } = useQuery<Friend[]>({
    queryKey: ['/api/friends'],
  });

  // Accept friend request mutation
  const acceptFriendMutation = useMutation({
    mutationFn: async (friendId: number) => {
      const res = await apiRequest("POST", `/api/friends/accept/${friendId}`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/friends'] });
      toast({
        title: "Friend request accepted",
        description: "You are now friends!"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to accept friend request",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Reject friend request mutation
  const rejectFriendMutation = useMutation({
    mutationFn: async (friendId: number) => {
      const res = await apiRequest("POST", `/api/friends/reject/${friendId}`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/friends'] });
      toast({
        title: "Friend request rejected",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reject friend request",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Send friend request mutation
  const sendFriendRequestMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("POST", `/api/friends/request/${userId}`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/friends'] });
      toast({
        title: "Friend request sent",
        description: "Your request has been sent!"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send friend request",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Filter users based on search term
  const filteredUsers = React.useMemo(() => {
    if (!users || !searchTerm) return [];
    
    return users.filter(user => 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.displayName && user.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [users, searchTerm]);

  // Split friends into different categories
  const { friendRequests, myFriends, pendingRequests } = React.useMemo(() => {
    if (!friends) {
      return {
        friendRequests: [],
        myFriends: [],
        pendingRequests: []
      };
    }
    
    return {
      // Requests sent to me
      friendRequests: friends.filter(f => f.status === "pending" && f.friendId === 1), // Use actual user ID
      // Accepted friends
      myFriends: friends.filter(f => f.status === "accepted"),
      // Requests I've sent
      pendingRequests: friends.filter(f => f.status === "pending" && f.userId === 1), // Use actual user ID
    };
  }, [friends]);

  // Get user by ID
  const getUserById = (userId: number) => {
    return users?.find(u => u.id === userId);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex flex-col md:pl-64 flex-1 overflow-hidden">
        <TopNavbar />
        
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-4 md:p-6">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Friends</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Main content */}
              <div className="md:col-span-2">
                <Tabs defaultValue="friends">
                  <TabsList className="w-full mb-6">
                    <TabsTrigger value="friends" className="flex-1">My Friends</TabsTrigger>
                    <TabsTrigger value="requests" className="flex-1">Friend Requests {friendRequests.length > 0 && `(${friendRequests.length})`}</TabsTrigger>
                    <TabsTrigger value="pending" className="flex-1">Pending</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="friends" className="mt-0">
                    {myFriends.length === 0 ? (
                      <Card>
                        <CardHeader>
                          <CardTitle>No Friends Yet</CardTitle>
                          <CardDescription>
                            Search for users and send friend requests to connect with others.
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {myFriends.map(friend => {
                          const friendUser = getUserById(friend.userId === 1 ? friend.friendId : friend.userId);
                          if (!friendUser) return null;
                          
                          return (
                            <Card key={friend.id}>
                              <CardContent className="p-4 flex items-center">
                                <Avatar className="h-12 w-12">
                                  <AvatarImage src={friendUser.avatar || ""} alt={friendUser.username} />
                                  <AvatarFallback>
                                    {friendUser.username.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="ml-4">
                                  <h3 className="font-medium">{friendUser.displayName || friendUser.username}</h3>
                                  <p className="text-sm text-muted-foreground">@{friendUser.username}</p>
                                </div>
                                <Button variant="outline" size="sm" className="ml-auto">
                                  View Profile
                                </Button>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="requests" className="mt-0">
                    {friendRequests.length === 0 ? (
                      <Card>
                        <CardHeader>
                          <CardTitle>No Friend Requests</CardTitle>
                          <CardDescription>
                            You don't have any pending friend requests at the moment.
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    ) : (
                      <div className="space-y-4">
                        {friendRequests.map(request => {
                          const requestUser = getUserById(request.userId);
                          if (!requestUser) return null;
                          
                          return (
                            <Card key={request.id}>
                              <CardHeader className="pb-2">
                                <div className="flex items-center">
                                  <Avatar className="h-12 w-12">
                                    <AvatarImage src={requestUser.avatar || ""} alt={requestUser.username} />
                                    <AvatarFallback>
                                      {requestUser.username.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="ml-4">
                                    <CardTitle className="text-lg">{requestUser.displayName || requestUser.username}</CardTitle>
                                    <CardDescription>@{requestUser.username}</CardDescription>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardFooter className="pt-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="mr-2"
                                  onClick={() => acceptFriendMutation.mutate(request.id)}
                                  disabled={acceptFriendMutation.isPending}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Accept
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => rejectFriendMutation.mutate(request.id)}
                                  disabled={rejectFriendMutation.isPending}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Decline
                                </Button>
                              </CardFooter>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="pending" className="mt-0">
                    {pendingRequests.length === 0 ? (
                      <Card>
                        <CardHeader>
                          <CardTitle>No Pending Requests</CardTitle>
                          <CardDescription>
                            You haven't sent any friend requests that are pending.
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {pendingRequests.map(request => {
                          const pendingUser = getUserById(request.friendId);
                          if (!pendingUser) return null;
                          
                          return (
                            <Card key={request.id}>
                              <CardContent className="p-4 flex items-center">
                                <Avatar className="h-12 w-12">
                                  <AvatarImage src={pendingUser.avatar || ""} alt={pendingUser.username} />
                                  <AvatarFallback>
                                    {pendingUser.username.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="ml-4">
                                  <h3 className="font-medium">{pendingUser.displayName || pendingUser.username}</h3>
                                  <p className="text-sm text-muted-foreground">Request pending</p>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
              
              {/* Search sidebar */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Find Friends</CardTitle>
                    <CardDescription>Search for users to connect with</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search by username..." 
                        className="pl-10" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    
                    <div className="mt-4 space-y-3 max-h-[400px] overflow-y-auto">
                      {searchTerm && filteredUsers.length === 0 ? (
                        <p className="text-sm text-center text-muted-foreground py-4">
                          No users found matching "{searchTerm}"
                        </p>
                      ) : (
                        filteredUsers.map(user => (
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
                              variant="ghost" 
                              size="sm"
                              onClick={() => sendFriendRequestMutation.mutate(user.id)}
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
        
        <MobileNav />
      </div>
    </div>
  );
}
