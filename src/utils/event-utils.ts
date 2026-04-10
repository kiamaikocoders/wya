
import { Event } from '@/types/event.types';

export const sortEventsByDate = (events: Event[]): Event[] => {
  return [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const filterEventsByCategory = (events: Event[], category: string): Event[] => {
  return events.filter(event => event.category.toLowerCase() === category.toLowerCase());
};

export const getFeaturedEvents = (events: Event[]): Event[] => {
  return events.filter(event => event.featured || event.is_featured);
};

export const eventLastDayIso = (event: { date: string; end_date?: string | null }): string => {
  const fromEnd = event.end_date && String(event.end_date).slice(0, 10);
  if (fromEnd) return fromEnd;
  return new Date(event.date).toISOString().slice(0, 10);
};

export const getUpcomingEvents = (events: Event[]): Event[] => {
  const todayStr = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate()
  )
    .toISOString()
    .slice(0, 10);
  return events.filter(event => eventLastDayIso(event) >= todayStr);
};

// Add the missing formatDate function that was referenced in EventDetails.tsx
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
