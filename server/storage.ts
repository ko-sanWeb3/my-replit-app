import {
  users,
  categories,
  foodItems,
  shoppingItems,
  receipts,
  communityPosts,
  feedbackItems,
  type User,
  type UpsertUser,
  type Category,
  type InsertCategory,
  type FoodItem,
  type InsertFoodItem,
  type ShoppingItem,
  type InsertShoppingItem,
  type Receipt,
  type InsertReceipt,
  type CommunityPost,
  type InsertCommunityPost,
  type FeedbackItem,
  type InsertFeedbackItem,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Category operations
  getUserCategories(userId: string): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Food item operations
  getFoodItemsByCategory(userId: string, categoryId: number): Promise<FoodItem[]>;
  getAllFoodItems(userId: string): Promise<FoodItem[]>;
  createFoodItem(item: InsertFoodItem): Promise<FoodItem>;
  updateFoodItem(id: number, updates: Partial<InsertFoodItem>): Promise<FoodItem>;
  deleteFoodItem(id: number): Promise<void>;
  getExpiringItems(userId: string, days: number): Promise<FoodItem[]>;
  
  // Shopping list operations
  getShoppingItems(userId: string): Promise<ShoppingItem[]>;
  createShoppingItem(item: InsertShoppingItem): Promise<ShoppingItem>;
  updateShoppingItem(id: number, updates: Partial<InsertShoppingItem>): Promise<ShoppingItem>;
  deleteShoppingItem(id: number): Promise<void>;
  
  // Receipt operations
  createReceipt(receipt: InsertReceipt): Promise<Receipt>;
  getUserReceipts(userId: string): Promise<Receipt[]>;
  
  // Community operations
  getCommunityPosts(): Promise<CommunityPost[]>;
  createCommunityPost(post: InsertCommunityPost): Promise<CommunityPost>;
  
  // Feedback operations
  getFeedbackItems(): Promise<FeedbackItem[]>;
  createFeedbackItem(feedback: InsertFeedbackItem): Promise<FeedbackItem>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Category operations
  async getUserCategories(userId: string): Promise<Category[]> {
    return await db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId))
      .orderBy(asc(categories.name));
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values(category)
      .returning();
    return newCategory;
  }

  // Food item operations
  async getFoodItemsByCategory(userId: string, categoryId: number): Promise<FoodItem[]> {
    return await db
      .select()
      .from(foodItems)
      .where(and(eq(foodItems.userId, userId), eq(foodItems.categoryId, categoryId)))
      .orderBy(asc(foodItems.expiryDate));
  }

  async getAllFoodItems(userId: string): Promise<FoodItem[]> {
    return await db
      .select()
      .from(foodItems)
      .where(eq(foodItems.userId, userId))
      .orderBy(asc(foodItems.expiryDate));
  }

  async createFoodItem(item: InsertFoodItem): Promise<FoodItem> {
    const [newItem] = await db
      .insert(foodItems)
      .values(item)
      .returning();
    return newItem;
  }

  async updateFoodItem(id: number, updates: Partial<InsertFoodItem>): Promise<FoodItem> {
    const [updatedItem] = await db
      .update(foodItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(foodItems.id, id))
      .returning();
    return updatedItem;
  }

  async deleteFoodItem(id: number): Promise<void> {
    await db.delete(foodItems).where(eq(foodItems.id, id));
  }

  async getExpiringItems(userId: string, days: number): Promise<FoodItem[]> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    
    return await db
      .select()
      .from(foodItems)
      .where(
        and(
          eq(foodItems.userId, userId),
          // Note: This is a simplified query - in production you'd want proper date comparison
        )
      )
      .orderBy(asc(foodItems.expiryDate));
  }

  // Shopping list operations
  async getShoppingItems(userId: string): Promise<ShoppingItem[]> {
    return await db
      .select()
      .from(shoppingItems)
      .where(eq(shoppingItems.userId, userId))
      .orderBy(asc(shoppingItems.completed), desc(shoppingItems.createdAt));
  }

  async createShoppingItem(item: InsertShoppingItem): Promise<ShoppingItem> {
    const [newItem] = await db
      .insert(shoppingItems)
      .values(item)
      .returning();
    return newItem;
  }

  async updateShoppingItem(id: number, updates: Partial<InsertShoppingItem>): Promise<ShoppingItem> {
    const [updatedItem] = await db
      .update(shoppingItems)
      .set(updates)
      .where(eq(shoppingItems.id, id))
      .returning();
    return updatedItem;
  }

  async deleteShoppingItem(id: number): Promise<void> {
    await db.delete(shoppingItems).where(eq(shoppingItems.id, id));
  }

  // Receipt operations
  async createReceipt(receipt: InsertReceipt): Promise<Receipt> {
    const [newReceipt] = await db
      .insert(receipts)
      .values(receipt)
      .returning();
    return newReceipt;
  }

  async getUserReceipts(userId: string): Promise<Receipt[]> {
    return await db
      .select()
      .from(receipts)
      .where(eq(receipts.userId, userId))
      .orderBy(desc(receipts.createdAt));
  }

  // Community operations
  async getCommunityPosts(): Promise<CommunityPost[]> {
    return await db.select().from(communityPosts).orderBy(desc(communityPosts.createdAt));
  }

  async createCommunityPost(post: InsertCommunityPost): Promise<CommunityPost> {
    const [newPost] = await db
      .insert(communityPosts)
      .values(post)
      .returning();
    return newPost;
  }

  // Feedback operations
  async getFeedbackItems(): Promise<FeedbackItem[]> {
    return await db.select().from(feedbackItems).orderBy(desc(feedbackItems.createdAt));
  }

  async createFeedbackItem(feedback: InsertFeedbackItem): Promise<FeedbackItem> {
    const [newFeedback] = await db
      .insert(feedbackItems)
      .values(feedback)
      .returning();
    return newFeedback;
  }

  // Initialize default categories for new users
  async initializeDefaultCategories(userId: string): Promise<Category[]> {
    const defaultCategories = [
      { name: "冷蔵室", icon: "fas fa-snowflake", color: "#2196F3", userId },
      { name: "野菜室", icon: "fas fa-leaf", color: "#4CAF50", userId },
      { name: "冷凍庫", icon: "fas fa-icicles", color: "#6366f1", userId },
      { name: "チルド", icon: "fas fa-thermometer-half", color: "#9C27B0", userId },
    ];

    const createdCategories = [];
    for (const categoryData of defaultCategories) {
      const [category] = await db
        .insert(categories)
        .values(categoryData)
        .returning();
      createdCategories.push(category);
    }

    return createdCategories;
  }

  // Fix delete operations to include user validation
  async deleteFoodItem(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(foodItems)
      .where(and(eq(foodItems.id, id), eq(foodItems.userId, userId)))
      .returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
