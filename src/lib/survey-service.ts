
import { supabase } from './supabase';
import { toast } from 'sonner';

// Survey interfaces
export interface Survey {
  id: number;
  event_id: number;
  title: string;
  description?: string;
  questions: SurveyQuestion[];
  created_at: string;
  updated_at: string;
  creator_id?: string;
  is_anonymous?: boolean;
  status?: 'active' | 'closed';
}

export interface SurveyQuestion {
  id: number;
  question_text: string;
  question_type: 'multiple_choice' | 'text' | 'rating' | 'yes_no';
  options?: string[];
  required: boolean;
}

export interface SurveyResponse {
  id: number;
  survey_id: number;
  user_id: string;
  responses: QuestionResponse[];
  submitted_at: string;
}

export interface QuestionResponse {
  question_id: number;
  answer: string | string[] | number;
}

export interface CreateSurveyDto {
  event_id: number;
  title: string;
  description?: string;
  questions: Omit<SurveyQuestion, 'id'>[];
  is_anonymous?: boolean;
}

export interface UpdateSurveyDto {
  title?: string;
  description?: string;
  questions?: Omit<SurveyQuestion, 'id'>[];
  status?: 'active' | 'closed';
}

export interface SubmitSurveyResponseDto {
  survey_id: number;
  responses: Omit<QuestionResponse, 'id'>[];
}

// We'll use a mock service for now since we haven't created survey tables
// In a real implementation, we would create the necessary tables and update this service
export const surveyService = {
  // Get all surveys
  getAllSurveys: async (): Promise<Survey[]> => {
    try {
      // Mock implementation - would use Supabase in real version
      return [];
    } catch (error) {
      toast.error('Failed to fetch surveys');
      throw error;
    }
  },

  // Get surveys by event ID
  getSurveysByEventId: async (eventId: number): Promise<Survey[]> => {
    try {
      // Mock implementation - would use Supabase in real version
      return [];
    } catch (error) {
      toast.error('Failed to fetch event surveys');
      throw error;
    }
  },
  
  // Alias for getSurveysByEventId for EventAnalytics.tsx
  getEventSurveys: async (eventId: number): Promise<Survey[]> => {
    return surveyService.getSurveysByEventId(eventId);
  },

  // Get survey by ID
  getSurveyById: async (id: number): Promise<Survey> => {
    try {
      // Mock implementation - would use Supabase in real version
      throw new Error('Survey not found');
    } catch (error) {
      toast.error('Failed to fetch survey');
      throw error;
    }
  },

  // Create a new survey
  createSurvey: async (surveyData: CreateSurveyDto): Promise<Survey> => {
    try {
      // Mock implementation - would use Supabase in real version
      toast.success('Survey created successfully');
      return {} as Survey;
    } catch (error) {
      toast.error('Failed to create survey');
      throw error;
    }
  },

  // Update survey
  updateSurvey: async (id: number, surveyData: UpdateSurveyDto): Promise<Survey> => {
    try {
      // Mock implementation - would use Supabase in real version
      toast.success('Survey updated successfully');
      return {} as Survey;
    } catch (error) {
      toast.error('Failed to update survey');
      throw error;
    }
  },

  // Delete survey
  deleteSurvey: async (id: number): Promise<void> => {
    try {
      // Mock implementation - would use Supabase in real version
      toast.success('Survey deleted successfully');
    } catch (error) {
      toast.error('Failed to delete survey');
      throw error;
    }
  },

  // Submit survey response
  submitSurveyResponse: async (responseData: SubmitSurveyResponseDto): Promise<SurveyResponse> => {
    try {
      // Mock implementation - would use Supabase in real version
      toast.success('Survey response submitted successfully');
      return {} as SurveyResponse;
    } catch (error) {
      toast.error('Failed to submit survey response');
      throw error;
    }
  },

  // Get all survey responses
  getAllSurveyResponses: async (): Promise<SurveyResponse[]> => {
    try {
      // Mock implementation - would use Supabase in real version
      return [];
    } catch (error) {
      toast.error('Failed to fetch survey responses');
      throw error;
    }
  },

  // Get survey response by ID
  getSurveyResponseById: async (id: number): Promise<SurveyResponse> => {
    try {
      // Mock implementation - would use Supabase in real version
      throw new Error('Survey response not found');
    } catch (error) {
      toast.error('Failed to fetch survey response');
      throw error;
    }
  },

  // Get survey responses by survey ID
  getSurveyResponses: async (surveyId: number): Promise<SurveyResponse[]> => {
    try {
      // Mock implementation - would use Supabase in real version
      return [];
    } catch (error) {
      toast.error('Failed to fetch survey responses');
      throw error;
    }
  },

  // Update survey response
  updateSurveyResponse: async (id: number, responseData: Partial<SubmitSurveyResponseDto>): Promise<SurveyResponse> => {
    try {
      // Mock implementation - would use Supabase in real version
      toast.success('Survey response updated successfully');
      return {} as SurveyResponse;
    } catch (error) {
      toast.error('Failed to update survey response');
      throw error;
    }
  },

  // Delete survey response
  deleteSurveyResponse: async (id: number): Promise<void> => {
    try {
      // Mock implementation - would use Supabase in real version
      toast.success('Survey response deleted successfully');
    } catch (error) {
      toast.error('Failed to delete survey response');
      throw error;
    }
  }
};
