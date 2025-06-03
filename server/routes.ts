import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertCategorySchema,
  insertFoodItemSchema,
  insertShoppingItemSchema,
  insertReceiptSchema 
} from "@shared/schema";
import { z } from "zod";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Gemini API function
async function analyzeReceiptWithGemini(imageBuffer: Buffer): Promise<{
  text: string;
  extractedItems: Array<{ name: string; category: string; quantity?: number; unit?: string }>;
}> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "AIzaSyAk_G-Nby8A8hHW3RPBCKhpXqyFo0ShAVU";
  
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key not found in environment variables");
  }

  try {
    // Convert image to base64
    const base64Image = imageBuffer.toString('base64');
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `このレシートの画像から食品・食材のみを抽出してください。以下のJSON形式で返してください：
{
  "extractedItems": [
    {
      "name": "商品名",
      "category": "冷蔵" | "冷凍" | "野菜" | "常温",
      "quantity": 数量（数値）,
      "unit": "個" | "袋" | "本" | "パック"
    }
  ]
}

食品以外の商品（日用品、雑貨等）は除外してください。`
                },
                {
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: base64Image
                  }
                }
              ]
            }
          ]
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Extract JSON from the response
    let extractedItems = [];
    try {
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        extractedItems = parsed.extractedItems || [];
      }
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", parseError);
    }

    return {
      text: generatedText,
      extractedItems
    };
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("Failed to analyze receipt with Gemini API");
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Initialize default categories for new users
  app.post('/api/categories/init', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Check if user already has categories
      const existingCategories = await storage.getUserCategories(userId);
      if (existingCategories.length > 0) {
        return res.json(existingCategories);
      }

      // Create default categories
      const defaultCategories = [
        { name: "冷蔵", icon: "fas fa-snowflake", color: "#2196F3", userId },
        { name: "野菜室", icon: "fas fa-leaf", color: "#4CAF50", userId },
        { name: "冷凍庫", icon: "fas fa-icicles", color: "#6366f1", userId },
        { name: "チルド", icon: "fas fa-thermometer-half", color: "#9C27B0", userId },
      ];

      const createdCategories = await Promise.all(
        defaultCategories.map(cat => storage.createCategory(cat))
      );

      res.json(createdCategories);
    } catch (error) {
      console.error("Error initializing categories:", error);
      res.status(500).json({ message: "Failed to initialize categories" });
    }
  });

  // Category routes
  app.get('/api/categories', async (req: any, res) => {
    try {
      const userId = "guest"; // Use guest user for demo
      const categories = await storage.getUserCategories(userId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post('/api/categories', async (req: any, res) => {
    try {
      const userId = "guest";
      const categoryData = insertCategorySchema.parse({ ...req.body, userId });
      const category = await storage.createCategory(categoryData);
      res.json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Food item routes
  app.get('/api/food-items', async (req: any, res) => {
    try {
      const userId = "guest";
      const { categoryId } = req.query;
      
      let items;
      if (categoryId) {
        items = await storage.getFoodItemsByCategory(userId, parseInt(categoryId as string));
      } else {
        items = await storage.getAllFoodItems(userId);
      }
      
      res.json(items);
    } catch (error) {
      console.error("Error fetching food items:", error);
      res.status(500).json({ message: "Failed to fetch food items" });
    }
  });

  app.post('/api/food-items', async (req: any, res) => {
    try {
      const userId = "guest";
      console.log("Raw request body:", req.body);
      console.log("User ID:", userId);
      console.log("Content-Type:", req.get('Content-Type'));
      
      const dataToValidate = { ...req.body, userId };
      console.log("Data to validate:", dataToValidate);
      
      const itemData = insertFoodItemSchema.parse(dataToValidate);
      console.log("Validated data:", itemData);
      
      const item = await storage.createFoodItem(itemData);
      res.json(item);
    } catch (error) {
      console.error("Error creating food item:", error);
      if (error instanceof Error && 'issues' in error) {
        console.error("Validation errors:", error.issues);
      }
      res.status(500).json({ message: "Failed to create food item" });
    }
  });

  app.put('/api/food-items/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const item = await storage.updateFoodItem(parseInt(id), updates);
      res.json(item);
    } catch (error) {
      console.error("Error updating food item:", error);
      res.status(500).json({ message: "Failed to update food item" });
    }
  });

  app.delete('/api/food-items/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteFoodItem(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting food item:", error);
      res.status(500).json({ message: "Failed to delete food item" });
    }
  });

  app.get('/api/food-items/expiring', async (req: any, res) => {
    try {
      const userId = "guest";
      const days = parseInt(req.query.days as string) || 3;
      const items = await storage.getExpiringItems(userId, days);
      res.json(items);
    } catch (error) {
      console.error("Error fetching expiring items:", error);
      res.status(500).json({ message: "Failed to fetch expiring items" });
    }
  });

  // Fix expiry dates for existing items
  app.post('/api/food-items/fix-expiry-dates', async (req: any, res) => {
    try {
      const userId = "guest";
      const allItems = await storage.getAllFoodItems(userId);
      
      const getExpiryDays = (itemName: string, categoryId: number): number => {
        const name = itemName.toLowerCase();
        
        // 肉類 (categoryId 4 = チルド)
        if (categoryId === 4 || name.includes('肉') || name.includes('ミンチ')) {
          return 3; // 3日
        }
        
        // 野菜類
        if (categoryId === 1) {
          if (name.includes('レタス') || name.includes('小松菜') || name.includes('キャベツ')) {
            return 5; // 葉物野菜 5日
          }
          if (name.includes('たまねぎ') || name.includes('にんにく') || name.includes('じゃがいも')) {
            return 30; // 根菜類 30日
          }
          if (name.includes('トマト') || name.includes('きゅうり')) {
            return 7; // 一般野菜 7日
          }
          if (name.includes('しいたけ') || name.includes('きのこ')) {
            return 4; // きのこ類 4日
          }
          return 7; // その他野菜
        }
        
        // 飲み物 (categoryId 2)
        if (categoryId === 2) {
          if (name.includes('綾鷹') || name.includes('お茶') || name.includes('ペット')) {
            return 60; // ペットボトル飲料 60日
          }
          if (name.includes('牛乳') || name.includes('ミルク')) {
            return 5; // 牛乳 5日
          }
          return 30; // その他飲み物
        }
        
        // 果物
        if (name.includes('レモン') || name.includes('りんご')) {
          return 14; // 柑橘類・りんご 14日
        }
        if (name.includes('キウイ') || name.includes('バナナ')) {
          return 7; // その他果物 7日
        }
        
        return 7; // デフォルト
      };

      const updatedItems = [];
      for (const item of allItems) {
        const expiryDays = getExpiryDays(item.name, item.categoryId);
        const newExpiryDate = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const updatedItem = await storage.updateFoodItem(item.id, {
          expiryDate: newExpiryDate
        });
        updatedItems.push(updatedItem);
      }
      
      res.json({ message: "Expiry dates updated", updatedCount: updatedItems.length });
    } catch (error) {
      console.error("Error fixing expiry dates:", error);
      res.status(500).json({ message: "Failed to fix expiry dates" });
    }
  });

  // Shopping list routes
  app.get('/api/shopping-items', async (req: any, res) => {
    try {
      const userId = "guest";
      const items = await storage.getShoppingItems(userId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching shopping items:", error);
      res.status(500).json({ message: "Failed to fetch shopping items" });
    }
  });

  app.post('/api/shopping-items', async (req: any, res) => {
    try {
      const userId = "guest";
      const itemData = insertShoppingItemSchema.parse({ ...req.body, userId });
      const item = await storage.createShoppingItem(itemData);
      res.json(item);
    } catch (error) {
      console.error("Error creating shopping item:", error);
      res.status(500).json({ message: "Failed to create shopping item" });
    }
  });

  app.put('/api/shopping-items/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const item = await storage.updateShoppingItem(parseInt(id), updates);
      res.json(item);
    } catch (error) {
      console.error("Error updating shopping item:", error);
      res.status(500).json({ message: "Failed to update shopping item" });
    }
  });

  app.delete('/api/shopping-items/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteShoppingItem(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting shopping item:", error);
      res.status(500).json({ message: "Failed to delete shopping item" });
    }
  });

  // Receipt OCR route
  app.post('/api/receipts/analyze', upload.single('receipt'), async (req: any, res) => {
    try {
      const userId = "guest";
      
      if (!req.file) {
        return res.status(400).json({ message: "No receipt image provided" });
      }

      // Analyze receipt with Gemini API
      const analysis = await analyzeReceiptWithGemini(req.file.buffer);
      
      // Save receipt record
      const receiptData = insertReceiptSchema.parse({
        userId,
        imageUrl: `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
        ocrText: analysis.text,
        extractedItems: analysis.extractedItems,
      });
      
      const receipt = await storage.createReceipt(receiptData);
      
      res.json({
        receipt,
        extractedItems: analysis.extractedItems,
      });
    } catch (error) {
      console.error("Error analyzing receipt:", error);
      res.status(500).json({ message: "Failed to analyze receipt" });
    }
  });

  // Nutrition summary route
  app.get('/api/nutrition/summary', async (req: any, res) => {
    try {
      const userId = "guest";
      const items = await storage.getAllFoodItems(userId);
      
      // Calculate total nutrition (simplified calculation)
      const totalNutrition = items.reduce((acc, item) => {
        const factor = item.quantity || 1;
        return {
          protein: acc.protein + (item.protein || 0) * factor,
          carbs: acc.carbs + (item.carbs || 0) * factor,
          fats: acc.fats + (item.fats || 0) * factor,
          calories: acc.calories + (item.calories || 0) * factor,
        };
      }, { protein: 0, carbs: 0, fats: 0, calories: 0 });

      // Calculate percentages (simplified daily targets)
      const dailyTargets = { protein: 60, carbs: 300, fats: 60 }; // grams
      const percentages = {
        protein: Math.min((totalNutrition.protein / dailyTargets.protein) * 100, 100),
        carbs: Math.min((totalNutrition.carbs / dailyTargets.carbs) * 100, 100),
        fats: Math.min((totalNutrition.fats / dailyTargets.fats) * 100, 100),
      };

      res.json({
        totals: totalNutrition,
        percentages,
        targets: dailyTargets,
      });
    } catch (error) {
      console.error("Error calculating nutrition summary:", error);
      res.status(500).json({ message: "Failed to calculate nutrition summary" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
