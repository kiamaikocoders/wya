
import { Event } from '@/types/event.types';

export const sortEventsByDate = (events: Event[]): Event[] => {
  return [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const filterEventsByCategory = (events: Event[], category: string): Event[] => {
  return events.filter(event => event.category.toLowerCase() === category.toLowerCase());
};

export const getFeaturedEvents = (events: Event[]): Event[] => {
  return events.filter(event => event.is_featured);
};

export const getUpcomingEvents = (events: Event[]): Event[] => {
  const now = new Date();
  return events.filter(event => new Date(event.date) >= now);
};

// Add the missing formatDate function
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
