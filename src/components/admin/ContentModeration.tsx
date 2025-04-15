
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { aiService } from '@/lib/ai-service';
import { AlertTriangle, Ban, Flag, MessageSquare, Image, Check, X, Sparkles, Loader2, Filter, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Sample reported content
const reportedPosts = [
  {
    id: 1,
    user: {
      name: "John Doe",
      image: "https://randomuser.me/api/portraits/men/1.jpg"
    },
    content: "This event was terrible! The worst experience ever. Don't waste your money on this scam!",
    reported_by: "Multiple users",
    reported_reason: "Abusive content",
    date: "2023-06-15T09:30:00Z",
    status: "pending"
  },
  {
    id: 2,
    user: {
      name: "Alice Smith",
      image: "https://randomuser.me/api/portraits/women/2.jpg"
    },
    content: "Check out this amazing deal on brand new phones! Click here to get 90% off: www.suspiciouslink.com",
    reported_by: "Jane Wilson",
    reported_reason: "Spam/Misleading",
    date: "2023-06-16T14:20:00Z",
    status: "pending"
  },
  {
    id: 3,
    user: {
      name: "Robert Brown",
      image: "https://randomuser.me/api/portraits/men/3.jpg"
    },
    content: "The organizers were very professional and the event was amazing!",
    reported_by: "Mark Johnson",
    reported_reason: "False report",
    date: "2023-06-17T11:45:00Z",
    status: "pending"
  }
];

// Sample images for review
const reportedImages = [
  {
    id: 1,
    url: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?q=80&w=2070",
    user: "Mike Wilson",
    date: "2023-06-15",
    status: "pending"
  },
  {
    id: 2,
    url: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070",
    user: "Emily Brown",
    date: "2023-06-16",
    status: "pending"
  }
];

const ContentModeration = () => {
  const [textToModerate, setTextToModerate] = useState("");
  const [moderationResult, setModerationResult] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [selectedPost, setSelectedPost] = useState<number | null>(null);
  
  const handleTextModeration = async () => {
    if (!textToModerate.trim()) {
      toast.error("Please enter text to moderate");
      return;
    }
    
    setIsChecking(true);
    try {
      const isAppropriate = await aiService.moderateContent(textToModerate);
      setModerationResult(isAppropriate);
      toast.success("Content analyzed successfully");
    } catch (error) {
      console.error("Error moderating content:", error);
      toast.error("Failed to analyze content");
      setModerationResult(null);
    } finally {
      setIsChecking(false);
    }
  };
  
  const handleApprove = (postId: number) => {
    // In a real implementation, this would update the post status in the database
    toast.success(`Post #${postId} approved`);
    setSelectedPost(null);
  };
  
  const handleReject = (postId: number) => {
    // In a real implementation, this would update the post status and possibly hide/delete it
    toast.success(`Post #${postId} removed`);
    setSelectedPost(null);
  };
  
  return (
    <Tabs defaultValue="reported" className="space-y-4">
      <div className="flex justify-between items-center">
        <TabsList>
          <TabsTrigger value="reported" className="flex items-center gap-1">
            <Flag className="h-4 w-4" />
            Reported
          </TabsTrigger>
          <TabsTrigger value="images" className="flex items-center gap-1">
            <Image className="h-4 w-4" />
            Images
          </TabsTrigger>
          <TabsTrigger value="ai-moderation" className="flex items-center gap-1">
            <Sparkles className="h-4 w-4" />
            AI Moderation
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-1">
            <Filter className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Search className="h-4 w-4" />
            Search
          </Button>
        </div>
      </div>
      
      <TabsContent value="reported" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Reported Content</CardTitle>
            <CardDescription>Review and moderate user-reported content</CardDescription>
          </CardHeader>
          <CardContent>
            {reportedPosts.map((post) => (
              <div 
                key={post.id} 
                className={`p-4 rounded-lg mb-4 border ${
                  selectedPost === post.id ? 'border-kenya-orange' : 'border-border'
                } ${selectedPost === post.id ? 'bg-kenya-orange/5' : 'bg-card'}`}
              >
                <div className="flex items-start gap-3">
                  <Avatar>
                    <AvatarImage src={post.user.image} alt={post.user.name} />
                    <AvatarFallback>{post.user.name[0]}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div>
                        <h4 className="font-semibold">{post.user.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(post.date).toLocaleString()}
                        </p>
                      </div>
                      <Badge
                        variant={
                          post.reported_reason === "Abusive content" 
                            ? "destructive" 
                            : post.reported_reason === "Spam/Misleading"
                              ? "outline"
                              : "secondary"
                        }
                      >
                        {post.reported_reason}
                      </Badge>
                    </div>
                    
                    <p className="my-2">{post.content}</p>
                    
                    <div className="text-sm text-muted-foreground">
                      Reported by: {post.reported_by}
                    </div>
                    
                    <div className="flex justify-end gap-2 mt-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={() => setSelectedPost(post.id)}
                      >
                        <MessageSquare className="h-4 w-4" />
                        Review
                      </Button>
                    </div>
                  </div>
                </div>
                
                {selectedPost === post.id && (
                  <div className="mt-4 p-3 bg-background rounded-lg border">
                    <h5 className="font-semibold mb-2">Moderation Actions</h5>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="default" 
                        className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                        onClick={() => handleApprove(post.id)}
                      >
                        <Check className="h-4 w-4" />
                        Approve Content
                      </Button>
                      
                      <Button 
                        variant="destructive" 
                        className="flex items-center gap-1"
                        onClick={() => handleReject(post.id)}
                      >
                        <Ban className="h-4 w-4" />
                        Remove Content
                      </Button>
                    </div>
                    
                    <div className="mt-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-muted-foreground"
                        onClick={() => aiService.moderateContent(post.content)
                          .then(result => {
                            toast.success(
                              result 
                                ? "AI analysis: Content appears appropriate" 
                                : "AI analysis: Content may violate guidelines"
                            );
                          })
                          .catch(error => {
                            console.error("Error analyzing content:", error);
                            toast.error("AI analysis failed");
                          })
                        }
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Run AI Analysis
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="images">
        <Card>
          <CardHeader>
            <CardTitle>Image Moderation</CardTitle>
            <CardDescription>Review reported or flagged images</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportedImages.map((image) => (
                <Card key={image.id}>
                  <div className="relative">
                    <img
                      src={image.url}
                      alt="Reported content"
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Reported
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">
                      Uploaded by: {image.user} on {image.date}
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Check className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button variant="destructive" size="sm" className="flex items-center gap-1">
                      <X className="h-4 w-4" />
                      Remove
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="ai-moderation">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-kenya-orange" />
              AI Content Moderation
            </CardTitle>
            <CardDescription>
              Use AI to automatically analyze and detect inappropriate content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="content-to-check">Content to Check</Label>
              <Textarea
                id="content-to-check"
                placeholder="Paste content to check for violations..."
                className="min-h-[150px]"
                value={textToModerate}
                onChange={(e) => setTextToModerate(e.target.value)}
              />
            </div>
            
            <Button 
              onClick={handleTextModeration}
              disabled={isChecking || !textToModerate.trim()}
              className="w-full flex items-center justify-center gap-2"
            >
              {isChecking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Check Content
                </>
              )}
            </Button>
            
            {moderationResult !== null && (
              <div className={`p-4 rounded-lg ${
                moderationResult ? 'bg-green-500/10 border border-green-500/30' : 'bg-destructive/10 border border-destructive/30'
              }`}>
                <div className="flex items-center gap-2">
                  {moderationResult ? (
                    <>
                      <Check className="h-5 w-5 text-green-500" />
                      <span className="font-medium">Content appears appropriate</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      <span className="font-medium">Content may violate community guidelines</span>
                    </>
                  )}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {moderationResult 
                    ? "The AI analysis suggests this content does not violate our community guidelines."
                    : "The AI analysis suggests this content may violate our community guidelines. Please review manually."
                  }
                </p>
              </div>
            )}
            
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">AI Moderation Features</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5" />
                  Automatically detect potentially inappropriate content
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5" />
                  Flag content for manual review
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5" />
                  Reduce moderation workload for your team
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5" />
                  Keep your community safe and positive
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="settings">
        <Card>
          <CardHeader>
            <CardTitle>Moderation Settings</CardTitle>
            <CardDescription>Configure content moderation rules and thresholds</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="auto-moderation">Automatic Moderation</Label>
              <div className="flex items-center justify-between bg-muted p-3 rounded-lg mt-1">
                <span className="text-sm">Use AI to automatically moderate content</span>
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                  Enabled
                </Badge>
              </div>
            </div>
            
            <div>
              <Label htmlFor="moderation-level">Moderation Strictness</Label>
              <Input id="moderation-level" type="range" min="1" max="5" defaultValue="3" className="mt-1" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Lenient</span>
                <span>Moderate</span>
                <span>Strict</span>
              </div>
            </div>
            
            <div>
              <Label htmlFor="keywords">Blocked Keywords</Label>
              <Textarea 
                id="keywords"
                placeholder="Enter keywords to block, one per line"
                className="min-h-[100px] mt-1"
                defaultValue="spam\nscam\nfree gift\nclick here"
              />
            </div>
            
            <Button className="w-full">Save Settings</Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default ContentModeration;
