import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BottomNavigation from "@/components/BottomNavigation";
import FoodItemCard from "@/components/FoodItemCard";
import { getCurrentUserId } from "@/lib/queryClient";

export default function Inventory() {
  const currentUserId = getCurrentUserId();

  // API Queries
  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ["/api/categories"],
  });

  const { data: allFoodItems = [], isLoading: itemsLoading, error: itemsError } = useQuery({
    queryKey: ["/api/food-items"],
  });

  // Debug logging
  React.useEffect(() => {
    console.log('📦 Inventory Debug Info:', {
      currentUserId,
      categoriesCount: categories.length,
      itemsCount: allFoodItems.length,
      categoriesLoading,
      itemsLoading,
      categoriesError,
      itemsError,
      categories: categories.map(cat => ({ id: cat.id, name: cat.name, userId: cat.userId })),
      items: allFoodItems.map(item => ({ id: item.id, name: item.name, categoryId: item.categoryId, userId: item.userId }))
    });
  });

  const isLoading = categoriesLoading || itemsLoading;
  const hasError = categoriesError || itemsError;

  // Debug current state
  React.useEffect(() => {
    console.log('📦 Inventory State:', {
      userId: currentUserId,
      categoriesCount: categories.length,
      itemsCount: allFoodItems.length,
      isLoading,
      hasError
    });
  }, [currentUserId, categories.length, allFoodItems.length, isLoading, hasError]);

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-b-3xl">
        <h1 className="text-2xl font-bold mb-2">📦 在庫一覧</h1>
        <div className="flex gap-2">
          <Badge variant="secondary" className="bg-white/20 text-white">
            {allFoodItems.length} アイテム
          </Badge>
          <Badge variant="secondary" className="bg-white/20 text-white">
            {categories.length} カテゴリ
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 pb-20">
        {isLoading && (
          <div className="text-center text-gray-500 py-8">
            データを読み込んでいます...
          </div>
        )}

        {hasError && (
          <div className="text-center text-red-500 py-8">
            データの読み込みに失敗しました
          </div>
        )}

        {!isLoading && !hasError && allFoodItems.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-gray-500 mb-4">まだ食材が登録されていません</p>
            <p className="text-sm text-gray-400">ホーム画面からレシートを読み取って食材を追加してみましょう</p>
          </Card>
        )}

        {!isLoading && !hasError && categories.map((category) => {
          const categoryItems = allFoodItems.filter(item => item.categoryId === category.id);

          if (categoryItems.length === 0) return null;

          return (
            <div key={category.id} className="mb-6">
              <div className="flex items-center mb-3">
                <i className={`${category.icon} text-lg mr-2`} style={{ color: category.color }}></i>
                <h2 className="text-lg font-semibold">{category.name}</h2>
                <Badge variant="outline" className="ml-2">
                  {categoryItems.length}
                </Badge>
              </div>

              <div className="grid gap-3">
                {categoryItems.map((item) => (
                  <FoodItemCard
                    key={item.id}
                    item={item}
                    category={category}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <BottomNavigation />
    </div>
  );
}