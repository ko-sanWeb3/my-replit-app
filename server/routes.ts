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
  app.get('/api/categories', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const categories = await storage.getUserCategories(userId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post('/api/categories', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const categoryData = insertCategorySchema.parse({ ...req.body, userId });
      const category = await storage.createCategory(categoryData);
      res.json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Food item routes
  app.get('/api/food-items', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.post('/api/food-items', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const itemData = insertFoodItemSchema.parse({ ...req.body, userId });
      const item = await storage.createFoodItem(itemData);
      res.json(item);
    } catch (error) {
      console.error("Error creating food item:", error);
      res.status(500).json({ message: "Failed to create food item" });
    }
  });

  app.put('/api/food-items/:id', isAuthenticated, async (req: any, res) => {
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

  app.delete('/api/food-items/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteFoodItem(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting food item:", error);
      res.status(500).json({ message: "Failed to delete food item" });
    }
  });

  app.get('/api/food-items/expiring', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const days = parseInt(req.query.days as string) || 3;
      const items = await storage.getExpiringItems(userId, days);
      res.json(items);
    } catch (error) {
      console.error("Error fetching expiring items:", error);
      res.status(500).json({ message: "Failed to fetch expiring items" });
    }
  });

  // Shopping list routes
  app.get('/api/shopping-items', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const items = await storage.getShoppingItems(userId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching shopping items:", error);
      res.status(500).json({ message: "Failed to fetch shopping items" });
    }
  });

  app.post('/api/shopping-items', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const itemData = insertShoppingItemSchema.parse({ ...req.body, userId });
      const item = await storage.createShoppingItem(itemData);
      res.json(item);
    } catch (error) {
      console.error("Error creating shopping item:", error);
      res.status(500).json({ message: "Failed to create shopping item" });
    }
  });

  app.put('/api/shopping-items/:id', isAuthenticated, async (req: any, res) => {
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

  app.delete('/api/shopping-items/:id', isAuthenticated, async (req: any, res) => {
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
  app.post('/api/receipts/analyze', isAuthenticated, upload.single('receipt'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
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
  app.get('/api/nutrition/summary', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
