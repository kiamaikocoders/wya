import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Clock, 
  Users, 
  Heart, 
  MessageCircle, 
  Camera,
  Lightbulb,
  Star,
  Calendar,
  MapPin,
  Tag,
  Share,
  Eye,
  Zap
} from 'lucide-react';
import ThrowbackContent from './ThrowbackContent';
import CommunityPosts from './CommunityPosts';
import TrendingContent from './TrendingContent';
import { engagementService } from '@/lib/engagement-service';
import { toast } from 'sonner';

interface EngagementDashboardProps {
  eventId?: number;
}

const EngagementDashboard: React.FC<EngagementDashboardProps> = ({ eventId }) => {
  const [activeTab, setActiveTab] = useState('trending');
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0,
    activeUsers: 0,
    trendingCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEngagementStats();
  }, []);

  const loadEngagementStats = async () => {
    try {
      setIsLoading(true);
      
      // Load various content types to get stats
      const [trending, whatWentDown, creators, tips] = await Promise.all([
        engagementService.getTrendingContent('all', 50),
        engagementService.getWhatWentDownContent(24),
        engagementService.getFeaturedCreators(),
        engagementService.getLocalTips(undefined, 20)
      ]);

      // Calculate stats
      const totalPosts = trending.length + tips.length;
      const totalLikes = trending.reduce((sum, item) => sum + (item.engagement_score || 0), 0);
      const totalComments = trending.filter(item => item.content_type === 'community_post').length;
      const activeUsers = new Set(trending.map(item => item.username)).size;
      const trendingCount = trending.length;

      setStats({
        totalPosts,
        totalLikes,
        totalComments,
        activeUsers,
        trendingCount
      });
    } catch (error) {
      console.error('Error loading engagement stats:', error);
      toast.error('Failed to load engagement statistics');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContentClick = (content: any) => {
    // Handle content click - could open a modal or navigate to detail page
    console.log('Content clicked:', content);
    toast.info(`Opening ${content.content_type} content`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kenya-brown mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading engagement dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="h-8 w-8 text-kenya-brown" />
            Engagement Hub
          </h1>
          <p className="text-gray-600 mt-1">
            Keep the community buzzing with engaging content
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Star className="h-4 w-4" />
          Live Activity
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-kenya-brown/10 to-kenya-dark/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="h-4 w-4 text-kenya-brown" />
              <span className="text-sm text-gray-600">Posts</span>
            </div>
            <div className="text-2xl font-bold">{stats.totalPosts}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-kenya-brown/10 to-kenya-dark/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="h-4 w-4 text-kenya-brown" />
              <span className="text-sm text-gray-600">Likes</span>
            </div>
            <div className="text-2xl font-bold">{stats.totalLikes}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-kenya-brown/10 to-kenya-dark/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-kenya-brown" />
              <span className="text-sm text-gray-600">Active Users</span>
            </div>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-kenya-brown/10 to-kenya-dark/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-kenya-brown" />
              <span className="text-sm text-gray-600">Trending</span>
            </div>
            <div className="text-2xl font-bold">{stats.trendingCount}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-kenya-brown/10 to-kenya-dark/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-4 w-4 text-kenya-brown" />
              <span className="text-sm text-gray-600">Views</span>
            </div>
            <div className="text-2xl font-bold">{stats.totalLikes * 3}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2"
              onClick={() => setActiveTab('community')}
            >
              <MessageCircle className="h-6 w-6" />
              <span className="text-sm">Create Post</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2"
              onClick={() => setActiveTab('throwback')}
            >
              <Clock className="h-6 w-6" />
              <span className="text-sm">Share Throwback</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2"
              onClick={() => setActiveTab('tips')}
            >
              <Lightbulb className="h-6 w-6" />
              <span className="text-sm">Local Tip</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2"
              onClick={() => setActiveTab('trending')}
            >
              <TrendingUp className="h-6 w-6" />
              <span className="text-sm">View Trending</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="community">Community</TabsTrigger>
          <TabsTrigger value="throwback">Throwbacks</TabsTrigger>
          <TabsTrigger value="tips">Local Tips</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="trending" className="space-y-4">
          <TrendingContent onContentClick={handleContentClick} />
        </TabsContent>

        <TabsContent value="community" className="space-y-4">
          <CommunityPosts onPostCreated={loadEngagementStats} />
        </TabsContent>

        <TabsContent value="throwback" className="space-y-4">
          <ThrowbackContent eventId={eventId} onSuccess={loadEngagementStats} />
        </TabsContent>

        <TabsContent value="tips" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Local Tips & Culture
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* This would be populated with actual local tips */}
                <Card className="bg-gradient-to-br from-kenya-brown/5 to-kenya-dark/5">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-kenya-brown" />
                      <Badge variant="secondary" className="text-xs">Bar</Badge>
                    </div>
                    <h3 className="font-semibold mb-2">Best Rooftop Bar in Town</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Amazing views and great cocktails. Perfect for sunset drinks!
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>@local_explorer</span>
                      <span>2h ago</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-kenya-brown/5 to-kenya-dark/5">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Music className="h-4 w-4 text-kenya-brown" />
                      <Badge variant="secondary" className="text-xs">Music</Badge>
                    </div>
                    <h3 className="font-semibold mb-2">Underground Music Scene</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Check out the local jazz clubs for authentic vibes.
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>@music_lover</span>
                      <span>4h ago</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-kenya-brown/5 to-kenya-dark/5">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-kenya-brown" />
                      <Badge variant="secondary" className="text-xs">Event</Badge>
                    </div>
                    <h3 className="font-semibold mb-2">Weekend Market Finds</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Best local crafts and street food every Saturday morning.
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>@market_goer</span>
                      <span>1d ago</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Engagement Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-semibold">Content Performance</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Stories</span>
                      <span className="text-sm font-semibold">45%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Community Posts</span>
                      <span className="text-sm font-semibold">30%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Local Tips</span>
                      <span className="text-sm font-semibold">25%</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold">User Engagement</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Daily Active Users</span>
                      <span className="text-sm font-semibold">1,234</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Avg. Session Time</span>
                      <span className="text-sm font-semibold">8.5 min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Content Shares</span>
                      <span className="text-sm font-semibold">567</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EngagementDashboard;

