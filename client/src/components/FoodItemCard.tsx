import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getFoodIcon } from "@/lib/foodIcons";
import { Trash2, Check } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  showDeleteButton?: boolean;
}

export default function FoodItemCard({ item, showFullInfo = false, showDeleteButton = true }: FoodItemCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteFoodItem = useMutation({
    mutationFn: async (itemId: number) => {
      return await apiRequest("DELETE", `/api/food-items/${itemId}`);
    },
    onSuccess: () => {
      toast({
        title: "食材を削除しました",
        description: `${item.name}を在庫から削除しました`,
      });
      // Invalidate food items queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/food-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
    onError: () => {
      toast({
        title: "削除に失敗しました",
        description: "もう一度お試しください",
        variant: "destructive",
      });
    }
  });
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
    // Use emoji icons for consistent food representation
    const foodIcon = getFoodIcon(foodName);
    
    // Return emoji as a styled SVG
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext x='50' y='60' text-anchor='middle' font-size='50'%3E${encodeURIComponent(foodIcon)}%3C/text%3E%3C/svg%3E`;
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
            {showDeleteButton && (
              <div className="flex flex-col space-y-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-green-600 border-green-600 hover:bg-green-50"
                  onClick={() => deleteFoodItem.mutate(item.id)}
                  disabled={deleteFoodItem.isPending}
                >
                  <Check className="w-4 h-4 mr-1" />
                  使い切った
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-600 hover:bg-red-50"
                  onClick={() => deleteFoodItem.mutate(item.id)}
                  disabled={deleteFoodItem.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  削除
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
      <div className="flex items-center space-x-3">
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
      {showDeleteButton && (
        <Button
          size="sm"
          variant="ghost"
          className="text-green-600 hover:bg-green-50 hover:text-green-700"
          onClick={() => deleteFoodItem.mutate(item.id)}
          disabled={deleteFoodItem.isPending}
        >
          <Check className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
