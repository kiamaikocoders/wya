
import { supabase } from './supabase';
import { toast } from 'sonner';

export interface SurveyQuestion {
  id: number;
  question_text: string;
  question_type: 'multiple_choice' | 'text' | 'rating' | 'yes_no' | 'checkbox';
  options?: string[];
  required: boolean;
  maxRating?: number;
  description?: string;
  text?: string;
  type?: string; // Added for compatibility with existing code
}

export interface Survey {
  id: number;
  event_id: number;
  title: string;
  description?: string;
  questions: SurveyQuestion[];
  created_at: string;
  is_anonymous: boolean;
}

export interface SurveyResponse {
  id: number;
  survey_id: number;
  user_id: string;
  answers: {
    question_id: number;
    answer: string | string[] | number;
  }[];
  submitted_at: string;
  responses?: {
    question_id: number;
    answer: string | string[] | number;
  }[];
}

export interface CreateSurveyPayload {
  event_id: number;
  title: string;
  description?: string;
  questions: Omit<SurveyQuestion, 'id'>[];
  is_anonymous: boolean;
}

// Dummy implementation for survey service
export const surveyService = {
  // Get all surveys
  getAllSurveys: async (): Promise<Survey[]> => {
    try {
      // This is a mock implementation
      return [];
    } catch (error) {
      console.error('Error fetching surveys:', error);
      toast.error('Failed to fetch surveys');
      return [];
    }
  },
  
  // Get surveys by event ID
  getSurveysByEventId: async (eventId: number): Promise<Survey[]> => {
    try {
      // This is a mock implementation
      return [];
    } catch (error) {
      console.error(`Error fetching surveys for event ${eventId}:`, error);
      toast.error('Failed to fetch surveys');
      return [];
    }
  },

  // Get event surveys (alias for getSurveysByEventId)
  getEventSurveys: async (eventId: number): Promise<Survey[]> => {
    return surveyService.getSurveysByEventId(eventId);
  },
  
  // Get survey by ID
  getSurveyById: async (id: number): Promise<Survey | null> => {
    try {
      // This is a mock implementation
      return null;
    } catch (error) {
      console.error(`Error fetching survey with ID ${id}:`, error);
      toast.error('Failed to fetch survey');
      return null;
    }
  },
  
  // Create a new survey
  createSurvey: async (surveyData: CreateSurveyPayload): Promise<Survey> => {
    try {
      // Add IDs to the questions
      const questions = surveyData.questions.map((q, index) => ({
        ...q,
        id: index + 1
      }));

      // This is a mock implementation
      toast.success('Survey created successfully');
      const result: Survey = {
        id: Date.now(),
        ...surveyData,
        questions,
        created_at: new Date().toISOString()
      };
      return result;
    } catch (error) {
      console.error('Error creating survey:', error);
      toast.error('Failed to create survey');
      throw error;
    }
  },
  
  // Submit survey response
  submitSurveyResponse: async (
    surveyId: number, 
    answers: { question_id: number; answer: string | string[] | number }[]
  ): Promise<void> => {
    try {
      // Mock implementation
      toast.success('Survey response submitted successfully');
    } catch (error) {
      console.error('Error submitting survey response:', error);
      toast.error('Failed to submit survey response');
      throw error;
    }
  },

  // Submit survey answers (needed for compatibility)
  submitSurveyAnswers: async (
    surveyId: number,
    answers: { question_id: number; answer: string | string[] | number }[]
  ): Promise<void> => {
    return surveyService.submitSurveyResponse(surveyId, answers);
  },
  
  // Check if user has completed the survey
  checkSurveyCompletion: async (surveyId: number, userId: string): Promise<boolean> => {
    try {
      // Mock implementation
      return false;
    } catch (error) {
      console.error('Error checking survey completion:', error);
      return false;
    }
  },
  
  // Get survey responses
  getSurveyResponses: async (surveyId: number): Promise<SurveyResponse[]> => {
    try {
      // Mock implementation
      return [];
    } catch (error) {
      console.error(`Error fetching responses for survey ${surveyId}:`, error);
      toast.error('Failed to fetch survey responses');
      return [];
    }
  },
  
  // Delete a survey
  deleteSurvey: async (id: number): Promise<void> => {
    try {
      // Mock implementation
      toast.success('Survey deleted successfully');
    } catch (error) {
      console.error('Error deleting survey:', error);
      toast.error('Failed to delete survey');
      throw error;
    }
  },
  
  // Delete a survey response
  deleteSurveyResponse: async (id: number): Promise<void> => {
    try {
      // Mock implementation
      toast.success('Survey response deleted successfully');
    } catch (error) {
      console.error('Error deleting survey response:', error);
      toast.error('Failed to delete survey response');
      throw error;
    }
  }
};
