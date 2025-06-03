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
      "トマト": "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=80&h=80&fit=crop&crop=center",
      "たまねぎ": "https://images.unsplash.com/photo-1508747703725-719777637510?w=80&h=80&fit=crop&crop=center",
      "にんにく": "https://images.unsplash.com/photo-1585734811961-ed507c8e5deb?w=80&h=80&fit=crop&crop=center",
      "レタス": "https://images.unsplash.com/photo-1556801712-b4d4ecb80543?w=80&h=80&fit=crop&crop=center",
      "小松菜": "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=80&h=80&fit=crop&crop=center",
      "キャベツ": "https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=80&h=80&fit=crop&crop=center",
      "にんじん": "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=80&h=80&fit=crop&crop=center",
      "ピーマン": "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=80&h=80&fit=crop&crop=center",
      "きゅうり": "https://images.unsplash.com/photo-1599818180499-ac8c5c07ee5a?w=80&h=80&fit=crop&crop=center",
      "大根": "https://images.unsplash.com/photo-1612507311219-8b0aed38b48e?w=80&h=80&fit=crop&crop=center",
      
      // きのこ類
      "生しいたけ": "https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=80&h=80&fit=crop&crop=center",
      "しいたけ": "https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=80&h=80&fit=crop&crop=center",
      
      // 果物
      "レモン": "https://images.unsplash.com/photo-1590502593747-42a4e0d4aac3?w=80&h=80&fit=crop&crop=center",
      "キウイフルーツ": "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=80&h=80&fit=crop&crop=center",
      "りんご": "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=80&h=80&fit=crop&crop=center",
      
      // 肉類
      "豚ミンチ": "https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=80&h=80&fit=crop&crop=center",
      "国産豚ミンチ": "https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=80&h=80&fit=crop&crop=center",
      "牛肉": "https://images.unsplash.com/photo-1588347818441-7095c252d399?w=80&h=80&fit=crop&crop=center",
      "鶏肉": "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=80&h=80&fit=crop&crop=center",
      
      // 飲み物
      "綾鷹": "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=80&h=80&fit=crop&crop=center",
      "お茶": "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=80&h=80&fit=crop&crop=center",
      "水": "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=80&h=80&fit=crop&crop=center",
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
