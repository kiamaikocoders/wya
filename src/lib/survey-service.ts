
import { apiClient, SURVEY_ENDPOINTS } from "./api-client";

// Survey interfaces
export interface Survey {
  id: number;
  event_id: number;
  title: string;
  description?: string;
  questions: SurveyQuestion[];
  created_at: string;
  updated_at: string;
  creator_id?: number;
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
  user_id: number;
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

// Survey response endpoints
const SURVEY_RESPONSE_ENDPOINTS = {
  ALL: `${SURVEY_ENDPOINTS.ALL}_response`,
  SINGLE: (id: number) => `${SURVEY_ENDPOINTS.ALL}_response/${id}`,
};

// Survey service
export const surveyService = {
  // Get all surveys
  getAllSurveys: async (): Promise<Survey[]> => {
    return apiClient.get<Survey[]>(SURVEY_ENDPOINTS.ALL);
  },

  // Get surveys by event ID (renamed from getSurveysByEventId for consistency)
  getSurveysByEventId: async (eventId: number): Promise<Survey[]> => {
    const allSurveys = await apiClient.get<Survey[]>(SURVEY_ENDPOINTS.ALL);
    return allSurveys.filter(survey => survey.event_id === eventId);
  },
  
  // Alias for getSurveysByEventId for EventAnalytics.tsx
  getEventSurveys: async (eventId: number): Promise<Survey[]> => {
    return surveyService.getSurveysByEventId(eventId);
  },

  // Get survey by ID
  getSurveyById: async (id: number): Promise<Survey> => {
    return apiClient.get<Survey>(SURVEY_ENDPOINTS.SINGLE(id));
  },

  // Create a new survey
  createSurvey: async (surveyData: CreateSurveyDto): Promise<Survey> => {
    return apiClient.post<Survey>(SURVEY_ENDPOINTS.ALL, surveyData);
  },

  // Update survey
  updateSurvey: async (id: number, surveyData: UpdateSurveyDto): Promise<Survey> => {
    return apiClient.patch<Survey>(SURVEY_ENDPOINTS.SINGLE(id), surveyData);
  },

  // Delete survey
  deleteSurvey: async (id: number): Promise<void> => {
    return apiClient.delete<void>(SURVEY_ENDPOINTS.SINGLE(id));
  },

  // Submit survey response
  submitSurveyResponse: async (responseData: SubmitSurveyResponseDto): Promise<SurveyResponse> => {
    return apiClient.post<SurveyResponse>(SURVEY_RESPONSE_ENDPOINTS.ALL, responseData);
  },

  // Get all survey responses
  getAllSurveyResponses: async (): Promise<SurveyResponse[]> => {
    return apiClient.get<SurveyResponse[]>(SURVEY_RESPONSE_ENDPOINTS.ALL);
  },

  // Get survey response by ID
  getSurveyResponseById: async (id: number): Promise<SurveyResponse> => {
    return apiClient.get<SurveyResponse>(SURVEY_RESPONSE_ENDPOINTS.SINGLE(id));
  },

  // Get survey responses by survey ID
  getSurveyResponses: async (surveyId: number): Promise<SurveyResponse[]> => {
    const allResponses = await apiClient.get<SurveyResponse[]>(SURVEY_RESPONSE_ENDPOINTS.ALL);
    return allResponses.filter(response => response.survey_id === surveyId);
  },

  // Update survey response
  updateSurveyResponse: async (id: number, responseData: Partial<SubmitSurveyResponseDto>): Promise<SurveyResponse> => {
    return apiClient.patch<SurveyResponse>(SURVEY_RESPONSE_ENDPOINTS.SINGLE(id), responseData);
  },

  // Delete survey response
  deleteSurveyResponse: async (id: number): Promise<void> => {
    return apiClient.delete<void>(SURVEY_RESPONSE_ENDPOINTS.SINGLE(id));
  }
};
