import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Gift, Lightbulb, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ChatMessage {
  id: number;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'suggestion' | 'achievement' | 'tip';
}

interface QuickAction {
  label: string;
  action: string;
  icon: string;
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickActions: QuickAction[] = [
    { label: "レシピ提案", action: "suggest_recipe", icon: "🍳" },
    { label: "食材チェック", action: "check_expiry", icon: "📅" },
    { label: "節約のコツ", action: "saving_tips", icon: "💰" },
    { label: "栄養バランス", action: "nutrition_advice", icon: "🥗" }
  ];

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Welcome message when first opened
      addBotMessage("こんにちは！食材管理のお手伝いをします。何かお困りのことはありますか？", 'text');
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const addBotMessage = (content: string, type: 'text' | 'suggestion' | 'achievement' | 'tip' = 'text') => {
    const newMessage: ChatMessage = {
      id: Date.now(),
      content,
      sender: 'bot',
      timestamp: new Date(),
      type
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addUserMessage = (content: string) => {
    const newMessage: ChatMessage = {
      id: Date.now(),
      content,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    addUserMessage(userMessage);
    setInputValue("");
    setIsTyping(true);

    // Simulate bot thinking time
    setTimeout(() => {
      const response = generateBotResponse(userMessage);
      setIsTyping(false);
      addBotMessage(response.content, response.type);
    }, 1000 + Math.random() * 1000);
  };

  const handleQuickAction = (action: string) => {
    let response: { content: string; type: 'text' | 'suggestion' | 'achievement' | 'tip' } = { content: "", type: 'text' };
    
    switch (action) {
      case 'suggest_recipe':
        response = {
          content: "冷蔵庫にある食材を確認しました！国産豚ミンチを使った「豚そぼろ丼」はいかがですか？\n\n【材料】\n・国産豚ミンチ\n・醤油、みりん、砂糖\n・卵（あれば）\n\n【作り方】\n1. フライパンでミンチを炒める\n2. 調味料を加えて味付け\n3. ご飯にのせて完成！\n\n今日作ってみませんか？",
          type: 'suggestion'
        };
        break;
      case 'check_expiry':
        response = {
          content: "期限チェックを行いました！\n\n🟡 国産豚ミンチ：今日中に使用推奨\n\nすぐに調理するか、冷凍保存をおすすめします。冷凍すれば1ヶ月程度保存可能です。",
          type: 'tip'
        };
        break;
      case 'saving_tips':
        response = {
          content: "節約のコツをお教えします！\n\n💰 まとめ買いのポイント\n・特売日を狙う\n・冷凍できる食材を優先\n・計画的な献立作成\n\n💰 食材ロス防止\n・先入先出法の実践\n・残り物リメイクレシピ\n・適切な保存方法\n\n毎月3000円は節約できますよ！",
          type: 'tip'
        };
        break;
      case 'nutrition_advice':
        response = {
          content: "栄養バランスのアドバイスです！\n\n🥗 今日の推奨メニュー\n・タンパク質：豚肉（確保済み）\n・野菜：緑黄色野菜を追加\n・炭水化物：玄米がおすすめ\n\n📊 不足しがちな栄養素\n・食物繊維\n・ビタミンC\n・カルシウム\n\n野菜を増やすと完璧です！",
          type: 'suggestion'
        };
        break;
    }

    addBotMessage(response.content, response.type);
  };

  const generateBotResponse = (userMessage: string): { content: string; type: 'text' | 'suggestion' | 'achievement' | 'tip' } => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('レシピ') || message.includes('料理') || message.includes('作り方')) {
      return {
        content: "レシピのご質問ですね！冷蔵庫の食材を確認して、おすすめレシピを提案します。\n\n今ある「国産豚ミンチ」で作れる料理：\n• 豚そぼろ丼\n• 麻婆豆腐\n• ミートソースパスタ\n• 肉団子スープ\n\nどちらがお好みですか？",
        type: 'suggestion'
      };
    }
    
    if (message.includes('期限') || message.includes('賞味期限') || message.includes('消費期限')) {
      return {
        content: "期限管理についてですね！\n\n⚠️ 注意が必要な食材\n・国産豚ミンチ：今日中に使用推奨\n\n✅ 保存のコツ\n・肉類は購入日から2-3日以内\n・冷凍保存で期限延長可能\n・解凍は冷蔵庫でゆっくりと\n\n期限切れ前にお知らせします！",
        type: 'tip'
      };
    }
    
    if (message.includes('節約') || message.includes('安く') || message.includes('お得')) {
      return {
        content: "節約術をお教えします！\n\n💰 今すぐできる節約法\n・特売日のメモ機能活用\n・まとめ買いで単価を下げる\n・冷凍保存で食材ロス削減\n\n📈 今月の節約実績\n・食材ロス：-500円\n・計画購入：-800円\n\n合計1300円の節約です！",
        type: 'achievement'
      };
    }
    
    if (message.includes('栄養') || message.includes('健康') || message.includes('バランス')) {
      return {
        content: "栄養バランスについてアドバイスします！\n\n📊 現在の栄養状況\n・タンパク質：十分\n・野菜：やや不足\n・炭水化物：適量\n\n🥬 おすすめ野菜\n・ほうれん草（鉄分豊富）\n・ブロッコリー（ビタミンC）\n・人参（βカロテン）\n\n明日の買い物で追加しませんか？",
        type: 'suggestion'
      };
    }

    // Default response
    return {
      content: "ご質問ありがとうございます！食材管理について何でもお聞きください。\n\n• レシピの提案\n• 食材の保存方法\n• 節約のコツ\n• 栄養バランス\n\nどのようなことでお手伝いできますか？",
      type: 'text'
    };
  };

  const getMessageIcon = (type?: string) => {
    switch (type) {
      case 'suggestion': return <ChefHat className="w-4 h-4 text-blue-500" />;
      case 'achievement': return <Gift className="w-4 h-4 text-yellow-500" />;
      case 'tip': return <Lightbulb className="w-4 h-4 text-green-500" />;
      default: return null;
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-20 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 w-80 h-96 z-50">
      <Card className="h-full flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-primary text-white rounded-t-lg">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-sm">🤖</span>
            </div>
            <div>
              <h3 className="font-medium">食材アシスタント</h3>
              <p className="text-xs opacity-90">いつでもお手伝いします</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-white/20"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-lg p-3 ${
                  message.sender === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {message.sender === 'bot' && message.type && (
                  <div className="flex items-center space-x-1 mb-2">
                    {getMessageIcon(message.type)}
                    <Badge variant="secondary" className="text-xs">
                      {message.type === 'suggestion' && 'おすすめ'}
                      {message.type === 'achievement' && '実績'}
                      {message.type === 'tip' && 'ヒント'}
                    </Badge>
                  </div>
                )}
                <p className="text-sm whitespace-pre-line">{message.content}</p>
                <div className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2">
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction(action.action)}
                  className="text-xs h-8"
                >
                  <span className="mr-1">{action.icon}</span>
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="メッセージを入力..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="text-sm"
            />
            <Button onClick={handleSendMessage} size="sm">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}