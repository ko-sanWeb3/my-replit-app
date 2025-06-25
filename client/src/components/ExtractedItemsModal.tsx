import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

export default function ExtractedItemsModal({ isOpen, onClose, extractedItems, categories }: ExtractedItemsModalProps) {
  const [selectedItems, setSelectedItems] = useState<{[key: number]: {
    categoryId: number;
    quantity: number;
    unit: string;
    expiryDate: string;
  }}>({});
  const { toast } = useToast();

  const addFoodItemsMutation = useMutation({
    mutationFn: async (items: any[]) => {
      const response = await fetch("/api/food-items/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ items }),
      });

      if (!response.ok) {
        throw new Error("Failed to add food items");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "食材を冷蔵庫に追加しました",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/food-items"] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "食材の追加に失敗しました",
        variant: "destructive",
      });
    },
  });

  const handleItemChange = (index: number, field: string, value: any) => {
    setSelectedItems(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        [field]: value
      }
    }));
  };

  const handleAddItems = () => {
    const itemsToAdd = extractedItems
      .map((item, index) => {
        const selection = selectedItems[index];
        if (!selection?.categoryId) return null;

        // Calculate expiry date based on category
        const expiryDate = selection.expiryDate || getDefaultExpiryDate(selection.categoryId);

        return {
          name: item.name,
          categoryId: selection.categoryId,
          quantity: selection.quantity || item.quantity || 1,
          unit: selection.unit || item.unit || "個",
          expiryDate,
        };
      })
      .filter(Boolean);

    if (itemsToAdd.length === 0) {
      toast({
        title: "Warning",
        description: "追加する食材を選択してください",
        variant: "destructive",
      });
      return;
    }

    addFoodItemsMutation.mutate(itemsToAdd);
  };

  const getDefaultExpiryDate = (categoryId: number): string => {
    const today = new Date();
    let daysToAdd = 7; // Default 7 days

    // Set different expiry periods based on category
    switch (categoryId) {
      case 1: // 野菜
        daysToAdd = 5;
        break;
      case 2: // 冷凍
        daysToAdd = 30;
        break;
      case 3: // 常温
        daysToAdd = 14;
        break;
      case 4: // チルド
        daysToAdd = 3;
        break;
      default:
        daysToAdd = 7;
    }

    const expiryDate = new Date(today);
    expiryDate.setDate(today.getDate() + daysToAdd);
    return expiryDate.toISOString().split('T')[0];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>検出された食材</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {extractedItems.length === 0 ? (
            <p className="text-center text-gray-500 py-8">食材が検出されませんでした</p>
          ) : (
            <>
              {extractedItems.map((item, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    <h3 className="font-medium">{item.name}</h3>

                    {/* Category Selection */}
                    <div>
                      <Label htmlFor={`category-${index}`}>保存先</Label>
                      <Select 
                        onValueChange={(value) => handleItemChange(index, 'categoryId', parseInt(value))}
                        value={selectedItems[index]?.categoryId?.toString() || ""}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="保存先を選択してください" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              <div className="flex items-center space-x-2">
                                <div 
                                  className="w-4 h-4 rounded-sm flex items-center justify-center"
                                  style={{ backgroundColor: `${category.color}20` }}
                                >
                                  <i className={`${category.icon} text-xs`} style={{ color: category.color }}></i>
                                </div>
                                <span>{category.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Quantity and Unit */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor={`quantity-${index}`}>数量</Label>
                        <Input
                          id={`quantity-${index}`}
                          type="number"
                          min="1"
                          placeholder="1"
                          value={selectedItems[index]?.quantity || item.quantity || ""}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`unit-${index}`}>単位</Label>
                        <Input
                          id={`unit-${index}`}
                          placeholder="個"
                          value={selectedItems[index]?.unit || item.unit || "個"}
                          onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Expiry Date */}
                    <div>
                      <Label htmlFor={`expiry-${index}`}>賞味期限</Label>
                      <Input
                        id={`expiry-${index}`}
                        type="date"
                        value={selectedItems[index]?.expiryDate || ""}
                        onChange={(e) => handleItemChange(index, 'expiryDate', e.target.value)}
                      />
                    </div>
                  </div>
                </Card>
              ))}

              <div className="flex space-x-3 pt-4">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  キャンセル
                </Button>
                <Button 
                  onClick={handleAddItems}
                  disabled={addFoodItemsMutation.isPending}
                  className="flex-1"
                >
                  {addFoodItemsMutation.isPending ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>追加中...</span>
                    </div>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      冷蔵庫に追加
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </div>
    </div>
  );
}