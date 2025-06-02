import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Check, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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

export default function ExtractedItemsModal({ 
  isOpen, 
  onClose, 
  extractedItems, 
  categories 
}: ExtractedItemsModalProps) {
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [itemCategories, setItemCategories] = useState<{ [key: number]: number }>({});
  const { toast } = useToast();

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

  // Initialize item categories
  useState(() => {
    const initialCategories: { [key: number]: number } = {};
    extractedItems.forEach((item, index) => {
      initialCategories[index] = getCategoryId(item.category);
    });
    setItemCategories(initialCategories);
  });

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

  const handleAddSelected = () => {
    const itemsToAdd = Array.from(selectedItems).map(index => {
      const item = extractedItems[index];
      return {
        name: item.name,
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
                            <h3 className="font-medium">{item.name}</h3>
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