import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  date,
  real,
  boolean
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Food categories (refrigerator, freezer, vegetables, chilled)
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  icon: varchar("icon", { length: 50 }).notNull(),
  color: varchar("color", { length: 20 }).notNull(),
  userId: varchar("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Food items in the refrigerator
export const foodItems = pgTable("food_items", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  categoryId: integer("category_id").notNull().references(() => categories.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  expiryDate: date("expiry_date"),
  quantity: integer("quantity").default(1),
  unit: varchar("unit", { length: 20 }).default("個"),
  imageUrl: varchar("image_url"),
  // Nutrition per 100g
  protein: real("protein").default(0), // grams
  carbs: real("carbs").default(0), // grams
  fats: real("fats").default(0), // grams
  calories: real("calories").default(0), // kcal
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Shopping list items
export const shoppingItems = pgTable("shopping_items", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  userId: varchar("user_id").notNull().references(() => users.id),
  categoryName: varchar("category_name", { length: 50 }),
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Receipt records for tracking OCR uploads
export const receipts = pgTable("receipts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  imageUrl: varchar("image_url").notNull(),
  ocrText: text("ocr_text"),
  extractedItems: jsonb("extracted_items"), // Array of detected food items
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  categories: many(categories),
  foodItems: many(foodItems),
  shoppingItems: many(shoppingItems),
  receipts: many(receipts),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id],
  }),
  foodItems: many(foodItems),
}));

export const foodItemsRelations = relations(foodItems, ({ one }) => ({
  user: one(users, {
    fields: [foodItems.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [foodItems.categoryId],
    references: [categories.id],
  }),
}));

export const shoppingItemsRelations = relations(shoppingItems, ({ one }) => ({
  user: one(users, {
    fields: [shoppingItems.userId],
    references: [users.id],
  }),
}));

export const receiptsRelations = relations(receipts, ({ one }) => ({
  user: one(users, {
    fields: [receipts.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertFoodItemSchema = createInsertSchema(foodItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertShoppingItemSchema = createInsertSchema(shoppingItems).omit({
  id: true,
  createdAt: true,
});

export const insertReceiptSchema = createInsertSchema(receipts).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type FoodItem = typeof foodItems.$inferSelect;
export type InsertFoodItem = z.infer<typeof insertFoodItemSchema>;
export type ShoppingItem = typeof shoppingItems.$inferSelect;
export type InsertShoppingItem = z.infer<typeof insertShoppingItemSchema>;
export type Receipt = typeof receipts.$inferSelect;
export type InsertReceipt = z.infer<typeof insertReceiptSchema>;
