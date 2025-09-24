import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Heart, 
  MessageCircle, 
  Eye, 
  Clock,
  Star,
  Users,
  Camera,
  Music,
  Lightbulb
} from 'lucide-react';
import { engagementService } from '@/lib/engagement-service';
import { toast } from 'sonner';

interface TrendingContentProps {
  onContentClick?: (content: any) => void;
}

const TrendingContent: React.FC<TrendingContentProps> = ({ onContentClick }) => {
  const [trendingContent, setTrendingContent] = useState<any[]>([]);
  const [whatWentDown, setWhatWentDown] = useState<any[]>([]);
  const [featuredCreators, setFeaturedCreators] = useState<any[]>([]);
  const [localTips, setLocalTips] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('trending');

  useEffect(() => {
    loadAllContent();
  }, []);

  const loadAllContent = async () => {
    try {
      setIsLoading(true);
      
      // Load trending content
      const trending = await engagementService.getTrendingContent('all', 20);
      setTrendingContent(trending);

      // Load "What Went Down" content
      const whatWentDownData = await engagementService.getWhatWentDownContent(24);
      setWhatWentDown(whatWentDownData);

      // Load featured creators
      const creators = await engagementService.getFeaturedCreators();
      setFeaturedCreators(creators);

      // Load local tips
      const tips = await engagementService.getLocalTips(undefined, 10);
      setLocalTips(tips);
    } catch (error) {
      console.error('Error loading content:', error);
      toast.error('Failed to load content');
    } finally {
      setIsLoading(false);
    }
  };

  const getContentIcon = (contentType: string) => {
    switch (contentType) {
      case 'story':
        return Camera;
      case 'community_post':
        return MessageCircle;
      case 'local_tip':
        return Lightbulb;
      default:
        return TrendingUp;
    }
  };

  const formatEngagementScore = (score: number) => {
    if (score >= 1000) {
      return `${(score / 1000).toFixed(1)}k`;
    }
    return score.toString();
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kenya-brown mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading trending content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
          What's Hot
        </h2>
        <Badge variant="outline" className="flex items-center gap-1">
          <Star className="h-4 w-4" />
          Live Updates
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="what-went-down">What Went Down</TabsTrigger>
          <TabsTrigger value="creators">Featured</TabsTrigger>
          <TabsTrigger value="tips">Local Tips</TabsTrigger>
        </TabsList>

        <TabsContent value="trending" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {trendingContent.map((content, index) => {
              const Icon = getContentIcon(content.content_type);
              return (
                <Card 
                  key={content.content_id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => onContentClick?.(content)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-kenya-brown" />
                        <Badge variant="secondary" className="text-xs">
                          #{index + 1}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <TrendingUp className="h-3 w-3" />
                        {formatEngagementScore(content.engagement_score)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {content.media_url && (
                      <div className="mb-3">
                        {content.media_type === 'video' ? (
                          <video
                            src={content.media_url}
                            className="w-full h-32 object-cover rounded-md"
                          />
                        ) : (
                          <img
                            src={content.media_url}
                            alt="Content media"
                            className="w-full h-32 object-cover rounded-md"
                          />
                        )}
                      </div>
                    )}
                    <h3 className="font-semibold text-sm mb-2 line-clamp-2">
                      {content.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>@{content.username}</span>
                      <span>{getTimeAgo(content.created_at)}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="what-went-down" className="space-y-4">
          <div className="space-y-4">
            {whatWentDown.map((event) => (
              <Card key={event.event_id} className="bg-gradient-to-r from-kenya-brown/5 to-kenya-dark/5">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-kenya-brown" />
                    <span className="text-sm text-gray-500">
                      {new Date(event.event_date).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold">{event.event_title}</h3>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-kenya-brown">
                        {event.stories_count}
                      </div>
                      <div className="text-sm text-gray-500">Stories</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-kenya-brown">
                        {event.total_likes}
                      </div>
                      <div className="text-sm text-gray-500">Likes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-kenya-brown">
                        {event.top_stories?.length || 0}
                      </div>
                      <div className="text-sm text-gray-500">Highlights</div>
                    </div>
                  </div>
                  
                  {event.top_stories && event.top_stories.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Top Moments:</h4>
                      {event.top_stories.slice(0, 3).map((story: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-white/50 rounded-md">
                          <div className="w-8 h-8 bg-kenya-brown rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-semibold">
                              {story.username?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium line-clamp-1">
                              {story.content}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>@{story.username}</span>
                              <span>•</span>
                              <span>{story.likes_count} likes</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="creators" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featuredCreators.map((creator) => (
              <Card key={creator.creator_id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-kenya-brown rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {creator.username?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold">{creator.title}</h3>
                      <p className="text-sm text-gray-500">@{creator.username}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {creator.description && (
                    <p className="text-sm text-gray-700 mb-3">{creator.description}</p>
                  )}
                  {creator.media_url && (
                    <div className="mb-3">
                      <img
                        src={creator.media_url}
                        alt="Creator media"
                        className="w-full h-32 object-cover rounded-md"
                      />
                    </div>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {creator.feature_type}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tips" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {localTips.map((tip) => (
              <Card key={tip.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="h-4 w-4 text-kenya-brown" />
                    <Badge variant="secondary" className="text-xs">
                      {tip.tip_type}
                    </Badge>
                  </div>
                  <h3 className="font-semibold">{tip.title}</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                    {tip.content}
                  </p>
                  
                  {tip.media_url && (
                    <div className="mb-3">
                      {tip.media_type === 'video' ? (
                        <video
                          src={tip.media_url}
                          className="w-full h-32 object-cover rounded-md"
                        />
                      ) : (
                        <img
                          src={tip.media_url}
                          alt="Tip media"
                          className="w-full h-32 object-cover rounded-md"
                        />
                      )}
                    </div>
                  )}

                  {tip.location && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                      <span>📍 {tip.location}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>@{tip.user?.username || 'Anonymous'}</span>
                      <span>•</span>
                      <span>{getTimeAgo(tip.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Heart className="h-3 w-3" />
                      {tip.likes_count}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrendingContent;

