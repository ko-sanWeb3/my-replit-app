import { ChefHat } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import BottomNavigation from "@/components/BottomNavigation";

export default function Recipes() {

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <ChefHat className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-semibold text-gray-800">レシピ提案</h1>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-6 pb-24">
        <Card>
          <CardContent className="text-center py-12">
            <ChefHat className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">レシピ機能</h3>
            <p className="text-gray-500 mb-4">
              お持ちの食材を使ったレシピを提案する機能です。
            </p>
            <p className="text-sm text-gray-400">
              現在開発中です。近日公開予定！
            </p>
          </CardContent>
        </Card>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation currentPage="recipes" />
    </div>
  );
}
