
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

// Survey service
export const surveyService = {
  // Get all surveys
  getAllSurveys: async (): Promise<Survey[]> => {
    return apiClient.get<Survey[]>(SURVEY_ENDPOINTS.ALL);
  },

  // Get surveys by event ID
  getSurveysByEventId: async (eventId: number): Promise<Survey[]> => {
    const allSurveys = await apiClient.get<Survey[]>(SURVEY_ENDPOINTS.ALL);
    return allSurveys.filter(survey => survey.event_id === eventId);
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
    return apiClient.post<SurveyResponse>(`${SURVEY_ENDPOINTS.ALL}/response`, responseData);
  },

  // Get survey responses by survey ID
  getSurveyResponses: async (surveyId: number): Promise<SurveyResponse[]> => {
    return apiClient.get<SurveyResponse[]>(`${SURVEY_ENDPOINTS.SINGLE(surveyId)}/responses`);
  },
};
