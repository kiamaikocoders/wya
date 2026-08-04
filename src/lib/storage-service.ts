import { supabase } from './supabase';
import { toast } from 'sonner';
import {
  prepareMediaForUpload,
  type MediaUploadContext,
} from './media-upload-prepare';
import { R2_PUBLIC_BASE_URL, uploadToR2 } from './r2-upload';

export interface UploadOptions {
  bucket: string;
  folder?: string;
  fileName?: string;
  upsert?: boolean;
  /** When set, image/video is resized, re-encoded, or validated before upload */
  mediaContext?: MediaUploadContext;
  /** Override default long-lived cache (unique object paths only) */
  cacheControl?: string;
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

/** Parse a Supabase public storage URL into bucket + object path. */
export function parseSupabaseStoragePublicUrl(
  url: string
): { bucket: string; path: string } | null {
  try {
    const parsed = new URL(url);
    const marker = '/storage/v1/object/public/';
    const markerIndex = parsed.pathname.indexOf(marker);
    if (markerIndex === -1) return null;

    const remainder = decodeURIComponent(
      parsed.pathname.slice(markerIndex + marker.length)
    );
    const slashIndex = remainder.indexOf('/');
    if (slashIndex <= 0) return null;

    return {
      bucket: remainder.slice(0, slashIndex),
      path: remainder.slice(slashIndex + 1),
    };
  } catch {
    return null;
  }
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
      throw error;
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

      const context = options.mediaContext ?? 'generic';
      const fileToUpload =
        context === 'generic'
          ? file
          : await prepareMediaForUpload(file, context);

      // Generate unique filename if not provided
      const fileExt = fileToUpload.name.split('.').pop();
      const fileName =
        options.fileName ||
        `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      
      // Create file path with user folder
      const userFolder = user.id;
      const filePath = options.folder
        ? `${userFolder}/${options.folder}/${fileName}`
        : `${userFolder}/${fileName}`;

      return await uploadToR2({
        bucket: options.bucket,
        file: fileToUpload,
        path: filePath,
        contentType: fileToUpload.type || 'application/octet-stream',
      });
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
  deleteFile: async (bucketName: string, filePath: string): Promise<void> => {
    try {
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (error) throw error;

      toast.success('File deleted successfully');
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
      throw error;
    }
  },

  // Get file public URL (CDN for new keys)
  getPublicUrl: (bucketName: string, filePath: string): string => {
    return `${R2_PUBLIC_BASE_URL}/${bucketName}/${filePath.replace(/^\//, '')}`;
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

      const result = await storageService.uploadFile(file, {
        bucket: 'avatars',
        folder: userId,
        fileName: `avatar-${Date.now()}.${file.name.split('.').pop()}`,
        mediaContext: 'avatar',
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

      const result = await storageService.uploadFile(file, {
        bucket: 'event-images',
        folder: eventId.toString(),
        fileName: `event-${Date.now()}.${file.name.split('.').pop()}`,
        mediaContext: 'event-image',
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

      const result = await storageService.uploadFile(file, {
        bucket: 'throwbacks',
        folder: userId,
        fileName: `throwback-${Date.now()}.${file.name.split('.').pop()}`,
        mediaContext: 'throwback',
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

      const result = await storageService.uploadFile(file, {
        bucket: 'community-content',
        folder: userId,
        fileName: `community-${Date.now()}.${file.name.split('.').pop()}`,
        mediaContext: 'community',
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

