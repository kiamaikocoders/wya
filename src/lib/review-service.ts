
import { apiClient, REVIEW_ENDPOINTS, EVENT_ENDPOINTS } from './api-client';
import { toast } from 'sonner';
import { User } from './auth-service';

// Review type definitions
export interface Review {
  id: number;
  user_id: number;
  event_id: number;
  rating: number;
  comment: string;
  created_at: string;
  user?: User;
}

export interface CreateReviewPayload {
  event_id: number;
  rating: number;
  comment: string;
}

export interface UpdateReviewPayload {
  id: number;
  rating?: number;
  comment?: string;
}

// Review service methods
export const reviewService = {
  // Get all reviews
  getAllReviews: async (): Promise<Review[]> => {
    try {
      const response = await apiClient.get<Review[]>(REVIEW_ENDPOINTS.ALL);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch reviews';
      toast.error(errorMessage);
      throw error;
    }
  },
  
  // Get reviews for a specific event
  getEventReviews: async (eventId: number): Promise<Review[]> => {
    try {
      const response = await apiClient.get<Review[]>(REVIEW_ENDPOINTS.EVENT_REVIEWS(eventId));
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to fetch reviews for event #${eventId}`;
      toast.error(errorMessage);
      throw error;
    }
  },
  
  // Get review by ID
  getReviewById: async (id: number): Promise<Review> => {
    try {
      const response = await apiClient.get<Review>(REVIEW_ENDPOINTS.SINGLE(id));
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to fetch review #${id}`;
      toast.error(errorMessage);
      throw error;
    }
  },
  
  // Create new review
  createReview: async (reviewData: CreateReviewPayload): Promise<Review> => {
    try {
      const response = await apiClient.post<Review>(REVIEW_ENDPOINTS.ALL, reviewData);
      toast.success('Review submitted successfully!');
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit review';
      toast.error(errorMessage);
      throw error;
    }
  },
  
  // Update existing review
  updateReview: async (reviewData: UpdateReviewPayload): Promise<Review> => {
    try {
      const { id, ...updateData } = reviewData;
      const response = await apiClient.patch<Review>(REVIEW_ENDPOINTS.SINGLE(id), updateData);
      toast.success('Review updated successfully!');
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to update review #${reviewData.id}`;
      toast.error(errorMessage);
      throw error;
    }
  },
  
  // Delete review
  deleteReview: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(REVIEW_ENDPOINTS.SINGLE(id));
      toast.success('Review deleted successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to delete review #${id}`;
      toast.error(errorMessage);
      throw error;
    }
  }
};
