import { users, type User, type InsertUser, memories, type Memory, type InsertMemory, friends, type Friend, type InsertFriend, groups, type Group, type InsertGroup, groupMembers, type GroupMember, type InsertGroupMember, notifications, type Notification, type InsertNotification, comments, type Comment, type InsertComment } from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

// Define the storage interface
export interface IStorage {
  // Session store
  sessionStore: session.SessionStore;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Memory operations
  getMemory(id: number): Promise<Memory | undefined>;
  createMemory(memory: InsertMemory): Promise<Memory>;
  updateMemory(id: number, memoryData: Partial<Memory>): Promise<Memory>;
  deleteMemory(id: number): Promise<void>;
  getUserMemories(userId: number): Promise<Memory[]>;
  getUserPublicMemories(userId: number): Promise<Memory[]>;
  getAccessibleMemories(userId: number): Promise<Memory[]>;
  getGroupMemories(groupId: number): Promise<Memory[]>;
  
  // Friend operations
  getUserFriends(userId: number): Promise<Friend[]>;
  getFriendRequest(id: number): Promise<Friend | undefined>;
  createFriendRequest(userId: number, friendId: number): Promise<Friend>;
  acceptFriendRequest(requestId: number): Promise<Friend>;
  rejectFriendRequest(requestId: number): Promise<void>;
  removeFriend(userId: number, friendId: number): Promise<void>;
  
  // Group operations
  getGroup(id: number): Promise<Group | undefined>;
  createGroup(group: InsertGroup): Promise<Group>;
  updateGroup(id: number, groupData: Partial<Group>): Promise<Group>;
  deleteGroup(id: number): Promise<void>;
  getAllGroups(): Promise<Group[]>;
  getUserGroups(userId: number): Promise<Group[]>;
  
  // Group member operations
  getGroupMembers(groupId: number): Promise<GroupMember[]>;
  getGroupMembership(groupId: number, userId: number): Promise<GroupMember | undefined>;
  addGroupMember(member: InsertGroupMember): Promise<GroupMember>;
  updateGroupMember(groupId: number, userId: number, role: string): Promise<GroupMember>;
  removeGroupMember(groupId: number, userId: number): Promise<void>;
  
  // Notification operations
  getNotification(id: number): Promise<Notification | undefined>;
  getUserNotifications(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification>;
  
  // Comment operations
  getComment(id: number): Promise<Comment | undefined>;
  getMemoryComments(memoryId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: number): Promise<void>;
}

const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private memories: Map<number, Memory>;
  private friends: Map<number, Friend>;
  private groups: Map<number, Group>;
  private groupMembers: Map<number, GroupMember>;
  private notifications: Map<number, Notification>;
  private comments: Map<number, Comment>;
  sessionStore: session.SessionStore;
  
  private userIdCounter: number;
  private memoryIdCounter: number;
  private friendIdCounter: number;
  private groupIdCounter: number;
  private groupMemberIdCounter: number;
  private notificationIdCounter: number;
  private commentIdCounter: number;

  constructor() {
    this.users = new Map();
    this.memories = new Map();
    this.friends = new Map();
    this.groups = new Map();
    this.groupMembers = new Map();
    this.notifications = new Map();
    this.comments = new Map();
    
    this.userIdCounter = 1;
    this.memoryIdCounter = 1;
    this.friendIdCounter = 1;
    this.groupIdCounter = 1;
    this.groupMemberIdCounter = 1;
    this.notificationIdCounter = 1;
    this.commentIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...userData, 
      id, 
      createdAt: now 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Memory methods
  async getMemory(id: number): Promise<Memory | undefined> {
    return this.memories.get(id);
  }

  async createMemory(memoryData: InsertMemory): Promise<Memory> {
    const id = this.memoryIdCounter++;
    const now = new Date();
    const memory: Memory = {
      ...memoryData,
      id,
      createdAt: now
    };
    this.memories.set(id, memory);
    return memory;
  }

  async updateMemory(id: number, memoryData: Partial<Memory>): Promise<Memory> {
    const memory = await this.getMemory(id);
    if (!memory) {
      throw new Error("Memory not found");
    }
    
    const updatedMemory = { ...memory, ...memoryData };
    this.memories.set(id, updatedMemory);
    return updatedMemory;
  }

  async deleteMemory(id: number): Promise<void> {
    this.memories.delete(id);
    
    // Also delete related comments
    const commentsToDelete = Array.from(this.comments.values())
      .filter(comment => comment.memoryId === id);
    
    for (const comment of commentsToDelete) {
      this.comments.delete(comment.id);
    }
  }

  async getUserMemories(userId: number): Promise<Memory[]> {
    return Array.from(this.memories.values())
      .filter(memory => memory.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getUserPublicMemories(userId: number): Promise<Memory[]> {
    return Array.from(this.memories.values())
      .filter(memory => memory.userId === userId && !memory.isPrivate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getAccessibleMemories(userId: number): Promise<Memory[]> {
    // Get user's friends
    const userFriends = await this.getUserFriends(userId);
    const friendIds = userFriends
      .filter(f => f.status === "accepted")
      .map(f => f.userId === userId ? f.friendId : f.userId);
    
    // Get user's groups
    const userGroups = await this.getUserGroups(userId);
    const groupIds = userGroups.map(g => g.id);
    
    // Get all memories
    return Array.from(this.memories.values())
      .filter(memory => {
        // User's own memories
        if (memory.userId === userId) return true;
        
        // Public memories from friends
        if (!memory.isPrivate && friendIds.includes(memory.userId)) return true;
        
        // Memories shared in groups the user is part of
        // In a real implementation, we would have a group_memories table to handle this
        
        return false;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getGroupMemories(groupId: number): Promise<Memory[]> {
    // In a real implementation, we would have a group_memories table
    // For now, we'll return memories created by group members
    const members = await this.getGroupMembers(groupId);
    const memberIds = members.map(member => member.userId);
    
    return Array.from(this.memories.values())
      .filter(memory => memberIds.includes(memory.userId) && !memory.isPrivate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // Friend methods
  async getUserFriends(userId: number): Promise<Friend[]> {
    return Array.from(this.friends.values())
      .filter(friend => friend.userId === userId || friend.friendId === userId);
  }

  async getFriendRequest(id: number): Promise<Friend | undefined> {
    return this.friends.get(id);
  }

  async createFriendRequest(userId: number, friendId: number): Promise<Friend> {
    // Check if a request already exists
    const existingRequests = Array.from(this.friends.values())
      .filter(friend => 
        (friend.userId === userId && friend.friendId === friendId) ||
        (friend.userId === friendId && friend.friendId === userId)
      );
    
    if (existingRequests.length > 0) {
      throw new Error("Friend request already exists");
    }
    
    const id = this.friendIdCounter++;
    const now = new Date();
    const friendRequest: Friend = {
      id,
      userId,
      friendId,
      status: "pending",
      createdAt: now
    };
    
    this.friends.set(id, friendRequest);
    
    // Create notification for the friend
    await this.createNotification({
      userId: friendId,
      type: "friend_request",
      content: `You have a new friend request`,
      read: false,
      relatedId: id
    });
    
    return friendRequest;
  }

  async acceptFriendRequest(requestId: number): Promise<Friend> {
    const request = await this.getFriendRequest(requestId);
    if (!request) {
      throw new Error("Friend request not found");
    }
    
    const updatedRequest = { ...request, status: "accepted" };
    this.friends.set(requestId, updatedRequest);
    
    // Create notification for the requester
    await this.createNotification({
      userId: request.userId,
      type: "friend_accepted",
      content: `Your friend request was accepted`,
      read: false,
      relatedId: requestId
    });
    
    return updatedRequest;
  }

  async rejectFriendRequest(requestId: number): Promise<void> {
    const request = await this.getFriendRequest(requestId);
    if (!request) {
      throw new Error("Friend request not found");
    }
    
    const updatedRequest = { ...request, status: "rejected" };
    this.friends.set(requestId, updatedRequest);
  }

  async removeFriend(userId: number, friendId: number): Promise<void> {
    const friendships = Array.from(this.friends.values())
      .filter(friend => 
        (friend.userId === userId && friend.friendId === friendId) ||
        (friend.userId === friendId && friend.friendId === userId)
      );
    
    for (const friendship of friendships) {
      this.friends.delete(friendship.id);
    }
  }

  // Group methods
  async getGroup(id: number): Promise<Group | undefined> {
    return this.groups.get(id);
  }

  async createGroup(groupData: InsertGroup): Promise<Group> {
    const id = this.groupIdCounter++;
    const now = new Date();
    const group: Group = {
      ...groupData,
      id,
      createdAt: now
    };
    this.groups.set(id, group);
    return group;
  }

  async updateGroup(id: number, groupData: Partial<Group>): Promise<Group> {
    const group = await this.getGroup(id);
    if (!group) {
      throw new Error("Group not found");
    }
    
    const updatedGroup = { ...group, ...groupData };
    this.groups.set(id, updatedGroup);
    return updatedGroup;
  }

  async deleteGroup(id: number): Promise<void> {
    this.groups.delete(id);
    
    // Also delete group members
    const membersToDelete = Array.from(this.groupMembers.values())
      .filter(member => member.groupId === id);
    
    for (const member of membersToDelete) {
      this.groupMembers.delete(member.id);
    }
  }

  async getAllGroups(): Promise<Group[]> {
    return Array.from(this.groups.values());
  }

  async getUserGroups(userId: number): Promise<Group[]> {
    const userMemberships = Array.from(this.groupMembers.values())
      .filter(member => member.userId === userId);
    
    const groupIds = userMemberships.map(member => member.groupId);
    
    return Array.from(this.groups.values())
      .filter(group => groupIds.includes(group.id));
  }

  // Group member methods
  async getGroupMembers(groupId: number): Promise<GroupMember[]> {
    return Array.from(this.groupMembers.values())
      .filter(member => member.groupId === groupId);
  }

  async getGroupMembership(groupId: number, userId: number): Promise<GroupMember | undefined> {
    return Array.from(this.groupMembers.values())
      .find(member => member.groupId === groupId && member.userId === userId);
  }

  async addGroupMember(memberData: InsertGroupMember): Promise<GroupMember> {
    const id = this.groupMemberIdCounter++;
    const now = new Date();
    const member: GroupMember = {
      ...memberData,
      id,
      joinedAt: now
    };
    this.groupMembers.set(id, member);
    return member;
  }

  async updateGroupMember(groupId: number, userId: number, role: string): Promise<GroupMember> {
    const membership = await this.getGroupMembership(groupId, userId);
    if (!membership) {
      throw new Error("Group membership not found");
    }
    
    const updatedMembership = { ...membership, role };
    this.groupMembers.set(membership.id, updatedMembership);
    return updatedMembership;
  }

  async removeGroupMember(groupId: number, userId: number): Promise<void> {
    const membership = await this.getGroupMembership(groupId, userId);
    if (membership) {
      this.groupMembers.delete(membership.id);
    }
  }

  // Notification methods
  async getNotification(id: number): Promise<Notification | undefined> {
    return this.notifications.get(id);
  }

  async getUserNotifications(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const id = this.notificationIdCounter++;
    const now = new Date();
    const notification: Notification = {
      ...notificationData,
      id,
      createdAt: now
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<Notification> {
    const notification = await this.getNotification(id);
    if (!notification) {
      throw new Error("Notification not found");
    }
    
    const updatedNotification = { ...notification, read: true };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }

  // Comment methods
  async getComment(id: number): Promise<Comment | undefined> {
    return this.comments.get(id);
  }

  async getMemoryComments(memoryId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.memoryId === memoryId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async createComment(commentData: InsertComment): Promise<Comment> {
    const id = this.commentIdCounter++;
    const now = new Date();
    const comment: Comment = {
      ...commentData,
      id,
      createdAt: now
    };
    this.comments.set(id, comment);
    
    // Get the memory
    const memory = await this.getMemory(commentData.memoryId);
    if (memory && memory.userId !== commentData.userId) {
      // Create notification for memory owner about the new comment
      await this.createNotification({
        userId: memory.userId,
        type: "new_comment",
        content: `Someone commented on your memory`,
        read: false,
        relatedId: id
      });
    }
    
    return comment;
  }

  async deleteComment(id: number): Promise<void> {
    this.comments.delete(id);
  }
}

export const storage = new MemStorage();
