import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, LogOut, User, Bell, Palette } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import BottomNavigation from "@/components/BottomNavigation";

export default function Settings() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <SettingsIcon className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-semibold text-gray-800">設定</h1>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-6 pb-24">
        {/* Profile Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <User className="w-5 h-5" />
              <span>プロフィール</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              {user?.profileImageUrl && (
                <img 
                  src={user.profileImageUrl} 
                  alt="Profile" 
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                />
              )}
              <div>
                <p className="font-medium text-gray-800">
                  {user?.firstName || user?.lastName 
                    ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                    : "ユーザー"
                  }
                </p>
                <p className="text-sm text-gray-500">{user?.email || "メールアドレス未設定"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Options */}
        <Card className="mb-6">
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              <button className="w-full px-4 py-4 flex items-center space-x-3 hover:bg-gray-50 transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="flex-1 text-left text-gray-700">通知設定</span>
                <i className="fas fa-chevron-right text-sm text-gray-400"></i>
              </button>
              
              <button className="w-full px-4 py-4 flex items-center space-x-3 hover:bg-gray-50 transition-colors">
                <Palette className="w-5 h-5 text-gray-600" />
                <span className="flex-1 text-left text-gray-700">テーマ設定</span>
                <i className="fas fa-chevron-right text-sm text-gray-400"></i>
              </button>
              
              <button className="w-full px-4 py-4 flex items-center space-x-3 hover:bg-gray-50 transition-colors">
                <SettingsIcon className="w-5 h-5 text-gray-600" />
                <span className="flex-1 text-left text-gray-700">カテゴリ管理</span>
                <i className="fas fa-chevron-right text-sm text-gray-400"></i>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* App Info */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">FridgeKeeper</p>
              <p className="text-xs text-gray-400">バージョン 1.0.0</p>
            </div>
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Button 
          onClick={handleLogout}
          variant="destructive"
          className="w-full flex items-center space-x-2"
        >
          <LogOut className="w-4 h-4" />
          <span>ログアウト</span>
        </Button>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation currentPage="settings" />
    </div>
  );
}
