
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
  order_position: number;
}

export interface Survey {
  id: number;
  event_id: number;
  title: string;
  description?: string;
  questions: SurveyQuestion[];
  created_at: string;
  is_anonymous?: boolean; // Make optional since it doesn't exist in DB
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
  is_anonymous?: boolean;
}

// Helper function to transform database question to SurveyQuestion
const transformDatabaseQuestion = (dbQuestion: any): SurveyQuestion => {
  let options: string[] | undefined = undefined;
  
  if (dbQuestion.options) {
    try {
      // Parse JSON options if they exist
      const parsedOptions = typeof dbQuestion.options === 'string' 
        ? JSON.parse(dbQuestion.options) 
        : dbQuestion.options;
      
      options = Array.isArray(parsedOptions) ? parsedOptions : undefined;
    } catch (error) {
      console.error('Error parsing question options:', error);
      options = undefined;
    }
  }

  return {
    id: dbQuestion.id,
    question_text: dbQuestion.question_text,
    question_type: dbQuestion.question_type as 'multiple_choice' | 'text' | 'rating' | 'yes_no' | 'checkbox',
    options,
    required: dbQuestion.required || false,
    order_position: dbQuestion.order_position
  };
};

export const surveyService = {
  // Get all surveys
  getAllSurveys: async (): Promise<Survey[]> => {
    try {
      const { data: surveys, error } = await supabase
        .from('surveys')
        .select('*');
      if (error) throw error;
      if (!surveys) return [];
      
      // Fetch questions for each survey
      const surveyIds = surveys.map(s => s.id);
      const { data: questions, error: qError } = await supabase
        .from('survey_questions')
        .select('*')
        .in('survey_id', surveyIds);
      if (qError) throw qError;
      
      return surveys.map(survey => ({
        ...survey,
        is_anonymous: false, // Default value since it doesn't exist in DB
        questions: (questions || [])
          .filter(q => q.survey_id === survey.id)
          .map(transformDatabaseQuestion)
      }));
    } catch (error) {
      console.error('Error fetching surveys:', error);
      toast.error('Failed to fetch surveys');
      return [];
    }
  },

  // Get surveys by event ID
  getSurveysByEventId: async (eventId: number): Promise<Survey[]> => {
    try {
      const { data: surveys, error } = await supabase
        .from('surveys')
        .select('*')
        .eq('event_id', eventId);
      if (error) throw error;
      if (!surveys) return [];
      
      const surveyIds = surveys.map(s => s.id);
      const { data: questions, error: qError } = await supabase
        .from('survey_questions')
        .select('*')
        .in('survey_id', surveyIds);
      if (qError) throw qError;
      
      return surveys.map(survey => ({
        ...survey,
        is_anonymous: false, // Default value since it doesn't exist in DB
        questions: (questions || [])
          .filter(q => q.survey_id === survey.id)
          .map(transformDatabaseQuestion)
      }));
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
      const { data: survey, error } = await supabase
        .from('surveys')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      if (!survey) return null;
      
      const { data: questions, error: qError } = await supabase
        .from('survey_questions')
        .select('*')
        .eq('survey_id', id);
      if (qError) throw qError;
      
      return {
        ...survey,
        is_anonymous: false, // Default value since it doesn't exist in DB
        questions: (questions || []).map(transformDatabaseQuestion)
      };
    } catch (error) {
      console.error(`Error fetching survey with ID ${id}:`, error);
      toast.error('Failed to fetch survey');
      return null;
    }
  },

  // Create a new survey
  createSurvey: async (surveyData: CreateSurveyPayload): Promise<Survey | null> => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // Insert survey
      const { data: survey, error } = await supabase
        .from('surveys')
        .insert({
          event_id: surveyData.event_id,
          title: surveyData.title,
          description: surveyData.description,
          user_id: user.id
        })
        .select()
        .single();
      if (error) throw error;
      
      // Insert questions
      const questionsToInsert = surveyData.questions.map((q, index) => ({
        survey_id: survey.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options ? JSON.stringify(q.options) : null,
        required: q.required,
        order_position: q.order_position || index + 1
      }));
      
      const { error: qError } = await supabase
        .from('survey_questions')
        .insert(questionsToInsert);
      if (qError) throw qError;
      
      toast.success('Survey created successfully');
      
      // Return the created survey with questions
      const { data: questions } = await supabase
        .from('survey_questions')
        .select('*')
        .eq('survey_id', survey.id);
      
      return {
        ...survey,
        is_anonymous: surveyData.is_anonymous || false,
        questions: (questions || []).map(transformDatabaseQuestion)
      };
    } catch (error) {
      console.error('Error creating survey:', error);
      toast.error('Failed to create survey');
      return null;
    }
  },

  // Submit survey response
  submitSurveyResponse: async (
    surveyId: number, 
    answers: { question_id: number; answer: string | string[] | number }[]
  ): Promise<void> => {
    try {
      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('survey_responses')
        .insert({
          survey_id: surveyId,
          user_id: user.id,
          response_data: JSON.stringify(answers)
        });
      if (error) throw error;
      
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
      const { data, error } = await supabase
        .from('survey_responses')
        .select('id')
        .eq('survey_id', surveyId)
        .eq('user_id', userId);
      if (error) throw error;
      return !!(data && data.length > 0);
    } catch (error) {
      console.error('Error checking survey completion:', error);
      return false;
    }
  },

  // Get survey responses
  getSurveyResponses: async (surveyId: number): Promise<SurveyResponse[]> => {
    try {
      const { data: responses, error } = await supabase
        .from('survey_responses')
        .select('*')
        .eq('survey_id', surveyId);
      if (error) throw error;
      
      return (responses || []).map(response => ({
        id: response.id,
        survey_id: response.survey_id!,
        user_id: response.user_id!,
        answers: JSON.parse(response.response_data as string),
        submitted_at: response.created_at!
      }));
    } catch (error) {
      console.error(`Error fetching responses for survey ${surveyId}:`, error);
      toast.error('Failed to fetch survey responses');
      return [];
    }
  },

  // Delete a survey
  deleteSurvey: async (id: number): Promise<void> => {
    try {
      const { error } = await supabase
        .from('surveys')
        .delete()
        .eq('id', id);
      if (error) throw error;
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
      const { error } = await supabase
        .from('survey_responses')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Survey response deleted successfully');
    } catch (error) {
      console.error('Error deleting survey response:', error);
      toast.error('Failed to delete survey response');
      throw error;
    }
  }
};
