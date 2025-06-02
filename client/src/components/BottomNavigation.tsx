import { Home, Package, ChefHat, Settings } from "lucide-react";
import { useLocation } from "wouter";

interface BottomNavigationProps {
  currentPage: "home" | "inventory" | "recipes" | "settings";
}

export default function BottomNavigation({ currentPage }: BottomNavigationProps) {
  const [, setLocation] = useLocation();

  const navItems = [
    { id: "home", label: "ホーム", icon: Home, path: "/" },
    { id: "inventory", label: "在庫一覧", icon: Package, path: "/inventory" },
    { id: "recipes", label: "レシピ", icon: ChefHat, path: "/recipes" },
    { id: "settings", label: "設定", icon: Settings, path: "/settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          const IconComponent = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => setLocation(item.path)}
              className={`flex flex-col items-center space-y-1 py-2 px-3 ${
                isActive ? "text-primary" : "text-gray-400"
              } transition-colors`}
            >
              <IconComponent className="w-5 h-5" />
              <span className={`text-xs ${isActive ? "font-medium" : ""}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
