import { supabase } from './supabase';
import { toast } from 'sonner';

export interface UploadOptions {
  bucket: string;
  folder?: string;
  fileName?: string;
  upsert?: boolean;
}

export interface UploadResult {
  path: string;
  publicUrl: string;
  fullPath: string;
}

export interface StorageBucket {
  id: string;
  name: string;
  public: boolean;
  file_size_limit: number;
  allowed_mime_types: string[];
}

export const storageService = {
  // ==============================================
  // BUCKET MANAGEMENT
  // ==============================================

  // Get all storage buckets
  getBuckets: async (): Promise<StorageBucket[]> => {
    try {
      const { data, error } = await supabase.storage.listBuckets();

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting storage buckets:', error);
      throw error;
    }
  },

  // Get bucket info
  getBucketInfo: async (bucketName: string): Promise<StorageBucket | null> => {
    try {
      const { data, error } = await supabase.storage.getBucket(bucketName);

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error getting bucket info:', error);
      return null;
    }
  },

  // ==============================================
  // FILE UPLOAD
  // ==============================================

  // Upload file to storage
  uploadFile: async (
    file: File,
    options: UploadOptions
  ): Promise<UploadResult> => {
    try {
      // Get current user for user-specific folders
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to upload files');

      // Generate unique filename if not provided
      const fileExt = file.name.split('.').pop();
      const fileName = options.fileName || `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      
      // Create file path with user folder
      const userFolder = user.id;
      const filePath = options.folder 
        ? `${userFolder}/${options.folder}/${fileName}`
        : `${userFolder}/${fileName}`;

      // Upload file
      const { data, error } = await supabase.storage
        .from(options.bucket)
        .upload(filePath, file, {
          upsert: options.upsert || false,
          cacheControl: '3600'
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(options.bucket)
        .getPublicUrl(filePath);

      return {
        path: data.path,
        publicUrl: urlData.publicUrl,
        fullPath: `${options.bucket}/${data.path}`
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
      throw error;
    }
  },

  // Upload multiple files
  uploadMultipleFiles: async (
    files: File[],
    options: UploadOptions
  ): Promise<UploadResult[]> => {
    try {
      const uploadPromises = files.map(file => 
        storageService.uploadFile(file, options)
      );

      const results = await Promise.all(uploadPromises);
      toast.success(`${files.length} files uploaded successfully`);
      
      return results;
    } catch (error) {
      console.error('Error uploading multiple files:', error);
      toast.error('Failed to upload files');
      throw error;
    }
  },

  // ==============================================
  // FILE MANAGEMENT
  // ==============================================

  // Get file list from bucket
  getFiles: async (
    bucketName: string,
    folder?: string,
    limit: number = 100
  ): Promise<any[]> => {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .list(folder, {
          limit,
          offset: 0
        });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting files:', error);
      throw error;
    }
  },

  // Delete file
  deleteFile: async (bucketName: string, filePath: string): Promise<boolean> => {
    try {
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (error) throw error;

      toast.success('File deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
      return false;
    }
  },

  // Get file public URL
  getPublicUrl: (bucketName: string, filePath: string): string => {
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  // Get signed URL for private files
  getSignedUrl: async (
    bucketName: string,
    filePath: string,
    expiresIn: number = 3600
  ): Promise<string> => {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, expiresIn);

      if (error) throw error;

      return data.signedUrl;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      throw error;
    }
  },

  // ==============================================
  // SPECIALIZED UPLOAD FUNCTIONS
  // ==============================================

  // Upload avatar image
  uploadAvatar: async (file: File, userId: string): Promise<UploadResult> => {
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Only image files are allowed for avatars');
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Avatar file size must be less than 5MB');
      }

      const result = await storageService.uploadFile(file, {
        bucket: 'avatars',
        folder: userId,
        fileName: `avatar-${Date.now()}.${file.name.split('.').pop()}`
      });

      toast.success('Avatar uploaded successfully');
      return result;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
      throw error;
    }
  },

  // Upload event image
  uploadEventImage: async (file: File, eventId: number): Promise<UploadResult> => {
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Only image files are allowed for event images');
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Event image file size must be less than 10MB');
      }

      const result = await storageService.uploadFile(file, {
        bucket: 'event-images',
        folder: eventId.toString(),
        fileName: `event-${Date.now()}.${file.name.split('.').pop()}`
      });

      toast.success('Event image uploaded successfully');
      return result;
    } catch (error) {
      console.error('Error uploading event image:', error);
      toast.error('Failed to upload event image');
      throw error;
    }
  },

  // Upload story media
  uploadStoryMedia: async (file: File, userId: string): Promise<UploadResult> => {
    try {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type for story media');
      }

      // Validate file size (100MB limit)
      if (file.size > 100 * 1024 * 1024) {
        throw new Error('Story media file size must be less than 100MB');
      }

      const result = await storageService.uploadFile(file, {
        bucket: 'stories',
        folder: userId,
        fileName: `story-${Date.now()}.${file.name.split('.').pop()}`
      });

      toast.success('Story media uploaded successfully');
      return result;
    } catch (error) {
      console.error('Error uploading story media:', error);
      toast.error('Failed to upload story media');
      throw error;
    }
  },

  // Upload throwback media
  uploadThrowbackMedia: async (file: File, userId: string): Promise<UploadResult> => {
    try {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type for throwback media');
      }

      // Validate file size (100MB limit)
      if (file.size > 100 * 1024 * 1024) {
        throw new Error('Throwback media file size must be less than 100MB');
      }

      const result = await storageService.uploadFile(file, {
        bucket: 'throwbacks',
        folder: userId,
        fileName: `throwback-${Date.now()}.${file.name.split('.').pop()}`
      });

      toast.success('Throwback media uploaded successfully');
      return result;
    } catch (error) {
      console.error('Error uploading throwback media:', error);
      toast.error('Failed to upload throwback media');
      throw error;
    }
  },

  // Upload community content
  uploadCommunityContent: async (file: File, userId: string): Promise<UploadResult> => {
    try {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type for community content');
      }

      // Validate file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        throw new Error('Community content file size must be less than 50MB');
      }

      const result = await storageService.uploadFile(file, {
        bucket: 'community-content',
        folder: userId,
        fileName: `community-${Date.now()}.${file.name.split('.').pop()}`
      });

      toast.success('Community content uploaded successfully');
      return result;
    } catch (error) {
      console.error('Error uploading community content:', error);
      toast.error('Failed to upload community content');
      throw error;
    }
  },

  // ==============================================
  // FILE VALIDATION
  // ==============================================

  // Validate file type
  validateFileType: (file: File, allowedTypes: string[]): boolean => {
    return allowedTypes.includes(file.type);
  },

  // Validate file size
  validateFileSize: (file: File, maxSizeInMB: number): boolean => {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return file.size <= maxSizeInBytes;
  },

  // Get file info
  getFileInfo: (file: File) => {
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    };
  },

  // ==============================================
  // UTILITY FUNCTIONS
  // ==============================================

  // Generate unique filename
  generateUniqueFileName: (originalName: string, prefix?: string): string => {
    const fileExt = originalName.split('.').pop();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const prefixStr = prefix ? `${prefix}-` : '';
    
    return `${prefixStr}${timestamp}-${random}.${fileExt}`;
  },

  // Format file size
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Check if file is image
  isImageFile: (file: File): boolean => {
    return file.type.startsWith('image/');
  },

  // Check if file is video
  isVideoFile: (file: File): boolean => {
    return file.type.startsWith('video/');
  }
};

