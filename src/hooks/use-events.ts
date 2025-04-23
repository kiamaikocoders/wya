
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { eventService } from '@/lib/event-service';
import type { Event, CreateEventPayload, UpdateEventPayload } from '@/types/event.types';

export function useEvents() {
  const queryClient = useQueryClient();

  const { data: events, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: eventService.getAllEvents,
  });

  const createEventMutation = useMutation({
    mutationFn: (eventData: CreateEventPayload) => eventService.createEvent(eventData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event created successfully!');
    },
    onError: (error) => {
      console.error('Error creating event:', error);
      toast.error('Failed to create event');
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: (eventData: UpdateEventPayload) => eventService.updateEvent(eventData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event updated successfully!');
    },
    onError: (error) => {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: (eventId: number) => eventService.deleteEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event deleted successfully!');
    },
    onError: (error) => {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    },
  });

  return {
    events,
    isLoading,
    createEvent: createEventMutation.mutate,
    updateEvent: updateEventMutation.mutate,
    deleteEvent: deleteEventMutation.mutate,
    isCreating: createEventMutation.isPending,
    isUpdating: updateEventMutation.isPending,
    isDeleting: deleteEventMutation.isPending,
  };
}
