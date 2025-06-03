import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface FoodItemCardProps {
  item: {
    id: number;
    name: string;
    expiryDate?: string;
    quantity?: number;
    unit?: string;
    imageUrl?: string;
  };
  showFullInfo?: boolean;
}

export default function FoodItemCard({ item, showFullInfo = false }: FoodItemCardProps) {
  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return { text: "期限なし", color: "text-gray-500" };
    
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: "期限切れ", color: "text-red-500" };
    } else if (diffDays === 0) {
      return { text: "今日まで", color: "text-red-500" };
    } else if (diffDays === 1) {
      return { text: "明日まで", color: "text-warning" };
    } else if (diffDays <= 3) {
      return { text: `あと${diffDays}日`, color: "text-warning" };
    } else {
      return { text: `あと${diffDays}日`, color: "text-primary" };
    }
  };

  const getFoodImage = (foodName: string): string => {
    const foodImages: { [key: string]: string } = {
      // 野菜
      "トマト": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='40' fill='%23FF6B6B'/%3E%3Cpath d='M35 25 Q50 15 65 25 Q60 35 50 40 Q40 35 35 25' fill='%2398D982'/%3E%3C/svg%3E",
      "たまねぎ": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cellipse cx='50' cy='60' rx='35' ry='30' fill='%23F4E4BC'/%3E%3Cpath d='M50 30 Q40 35 45 45 Q50 40 55 45 Q60 35 50 30' fill='%23D4B896'/%3E%3C/svg%3E",
      "にんにく": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M35 45 Q40 35 50 40 Q60 35 65 45 Q60 60 50 65 Q40 60 35 45' fill='%23F5F5DC'/%3E%3Cpath d='M45 35 Q50 30 55 35 Q52 40 50 42 Q48 40 45 35' fill='%23E6E6CD'/%3E%3Ccircle cx='42' cy='50' r='3' fill='%23E6E6CD'/%3E%3Ccircle cx='58' cy='50' r='3' fill='%23E6E6CD'/%3E%3C/svg%3E",
      "レタス": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M20 70 Q30 40 50 45 Q70 40 80 70 Q70 80 50 75 Q30 80 20 70' fill='%2398D982'/%3E%3Cpath d='M30 50 Q40 35 50 40 Q60 35 70 50' fill='%23B8E6A2'/%3E%3C/svg%3E",
      "小松菜": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M40 20 Q35 30 30 50 Q25 70 35 80 L45 75 Q50 60 45 40 Q42 25 40 20' fill='%2366BB6A'/%3E%3Cpath d='M60 20 Q65 30 70 50 Q75 70 65 80 L55 75 Q50 60 55 40 Q58 25 60 20' fill='%2366BB6A'/%3E%3C/svg%3E",
      "キャベツ": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='35' fill='%2398D982'/%3E%3Cpath d='M25 35 Q35 25 50 30 Q65 25 75 35 Q70 45 50 50 Q30 45 25 35' fill='%23B8E6A2'/%3E%3C/svg%3E",
      "にんじん": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M45 20 Q50 15 55 20 L60 75 Q55 85 50 85 Q45 85 40 75 Z' fill='%23FF9800'/%3E%3Cpath d='M50 15 Q45 10 40 15 Q45 20 50 15' fill='%2366BB6A'/%3E%3Cpath d='M50 15 Q55 10 60 15 Q55 20 50 15' fill='%2366BB6A'/%3E%3C/svg%3E",
      "ピーマン": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M35 30 Q30 40 35 60 Q40 80 50 80 Q60 80 65 60 Q70 40 65 30 Q60 20 50 25 Q40 20 35 30' fill='%234CAF50'/%3E%3Cpath d='M50 25 Q45 20 50 15 Q55 20 50 25' fill='%2366BB6A'/%3E%3C/svg%3E",
      "きゅうり": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M35 25 Q40 20 45 25 L55 75 Q50 80 45 75 L35 25' fill='%234CAF50'/%3E%3Cpath d='M40 30 L50 30 M40 40 L50 40 M40 50 L50 50 M40 60 L50 60' stroke='%23388E3C' stroke-width='2'/%3E%3C/svg%3E",
      "大根": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M40 30 Q45 25 55 30 L60 80 Q55 85 50 85 Q45 85 40 80 Z' fill='%23FFFFFF'/%3E%3Cpath d='M50 25 Q45 15 40 20 Q45 25 50 25' fill='%2366BB6A'/%3E%3Cpath d='M50 25 Q55 15 60 20 Q55 25 50 25' fill='%2366BB6A'/%3E%3C/svg%3E",
      
      // きのこ類
      "生しいたけ": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M25 50 Q30 35 50 40 Q70 35 75 50 Q70 65 50 60 Q30 65 25 50' fill='%23D2691E'/%3E%3Crect x='45' y='60' width='10' height='25' fill='%23F5DEB3'/%3E%3C/svg%3E",
      "しいたけ": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M25 50 Q30 35 50 40 Q70 35 75 50 Q70 65 50 60 Q30 65 25 50' fill='%23D2691E'/%3E%3Crect x='45' y='60' width='10' height='25' fill='%23F5DEB3'/%3E%3C/svg%3E",
      
      // 果物
      "レモン": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cellipse cx='50' cy='50' rx='25' ry='35' fill='%23FFEB3B'/%3E%3Cpath d='M50 20 Q45 15 40 20 Q45 25 50 20' fill='%2366BB6A'/%3E%3C/svg%3E",
      "キウイフルーツ": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cellipse cx='50' cy='50' rx='30' ry='35' fill='%23795548'/%3E%3Ccircle cx='50' cy='50' r='25' fill='%23AED581'/%3E%3Ccircle cx='50' cy='50' r='15' fill='%23FFFFFF'/%3E%3Ccircle cx='50' cy='50' r='3' fill='%23333'/%3E%3C/svg%3E",
      "りんご": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M35 40 Q30 25 50 30 Q70 25 65 40 Q70 60 50 75 Q30 60 35 40' fill='%23F44336'/%3E%3Cpath d='M50 30 Q45 20 40 25 Q45 30 50 30' fill='%2366BB6A'/%3E%3C/svg%3E",
      
      // 肉類
      "豚ミンチ": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect x='25' y='35' width='50' height='30' rx='8' fill='%23FFB6C1'/%3E%3Cpath d='M30 40 L70 40 L68 50 L32 50 Z' fill='%23FF69B4'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='%23000' font-size='10'%3E肉%3C/text%3E%3C/svg%3E",
      "国産豚ミンチ": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect x='25' y='35' width='50' height='30' rx='8' fill='%23FFB6C1'/%3E%3Cpath d='M30 40 L70 40 L68 50 L32 50 Z' fill='%23FF69B4'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='%23000' font-size='10'%3E肉%3C/text%3E%3C/svg%3E",
      "牛肉": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M25 35 Q35 30 50 35 Q65 30 75 35 Q75 60 50 70 Q25 60 25 35' fill='%23D32F2F'/%3E%3Cpath d='M35 40 Q45 45 55 40' stroke='%23FFFFFF' stroke-width='2' fill='none'/%3E%3C/svg%3E",
      "鶏肉": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M30 35 Q40 30 50 35 Q60 30 70 35 Q70 65 50 70 Q30 65 30 35' fill='%23FFC107'/%3E%3Cpath d='M40 40 Q50 45 60 40' stroke='%23FFFFFF' stroke-width='2' fill='none'/%3E%3C/svg%3E",
      
      // 飲み物
      "綾鷹": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect x='40' y='20' width='20' height='60' rx='5' fill='%234CAF50'/%3E%3Crect x='42' y='22' width='16' height='56' rx='3' fill='%2366BB6A'/%3E%3Ctext x='50' y='50' text-anchor='middle' fill='%23FFFFFF' font-size='8'%3E茶%3C/text%3E%3C/svg%3E",
      "お茶": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect x='40' y='20' width='20' height='60' rx='5' fill='%234CAF50'/%3E%3Crect x='42' y='22' width='16' height='56' rx='3' fill='%2366BB6A'/%3E%3Ctext x='50' y='50' text-anchor='middle' fill='%23FFFFFF' font-size='8'%3E茶%3C/text%3E%3C/svg%3E",
      "緑茶": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect x='40' y='20' width='20' height='60' rx='5' fill='%234CAF50'/%3E%3Crect x='42' y='22' width='16' height='56' rx='3' fill='%2366BB6A'/%3E%3Ctext x='50' y='50' text-anchor='middle' fill='%23FFFFFF' font-size='8'%3E茶%3C/text%3E%3C/svg%3E",
      "ペットボトル": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect x='40' y='20' width='20' height='60' rx='5' fill='%234CAF50'/%3E%3Crect x='42' y='22' width='16' height='56' rx='3' fill='%2366BB6A'/%3E%3Ctext x='50' y='50' text-anchor='middle' fill='%23FFFFFF' font-size='8'%3E茶%3C/text%3E%3C/svg%3E",
      "水": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect x='40' y='20' width='20' height='60' rx='5' fill='%232196F3'/%3E%3Crect x='42' y='22' width='16' height='56' rx='3' fill='%2364B5F6'/%3E%3C/svg%3E",
    };

    // 完全一致を試す
    if (foodImages[foodName]) {
      return foodImages[foodName];
    }

    // 部分一致を試す
    for (const [key, imageUrl] of Object.entries(foodImages)) {
      if (foodName.includes(key) || key.includes(foodName)) {
        return imageUrl;
      }
    }

    // デフォルト画像
    return "https://images.unsplash.com/photo-1567306301408-9b74779a11af?w=80&h=80&fit=crop&crop=center";
  };

  const expiryStatus = getExpiryStatus(item.expiryDate);
  const foodImage = item.imageUrl || getFoodImage(item.name);

  if (showFullInfo) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <img 
              src={foodImage}
              alt={item.name}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div className="flex-1">
              <h3 className="font-medium text-gray-800">{item.name}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`text-sm ${expiryStatus.color}`}>
                  {expiryStatus.text}
                </span>
                {item.quantity && (
                  <Badge variant="secondary" className="text-xs">
                    {item.quantity}{item.unit || "個"}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-3 flex items-center space-x-3">
      <img 
        src={foodImage}
        alt={item.name}
        className="w-12 h-12 rounded-lg object-cover"
      />
      <div>
        <p className="text-sm font-medium text-gray-800">{item.name}</p>
        <p className={`text-xs ${expiryStatus.color}`}>
          {expiryStatus.text}
        </p>
      </div>
    </div>
  );
}
