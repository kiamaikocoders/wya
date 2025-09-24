import { supabase } from './supabase';
import { toast } from 'sonner';

export interface SupportedLanguage {
  code: string;
  name: string;
  native_name: string;
  flag_emoji: string;
  is_rtl: boolean;
  is_active: boolean;
}

export interface UserLanguagePreferences {
  id: number;
  user_id: string;
  primary_language: string;
  secondary_language: string;
  interface_language: string;
  content_language: string;
  created_at: string;
  updated_at: string;
}

export interface TranslationRequest {
  id: number;
  content_type: string;
  content_id: number;
  source_language: string;
  target_language: string;
  original_text: string;
  translated_text?: string;
  status: string;
  translator_id?: string;
  requested_by: string;
  created_at: string;
  completed_at?: string;
}

export const languageService = {
  // Get available languages
  getAvailableLanguages: async (): Promise<SupportedLanguage[]> => {
    try {
      const { data, error } = await supabase.rpc('get_available_languages');

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting available languages:', error);
      throw error;
    }
  },

  // Get user's preferred language
  getUserLanguage: async (userId?: string): Promise<string> => {
    try {
      const { data, error } = await supabase.rpc('get_user_language', {
        p_user_id: userId
      });

      if (error) throw error;

      return data || 'en';
    } catch (error) {
      console.error('Error getting user language:', error);
      return 'en';
    }
  },

  // Get translated content
  getTranslatedContent: async (
    contentType: string,
    contentId: number,
    languageCode?: string
  ): Promise<any> => {
    try {
      const { data, error } = await supabase.rpc('get_translated_content', {
        p_content_type: contentType,
        p_content_id: contentId,
        p_language_code: languageCode
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error getting translated content:', error);
      throw error;
    }
  },

  // Get system translation
  getSystemTranslation: async (
    key: string,
    languageCode?: string
  ): Promise<string> => {
    try {
      const { data, error } = await supabase.rpc('get_system_translation', {
        p_key: key,
        p_language_code: languageCode
      });

      if (error) throw error;

      return data || key;
    } catch (error) {
      console.error('Error getting system translation:', error);
      return key;
    }
  },

  // Update user language preferences
  updateLanguagePreferences: async (
    primaryLanguage: string,
    secondaryLanguage?: string,
    interfaceLanguage?: string,
    contentLanguage?: string
  ): Promise<UserLanguagePreferences> => {
    try {
      const { data, error } = await supabase
        .from('user_language_preferences')
        .upsert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          primary_language: primaryLanguage,
          secondary_language: secondaryLanguage,
          interface_language: interfaceLanguage || primaryLanguage,
          content_language: contentLanguage || primaryLanguage,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Language preferences updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating language preferences:', error);
      toast.error('Failed to update language preferences');
      throw error;
    }
  },

  // Get user language preferences
  getUserLanguagePreferences: async (userId?: string): Promise<UserLanguagePreferences | null> => {
    try {
      const { data, error } = await supabase
        .from('user_language_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error getting user language preferences:', error);
      return null;
    }
  },

  // Create translation request
  createTranslationRequest: async (
    contentType: string,
    contentId: number,
    sourceLanguage: string,
    targetLanguage: string,
    originalText: string
  ): Promise<any> => {
    try {
      const { data, error } = await supabase.rpc('create_translation_request', {
        p_content_type: contentType,
        p_content_id: contentId,
        p_source_language: sourceLanguage,
        p_target_language: targetLanguage,
        p_original_text: originalText
      });

      if (error) throw error;

      toast.success('Translation request created successfully');
      return data;
    } catch (error) {
      console.error('Error creating translation request:', error);
      toast.error('Failed to create translation request');
      throw error;
    }
  },

  // Submit translation
  submitTranslation: async (
    requestId: number,
    translatedText: string
  ): Promise<any> => {
    try {
      const { data, error } = await supabase.rpc('submit_translation', {
        p_request_id: requestId,
        p_translated_text: translatedText
      });

      if (error) throw error;

      toast.success('Translation submitted successfully');
      return data;
    } catch (error) {
      console.error('Error submitting translation:', error);
      toast.error('Failed to submit translation');
      throw error;
    }
  },

  // Get translation requests
  getTranslationRequests: async (
    status?: string,
    targetLanguage?: string
  ): Promise<TranslationRequest[]> => {
    try {
      let query = supabase
        .from('translation_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      if (targetLanguage) {
        query = query.eq('target_language', targetLanguage);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting translation requests:', error);
      throw error;
    }
  },

  // Add event translation
  addEventTranslation: async (
    eventId: number,
    languageCode: string,
    title: string,
    description?: string,
    location?: string,
    category?: string,
    tags?: string[]
  ): Promise<any> => {
    try {
      const { data, error } = await supabase
        .from('event_translations')
        .upsert({
          event_id: eventId,
          language_code: languageCode,
          title,
          description,
          location,
          category,
          tags,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Event translation added successfully');
      return data;
    } catch (error) {
      console.error('Error adding event translation:', error);
      toast.error('Failed to add event translation');
      throw error;
    }
  },

  // Add forum post translation
  addForumPostTranslation: async (
    postId: number,
    languageCode: string,
    title: string,
    content: string
  ): Promise<any> => {
    try {
      const { data, error } = await supabase
        .from('forum_post_translations')
        .upsert({
          post_id: postId,
          language_code: languageCode,
          title,
          content,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Forum post translation added successfully');
      return data;
    } catch (error) {
      console.error('Error adding forum post translation:', error);
      toast.error('Failed to add forum post translation');
      throw error;
    }
  },

  // Add story translation
  addStoryTranslation: async (
    storyId: number,
    languageCode: string,
    caption?: string,
    content?: string
  ): Promise<any> => {
    try {
      const { data, error } = await supabase
        .from('story_translations')
        .upsert({
          story_id: storyId,
          language_code: languageCode,
          caption,
          content,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Story translation added successfully');
      return data;
    } catch (error) {
      console.error('Error adding story translation:', error);
      toast.error('Failed to add story translation');
      throw error;
    }
  },

  // Get system translations for a language
  getSystemTranslations: async (languageCode: string): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('system_translations')
        .select('*')
        .eq('language_code', languageCode)
        .order('key');

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting system translations:', error);
      throw error;
    }
  }
};
