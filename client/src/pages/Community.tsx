import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Users, Star, Gift, Trophy, Heart, Send, Share2, ExternalLink, Award, Target, TrendingUp, ThumbsUp, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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
  const [userLevel, setUserLevel] = useState(12);

  // Fetch community posts from database
  const { data: postsData = [], refetch: refetchPosts } = useQuery({
    queryKey: ["/api/community/posts"],
  });

  // Fetch feedback items from database
  const { data: feedbackData = [], refetch: refetchFeedback } = useQuery({
    queryKey: ["/api/feedback"],
  });

  // Static achievement data
  const achievements: UserAchievement[] = [
    {
      id: 1,
      title: "食材マスター",
      description: "50種類の食材を登録する",
      icon: "🥬",
      points: 500,
      unlocked: true,
      progress: 50,
      maxProgress: 50
    },
    {
      id: 2,
      title: "料理上手",
      description: "20個のレシピを作成する",
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

  const submitPost = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("POST", "/api/community/posts", { 
        content,
        type: "tip",
        username: "匿名ユーザー"
      });
    },
    onSuccess: () => {
      toast({
        title: "投稿完了",
        description: "コミュニティに投稿しました！",
      });
      setNewPostContent("");
      setUserPoints(prev => prev + 10);
      refetchPosts();
    }
  });

  const submitFeedback = useMutation({
    mutationFn: async (feedback: { title: string; description: string }) => {
      return await apiRequest("POST", "/api/feedback", feedback);
    },
    onSuccess: () => {
      toast({
        title: "フィードバック送信完了",
        description: "ご意見をありがとうございます！",
      });
      setNewFeedbackTitle("");
      setNewFeedbackDescription("");
      setUserPoints(prev => prev + 25);
      refetchFeedback();
    }
  });

  const handleJoinLINEGroup = () => {
    toast({
      title: "LINEグループに参加",
      description: "LINEアプリが開きます...",
    });
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

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'recipe': return '👨‍🍳';
      case 'tip': return '💡';
      case 'question': return '❓';
      case 'achievement': return '🏆';
      default: return '💬';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "たった今";
    if (diffInHours < 24) return `${diffInHours}時間前`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}日前`;
    return date.toLocaleDateString('ja-JP');
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
                  {submitPost.isPending ? "投稿中..." : "投稿する"}
                </Button>
              </CardContent>
            </Card>

            {/* Community Posts */}
            <div className="space-y-4">
              {(postsData as any[]).map((post: any) => (
                <Card key={post.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {post.username?.[0] || "匿"}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-sm">{post.username}</span>
                          <span className="text-xs">{getPostTypeIcon(post.type)}</span>
                          <span className="text-xs text-gray-500">{formatDate(post.createdAt)}</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">{post.content}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <button className="flex items-center space-x-1 hover:text-red-500">
                            <ThumbsUp className="w-3 h-3" />
                            <span>{post.likes}</span>
                          </button>
                          <button className="flex items-center space-x-1 hover:text-blue-500">
                            <MessageSquare className="w-3 h-3" />
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
            <div className="grid gap-4">
              {achievements.map((achievement) => (
                <Card key={achievement.id} className={achievement.unlocked ? "border-green-200 bg-green-50" : ""}>
                  <CardContent className="pt-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-sm">{achievement.title}</h3>
                          <Badge variant={achievement.unlocked ? "default" : "secondary"}>
                            {achievement.points}pt
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{achievement.description}</p>
                        {!achievement.unlocked && achievement.progress !== undefined && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>進捗</span>
                              <span>{achievement.progress}/{achievement.maxProgress}</span>
                            </div>
                            <Progress 
                              value={(achievement.progress / (achievement.maxProgress || 1)) * 100} 
                              className="h-2"
                            />
                          </div>
                        )}
                        {achievement.unlocked && (
                          <Badge variant="default" className="text-xs">
                            <Award className="w-3 h-3 mr-1" />
                            達成済み
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-4">
            {/* Feedback Form */}
            <Card>
              <CardHeader>
                <CardTitle>改善提案</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="提案のタイトル"
                  value={newFeedbackTitle}
                  onChange={(e) => setNewFeedbackTitle(e.target.value)}
                />
                <Textarea
                  placeholder="詳細な説明をお聞かせください..."
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
                  {submitFeedback.isPending ? "送信中..." : "フィードバックを送信"}
                </Button>
              </CardContent>
            </Card>

            {/* Feedback Items */}
            <div className="space-y-4">
              {(feedbackData as any[]).map((item: any) => (
                <Card key={item.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-sm">{item.title}</h3>
                      <Badge className={getStatusColor(item.status)}>
                        {getStatusText(item.status)}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-3">{item.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{formatDate(item.createdAt)}</span>
                      <div className="flex items-center space-x-1">
                        <Heart className="w-3 h-3" />
                        <span>{item.votes}</span>
                      </div>
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