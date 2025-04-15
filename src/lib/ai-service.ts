
import { toast } from 'sonner';

const API_KEY = 'AIzaSyBRF6q949E70yC36OvT-BYsGBeP7Jfux9Y';

interface AIResponse {
  text: string;
  error?: string;
}

export const aiService = {
  // Content moderation
  moderateContent: async (text: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Analyze this content and respond with "true" if it's appropriate or "false" if it contains inappropriate content: "${text}"`
              }]
            }]
          })
        }
      );

      const data = await response.json();
      const result = data.candidates[0].content.parts[0].text;
      return result.toLowerCase().includes('true');
    } catch (error) {
      console.error('Error moderating content:', error);
      return true; // Default to allowing content if moderation fails
    }
  },

  // AI-powered event recommendations
  getEventRecommendations: async (userInterests: string[]): Promise<AIResponse> => {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Based on these interests: ${userInterests.join(', ')}, suggest some event types that would be appealing. Keep it concise.`
              }]
            }]
          })
        }
      );

      const data = await response.json();
      return {
        text: data.candidates[0].content.parts[0].text
      };
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return {
        text: '',
        error: 'Failed to get recommendations'
      };
    }
  },

  // AI-powered event description enhancement
  enhanceDescription: async (description: string): Promise<AIResponse> => {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Enhance this event description to be more engaging while keeping the main information: "${description}". Keep it concise.`
              }]
            }]
          })
        }
      );

      const data = await response.json();
      return {
        text: data.candidates[0].content.parts[0].text
      };
    } catch (error) {
      console.error('Error enhancing description:', error);
      return {
        text: description,
        error: 'Failed to enhance description'
      };
    }
  },

  // Generate event tags
  generateTags: async (description: string): Promise<string[]> => {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Generate 5 relevant hashtags for this event description: "${description}". Respond only with the hashtags separated by commas, without #.`
              }]
            }]
          })
        }
      );

      const data = await response.json();
      const tags = data.candidates[0].content.parts[0].text.split(',').map((tag: string) => tag.trim());
      return tags;
    } catch (error) {
      console.error('Error generating tags:', error);
      return [];
    }
  }
};
