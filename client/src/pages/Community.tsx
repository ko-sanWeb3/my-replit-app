import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Users, Star, Gift, Trophy, Heart, Send, Share2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BottomNavigation from "@/components/BottomNavigation";

interface CommunityPost {
  id: number;
  username: string;
  content: string;
  type: 'recipe' | 'tip' | 'question' | 'achievement';
  likes: number;
  replies: number;
  createdAt: string;
  tags?: string[];
}

interface UserAchievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  points: number;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

interface FeedbackItem {
  id: number;
  title: string;
  description: string;
  status: 'submitted' | 'in_review' | 'implemented' | 'rejected';
  votes: number;
  createdAt: string;
}

export default function Community() {
  const { toast } = useToast();
  const [newPostContent, setNewPostContent] = useState("");
  const [newFeedbackTitle, setNewFeedbackTitle] = useState("");
  const [newFeedbackDescription, setNewFeedbackDescription] = useState("");
  const [userPoints, setUserPoints] = useState(1250);
  const [userLevel, setUserLevel] = useState(5);

  // Mock data for demonstration
  const communityPosts: CommunityPost[] = [
    {
      id: 1,
      username: "料理上手さん",
      content: "冷蔵庫の残り野菜で作った炒め物が美味しくできました！人参、キャベツ、豚肉の組み合わせがおすすめです。",
      type: 'recipe',
      likes: 15,
      replies: 3,
      createdAt: "2時間前",
      tags: ["レシピ", "野菜活用"]
    },
    {
      id: 2,
      username: "節約マスター",
      content: "食材の期限切れを防ぐコツ：購入日をメモして、古いものから使う習慣をつけています。",
      type: 'tip',
      likes: 8,
      replies: 1,
      createdAt: "5時間前",
      tags: ["節約", "食材管理"]
    },
    {
      id: 3,
      username: "初心者さん",
      content: "野菜室の温度設定について教えてください。どのくらいが適温でしょうか？",
      type: 'question',
      likes: 2,
      replies: 5,
      createdAt: "1日前",
      tags: ["質問", "野菜保存"]
    }
  ];

  const achievements: UserAchievement[] = [
    {
      id: 1,
      title: "エコ料理人",
      description: "食材ロスを30日間ゼロにする",
      icon: "🌱",
      points: 500,
      unlocked: true
    },
    {
      id: 2,
      title: "レシピマスター",
      description: "20種類のレシピを投稿する",
      icon: "👨‍🍳",
      points: 300,
      unlocked: false,
      progress: 12,
      maxProgress: 20
    },
    {
      id: 3,
      title: "コミュニティヘルパー",
      description: "他のユーザーの質問に10回回答する",
      icon: "🤝",
      points: 200,
      unlocked: false,
      progress: 7,
      maxProgress: 10
    },
    {
      id: 4,
      title: "継続の達人",
      description: "アプリを100日連続使用する",
      icon: "🔥",
      points: 1000,
      unlocked: false,
      progress: 45,
      maxProgress: 100
    }
  ];

  const feedbackItems: FeedbackItem[] = [
    {
      id: 1,
      title: "音声入力機能",
      description: "料理中に手が汚れていても音声で食材を追加できる機能",
      status: 'in_review',
      votes: 23,
      createdAt: "3日前"
    },
    {
      id: 2,
      title: "栄養素の詳細表示",
      description: "各食材の詳細な栄養成分を表示する機能",
      status: 'implemented',
      votes: 18,
      createdAt: "1週間前"
    },
    {
      id: 3,
      title: "買い物リストの共有",
      description: "家族間で買い物リストを共有できる機能",
      status: 'submitted',
      votes: 31,
      createdAt: "2日前"
    }
  ];

  const submitPost = useMutation({
    mutationFn: async (content: string) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "投稿完了",
        description: "コミュニティに投稿しました！",
      });
      setNewPostContent("");
      setUserPoints(prev => prev + 10);
    }
  });

  const submitFeedback = useMutation({
    mutationFn: async (feedback: { title: string; description: string }) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "フィードバック送信完了",
        description: "ご意見をありがとうございます！",
      });
      setNewFeedbackTitle("");
      setNewFeedbackDescription("");
      setUserPoints(prev => prev + 25);
    }
  });

  const handleJoinLINEGroup = () => {
    toast({
      title: "LINEグループに参加",
      description: "LINEアプリが開きます...",
    });
    // In real implementation, would open LINE group invite link
  };

  const handleShareApp = () => {
    if (navigator.share) {
      navigator.share({
        title: 'スマート冷蔵庫アプリ',
        text: '食材管理がとても便利になるアプリです！',
        url: window.location.origin,
      });
    } else {
      navigator.clipboard.writeText(window.location.origin);
      toast({
        title: "リンクをコピーしました",
        description: "友達にシェアしてください！",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'implemented': return 'bg-green-100 text-green-800';
      case 'in_review': return 'bg-yellow-100 text-yellow-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'implemented': return '実装済み';
      case 'in_review': return '検討中';
      case 'submitted': return '提案済み';
      case 'rejected': return '見送り';
      default: return '不明';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">コミュニティ</h1>
          <div className="flex items-center space-x-2">
            <div className="text-sm">
              <span className="text-gray-600">Lv.{userLevel}</span>
              <span className="ml-2 text-primary font-semibold">{userPoints}pt</span>
            </div>
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
              <Trophy className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 pb-20">
        <Tabs defaultValue="community" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="community">コミュニティ</TabsTrigger>
            <TabsTrigger value="achievements">実績</TabsTrigger>
            <TabsTrigger value="feedback">改善提案</TabsTrigger>
          </TabsList>

          <TabsContent value="community" className="space-y-4">
            {/* Join Community Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>コミュニティに参加</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  他のユーザーと情報交換して、もっと食材管理を楽しみましょう！
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" onClick={handleJoinLINEGroup} className="flex items-center space-x-2">
                    <MessageCircle className="w-4 h-4" />
                    <span>LINEグループ</span>
                  </Button>
                  <Button variant="outline" onClick={handleShareApp} className="flex items-center space-x-2">
                    <Share2 className="w-4 h-4" />
                    <span>アプリをシェア</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Post Creation */}
            <Card>
              <CardHeader>
                <CardTitle>投稿する</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="レシピ、コツ、質問など何でもシェアしてください..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                />
                <Button 
                  onClick={() => submitPost.mutate(newPostContent)}
                  disabled={!newPostContent.trim() || submitPost.isPending}
                  className="w-full"
                >
                  <Send className="w-4 h-4 mr-2" />
                  投稿する (+10pt)
                </Button>
              </CardContent>
            </Card>

            {/* Community Posts */}
            <div className="space-y-4">
              {communityPosts.map((post) => (
                <Card key={post.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {post.username.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium text-sm">{post.username}</span>
                          <span className="text-xs text-gray-500">{post.createdAt}</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">{post.content}</p>
                        
                        {post.tags && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {post.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <button className="flex items-center space-x-1 hover:text-red-500">
                            <Heart className="w-4 h-4" />
                            <span>{post.likes}</span>
                          </button>
                          <button className="flex items-center space-x-1 hover:text-blue-500">
                            <MessageCircle className="w-4 h-4" />
                            <span>{post.replies}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            {/* User Progress */}
            <Card>
              <CardHeader>
                <CardTitle>あなたの進捗</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-primary">{userPoints}</div>
                  <div className="text-sm text-gray-600">合計ポイント</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full"
                      style={{ width: `${((userPoints % 500) / 500) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500">
                    次のレベルまで {500 - (userPoints % 500)}pt
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Achievements List */}
            <div className="space-y-4">
              {achievements.map((achievement) => (
                <Card key={achievement.id} className={achievement.unlocked ? 'bg-green-50 border-green-200' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium">{achievement.title}</h3>
                          <Badge variant={achievement.unlocked ? 'default' : 'secondary'}>
                            {achievement.points}pt
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                        
                        {!achievement.unlocked && achievement.progress !== undefined && (
                          <div>
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>進捗</span>
                              <span>{achievement.progress}/{achievement.maxProgress}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-primary h-1.5 rounded-full"
                                style={{ width: `${(achievement.progress! / achievement.maxProgress!) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                        
                        {achievement.unlocked && (
                          <div className="text-xs text-green-600 font-medium">
                            ✓ 達成済み
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-4">
            {/* Feedback Submission */}
            <Card>
              <CardHeader>
                <CardTitle>新しい機能を提案</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="機能のタイトル"
                  value={newFeedbackTitle}
                  onChange={(e) => setNewFeedbackTitle(e.target.value)}
                />
                <Textarea
                  placeholder="詳しい説明や理由を教えてください..."
                  value={newFeedbackDescription}
                  onChange={(e) => setNewFeedbackDescription(e.target.value)}
                />
                <Button 
                  onClick={() => submitFeedback.mutate({ 
                    title: newFeedbackTitle, 
                    description: newFeedbackDescription 
                  })}
                  disabled={!newFeedbackTitle.trim() || !newFeedbackDescription.trim() || submitFeedback.isPending}
                  className="w-full"
                >
                  <Send className="w-4 h-4 mr-2" />
                  提案する (+25pt)
                </Button>
              </CardContent>
            </Card>

            {/* Feedback List */}
            <div className="space-y-4">
              {feedbackItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium">{item.title}</h3>
                      <Badge className={getStatusColor(item.status)}>
                        {getStatusText(item.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <Star className="w-4 h-4" />
                        <span>{item.votes} 票</span>
                      </div>
                      <span>{item.createdAt}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <BottomNavigation currentPage="community" />
    </div>
  );
}