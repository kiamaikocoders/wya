import { supabase } from './supabase';
import { toast } from 'sonner';

// Survey interfaces
export interface Survey {
  id: number;
  event_id?: number;
  title: string;
  description?: string;
  is_published: boolean;
  created_at: string;
  updated_at?: string;
  questions?: SurveyQuestion[];
}

export interface SurveyQuestion {
  id: number;
  survey_id: number;
  text: string; // Added for compatibility
  type: 'multiple_choice' | 'checkbox' | 'text' | 'rating'; // Added for compatibility
  options?: string[];
  required: boolean;
  order: number;
  description?: string; // Added for compatibility
  maxRating?: number; // Added for compatibility
}

export interface SurveyResponse {
  id: number;
  survey_id: number;
  user_id: string;
  answers: Record<number, any>; // Question ID to answer mapping
  created_at: string;
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
  
  // Get survey by ID
  getSurveyById: async (id: number): Promise<Survey> => {
    try {
      // Mock implementation - would use Supabase in real version
      return {
        id,
        title: 'Survey',
        is_published: true,
        created_at: new Date().toISOString(),
        questions: []
      };
    } catch (error) {
      toast.error('Failed to fetch survey');
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
  
  // Alias for backward compatibility
  getEventSurveys: async (eventId: number): Promise<Survey[]> => {
    return surveyService.getSurveysByEventId(eventId);
  },
  
  // Check if a user has completed a survey
  checkSurveyCompletion: async (surveyId: number, userId: string): Promise<boolean> => {
    try {
      const { count, error } = await supabase
        .from('survey_responses')
        .select('*', { count: 'exact', head: true })
        .eq('survey_id', surveyId)
        .eq('user_id', userId);
      
      if (error) throw error;
      return count ? count > 0 : false;
    } catch (error) {
      console.error('Error checking survey completion:', error);
      return false;
    }
  },
  
  // Submit survey answers
  submitSurveyAnswers: async (surveyId: number, answers: Record<string, any>): Promise<SurveyResponse> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to submit a survey response');
      }
      
      const { data, error } = await supabase
        .from('survey_responses')
        .insert({
          survey_id: surveyId,
          user_id: user.id,
          answers,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return data as SurveyResponse;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit survey';
      toast.error(errorMessage);
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
