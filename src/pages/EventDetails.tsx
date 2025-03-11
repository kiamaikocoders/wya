
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventService } from '@/lib/event-service';
import { reviewService, Review, CreateReviewPayload } from '@/lib/review-service';
import { Calendar, MapPin, User, Tag, Clock, ArrowLeft, Edit, Trash, Star, StarHalf, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistance } from 'date-fns';

const EventDetails: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [showReviewForm, setShowReviewForm] = useState<boolean>(false);

  // Fetch event data
  const { data: event, isLoading: eventLoading, error: eventError } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventService.getEventById(Number(eventId)),
    enabled: !!eventId,
  });

  // Fetch reviews for this event
  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ['eventReviews', eventId],
    queryFn: () => reviewService.getEventReviews(Number(eventId)),
    enabled: !!eventId,
  });

  // Create review mutation
  const createReviewMutation = useMutation({
    mutationFn: (newReview: CreateReviewPayload) => reviewService.createReview(newReview),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventReviews', eventId] });
      setComment('');
      setRating(5);
      setShowReviewForm(false);
    }
  });

  // Delete review mutation
  const deleteReviewMutation = useMutation({
    mutationFn: (reviewId: number) => reviewService.deleteReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventReviews', eventId] });
    }
  });

  // Delete event handler
  const handleDeleteEvent = async () => {
    if (!eventId) return;
    
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await eventService.deleteEvent(Number(eventId));
        navigate('/events');
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  // Submit review handler
  const handleSubmitReview = () => {
    if (!eventId || !user) return;
    
    const reviewData: CreateReviewPayload = {
      event_id: Number(eventId),
      rating,
      comment
    };
    
    createReviewMutation.mutate(reviewData);
  };

  // Delete review handler
  const handleDeleteReview = (reviewId: number) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      deleteReviewMutation.mutate(reviewId);
    }
  };

  const isOwner = user?.id === event?.organizer_id;
  const hasReviewed = reviews?.some(review => review.user_id === user?.id);

  // Calculate average rating
  const averageRating = reviews && reviews.length > 0
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : null;

  if (eventLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kenya-orange"></div>
      </div>
    );
  }

  if (eventError || !event) {
    return (
      <div className="min-h-screen p-6 flex flex-col items-center justify-center">
        <h1 className="text-white text-xl font-bold mb-4">Event not found</h1>
        <p className="text-kenya-brown-light mb-6">The event you're looking for doesn't exist or has been removed.</p>
        <button 
          onClick={() => navigate('/events')}
          className="flex items-center gap-2 bg-kenya-orange text-white py-2 px-4 rounded-lg"
        >
          <ArrowLeft size={16} />
          Back to Events
        </button>
      </div>
    );
  }

  const timeAgo = formatDistance(
    new Date(event.created_at),
    new Date(),
    { addSuffix: true }
  );

  return (
    <div className="min-h-screen pb-20 animate-fade-in">
      <div className="relative">
        {/* Event Image Banner */}
        <div 
          className="w-full h-60 md:h-80 bg-center bg-cover bg-no-repeat relative"
          style={{ backgroundImage: event.image_url ? `url(${event.image_url})` : undefined, backgroundColor: '#2A231D' }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-kenya-dark"></div>
          
          <button
            onClick={() => navigate('/events')}
            className="absolute top-4 left-4 bg-black bg-opacity-50 p-2 rounded-full text-white"
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        {/* Event Category */}
        <div className="absolute bottom-0 left-0 translate-y-1/2 ml-4">
          <span className="bg-kenya-orange text-kenya-dark text-sm font-medium py-1 px-3 rounded-full">
            {event.category}
          </span>
        </div>
      </div>

      {/* Event Details */}
      <div className="px-4 pt-10 pb-4">
        <h1 className="text-white text-2xl md:text-3xl font-bold mb-3">{event.title}</h1>
        
        {/* Ratings summary if available */}
        {averageRating && (
          <div className="flex items-center gap-2 mb-4">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  className={`${
                    parseFloat(averageRating) >= star
                      ? 'fill-kenya-orange text-kenya-orange'
                      : parseFloat(averageRating) >= star - 0.5
                      ? 'text-kenya-orange fill-kenya-orange'
                      : 'text-gray-400'
                  }`}
                />
              ))}
            </div>
            <span className="text-kenya-orange font-medium">{averageRating}</span>
            <span className="text-kenya-brown-light text-sm">({reviews?.length || 0} reviews)</span>
          </div>
        )}
        
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex items-center gap-2 text-kenya-brown-light">
            <Calendar size={18} />
            <span>{event.date}</span>
          </div>
          
          <div className="flex items-center gap-2 text-kenya-brown-light">
            <MapPin size={18} />
            <span>{event.location}</span>
          </div>
          
          {event.price !== undefined && (
            <div className="flex items-center gap-2 text-kenya-brown-light">
              <Tag size={18} />
              <span>{event.price === 0 ? 'Free' : `Ksh ${event.price}`}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-kenya-brown-light">
            <Clock size={18} />
            <span>Posted {timeAgo}</span>
          </div>
        </div>
        
        {/* Description */}
        <div className="bg-kenya-dark bg-opacity-50 rounded-xl p-4 mb-6">
          <h2 className="text-white text-lg font-semibold mb-2">About this event</h2>
          <p className="text-kenya-brown-light whitespace-pre-line">{event.description}</p>
        </div>
        
        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <div className="mb-6">
            <h2 className="text-white text-lg font-semibold mb-2">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {event.tags.map((tag, index) => (
                <span key={index} className="bg-kenya-brown bg-opacity-30 text-kenya-brown-light text-xs py-1 px-3 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Reviews Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-white text-lg font-semibold">Reviews</h2>
            {isAuthenticated && !isOwner && !hasReviewed && !showReviewForm && (
              <button 
                onClick={() => setShowReviewForm(true)}
                className="text-kenya-orange text-sm font-medium"
              >
                Add Review
              </button>
            )}
          </div>
          
          {/* Review Form */}
          {showReviewForm && (
            <div className="bg-kenya-dark bg-opacity-50 rounded-xl p-4 mb-4 animate-fade-in">
              <h3 className="text-white font-medium mb-3">Write a Review</h3>
              
              <div className="mb-4">
                <p className="text-kenya-brown-light text-sm mb-2">Rating</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        size={24}
                        className={`${
                          rating >= star
                            ? 'fill-kenya-orange text-kenya-orange'
                            : 'text-gray-500'
                        } transition-colors`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="comment" className="text-kenya-brown-light text-sm block mb-2">
                  Comment
                </label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-kenya-dark border border-kenya-brown rounded-lg p-3 text-white focus:outline-none focus:ring-1 focus:ring-kenya-orange"
                  rows={4}
                  placeholder="Share your experience..."
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleSubmitReview}
                  disabled={createReviewMutation.isPending}
                  className="bg-kenya-orange text-white py-2 px-4 rounded-lg font-medium flex-1 hover:bg-opacity-90 transition-colors disabled:opacity-50"
                >
                  {createReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
                </button>
                <button
                  onClick={() => setShowReviewForm(false)}
                  className="bg-kenya-brown-dark text-white py-2 px-4 rounded-lg font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          {/* Reviews List */}
          {reviewsLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-kenya-orange"></div>
            </div>
          ) : reviews && reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="bg-kenya-dark bg-opacity-50 rounded-xl p-4">
                  <div className="flex justify-between">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={14}
                            className={`${
                              review.rating >= star
                                ? 'fill-kenya-orange text-kenya-orange'
                                : 'text-gray-500'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-kenya-brown-light">
                        {review.user?.name || `User #${review.user_id}`}
                      </span>
                    </div>
                    
                    {user && review.user_id === user.id && (
                      <button 
                        onClick={() => handleDeleteReview(review.id)}
                        className="text-red-500 hover:text-red-400"
                      >
                        <Trash size={14} />
                      </button>
                    )}
                  </div>
                  
                  <p className="text-white text-sm whitespace-pre-line">{review.comment}</p>
                  
                  <p className="text-xs text-kenya-brown-light mt-2">
                    {formatDistance(new Date(review.created_at), new Date(), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-kenya-dark bg-opacity-50 rounded-xl p-4 text-center">
              <MessageSquare size={24} className="text-kenya-brown-light mx-auto mb-2" />
              <p className="text-kenya-brown-light">No reviews yet. Be the first to review!</p>
            </div>
          )}
        </div>
        
        {/* Owner Actions */}
        {isAuthenticated && isOwner && (
          <div className="flex gap-3 mt-6">
            <button 
              onClick={() => toast.info('Edit functionality coming soon')}
              className="flex-1 flex items-center justify-center gap-2 bg-kenya-brown text-white py-3 rounded-lg"
            >
              <Edit size={16} />
              Edit Event
            </button>
            <button 
              onClick={handleDeleteEvent}
              className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white py-3 rounded-lg"
            >
              <Trash size={16} />
              Delete Event
            </button>
          </div>
        )}
        
        {/* Attendance Actions */}
        {isAuthenticated && !isOwner && (
          <button 
            onClick={() => toast.info('RSVP functionality coming soon')}
            className="w-full bg-kenya-orange text-white py-3 rounded-lg font-medium mt-4"
          >
            RSVP to this event
          </button>
        )}
      </div>
    </div>
  );
};

export default EventDetails;
