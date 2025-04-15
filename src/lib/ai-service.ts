
import { toast } from 'sonner';

// Use the correct API endpoint for Gemini API
const API_KEY = 'AIzaSyBRF6q949E70yC36OvT-BYsGBeP7Jfux9Y';
const API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.0-pro:generateContent';

interface AIResponse {
  text: string;
  error?: string;
}

// Mock responses for when API calls fail
const getMockResponse = (type: string): string => {
  switch (type) {
    case 'recommendations':
      return 'Based on your interests, you might enjoy music festivals, food tasting events, tech conferences, cultural exhibitions, and sports tournaments. Look for fusion events that combine multiple categories for a unique experience.';
    case 'tags':
      return 'event, festival, experience, community, fun';
    case 'enhance':
      return 'This enhanced content maintains your original message while making it more engaging and readable.';
    default:
      return 'AI response unavailable at the moment. Please try again later.';
  }
};

export const aiService = {
  // Content moderation
  moderateContent: async (text: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `${API_URL}?key=${API_KEY}`,
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

      if (!response.ok) {
        console.warn('Content moderation API failed. Allowing content by default.');
        return true;
      }

      const data = await response.json();
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        console.warn('Unexpected API response format. Allowing content by default.');
        return true;
      }
      
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
        `${API_URL}?key=${API_KEY}`,
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

      if (!response.ok) {
        console.info('Using mock recommendations due to API error');
        return {
          text: getMockResponse('recommendations')
        };
      }

      const data = await response.json();
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        return {
          text: getMockResponse('recommendations'),
          error: 'API returned unexpected format'
        };
      }
      
      return {
        text: data.candidates[0].content.parts[0].text
      };
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return {
        text: getMockResponse('recommendations'),
        error: 'Failed to get recommendations'
      };
    }
  },

  // AI-powered event description enhancement
  enhanceDescription: async (description: string): Promise<AIResponse> => {
    try {
      const response = await fetch(
        `${API_URL}?key=${API_KEY}`,
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

      if (!response.ok) {
        return {
          text: description,
          error: 'API connection failed'
        };
      }

      const data = await response.json();
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        return {
          text: description,
          error: 'API returned unexpected format'
        };
      }
      
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
        `${API_URL}?key=${API_KEY}`,
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

      if (!response.ok) {
        // Return some mock tags if API fails
        return getMockResponse('tags').split(', ');
      }

      const data = await response.json();
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        return getMockResponse('tags').split(', ');
      }
      
      const tags = data.candidates[0].content.parts[0].text.split(',').map((tag: string) => tag.trim());
      return tags;
    } catch (error) {
      console.error('Error generating tags:', error);
      return getMockResponse('tags').split(', ');
    }
  },
  
  // Generate story content
  generateStoryContent: async (prompt: string): Promise<string> => {
    try {
      const response = await fetch(
        `${API_URL}?key=${API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Write a short, engaging story or caption about this event experience (60-100 words): ${prompt}`
              }]
            }]
          })
        }
      );

      if (!response.ok) {
        return `Thanks for sharing your experience at ${prompt}! It sounds like an amazing time. The event surely created memorable moments and connections. Keep sharing your adventures!`;
      }

      const data = await response.json();
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        return `Thanks for sharing your experience at ${prompt}! It sounds like an amazing time. The event surely created memorable moments and connections. Keep sharing your adventures!`;
      }
      
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Error generating story content:', error);
      return `Thanks for sharing your experience at ${prompt}! It sounds like an amazing time. The event surely created memorable moments and connections. Keep sharing your adventures!`;
    }
  }
};
