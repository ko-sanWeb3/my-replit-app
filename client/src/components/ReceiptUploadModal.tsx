import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Camera, Image as ImageIcon, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ExtractedItemsModal from "@/components/ExtractedItemsModal";

interface ExtractedItem {
  name: string;
  category: string;
  quantity?: number;
  unit?: string;
}

interface ReceiptUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReceiptUploadModal({ isOpen, onClose }: ReceiptUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [extractedItems, setExtractedItems] = useState<any[]>([]);
  const [showExtractedItems, setShowExtractedItems] = useState(false);
  const { toast } = useToast();

  // Fetch categories for the extracted items modal
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("receipt", file);

      const response = await fetch("/api/receipts/analyze", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText || response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `${data.extractedItems?.length || 0}個の食材を検出しました`,
      });
      
      // Show extracted items for selection
      setExtractedItems(Array.isArray(data.extractedItems) ? data.extractedItems : []);
      setShowExtractedItems(true);
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
        description: "レシートの解析に失敗しました",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreview(null);
    setExtractedItems([]);
    setShowExtractedItems(false);
    onClose();
  };

  const handleExtractedItemsClose = () => {
    setShowExtractedItems(false);
    // Reset form and close main modal
    setSelectedFile(null);
    setPreview(null);
    setExtractedItems([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
        <div className="bg-white rounded-t-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>レシートをスキャン</span>
              <Button variant="ghost" size="sm" onClick={handleClose}>
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
        
          <CardContent>
          {!selectedFile ? (
            <>
              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center mb-6">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600 mb-2">レシートを撮影またはアップロード</p>
                <p className="text-xs text-gray-400">Gemini AIが自動で食材を認識します</p>
              </div>
              
              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={() => document.getElementById('camera-input')?.click()}
                  className="bg-secondary hover:bg-secondary/90 text-white flex items-center justify-center space-x-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>撮影</span>
                </Button>
                <Button 
                  onClick={() => document.getElementById('file-input')?.click()}
                  variant="outline"
                  className="flex items-center justify-center space-x-2"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>選択</span>
                </Button>
              </div>

              {/* Hidden file inputs */}
              <input
                id="camera-input"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                id="file-input"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </>
          ) : (
            <>
              {/* Preview */}
              {preview && (
                <div className="mb-6">
                  <img 
                    src={preview} 
                    alt="Receipt preview" 
                    className="w-full max-h-64 object-contain rounded-lg border"
                  />
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedFile(null);
                    setPreview(null);
                  }}
                >
                  やり直し
                </Button>
                <Button 
                  onClick={handleUpload}
                  disabled={uploadMutation.isPending}
                  className="bg-primary hover:bg-primary/90"
                >
                  {uploadMutation.isPending ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>解析中...</span>
                    </div>
                  ) : (
                    "解析開始"
                  )}
                </Button>
              </div>
            </>
          )}
          </CardContent>
        </div>
      </div>

      {/* Extracted Items Modal */}
      <ExtractedItemsModal
        isOpen={showExtractedItems}
        onClose={handleExtractedItemsClose}
        extractedItems={extractedItems}
        categories={Array.isArray(categories) ? categories : []}
      />
    </>
  );
}
