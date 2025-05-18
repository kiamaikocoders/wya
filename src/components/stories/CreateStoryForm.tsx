
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { ImagePlus, X } from 'lucide-react';
import { useStories } from '@/hooks/use-stories';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { CreateStoryDto } from '@/lib/story/types';

interface CreateStoryFormProps {
  eventId?: number;
  onSuccess?: () => void;
}

const CreateStoryForm: React.FC<CreateStoryFormProps> = ({ eventId, onSuccess }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { createStory, isCreating } = useStories(eventId);

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
    try {
      const storyData: CreateStoryDto = {
        content: values.content,
        event_id: eventId
      };

      // Upload image if provided
      if (values.media_file && values.media_file.length > 0) {
        const url = await handleImageUpload(values.media_file[0]);
        storyData.media_url = url;
      }

      // Create the story
      createStory(storyData, {
        onSuccess: () => {
          form.reset();
          setPreviewUrl(null);
          if (onSuccess) onSuccess();
        }
      });
    } catch (error) {
      console.error('Error creating story:', error);
    }
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
                  className="min-h-[100px] bg-black/10 border-kenya-brown/30 text-white placeholder:text-gray-400"
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
            disabled={isUploading || isCreating}
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
              className="cursor-pointer flex items-center justify-center h-20 w-20 border border-dashed border-kenya-brown/50 rounded hover:bg-kenya-brown/10 transition-colors"
            >
              <ImagePlus size={24} className="text-kenya-brown-light" />
            </label>
          )}

          <Button
            type="submit"
            className="ml-auto bg-kenya-orange hover:bg-kenya-orange/90"
            disabled={isUploading || isCreating || form.formState.isSubmitting}
          >
            {isUploading || isCreating ? 'Posting...' : 'Post Story'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CreateStoryForm;
