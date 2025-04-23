
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
