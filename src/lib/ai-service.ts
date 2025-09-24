
import { toast } from 'sonner';

// Use the correct API endpoint for Gemini API (updated endpoint)
const API_KEY = 'AIzaSyBRF6q949E70yC36OvT-BYsGBeP7Jfux9Y';
const API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';

interface AIResponse {
  text: string;
  error?: string;
}

interface ImageGenerationResponse {
  url: string;
  error?: string;
}

interface CategorySuggestion {
  name: string;
  confidence: number;
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
    case 'chat':
      return 'I can help you plan your event! Consider the venue, date, target audience, and your budget as starting points.';
    case 'sentiment':
      return 'The overall sentiment of this review is positive. Key highlights include excellent organization, friendly staff, and engaging content.';
    case 'category':
      return 'This event appears to be primarily a Cultural event, with elements of Food & Drink and Music as secondary categories.';
    case 'image':
      return 'A vibrant event poster with bold colors showcasing the event details against a backdrop that captures the essence of the event theme.';
    default:
      return 'AI response unavailable at the moment. Please try again later.';
  }
};

// Sample image URLs for different event types
const sampleImageURLs = {
  'Music': [
    'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070',
    'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?q=80&w=2070',
    'https://images.unsplash.com/photo-1470229538611-16ba8c7ffbd7?q=80&w=2070'
  ],
  'Food': [
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=2787',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070',
    'https://images.unsplash.com/photo-1540914124281-342587941389?q=80&w=2674'
  ],
  'Technology': [
    'https://images.unsplash.com/photo-1523961131990-5ea7c61b2107?q=80&w=2074',
    'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?q=80&w=2070',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070'
  ],
  'Culture': [
    'https://images.unsplash.com/photo-1528605105345-5344ea20e269?q=80&w=2070',
    'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?q=80&w=2071',
    'https://images.unsplash.com/photo-1576075796033-848c2a5f3696?q=80&w=2144'
  ],
  'Sports': [
    'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?q=80&w=2007',
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=2070',
    'https://images.unsplash.com/photo-1472653431158-6364773b2a56?q=80&w=2069'
  ],
  'Art': [
    'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?q=80&w=2015',
    'https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?q=80&w=2835',
    'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?q=80&w=2070'
  ],
  'Business': [
    'https://images.unsplash.com/photo-1573164574572-cb89e39749b4?q=80&w=2069',
    'https://images.unsplash.com/photo-1576267423445-b2e0074d68a4?q=80&w=2070',
    'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=2069'
  ]
};

// Helper function to make API requests
const makeAIRequest = async (prompt: string): Promise<AIResponse> => {
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
              text: prompt
            }]
          }]
        })
      }
    );

    if (!response.ok) {
      console.warn(`API request failed with status: ${response.status}`);
      throw new Error(`API request failed with status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('API returned unexpected format');
    }
    
    return {
      text: data.candidates[0].content.parts[0].text
    };
  } catch (error) {
    console.error('Error making AI request:', error);
    throw error;
  }
};

export const aiService = {
  // Content moderation
  moderateContent: async (text: string): Promise<boolean> => {
    try {
      const result = await makeAIRequest(`Analyze this content and respond with "true" if it's appropriate or "false" if it contains inappropriate content: "${text}"`);
      return result.text.toLowerCase().includes('true');
    } catch (error) {
      console.warn('Content moderation failed. Allowing content by default.');
      return true;
    }
  },

  // AI-powered event recommendations
  getEventRecommendations: async (userInterests: string[]): Promise<AIResponse> => {
    try {
      const result = await makeAIRequest(`Based on these interests: ${userInterests.join(', ')}, suggest some event types that would be appealing. Keep it concise.`);
      return result;
    } catch (error) {
      console.info('Using mock recommendations due to API error:', error);
      return {
        text: getMockResponse('recommendations')
      };
    }
  },

  // AI-powered event description enhancement
  enhanceDescription: async (description: string): Promise<AIResponse> => {
    try {
      const result = await makeAIRequest(`Enhance this event description to be more engaging while keeping the main information: "${description}". Keep it concise.`);
      return result;
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
      const result = await makeAIRequest(`Generate 5 relevant hashtags for this event description: "${description}". Respond only with the hashtags separated by commas, without #.`);
      const tags = result.text.split(',').map((tag: string) => tag.trim());
      return tags;
    } catch (error) {
      console.error('Error generating tags:', error);
      return getMockResponse('tags').split(', ');
    }
  },
  
  // Generate story content
  generateStoryContent: async (prompt: string): Promise<string> => {
    try {
      const result = await makeAIRequest(`Write a short, engaging story or caption about this event experience (60-100 words): ${prompt}`);
      return result.text;
    } catch (error) {
      console.error('Error generating story content:', error);
      return `Thanks for sharing your experience at ${prompt}! It sounds like an amazing time. The event surely created memorable moments and connections. Keep sharing your adventures!`;
    }
  },

  // NEW: Generate image for event
  generateEventImage: async (description: string, category: string): Promise<ImageGenerationResponse> => {
    try {
      // In a real implementation, we would call an image generation API
      // For now, we'll use sample images based on category
      const categoryImages = sampleImageURLs[category as keyof typeof sampleImageURLs] || sampleImageURLs.Culture;
      const randomIndex = Math.floor(Math.random() * categoryImages.length);
      
      return {
        url: categoryImages[randomIndex]
      };
    } catch (error) {
      console.error('Error generating image:', error);
      // Return a default image
      return {
        url: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?q=80&w=2070',
        error: 'Failed to generate image'
      };
    }
  },

  // NEW: Smart event categorization
  suggestEventCategories: async (description: string, title: string): Promise<CategorySuggestion[]> => {
    try {
      const result = await makeAIRequest(
        `Analyze this event title and description and suggest the best category matches from this list: Music, Food, Technology, Culture, Sports, Art, Business.
        Title: "${title}"
        Description: "${description}"
        Format your response as a JSON array of objects with "name" and "confidence" (a number between 0 and 1) properties, sorted by confidence descending.`
      );
      
      try {
        // Try to parse the response as JSON
        return JSON.parse(result.text);
      } catch (parseError) {
        // If parsing fails, extract categories mentioned in the text
        const categories = ['Music', 'Food', 'Technology', 'Culture', 'Sports', 'Art', 'Business'];
        return categories
          .filter(category => result.text.toLowerCase().includes(category.toLowerCase()))
          .map(category => ({ 
            name: category, 
            confidence: result.text.toLowerCase().includes(category.toLowerCase()) ? 0.8 : 0.1 
          }))
          .sort((a, b) => b.confidence - a.confidence);
      }
    } catch (error) {
      console.error('Error suggesting categories:', error);
      return [
        { name: 'Culture', confidence: 0.8 },
        { name: 'Art', confidence: 0.6 },
        { name: 'Music', confidence: 0.4 }
      ];
    }
  },

  // NEW: Analyze event review sentiment
  analyzeSentiment: async (review: string): Promise<AIResponse> => {
    try {
      const result = await makeAIRequest(
        `Analyze the sentiment of this event review and provide a brief summary of key points: "${review}"`
      );
      return result;
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return {
        text: getMockResponse('sentiment'),
        error: 'Failed to analyze sentiment'
      };
    }
  },

  // NEW: Event planning assistant chat
  getEventPlanningAdvice: async (query: string): Promise<AIResponse> => {
    try {
      const result = await makeAIRequest(
        `As an event planning assistant, provide helpful advice for this query: "${query}". Keep it concise and actionable.`
      );
      return result;
    } catch (error) {
      console.error('Error getting event planning advice:', error);
      return {
        text: getMockResponse('chat'),
        error: 'Failed to get advice'
      };
    }
  },
  
  // NEW: Generate event name suggestions
  generateEventNames: async (description: string, category: string): Promise<string[]> => {
    try {
      const result = await makeAIRequest(
        `Generate 5 creative and catchy event names for a ${category} event with this description: "${description}". 
        Provide only the names separated by commas without numbers or explanations.`
      );
      return result.text.split(',').map(name => name.trim());
    } catch (error) {
      console.error('Error generating event names:', error);
      return [
        `${category} Fest 2024`,
        `The Ultimate ${category} Experience`,
        `${category} Showcase`,
        `${category} Extravaganza`,
        `${category} Celebration`
      ];
    }
  }
};
