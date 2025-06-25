import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Bell, Camera, ExternalLink, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import NutritionRings from "@/components/NutritionRings";
import ReceiptUploadModal from "@/components/ReceiptUploadModal";

import FoodItemCard from "@/components/FoodItemCard";
import BottomNavigation from "@/components/BottomNavigation";
import { getFoodIcon } from "@/lib/foodIcons";
import type { Category, FoodItem, ShoppingItem } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [extractedItems, setExtractedItems] = useState<any[]>([]);
  const [showExtractedItems, setShowExtractedItems] = useState(false);

  // Force user ID initialization on component mount
  useEffect(() => {
    import("@/lib/queryClient").then(({ getCurrentUserId }) => {
      const userId = getCurrentUserId();
      console.log('🏠 Home page initialized with user ID:', userId);
    });
  }, []);

  // Initialize categories mutation
  const initCategoriesMutation = useMutation({
    mutationFn: async () => {
      console.log('Initializing categories...');
      return await apiRequest("POST", "/api/categories/init");
    },
    onSuccess: (data) => {
      console.log('Categories initialized successfully:', data);
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/food-items"] });
    },
    onError: (error) => {
      console.error('Failed to initialize categories:', error);
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch food items
  const { data: allFoodItems = [] } = useQuery<FoodItem[]>({
    queryKey: ["/api/food-items"],
  });

  // Fetch shopping items
  const { data: shoppingItems = [] } = useQuery<ShoppingItem[]>({
    queryKey: ["/api/shopping-items"],
  });

  // Fetch nutrition summary
  const { data: nutritionSummary = { totals: { protein: 0, carbs: 0, fats: 0 }, percentages: { protein: 0, carbs: 0, fats: 0 } } } = useQuery<{ totals: { protein: number; carbs: number; fats: number }; percentages: { protein: number; carbs: number; fats: number } }>({
    queryKey: ["/api/nutrition/summary"],
  });

  // Initialize categories on first load
  useEffect(() => {
    const userId = getCurrentUserId();
    console.log('🏠 Home - Checking initialization for user:', userId);
    console.log('🏠 Categories count:', categories.length);
    
    if (categories.length === 0) {
      console.log('🏠 Initializing categories...');
      initCategoriesMutation.mutate();
    }
  }, [categories.length]);

  // Force refetch when user ID changes
  useEffect(() => {
    const userId = getCurrentUserId();
    console.log('🔄 User ID effect:', userId);
    queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    queryClient.invalidateQueries({ queryKey: ["/api/food-items"] });
  }, []);

  // Get expiring items (items expiring in next 3 days)
  const expiringItems = allFoodItems.filter((item: any) => {
    if (!item.expiryDate) return false;
    const expiry = new Date(item.expiryDate);
    const today = new Date();
    const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
    return expiry <= threeDaysFromNow && expiry >= today;
  });



  // Get items by category for display
  const getItemsByCategory = (categoryId: number) => {
    return allFoodItems.filter((item: any) => item.categoryId === categoryId).slice(0, 2);
  };

  // Current date for display
  const currentDate = new Date().toLocaleDateString("ja-JP", {
    month: "long",
    day: "numeric",
  });



  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2L3 6v8l7 4 7-4V6l-7-4z"/>
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-800">FridgeKeeper</h1>
          </div>
          <div className="flex items-center space-x-3">
            <button className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center relative">
              <Bell className="w-4 h-4 text-gray-600" />
              {expiringItems.length > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full">
                  <div className="w-1.5 h-1.5 bg-white rounded-full mx-auto mt-0.5"></div>
                </div>
              )}
            </button>

          </div>
        </div>
      </header>

      {/* Quick Stats */}
      {/*
      <section className="px-4 py-6 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">今日の栄養バランス</h2>
          <span className="text-sm text-gray-500">{currentDate}</span>
        </div>

        <NutritionRings nutritionData={nutritionSummary.percentages} />

        {/* Expiry Alert *}
        {expiringItems.length > 0 && (
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 flex items-center space-x-3 mt-6">
            <div className="w-8 h-8 bg-warning/20 rounded-full flex items-center justify-center">
              <ExternalLink className="w-4 h-4 text-warning" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">賞味期限間近</p>
              <p className="text-xs text-gray-600">
                {expiringItems.map((item: any) => item.name).join(", ")}など{expiringItems.length}点が期限間近
              </p>
            </div>
            <Button variant="ghost" size="sm" className="text-warning">
              確認
            </Button>
          </div>
        )}
      </section>
      */}

      {/* Upload Options */}
      <section className="px-4 py-4 bg-white border-b border-gray-100 space-y-3">
        <Button 
          onClick={() => setIsReceiptModalOpen(true)}
          className="w-full bg-secondary hover:bg-secondary/90 text-white rounded-xl py-4 flex items-center justify-center space-x-3"
        >
          <Camera className="w-5 h-5" />
          <span className="font-medium">レシートをスキャン</span>
        </Button>


      </section>

      {/* Fridge Sections */}
      <main className="px-4 py-6 pb-24">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">冷蔵庫の中身</h2>
          <Button variant="ghost" size="sm" className="text-secondary">
            編集
          </Button>
        </div>

        {/* Storage Categories */}
        <div className="space-y-4">
          {categories.map((category: any) => {
            const categoryItems = getItemsByCategory(category.id);
            const totalItems = allFoodItems.filter((item: any) => item.categoryId === category.id).length;

            return (
              <Card key={category.id} className="overflow-hidden">
                <div 
                  className="px-4 py-3 border-b border-gray-100 flex items-center justify-between"
                  style={{ backgroundColor: `${category.color}08` }}
                >
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <i className={`${category.icon} text-sm`} style={{ color: category.color }}></i>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">{category.name}</h3>
                      <p className="text-xs text-gray-500">{totalItems}点の食材</p>
                    </div>
                  </div>
                  <button style={{ color: category.color }}>
                    <i className="fas fa-chevron-down text-sm"></i>
                  </button>
                </div>

                <CardContent className="p-4">
                  {categoryItems.length > 0 ? (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        {categoryItems.map((item: any) => (
                          <FoodItemCard key={item.id} item={item} />
                        ))}
                      </div>
                      {totalItems > 2 && (
                        <Button 
                          variant="ghost" 
                          className="w-full mt-3" 
                          style={{ color: category.color }}
                          onClick={() => setLocation("/inventory")}
                        >
                          すべて表示 ({totalItems}点)
                        </Button>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      まだ食材が登録されていません
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Shopping List */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">買い物リスト</h2>
            <Button variant="ghost" size="sm" className="text-secondary">
              追加
            </Button>
          </div>

          <Card>
            <CardContent className="p-4">
              {shoppingItems.length > 0 ? (
                <div className="space-y-3">
                  {shoppingItems.slice(0, 3).map((item: any) => (
                    <div key={item.id} className="flex items-center space-x-3">
                      <button 
                        className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                          item.completed 
                            ? "bg-primary border-primary" 
                            : "border-gray-300"
                        }`}
                      >
                        {item.completed && (
                          <i className="fas fa-check text-xs text-white"></i>
                        )}
                      </button>
                      <span 
                        className={`flex-1 text-sm ${
                          item.completed 
                            ? "text-gray-400 line-through" 
                            : "text-gray-700"
                        }`}
                      >
                        {item.name}
                      </span>
                      {item.categoryName && (
                        <Badge variant="secondary" className="text-xs">
                          {item.categoryName}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  買い物リストは空です
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Floating Action Button */}
      <button className="fixed bottom-20 right-4 w-14 h-14 bg-primary rounded-full shadow-lg flex items-center justify-center text-white hover:bg-primary/90 transition-all hover:scale-105">
        <Plus className="w-6 h-6" />
      </button>

      {/* Bottom Navigation */}
      <BottomNavigation currentPage="home" />

      {/* Receipt Upload Modal */}
      <ReceiptUploadModal 
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
      />


    </div>
  );
}