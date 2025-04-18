import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { setupFileUpload } from "./file-upload";
import { z } from "zod";
import { insertMemorySchema, insertGroupSchema, insertGroupMemberSchema, insertFriendSchema, insertNotificationSchema, insertCommentSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // Set up file upload middleware
  setupFileUpload(app);

  // USERS routes
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Not authenticated");
    const users = await storage.getAllUsers();
    res.json(users);
  });

  app.get("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Not authenticated");
    const userId = parseInt(req.params.id);
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).send("User not found");
    }
    
    res.json(user);
  });

  app.put("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Not authenticated");
    const userId = req.user.id;
    const updatedUser = await storage.updateUser(userId, req.body);
    res.json(updatedUser);
  });

  // MEMORIES routes
  app.get("/api/memories", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Not authenticated");
    const memories = await storage.getAccessibleMemories(req.user.id);
    res.json(memories);
  });

  app.get("/api/memories/user/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Not authenticated");
    const userId = parseInt(req.params.id);
    
    // Only allow viewing user's own memories or public memories
    let memories;
    if (userId === req.user.id) {
      memories = await storage.getUserMemories(userId);
    } else {
      memories = await storage.getUserPublicMemories(userId);
    }
    
    res.json(memories);
  });

  app.get("/api/memories/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Not authenticated");
    const memoryId = parseInt(req.params.id);
    const memory = await storage.getMemory(memoryId);
    
    if (!memory) {
      return res.status(404).send("Memory not found");
    }
    
    // Check if user has access to this memory
    if (memory.userId !== req.user.id && memory.isPrivate) {
      return res.status(403).send("Access denied");
    }
    
    res.json(memory);
  });

  app.post("/api/memories", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Not authenticated");
    
    try {
      const validatedData = insertMemorySchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const memory = await storage.createMemory(validatedData);
      res.status(201).json(memory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).send("Server error");
    }
  });

  app.put("/api/memories/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Not authenticated");
    const memoryId = parseInt(req.params.id);
    const memory = await storage.getMemory(memoryId);
    
    if (!memory) {
      return res.status(404).send("Memory not found");
    }
    
    // Check if user owns this memory
    if (memory.userId !== req.user.id) {
      return res.status(403).send("Access denied");
    }
    
    try {
      const updatedMemory = await storage.updateMemory(memoryId, req.body);
      res.json(updatedMemory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).send("Server error");
    }
  });

  app.delete("/api/memories/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Not authenticated");
    const memoryId = parseInt(req.params.id);
    const memory = await storage.getMemory(memoryId);
    
    if (!memory) {
      return res.status(404).send("Memory not found");
    }
    
    // Check if user owns this memory
    if (memory.userId !== req.user.id) {
      return res.status(403).send("Access denied");
    }
    
    await storage.deleteMemory(memoryId);
    res.status(204).send();
  });

  // FRIENDS routes
  app.get("/api/friends", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Not authenticated");
    const friends = await storage.getUserFriends(req.user.id);
    res.json(friends);
  });

  app.post("/api/friends/request/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Not authenticated");
    const friendId = parseInt(req.params.userId);
    
    // Can't friend yourself
    if (friendId === req.user.id) {
      return res.status(400).send("You cannot send a friend request to yourself");
    }
    
    // Check if friend exists
    const friend = await storage.getUser(friendId);
    if (!friend) {
      return res.status(404).send("User not found");
    }
    
    try {
      const friendRequest = await storage.createFriendRequest(req.user.id, friendId);
      res.status(201).json(friendRequest);
    } catch (error) {
      res.status(500).send("Server error");
    }
  });

  app.post("/api/friends/accept/:requestId", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Not authenticated");
    const requestId = parseInt(req.params.requestId);
    
    // Get the friend request
    const request = await storage.getFriendRequest(requestId);
    if (!request) {
      return res.status(404).send("Friend request not found");
    }
    
    // Check if the request is for the current user
    if (request.friendId !== req.user.id) {
      return res.status(403).send("Access denied");
    }
    
    // Accept the request
    const friendship = await storage.acceptFriendRequest(requestId);
    res.json(friendship);
  });

  app.post("/api/friends/reject/:requestId", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Not authenticated");
    const requestId = parseInt(req.params.requestId);
    
    // Get the friend request
    const request = await storage.getFriendRequest(requestId);
    if (!request) {
      return res.status(404).send("Friend request not found");
    }
    
    // Check if the request is for the current user
    if (request.friendId !== req.user.id) {
      return res.status(403).send("Access denied");
    }
    
    // Reject the request
    await storage.rejectFriendRequest(requestId);
    res.status(204).send();
  });

  app.delete("/api/friends/:friendId", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Not authenticated");
    const friendId = parseInt(req.params.friendId);
    
    // Remove the friendship
    await storage.removeFriend(req.user.id, friendId);
    res.status(204).send();
  });

  // GROUPS routes
  app.get("/api/groups", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Not authenticated");
    const groups = await storage.getAllGroups();
    res.json(groups);
  });

  app.get("/api/users/groups", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Not authenticated");
    const userId = req.user.id;
    const groups = await storage.getUserGroups(userId);
    res.json(groups);
  });

  app.get("/api/groups/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Not authenticated");
    const groupId = parseInt(req.params.id);
    const group = await storage.getGroup(groupId);
    
    if (!group) {
      return res.status(404).send("Group not found");
    }
    
    res.json(group);
  });

  app.post("/api/groups", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Not authenticated");
    
    try {
      const validatedData = insertGroupSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      
      const group = await storage.createGroup(validatedData);
      
      // Add the creator as an admin
      await storage.addGroupMember({
        groupId: group.id,
        userId: req.user.id,
        role: "admin"
      });
      
      res.status(201).json(group);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).send("Server error");
    }
  });

  app.put("/api/groups/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Not authenticated");
    const groupId = parseInt(req.params.id);
    const group = await storage.getGroup(groupId);
    
    if (!group) {
      return res.status(404).send("Group not found");
    }
    
    // Check if user is admin
    const membership = await storage.getGroupMembership(groupId, req.user.id);
    if (!membership || membership.role !== "admin") {
      return res.status(403).send("Access denied");
    }
    
    try {
      const updatedGroup = await storage.updateGroup(groupId, req.body);
      res.json(updatedGroup);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).send("Server error");
    }
  });

  app.post("/api/groups/:id/join", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Not authenticated");
    const groupId = parseInt(req.params.id);
    const group = await storage.getGroup(groupId);
    
    if (!group) {
      return res.status(404).send("Group not found");
    }
    
    // Check if already a member
    const membership = await storage.getGroupMembership(groupId, req.user.id);
    if (membership) {
      return res.status(400).send("Already a member of this group");
    }
    
    // Add as member
    const newMembership = await storage.addGroupMember({
      groupId,
      userId: req.user.id,
      role: "member"
    });
    
    res.status(201).json(newMembership);
  });

  app.post("/api/groups/:id/leave", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Not authenticated");
    const groupId = parseInt(req.params.id);
    
    // Check if a member
    const membership = await storage.getGroupMembership(groupId, req.user.id);
    if (!membership) {
      return res.status(400).send("Not a member of this group");
    }
    
    // Remove from group
    await storage.removeGroupMember(groupId, req.user.id);
    res.status(204).send();
  });

  app.get("/api/groups/:id/members", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Not authenticated");
    const groupId = parseInt(req.params.id);
    const members = await storage.getGroupMembers(groupId);
    res.json(members);
  });

  app.delete("/api/groups/:groupId/members/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Not authenticated");
    const groupId = parseInt(req.params.groupId);
    const userId = parseInt(req.params.userId);
    
    // Check if current user is admin
    const membership = await storage.getGroupMembership(groupId, req.user.id);
    if (!membership || membership.role !== "admin") {
      return res.status(403).send("Access denied");
    }
    
    // Remove the member
    await storage.removeGroupMember(groupId, userId);
    res.status(204).send();
  });

  app.get("/api/groups/:id/memories", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Not authenticated");
    const groupId = parseInt(req.params.id);
    
    // Check if user is a member
    const membership = await storage.getGroupMembership(groupId, req.user.id);
    if (!membership) {
      return res.status(403).send("Access denied");
    }
    
    const memories = await storage.getGroupMemories(groupId);
    res.json(memories);
  });

  // NOTIFICATIONS routes
  app.get("/api/notifications", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Not authenticated");
    const notifications = await storage.getUserNotifications(req.user.id);
    res.json(notifications);
  });

  app.put("/api/notifications/:id/read", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Not authenticated");
    const notificationId = parseInt(req.params.id);
    const notification = await storage.getNotification(notificationId);
    
    if (!notification) {
      return res.status(404).send("Notification not found");
    }
    
    // Check if notification belongs to user
    if (notification.userId !== req.user.id) {
      return res.status(403).send("Access denied");
    }
    
    const updatedNotification = await storage.markNotificationAsRead(notificationId);
    res.json(updatedNotification);
  });

  // COMMENTS routes
  app.get("/api/memories/:id/comments", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Not authenticated");
    const memoryId = parseInt(req.params.id);
    const comments = await storage.getMemoryComments(memoryId);
    res.json(comments);
  });

  app.post("/api/memories/:id/comments", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Not authenticated");
    const memoryId = parseInt(req.params.id);
    
    try {
      const validatedData = insertCommentSchema.parse({
        ...req.body,
        memoryId,
        userId: req.user.id
      });
      
      const comment = await storage.createComment(validatedData);
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).send("Server error");
    }
  });

  app.delete("/api/comments/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Not authenticated");
    const commentId = parseInt(req.params.id);
    const comment = await storage.getComment(commentId);
    
    if (!comment) {
      return res.status(404).send("Comment not found");
    }
    
    // Check if user owns this comment
    if (comment.userId !== req.user.id) {
      return res.status(403).send("Access denied");
    }
    
    await storage.deleteComment(commentId);
    res.status(204).send();
  });

  const httpServer = createServer(app);
  return httpServer;
}
