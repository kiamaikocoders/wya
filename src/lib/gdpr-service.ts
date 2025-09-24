import { supabase } from './supabase';
import { toast } from 'sonner';

export interface GDPRDataExport {
  profile: any;
  events: any[];
  tickets: any[];
  payments: any[];
  notifications: any[];
  messages_sent: any[];
  messages_received: any[];
  favorites: any[];
  follows: any[];
  followers: any[];
  stories: any[];
  forum_posts: any[];
  forum_comments: any[];
  survey_responses: any[];
  exported_at: string;
  data_subject_id: string;
}

export interface GDPRRequest {
  type: 'export' | 'delete' | 'anonymize';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
}

export const gdprService = {
  // Export all user data
  exportUserData: async (userId?: string): Promise<GDPRDataExport> => {
    try {
      const { data, error } = await supabase.rpc('export_user_data', {
        user_uuid: userId
      });

      if (error) throw error;

      toast.success('Data export completed successfully');
      return data;
    } catch (error) {
      console.error('Error exporting user data:', error);
      toast.error('Failed to export user data');
      throw error;
    }
  },

  // Delete all user data (Right to be Forgotten)
  deleteUserData: async (userId?: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('delete_user_data', {
        user_uuid: userId
      });

      if (error) throw error;

      toast.success('User data deleted successfully');
      return data;
    } catch (error) {
      console.error('Error deleting user data:', error);
      toast.error('Failed to delete user data');
      throw error;
    }
  },

  // Anonymize user data (Soft delete)
  anonymizeUserData: async (userId?: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('anonymize_user_data', {
        user_uuid: userId
      });

      if (error) throw error;

      toast.success('User data anonymized successfully');
      return data;
    } catch (error) {
      console.error('Error anonymizing user data:', error);
      toast.error('Failed to anonymize user data');
      throw error;
    }
  },

  // Check data retention compliance
  checkDataRetention: async (): Promise<any> => {
    try {
      const { data, error } = await supabase.rpc('check_data_retention');

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error checking data retention:', error);
      throw error;
    }
  },

  // Clean up old data
  cleanupOldData: async (): Promise<any> => {
    try {
      const { data, error } = await supabase.rpc('cleanup_old_data');

      if (error) throw error;

      toast.success('Data cleanup completed successfully');
      return data;
    } catch (error) {
      console.error('Error cleaning up old data:', error);
      toast.error('Failed to clean up old data');
      throw error;
    }
  },

  // Log data access for audit
  logDataAccess: async (
    actionType: string,
    tableName: string,
    recordId: string,
    additionalData?: any
  ): Promise<void> => {
    try {
      await supabase.rpc('log_data_access', {
        action_type: actionType,
        table_name: tableName,
        record_id: recordId,
        additional_data: additionalData
      });
    } catch (error) {
      console.error('Error logging data access:', error);
    }
  }
};
