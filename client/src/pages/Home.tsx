import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BottomNavigation from "@/components/BottomNavigation";
import NutritionRings from "@/components/NutritionRings";
import ReceiptUploadModal from "@/components/ReceiptUploadModal";
import { queryClient, getCurrentUserId, apiRequest } from "@/lib/queryClient";
import { PlusCircle, Package, ShoppingCart, TrendingUp } from "lucide-react";

export default function Home() {
  const [isReceiptModalOpen, setIsReceiptModalOpen] = React.useState(false);

  // API Queries
  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ["/api/categories"],
  });

  const { data: allFoodItems = [], isLoading: itemsLoading, error: itemsError } = useQuery({
    queryKey: ["/api/food-items"],
  });

  const { data: shoppingItems = [] } = useQuery({
    queryKey: ["/api/shopping-items"],
  });

  const { data: nutritionData } = useQuery({
    queryKey: ["/api/nutrition/summary"],
  });

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

  // Initialize categories if needed
  React.useEffect(() => {
    const userId = getCurrentUserId();
    console.log('🏠 Home - Checking initialization for user:', userId);
    console.log('🏠 Categories count:', categories.length);

    if (categories.length === 0) {
      console.log('🏠 Initializing categories...');
      initCategoriesMutation.mutate();
    }
  }, [categories.length]);

  // Debug logging
  React.useEffect(() => {
    console.log('🏠 Home Debug Info:', {
      categories: categories.length,
      items: allFoodItems.length,
      shopping: shoppingItems.length,
      categoriesLoading,
      itemsLoading,
      categoriesError,
      itemsError
    });
  });

  const totalItems = allFoodItems.length;
  const lowStockItems = allFoodItems.filter(item => item.quantity <= 2).length;
  const shoppingListCount = shoppingItems.length;

  const isLoading = categoriesLoading || itemsLoading;
  const hasError = categoriesError || itemsError;

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white p-6 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">🥗 FridgeKeeper</h1>
            <p className="text-green-100 text-sm">食材を上手に管理しよう</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white border-white/30 hover:bg-white/20"
            onClick={() => setIsReceiptModalOpen(true)}
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            レシート読取
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-6 grid grid-cols-2 gap-4 -mt-8">
        <Card className="shadow-lg border-0">
          <CardContent className="p-4 text-center">
            <Package className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">{totalItems}</p>
            <p className="text-sm text-gray-600">総アイテム数</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">{lowStockItems}</p>
            <p className="text-sm text-gray-600">在庫少</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-4 text-center">
            <ShoppingCart className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">{shoppingListCount}</p>
            <p className="text-sm text-gray-600">買い物リスト</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 bg-purple-500 rounded-full mx-auto mb-2 flex items-center justify-center">
              <span className="text-white text-xs font-bold">栄</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {nutritionData?.totals?.calories || 0}
            </p>
            <p className="text-sm text-gray-600">カロリー</p>
          </CardContent>
        </Card>
      </div>

      {/* Nutrition Section */}
      {nutritionData && (
        <div className="px-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">今日の栄養バランス</CardTitle>
            </CardHeader>
            <CardContent>
              <NutritionRings data={nutritionData} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading & Error States */}
      {isLoading && (
        <div className="px-6 text-center text-gray-500">
          データを読み込んでいます...
        </div>
      )}

      {hasError && (
        <div className="px-6 text-center text-red-500">
          データの読み込みに失敗しました
        </div>
      )}

      {/* Receipt Upload Modal */}
      <ReceiptUploadModal 
        open={isReceiptModalOpen} 
        onOpenChange={setIsReceiptModalOpen} 
      />

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}