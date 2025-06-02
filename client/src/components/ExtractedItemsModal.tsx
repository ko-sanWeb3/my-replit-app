import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Check, X, Plus, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  extractedItems, 
  categories 
}: ExtractedItemsModalProps) {
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [itemCategories, setItemCategories] = useState<{ [key: number]: number }>({});
  const [editingItems, setEditingItems] = useState<{ [key: number]: string }>({});
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const { toast } = useToast();

  // 野菜の選択肢
  const vegetableOptions = [
    "トマト", "小松菜", "キャベツ", "にんじん", "玉ねぎ", 
    "ピーマン", "きゅうり", "大根", "レタス", "その他の野菜"
  ];

  // Find category ID by name
  const getCategoryId = (categoryName: string) => {
    const categoryMap: { [key: string]: string } = {
      "冷蔵": "冷蔵",
      "冷凍": "冷凍庫", 
      "野菜": "野菜室",
      "常温": "冷蔵", // Default to 冷蔵 for 常温
    };
    
    const mappedName = categoryMap[categoryName] || "冷蔵";
    const category = categories.find(cat => cat.name === mappedName);
    return category?.id || categories[0]?.id;
  };

  // Initialize item categories and names
  useState(() => {
    const initialCategories: { [key: number]: number } = {};
    const initialNames: { [key: number]: string } = {};
    extractedItems.forEach((item, index) => {
      initialCategories[index] = getCategoryId(item.category);
      initialNames[index] = item.name;
    });
    setItemCategories(initialCategories);
    setEditingItems(initialNames);
  });

  // Check if item name suggests it's a generic/unknown item
  const isGenericItem = (name: string) => {
    const genericTerms = ["直売", "産直", "野菜", "生鮮", "その他"];
    return genericTerms.some(term => name.includes(term));
  };

  const addItemsMutation = useMutation({
    mutationFn: async (items: any[]) => {
      const promises = items.map(item => 
        apiRequest("POST", "/api/food-items", {
          body: JSON.stringify(item),
          headers: {
            "Content-Type": "application/json",
          },
        })
      );
      
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `${selectedItems.size}個の食材を追加しました`,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/food-items"] });
      onClose();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Error",
        description: "食材の追加に失敗しました",
        variant: "destructive",
      });
    },
  });

  const handleItemToggle = (index: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedItems(newSelected);
  };

  const handleCategoryChange = (index: number, categoryId: string) => {
    setItemCategories(prev => ({
      ...prev,
      [index]: parseInt(categoryId)
    }));
  };

  const handleItemNameChange = (index: number, newName: string) => {
    setEditingItems(prev => ({
      ...prev,
      [index]: newName
    }));
  };

  const handleAddSelected = () => {
    const itemsToAdd = Array.from(selectedItems).map(index => {
      const item = extractedItems[index];
      return {
        name: editingItems[index] || item.name,
        categoryId: itemCategories[index],
        quantity: item.quantity || 1,
        unit: item.unit || "個",
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        protein: 0,
        carbs: 0,
        fats: 0,
        calories: 0,
      };
    });

    addItemsMutation.mutate(itemsToAdd);
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
        
        <CardContent>
          {extractedItems.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              食材が検出されませんでした
            </p>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {extractedItems.map((item, index) => (
                  <Card key={index} className={`border-2 transition-colors ${
                    selectedItems.has(index) ? 'border-primary bg-primary/5' : 'border-gray-200'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          checked={selectedItems.has(index)}
                          onCheckedChange={() => handleItemToggle(index)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {isGenericItem(item.name) ? (
                              <div className="flex-1">
                                <Select 
                                  value={editingItems[index] || item.name} 
                                  onValueChange={(value) => handleItemNameChange(index, value)}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="野菜を選択してください" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {vegetableOptions.map((vegetable) => (
                                      <SelectItem key={vegetable} value={vegetable}>
                                        {vegetable}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <p className="text-xs text-gray-500 mt-1">
                                  元の名前: {item.name}
                                </p>
                              </div>
                            ) : (
                              <h3 className="font-medium">{editingItems[index] || item.name}</h3>
                            )}
                            {item.quantity && (
                              <Badge variant="secondary" className="text-xs">
                                {item.quantity}{item.unit || "個"}
                              </Badge>
                            )}
                          </div>
                          
                          <Select 
                            value={itemCategories[index]?.toString()} 
                            onValueChange={(value) => handleCategoryChange(index, value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="保存場所を選択" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                  <div className="flex items-center space-x-2">
                                    <div 
                                      className="w-3 h-3 rounded"
                                      style={{ backgroundColor: category.color }}
                                    />
                                    <span>{category.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="flex-1"
                >
                  キャンセル
                </Button>
                <Button 
                  onClick={handleAddSelected}
                  disabled={selectedItems.size === 0 || addItemsMutation.isPending}
                  className="flex-1"
                >
                  {addItemsMutation.isPending ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>追加中...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Plus className="w-4 h-4" />
                      <span>選択した{selectedItems.size}個を追加</span>
                    </div>
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