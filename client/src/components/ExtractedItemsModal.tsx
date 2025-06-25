import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, getCurrentUserId } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface ExtractedItem {
  name: string;
  category: string;
  quantity?: number;
  unit?: string;
}

interface ExtractedItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  extractedItems: ExtractedItem[];
  categories: any[];
}

export default function ExtractedItemsModal({ 
  isOpen, 
  onClose, 
  extractedItems = [], 
  categories = [] 
}: ExtractedItemsModalProps) {
  const [items, setItems] = useState<(ExtractedItem & { categoryId?: number; quantity: number })[]>([]);
  const { toast } = useToast();

  // Update items when extractedItems changes
  useEffect(() => {
    if (extractedItems && extractedItems.length > 0) {
      setItems(extractedItems.map(item => ({
        ...item,
        quantity: 1, // Always default to 1
        categoryId: undefined
      })));
    }
  }, [extractedItems]);

  const saveMutation = useMutation({
    mutationFn: async (items: any[]) => {
      const userId = getCurrentUserId();

      console.log("Saving batch items:", items);

      const response = await fetch("/api/food-items/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": userId,
        },
        credentials: "include",
        body: JSON.stringify(items), // Send items directly, not wrapped in {items}
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Batch save error response:", errorText);
        throw new Error(`Batch save failed: ${response.status}: ${errorText}`);
      }

      return response.json();
    },
    onSuccess: (data) => {
      console.log("Save success:", data);
      toast({
        title: "成功",
        description: `${data.totalCreated || data.items?.length || 0}個の食材を追加しました`,
      });
      // Invalidate multiple queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ["/api/food-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/nutrition"] });
      onClose();
    },
    onError: (error) => {
      console.error("Save error:", error);
      toast({
        title: "エラー",
        description: error.message || "食材の保存に失敗しました",
        variant: "destructive",
      });
    },
  });

  const updateItem = (index: number, field: string, value: any) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    // Safety check for categories
    const validCategories = Array.isArray(categories) ? categories : [];

    const itemsToSave = items
      .filter(item => item.categoryId && item.name?.trim())
      .map(item => {
        // Calculate expiry date based on category name
        const getExpiryDays = (categoryId: number): number => {
          const category = validCategories.find(cat => cat.id === categoryId);
          if (!category) return 7;

          switch (category.name) {
            case "冷蔵室": return 7;   // 冷蔵室
            case "冷蔵": return 7;     // 冷蔵（別名）
            case "野菜室": return 5;   // 野菜室 
            case "冷凍庫": return 30;  // 冷凍庫
            case "チルド": return 3;   // チルド
            default: return 7;
          }
        };

        const expiryDays = getExpiryDays(item.categoryId);
        const expiryDate = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];

        // Make sure quantity is a valid number
        const quantity = parseInt(item.quantity?.toString() || "1") || 1;

        return {
          name: item.name.trim(),
          categoryId: item.categoryId,
          quantity: quantity,
          unit: item.unit || "個",
          expiryDate: expiryDate,
        };
      });

    if (itemsToSave.length === 0) {
      toast({
        title: "エラー",
        description: "保存する食材がありません",
        variant: "destructive",
      });
      return;
    }

    console.log("Saving items:", itemsToSave);
    saveMutation.mutate(itemsToSave);
  };

  if (!isOpen) return null;

  // Safety check for categories
  const validCategories = Array.isArray(categories) ? categories : [];

  // Debug logging
  console.log("ExtractedItemsModal render:", {
    isOpen,
    extractedItems: extractedItems?.length || 0,
    categories: validCategories?.length || 0,
    items: items?.length || 0
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="sticky top-0 bg-white border-b">
          <CardTitle className="flex items-center justify-between">
            <span>検出された食材</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4">
          {items.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">検出された食材がありません</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    {/* Item Name */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        食材名
                      </label>
                      <Input
                        value={item.name || ""}
                        onChange={(e) => updateItem(index, "name", e.target.value)}
                        placeholder="食材名を入力"
                      />
                    </div>

                    {/* Category Selection */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        保存先
                      </label>
                      <Select
                        value={item.categoryId?.toString() || ""}
                        onValueChange={(value) => {
                          console.log("Category selected:", value);
                          updateItem(index, "categoryId", parseInt(value));
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="保存先を選択してください" />
                        </SelectTrigger>
                        <SelectContent>
                          {validCategories.length === 0 ? (
                            <SelectItem value="loading" disabled>
                              読み込み中...
                            </SelectItem>
                          ) : (
                            validCategories.map((category) => (
                              <SelectItem 
                                key={category.id} 
                                value={category.id.toString()}
                                className="flex items-center space-x-2"
                              >
                                <div className="flex items-center space-x-2">
                                  <i 
                                    className={category.icon || "fas fa-circle"} 
                                    style={{ color: category.color || "#666" }}
                                  ></i>
                                  <span>{category.name}</span>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {validCategories.length === 0 && (
                        <p className="text-xs text-red-500 mt-1">
                          カテゴリーの読み込みに失敗しました
                        </p>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                          数量
                        </label>
                        <Input
                          type="number"
                          value={item.quantity || 1}
                          onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                          単位
                        </label>
                        <Input
                          value={item.unit || "個"}
                          onChange={(e) => updateItem(index, "unit", e.target.value)}
                          placeholder="個"
                        />
                      </div>
                    </div>

                    {/* Remove Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="w-full text-red-600 hover:text-red-700"
                    >
                      削除
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="sticky bottom-0 bg-white pt-4 mt-6 border-t space-y-2">
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending || items.length === 0}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {saveMutation.isPending ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>保存中...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Save className="w-4 h-4" />
                  <span>食材を追加 ({items.filter(item => item.categoryId).length}個)</span>
                </div>
              )}
            </Button>
            <Button variant="outline" onClick={onClose} className="w-full">
              キャンセル
            </Button>
          </div>
        </CardContent>
      </div>
    </div>
  );
}