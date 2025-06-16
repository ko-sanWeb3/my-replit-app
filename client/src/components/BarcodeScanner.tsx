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
      // Simple and direct camera request for iOS
      console.log("Requesting camera access...");
      
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("Camera stream obtained");

      if (videoRef.current && stream) {
        const video = videoRef.current;
        
        // Direct assignment and immediate play
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        video.autoplay = true;
        
        // Simple event handlers
        video.addEventListener('loadedmetadata', () => {
          console.log("Video metadata loaded, starting playback");
          video.play().then(() => {
            console.log("Video playing successfully");
            setIsScanning(true);
            
            // Initialize scanner immediately
            const codeReader = new BrowserMultiFormatReader();
            codeReaderRef.current = codeReader;
            
            console.log("Starting continuous barcode scanning");
            
            // Simple configuration for better barcode detection
            console.log("Configuring scanner for standard barcodes (EAN-13, UPC, etc.)");
            
            codeReader.decodeFromVideoDevice(
              undefined,
              video,
              (result, error) => {
                if (result) {
                  console.log("Barcode found:", result.getText());
                  const barcode = result.getText();
                  setScannedCode(barcode);
                  fetchProductInfo(barcode);
                  stopScanning();
                } else if (error) {
                  // Log scanning attempts
                  console.log("Scanning for barcode...");
                }
              }
            );
          }).catch(playError => {
            console.error("Video play failed:", playError);
            toast({
              title: "カメラエラー",
              description: "ビデオの再生に失敗しました。",
              variant: "destructive",
            });
          });
        });
        
        video.addEventListener('error', (error) => {
          console.error("Video element error:", error);
          toast({
            title: "カメラエラー",
            description: "ビデオの初期化に失敗しました。",
            variant: "destructive",
          });
        });
      }
      
    } catch (error: any) {
      console.error("Camera access error:", error);
      let errorMessage = "カメラにアクセスできませんでした。";
      
      if (error?.name === 'NotAllowedError') {
        errorMessage = "カメラの許可が必要です。ブラウザの設定でカメラアクセスを許可してください。";
      } else if (error?.name === 'NotFoundError') {
        errorMessage = "カメラが見つかりませんでした。";
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

  const handleRetry = async () => {
    console.log("Retrying camera initialization...");
    setScannedCode("");
    setProductInfo(null);
    setIsLoading(false);
    stopScanning();
    
    // Wait a moment before retrying
    setTimeout(() => {
      initializeScanner();
    }, 500);
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
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  playsInline
                  style={{ display: isScanning ? 'block' : 'none' }}
                />
                {!isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">カメラを起動中...</p>
                      <Button 
                        onClick={handleRetry}
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                      >
                        再試行
                      </Button>
                    </div>
                  </div>
                )}
                
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {/* Barcode scanning frame */}
                    <div className="relative">
                      <div className="w-64 h-32 border-2 border-red-500 bg-transparent">
                        {/* Corner brackets */}
                        <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-red-500"></div>
                        <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-red-500"></div>
                        <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-red-500"></div>
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-red-500"></div>
                        
                        {/* Scanning line */}
                        <div className="absolute top-0 left-0 w-full h-0.5 bg-red-500 animate-pulse"></div>
                      </div>
                      
                      {/* Instructions */}
                      <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center">
                        <p className="text-white bg-black bg-opacity-60 px-3 py-1 rounded text-sm">
                          バーコードをここに合わせてください
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <p className="text-sm text-gray-600 text-center">
                商品の<strong>バーコード</strong>（縦線のパターン）をスキャンしてください
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