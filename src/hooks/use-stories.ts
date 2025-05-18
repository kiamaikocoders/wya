
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storyService } from '@/lib/story/story-service';
import type { Story, CreateStoryDto, StoryComment, CreateStoryCommentDto } from '@/lib/story/types';

export function useStories(eventId?: number) {
  const queryClient = useQueryClient();

  const { data: stories, isLoading } = useQuery({
    queryKey: eventId ? ['stories', eventId] : ['stories'],
    queryFn: () => storyService.getAllStories(eventId),
  });

  const createStoryMutation = useMutation({
    mutationFn: (storyData: CreateStoryDto) => storyService.createStory(storyData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      if (eventId) {
        queryClient.invalidateQueries({ queryKey: ['stories', eventId] });
      }
    },
  });

  const updateStoryMutation = useMutation({
    mutationFn: ({ storyId, storyData }: { storyId: number; storyData: Partial<Story> }) => 
      storyService.updateStory(storyId, storyData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      if (eventId) {
        queryClient.invalidateQueries({ queryKey: ['stories', eventId] });
      }
    },
  });

  const deleteStoryMutation = useMutation({
    mutationFn: (storyId: number) => storyService.deleteStory(storyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      if (eventId) {
        queryClient.invalidateQueries({ queryKey: ['stories', eventId] });
      }
    },
  });

  return {
    stories,
    isLoading,
    createStory: createStoryMutation.mutate,
    updateStory: updateStoryMutation.mutate,
    deleteStory: deleteStoryMutation.mutate,
    isCreating: createStoryMutation.isPending,
    isUpdating: updateStoryMutation.isPending,
    isDeleting: deleteStoryMutation.isPending,
  };
}

export function useStoryComments(storyId: number) {
  const queryClient = useQueryClient();

  const { data: comments, isLoading } = useQuery({
    queryKey: ['storyComments', storyId],
    queryFn: () => storyService.getStoryComments(storyId),
    enabled: !!storyId,
  });

  const createCommentMutation = useMutation({
    mutationFn: (commentData: CreateStoryCommentDto) => storyService.createStoryComment(commentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storyComments', storyId] });
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });

  return {
    comments,
    isLoading,
    createComment: createCommentMutation.mutate,
    isCreating: createCommentMutation.isPending,
  };
}

export function useStoryLike(storyId: number) {
  const queryClient = useQueryClient();

  const { data: hasLiked, isLoading } = useQuery({
    queryKey: ['storyLike', storyId],
    queryFn: () => storyService.hasUserLikedStory(storyId),
    enabled: !!storyId,
  });

  const toggleLikeMutation = useMutation({
    mutationFn: (id: number) => storyService.likeStory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storyLike', storyId] });
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });

  return {
    hasLiked,
    isLoading,
    toggleLike: () => toggleLikeMutation.mutate(storyId),
    isToggling: toggleLikeMutation.isPending,
  };
}

export function useFeaturedStories() {
  const { data: featuredStories, isLoading } = useQuery({
    queryKey: ['featuredStories'],
    queryFn: () => storyService.getFeaturedStories(),
  });

  return {
    featuredStories,
    isLoading,
  };
}
