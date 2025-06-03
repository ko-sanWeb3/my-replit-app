import { useQuery } from "@tanstack/react-query";
import { Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FoodItemCard from "@/components/FoodItemCard";
import BottomNavigation from "@/components/BottomNavigation";

export default function Inventory() {
  // Fetch categories and food items
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  const { data: allFoodItems = [] } = useQuery({
    queryKey: ["/api/food-items"],
  });

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <Package className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-semibold text-gray-800">在庫一覧</h1>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-6 pb-24">
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">カテゴリがまだ設定されていません</p>
          </div>
        ) : (
          <div className="space-y-6">
            {categories.map((category: any) => {
              const categoryItems = allFoodItems.filter((item: any) => item.categoryId === category.id);
              
              return (
                <Card key={category.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-3">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        <i className={`${category.icon} text-sm`} style={{ color: category.color }}></i>
                      </div>
                      <span>{category.name}</span>
                      <span className="text-sm text-gray-500 font-normal">
                        ({categoryItems.length}点)
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {categoryItems.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3">
                        {categoryItems.map((item: any) => (
                          <FoodItemCard key={item.id} item={item} showFullInfo />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">
                        この区分には食材がありません
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation currentPage="inventory" />
    </div>
  );
}
