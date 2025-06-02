import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Snowflake, Leaf, Thermometer, ChefHat } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Snowflake className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">FridgeKeeper</h1>
          <p className="text-gray-600">賢い冷蔵庫管理で食材を無駄なく活用</p>
        </div>

        {/* Features */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg text-center">主な機能</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="font-medium text-gray-800">レシートスキャン</p>
                <p className="text-sm text-gray-600">AI OCRで簡単食材登録</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Leaf className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-gray-800">区分管理</p>
                <p className="text-sm text-gray-600">冷蔵・冷凍・野菜室を分類</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                <Thermometer className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="font-medium text-gray-800">賞味期限管理</p>
                <p className="text-sm text-gray-600">期限切れを事前通知</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Login Button */}
        <Button 
          onClick={() => window.location.href = "/api/login"}
          className="w-full bg-primary hover:bg-primary/90 text-white py-3 text-lg font-medium"
        >
          ログインして始める
        </Button>

        <p className="text-center text-sm text-gray-500 mt-4">
          アカウントがない場合は自動で作成されます
        </p>
      </div>
    </div>
  );
}
