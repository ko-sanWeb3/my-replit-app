import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Camera, Scan } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (productInfo: {
    barcode: string;
    name: string;
    brand?: string;
    category?: string;
    imageUrl?: string;
  }) => void;
}

interface ProductInfo {
  barcode: string;
  name: string;
  brand?: string;
  category?: string;
  imageUrl?: string;
  description?: string;
}

export default function BarcodeScanner({ isOpen, onClose, onScanSuccess }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState<string>("");
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      initializeScanner();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isOpen]);

  const initializeScanner = async () => {
    console.log("Initializing scanner...");
    
    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported");
      }

      console.log("Requesting camera access...");
      
      // Try different constraints for iOS compatibility
      let stream: MediaStream;
      try {
        // First try with environment camera
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
      } catch (envError) {
        console.log("Environment camera failed, trying any camera:", envError);
        // Fallback to any available camera
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: true
        });
      }

      console.log("Camera access granted, setting up video...");

      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to load
        await new Promise((resolve, reject) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = resolve;
            videoRef.current.onerror = reject;
          }
        });
        
        await videoRef.current.play();
        setIsScanning(true);
        
        console.log("Video playing, starting barcode detection...");

        // Initialize ZXing scanner
        const codeReader = new BrowserMultiFormatReader();
        codeReaderRef.current = codeReader;
        
        // Start continuous scanning
        setTimeout(() => {
          if (videoRef.current && isOpen) {
            codeReader.decodeFromVideoDevice(
              undefined,
              videoRef.current,
              (result, error) => {
                if (result) {
                  console.log("Barcode detected:", result.getText());
                  const barcode = result.getText();
                  setScannedCode(barcode);
                  fetchProductInfo(barcode);
                  stopScanning();
                }
                // Continue scanning if no result
              }
            );
          }
        }, 1000); // Give video time to stabilize
      }
    } catch (error: any) {
      console.error("Scanner initialization error:", error);
      let errorMessage = "カメラにアクセスできませんでした。";
      
      if (error?.name === 'NotAllowedError') {
        errorMessage = "カメラの許可が必要です。ブラウザの設定でカメラアクセスを許可してください。";
      } else if (error?.name === 'NotFoundError') {
        errorMessage = "カメラが見つかりませんでした。";
      } else if (error?.name === 'NotSupportedError') {
        errorMessage = "このブラウザではカメラがサポートされていません。";
      } else if (error?.message === 'Camera not supported') {
        errorMessage = "このデバイスではカメラ機能がサポートされていません。";
      }
      
      toast({
        title: "カメラエラー",
        description: errorMessage,
        variant: "destructive",
      });
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    console.log("Stopping scanner...");
    
    if (codeReaderRef.current) {
      try {
        // Stop the video stream first
        const video = videoRef.current;
        if (video && video.srcObject) {
          const stream = video.srcObject as MediaStream;
          stream.getTracks().forEach(track => {
            console.log("Stopping track:", track.kind);
            track.stop();
          });
          video.srcObject = null;
        }
        
        // Clear the scanner reference
        codeReaderRef.current = null;
      } catch (error) {
        console.log("Scanner already stopped:", error);
      }
    }
    setIsScanning(false);
  };

  const fetchProductInfo = async (barcode: string) => {
    setIsLoading(true);
    try {
      // Open Food Facts APIを使用して商品情報を取得
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();

      if (data.status === 1 && data.product) {
        const product = data.product;
        const productInfo: ProductInfo = {
          barcode,
          name: product.product_name || product.product_name_ja || "不明な商品",
          brand: product.brands || undefined,
          category: product.categories_tags ? product.categories_tags[0]?.replace("en:", "") : undefined,
          imageUrl: product.image_url || undefined,
          description: product.ingredients_text || undefined,
        };
        setProductInfo(productInfo);
      } else {
        // フォールバック: バーコード番号のみで商品情報を作成
        const fallbackProduct: ProductInfo = {
          barcode,
          name: `商品 (${barcode})`,
          category: "その他",
        };
        setProductInfo(fallbackProduct);
      }
    } catch (error) {
      console.error("Product fetch error:", error);
      // エラー時もバーコード番号で商品を作成
      const fallbackProduct: ProductInfo = {
        barcode,
        name: `商品 (${barcode})`,
        category: "その他",
      };
      setProductInfo(fallbackProduct);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProduct = () => {
    if (productInfo) {
      onScanSuccess(productInfo);
      onClose();
    }
  };

  const handleRetry = () => {
    setScannedCode("");
    setProductInfo(null);
    initializeScanner();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">バーコードスキャン</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!scannedCode && (
            <>
              <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                {isScanning ? (
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    playsInline
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Camera className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="border-2 border-white w-48 h-48 rounded-lg flex items-center justify-center">
                      <Scan className="w-8 h-8 text-white animate-pulse" />
                    </div>
                  </div>
                )}
              </div>
              
              <p className="text-sm text-gray-600 text-center">
                バーコードをカメラの中央に合わせてください
              </p>
            </>
          )}

          {scannedCode && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">スキャン結果</p>
                <p className="font-mono text-lg">{scannedCode}</p>
              </div>

              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-gray-600 mt-2">商品情報を取得中...</p>
                </div>
              ) : productInfo ? (
                <div className="space-y-3">
                  <div className="border rounded-lg p-3 space-y-2">
                    {productInfo.imageUrl && (
                      <img
                        src={productInfo.imageUrl}
                        alt={productInfo.name}
                        className="w-16 h-16 object-cover rounded mx-auto"
                      />
                    )}
                    <h3 className="font-medium text-center">{productInfo.name}</h3>
                    {productInfo.brand && (
                      <p className="text-sm text-gray-600 text-center">{productInfo.brand}</p>
                    )}
                    {productInfo.category && (
                      <p className="text-xs text-gray-500 text-center">
                        カテゴリ: {productInfo.category}
                      </p>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Button onClick={handleRetry} variant="outline" className="flex-1">
                      再スキャン
                    </Button>
                    <Button onClick={handleAddProduct} className="flex-1">
                      食材に追加
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}