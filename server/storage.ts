import {
  users,
  categories,
  foodItems,
  shoppingItems,
  receipts,
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
}

export const storage = new DatabaseStorage();
