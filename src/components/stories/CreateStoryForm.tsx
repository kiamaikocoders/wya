
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { ImagePlus, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useMediaConsentPosting } from '@/contexts/MediaConsentPostingContext';
import { storyService } from '@/lib/story/story-service';
import { supabase } from '@/lib/supabase';
import {
  LegalReconsentRequiredForPostingError,
  MediaConsentRequiredForPostingError,
} from '@/lib/posting-guard';
import { toast } from 'sonner';
import { CreateStoryDto } from '@/lib/story/types';

interface CreateStoryFormProps {
  eventId?: number;
  onSuccess?: () => void;
}

const CreateStoryForm: React.FC<CreateStoryFormProps> = ({ eventId, onSuccess }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { runWithPostingConsent } = useMediaConsentPosting();

  const form = useForm<{
    content: string;
    media_file?: FileList;
  }>({
    defaultValues: {
      content: ''
    }
  });

  const handleImageUpload = async (file: File): Promise<string> => {
    setIsUploading(true);
    try {
      // Generate a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `stories/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create a preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    form.setValue('media_file', e.target.files as FileList);
    
    // Clean up the preview URL when component unmounts
    return () => URL.revokeObjectURL(objectUrl);
  };

  const removeImage = () => {
    setPreviewUrl(null);
    form.setValue('media_file', undefined);
  };

  const onSubmit = async (values: { content: string; media_file?: FileList }) => {
    runWithPostingConsent(async () => {
      setIsPosting(true);
      try {
        const storyData: CreateStoryDto = {
          content: values.content,
          event_id: eventId
        };

        if (values.media_file && values.media_file.length > 0) {
          const url = await handleImageUpload(values.media_file[0]);
          storyData.media_url = url;
        }

        const created = await storyService.createStory(storyData);
        if (!created) return;

        await queryClient.invalidateQueries({ queryKey: ['stories'] });
        if (eventId != null) {
          await queryClient.invalidateQueries({ queryKey: ['stories', eventId] });
        }
        form.reset();
        setPreviewUrl(null);
        onSuccess?.();
      } catch (error) {
        if (
          error instanceof MediaConsentRequiredForPostingError ||
          error instanceof LegalReconsentRequiredForPostingError
        ) {
          throw error;
        }
        console.error('Error creating story:', error);
      } finally {
        setIsPosting(false);
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="content"
          rules={{ required: 'Content is required' }}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  placeholder="Share your experience..."
                  className="min-h-[100px] bg-black/10 border-white/20/30 text-white placeholder:text-gray-400"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center space-x-3">
          <input
            type="file"
            id="story-image"
            accept="image/*"
            className="hidden"
            onChange={onFileChange}
            disabled={isUploading || isPosting}
          />
          
          {previewUrl ? (
            <div className="relative h-20 w-20 rounded overflow-hidden">
              <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-0.5 right-0.5 bg-black/50 rounded-full p-0.5"
              >
                <X size={16} className="text-white" />
              </button>
            </div>
          ) : (
            <label
              htmlFor="story-image"
              className="cursor-pointer flex items-center justify-center h-20 w-20 border border-dashed border-white/20/50 rounded hover:bg-gradient-to-br from-gradient-purple-medium/50 to-gradient-purple-bright/30/10 transition-colors"
            >
              <ImagePlus size={24} className="text-text-white/70" />
            </label>
          )}

          <Button
            type="submit"
            className="ml-auto bg-gradient-accent hover:bg-gradient-accent/90"
            disabled={isUploading || isPosting || form.formState.isSubmitting}
          >
            {isUploading || isPosting ? 'Posting...' : 'Post Story'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CreateStoryForm;
