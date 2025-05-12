
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star, MessageSquare, ThumbsUp, Flag, Loader2, Filter, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import AIReviewAnalysis from '@/components/events/AIReviewAnalysis';
import { format } from 'date-fns';

export interface Review {
  id: number;
  user_id: string; // Changed from number to string
  event_id: number;
  rating: number;
  content: string;
  created_at: string;
  user_name: string;
  user_avatar?: string;
  helpful_count: number;
  is_verified_attendee: boolean;
  photos?: string[];
  categories?: {
    service?: number;
    venue?: number;
    value?: number;
    atmosphere?: number;
  };
  sentiment?: 'positive' | 'negative' | 'neutral';
}

interface CategoryRating {
  service: number;
  venue: number;
  value: number;
  atmosphere: number;
}

interface ReviewSystemProps {
  eventId: number;
  initialReviews?: Review[];
  onAddReview?: (review: Omit<Review, 'id' | 'user_name' | 'created_at' | 'helpful_count'>) => Promise<void>;
}

const ReviewSystem: React.FC<ReviewSystemProps> = ({ 
  eventId, 
  initialReviews = [],
  onAddReview 
}) => {
  const { user, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [newReview, setNewReview] = useState('');
  const [overallRating, setOverallRating] = useState(0);
  const [categoryRatings, setCategoryRatings] = useState<CategoryRating>({
    service: 0,
    venue: 0,
    value: 0,
    atmosphere: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewPhotos, setReviewPhotos] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('read');
  const [sortBy, setSortBy] = useState('recent');
  const [filterBy, setFilterBy] = useState('all');

  useEffect(() => {
    if (initialReviews.length > 0) {
      setReviews(initialReviews);
    } else {
      const demoReviews: Review[] = [
        {
          id: 1,
          user_id: 101,
          event_id: eventId,
          rating: 5,
          content: "Absolutely amazing event! The atmosphere was electric and everything was well organized. Would definitely attend again next year.",
          created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          user_name: "Jane Doe",
          user_avatar: "https://i.pravatar.cc/150?img=1",
          helpful_count: 7,
          is_verified_attendee: true,
          categories: {
            service: 5,
            venue: 5,
            value: 4,
            atmosphere: 5
          },
          sentiment: 'positive'
        },
        {
          id: 2,
          user_id: 102,
          event_id: eventId,
          rating: 3,
          content: "The event was okay. Good music but the venue was a bit crowded and hot. The food stands were overpriced for what they were offering.",
          created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
          user_name: "John Smith",
          user_avatar: "https://i.pravatar.cc/150?img=2",
          helpful_count: 3,
          is_verified_attendee: true,
          categories: {
            service: 3,
            venue: 2,
            value: 2,
            atmosphere: 4
          },
          sentiment: 'neutral'
        },
        {
          id: 3,
          user_id: 103,
          event_id: eventId,
          rating: 4,
          content: "Really enjoyed it! The performers were excellent and the staff were very helpful. Just wish there were more restrooms available.",
          created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
          user_name: "Mike Johnson",
          user_avatar: "https://i.pravatar.cc/150?img=3",
          helpful_count: 5,
          is_verified_attendee: false,
          categories: {
            service: 4,
            venue: 3,
            value: 4,
            atmosphere: 5
          },
          sentiment: 'positive'
        }
      ];
      
      setReviews(demoReviews);
    }
  }, [eventId, initialReviews]);

  const handleStarClick = (rating: number) => {
    setOverallRating(rating);
  };
  
  const handleCategoryRatingChange = (category: keyof CategoryRating, value: number) => {
    setCategoryRatings(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to leave a review');
      return;
    }
    
    if (overallRating === 0) {
      toast.error('Please provide a rating');
      return;
    }
    
    if (!newReview.trim()) {
      toast.error('Please write a review');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const reviewData = {
        user_id: user?.id || '', // Use string for user_id
        event_id: eventId,
        rating: overallRating,
        content: newReview,
        photos: reviewPhotos,
        categories: categoryRatings,
        is_verified_attendee: true
      };
      
      if (onAddReview) {
        await onAddReview(reviewData);
      }
      
      const newReviewObj: Review = {
        ...reviewData,
        id: reviews.length + 1,
        created_at: new Date().toISOString(),
        user_name: user?.name || 'Anonymous',
        user_avatar: user?.profile_picture,
        helpful_count: 0,
        sentiment: overallRating >= 4 ? 'positive' : overallRating >= 3 ? 'neutral' : 'negative'
      };
      
      setReviews([newReviewObj, ...reviews]);
      setNewReview('');
      setOverallRating(0);
      setCategoryRatings({
        service: 0,
        venue: 0,
        value: 0,
        atmosphere: 0
      });
      setReviewPhotos([]);
      
      toast.success('Review submitted successfully!');
      setActiveTab('read');
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkHelpful = (reviewId: number) => {
    if (!isAuthenticated) {
      toast.error('Please login to mark reviews as helpful');
      return;
    }
    
    setReviews(reviews.map(review => 
      review.id === reviewId 
        ? { ...review, helpful_count: review.helpful_count + 1 } 
        : review
    ));
    
    toast.success('Review marked as helpful');
  };

  const handleReportReview = (reviewId: number) => {
    if (!isAuthenticated) {
      toast.error('Please login to report reviews');
      return;
    }
    
    toast.success('Review reported. Our team will review it shortly.');
  };

  const handleAddPhoto = () => {
    const url = prompt('Enter photo URL:');
    if (url && url.trim()) {
      setReviewPhotos([...reviewPhotos, url.trim()]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setReviewPhotos(reviewPhotos.filter((_, i) => i !== index));
  };

  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviews.length;
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    
    reviews.forEach(review => {
      distribution[review.rating as keyof typeof distribution]++;
    });
    
    return distribution;
  };

  const getCategoryAverages = () => {
    if (reviews.length === 0) return { service: 0, venue: 0, value: 0, atmosphere: 0 };
    
    const totals = { service: 0, venue: 0, value: 0, atmosphere: 0 };
    let count = 0;
    
    reviews.forEach(review => {
      if (review.categories) {
        if (review.categories.service) totals.service += review.categories.service;
        if (review.categories.venue) totals.venue += review.categories.venue;
        if (review.categories.value) totals.value += review.categories.value;
        if (review.categories.atmosphere) totals.atmosphere += review.categories.atmosphere;
        count++;
      }
    });
    
    return {
      service: count ? totals.service / count : 0,
      venue: count ? totals.venue / count : 0,
      value: count ? totals.value / count : 0,
      atmosphere: count ? totals.atmosphere / count : 0
    };
  };

  const getSortedAndFilteredReviews = () => {
    let filtered = [...reviews];
    
    if (filterBy === 'verified') {
      filtered = filtered.filter(review => review.is_verified_attendee);
    } else if (filterBy === 'positive') {
      filtered = filtered.filter(review => review.rating >= 4);
    } else if (filterBy === 'critical') {
      filtered = filtered.filter(review => review.rating <= 2);
    } else if (filterBy === 'with-photos') {
      filtered = filtered.filter(review => review.photos && review.photos.length > 0);
    }
    
    return filtered.sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === 'highest') {
        return b.rating - a.rating;
      } else if (sortBy === 'lowest') {
        return a.rating - b.rating;
      } else if (sortBy === 'helpful') {
        return b.helpful_count - a.helpful_count;
      }
      return 0;
    });
  };

  const sortedAndFilteredReviews = getSortedAndFilteredReviews();
  const averageRating = getAverageRating();
  const ratingDistribution = getRatingDistribution();
  const categoryAverages = getCategoryAverages();

  return (
    <Card className="bg-kenya-brown-dark/20">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-kenya-orange" />
          Event Reviews {reviews.length > 0 && `(${reviews.length})`}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="read" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="read">Read Reviews</TabsTrigger>
            <TabsTrigger value="write">Write a Review</TabsTrigger>
          </TabsList>
          
          <TabsContent value="read" className="space-y-6">
            {reviews.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-kenya-brown/10 p-4 rounded-lg">
                  <div className="flex flex-col items-center justify-center">
                    <div className="text-4xl font-bold text-white">{averageRating.toFixed(1)}</div>
                    <div className="flex items-center mt-2">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${i <= Math.round(averageRating) ? 'text-kenya-orange fill-kenya-orange' : 'text-gray-500'}`}
                        />
                      ))}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Based on {reviews.length} reviews
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {Object.entries(ratingDistribution).reverse().map(([rating, count]) => (
                      <div key={rating} className="flex items-center gap-2">
                        <div className="w-8 text-right">{rating}★</div>
                        <div className="w-full bg-gray-700 rounded-full h-2.5">
                          <div 
                            className="bg-kenya-orange h-2.5 rounded-full" 
                            style={{ width: `${reviews.length ? (count / reviews.length) * 100 : 0}%` }}
                          ></div>
                        </div>
                        <div className="w-8">{count}</div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Service:</span>
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i <= Math.round(categoryAverages.service) ? 'text-kenya-orange fill-kenya-orange' : 'text-gray-500'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Venue:</span>
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i <= Math.round(categoryAverages.venue) ? 'text-kenya-orange fill-kenya-orange' : 'text-gray-500'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Value:</span>
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i <= Math.round(categoryAverages.value) ? 'text-kenya-orange fill-kenya-orange' : 'text-gray-500'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Atmosphere:</span>
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i <= Math.round(categoryAverages.atmosphere) ? 'text-kenya-orange fill-kenya-orange' : 'text-gray-500'}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <Select value={filterBy} onValueChange={setFilterBy}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter reviews" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Reviews</SelectItem>
                        <SelectItem value="verified">Verified Attendees</SelectItem>
                        <SelectItem value="positive">Positive (4-5★)</SelectItem>
                        <SelectItem value="critical">Critical (1-2★)</SelectItem>
                        <SelectItem value="with-photos">With Photos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4" />
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sort reviews" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recent">Most Recent</SelectItem>
                        <SelectItem value="highest">Highest Rated</SelectItem>
                        <SelectItem value="lowest">Lowest Rated</SelectItem>
                        <SelectItem value="helpful">Most Helpful</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-4 mt-4">
                  {sortedAndFilteredReviews.map(review => (
                    <Card key={review.id} className="bg-kenya-brown/5 border-kenya-brown/20">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <Avatar>
                            <AvatarImage src={review.user_avatar} />
                            <AvatarFallback>{review.user_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">{review.user_name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {format(new Date(review.created_at), 'MMM d, yyyy')}
                                </div>
                              </div>
                              <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map(i => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${i <= review.rating ? 'text-kenya-orange fill-kenya-orange' : 'text-gray-500'}`}
                                  />
                                ))}
                              </div>
                            </div>
                            
                            {review.is_verified_attendee && (
                              <Badge variant="outline" className="mt-1 text-green-400 border-green-400/30">
                                Verified Attendee
                              </Badge>
                            )}
                            
                            {review.categories && (
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                                {review.categories.service && (
                                  <div className="flex justify-between">
                                    <span>Service:</span>
                                    <span>{review.categories.service}/5</span>
                                  </div>
                                )}
                                {review.categories.venue && (
                                  <div className="flex justify-between">
                                    <span>Venue:</span>
                                    <span>{review.categories.venue}/5</span>
                                  </div>
                                )}
                                {review.categories.value && (
                                  <div className="flex justify-between">
                                    <span>Value:</span>
                                    <span>{review.categories.value}/5</span>
                                  </div>
                                )}
                                {review.categories.atmosphere && (
                                  <div className="flex justify-between">
                                    <span>Atmosphere:</span>
                                    <span>{review.categories.atmosphere}/5</span>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            <p className="mt-3">{review.content}</p>
                            
                            {review.photos && review.photos.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {review.photos.map((photo, index) => (
                                  <img 
                                    key={index} 
                                    src={photo} 
                                    alt={`Review photo ${index + 1}`} 
                                    className="h-20 w-20 object-cover rounded-md"
                                  />
                                ))}
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between mt-4">
                              <div className="flex items-center gap-4">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="flex items-center gap-1 text-muted-foreground hover:text-white"
                                  onClick={() => handleMarkHelpful(review.id)}
                                >
                                  <ThumbsUp className="h-4 w-4" />
                                  Helpful ({review.helpful_count})
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="flex items-center gap-1 text-muted-foreground hover:text-white"
                                  onClick={() => handleReportReview(review.id)}
                                >
                                  <Flag className="h-4 w-4" />
                                  Report
                                </Button>
                              </div>
                              
                              {review.sentiment && (
                                <Badge variant="outline" className={`
                                  ${review.sentiment === 'positive' ? 'text-green-400 border-green-400/30' : 
                                    review.sentiment === 'negative' ? 'text-red-400 border-red-400/30' : 
                                    'text-yellow-400 border-yellow-400/30'}
                                `}>
                                  {review.sentiment.charAt(0).toUpperCase() + review.sentiment.slice(1)}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center p-8 border border-dashed rounded-lg">
                <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-medium">No Reviews Yet</h3>
                <p className="text-muted-foreground mt-1">Be the first to review this event!</p>
                <Button 
                  className="mt-4" 
                  onClick={() => setActiveTab('write')}
                >
                  Write a Review
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="write" className="space-y-6">
            {!isAuthenticated ? (
              <div className="text-center p-8 border border-dashed rounded-lg">
                <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-medium">Login Required</h3>
                <p className="text-muted-foreground mt-1">Please login to leave a review</p>
                <Button className="mt-4">Login</Button>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <Label className="block mb-2">Overall Rating</Label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(rating => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => handleStarClick(rating)}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`h-10 w-10 ${
                              rating <= overallRating ? 'text-kenya-orange fill-kenya-orange' : 'text-gray-500'
                            } hover:text-kenya-orange transition-colors`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="block mb-2">Service</Label>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(rating => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => handleCategoryRatingChange('service', rating)}
                            className="focus:outline-none"
                          >
                            <Star
                              className={`h-6 w-6 ${
                                rating <= categoryRatings.service ? 'text-kenya-orange fill-kenya-orange' : 'text-gray-500'
                              } hover:text-kenya-orange transition-colors`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="block mb-2">Venue</Label>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(rating => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => handleCategoryRatingChange('venue', rating)}
                            className="focus:outline-none"
                          >
                            <Star
                              className={`h-6 w-6 ${
                                rating <= categoryRatings.venue ? 'text-kenya-orange fill-kenya-orange' : 'text-gray-500'
                              } hover:text-kenya-orange transition-colors`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="block mb-2">Value for Money</Label>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(rating => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => handleCategoryRatingChange('value', rating)}
                            className="focus:outline-none"
                          >
                            <Star
                              className={`h-6 w-6 ${
                                rating <= categoryRatings.value ? 'text-kenya-orange fill-kenya-orange' : 'text-gray-500'
                              } hover:text-kenya-orange transition-colors`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="block mb-2">Atmosphere</Label>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(rating => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => handleCategoryRatingChange('atmosphere', rating)}
                            className="focus:outline-none"
                          >
                            <Star
                              className={`h-6 w-6 ${
                                rating <= categoryRatings.atmosphere ? 'text-kenya-orange fill-kenya-orange' : 'text-gray-500'
                              } hover:text-kenya-orange transition-colors`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="review-content">Write your review</Label>
                    <Textarea
                      id="review-content"
                      placeholder="Share your experience at this event..."
                      rows={5}
                      value={newReview}
                      onChange={e => setNewReview(e.target.value)}
                    />
                    
                    <AIReviewAnalysis
                      initialReview={newReview}
                      onAnalysisComplete={(analysis) => {
                        console.log("AI Analysis:", analysis);
                      }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Add Photos (Optional)</Label>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {reviewPhotos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={photo} 
                            alt={`Upload ${index + 1}`} 
                            className="h-20 w-full object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(index)}
                            className="absolute top-1 right-1 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3 text-white" />
                          </button>
                        </div>
                      ))}
                      
                      {reviewPhotos.length < 5 && (
                        <button
                          type="button"
                          onClick={handleAddPhoto}
                          className="h-20 flex flex-col items-center justify-center border-2 border-dashed rounded-md hover:border-kenya-orange transition-colors"
                        >
                          <Plus className="h-6 w-6" />
                          <span className="text-xs mt-1">Add Photo</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      {activeTab === 'write' && isAuthenticated && (
        <CardFooter className="flex justify-end">
          <Button
            variant="outline"
            className="mr-2"
            onClick={() => setActiveTab('read')}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmitReview}
            disabled={isSubmitting || overallRating === 0 || !newReview.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : 'Submit Review'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

const X = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const Plus = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export default ReviewSystem;
