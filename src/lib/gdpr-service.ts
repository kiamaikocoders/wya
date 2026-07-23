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

export type DataSubjectRequestType = 'export' | 'delete' | 'anonymize' | 'access';
export type DataSubjectRequestStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface DataSubjectRequestRow {
  id: string;
  user_id: string;
  request_type: DataSubjectRequestType;
  status: DataSubjectRequestStatus;
  created_at: string;
  completed_at: string | null;
  failure_reason: string | null;
  metadata: Record<string, unknown> | null;
}

export const gdprService = {
  exportUserData: async (
    userId?: string,
    opts?: { silent?: boolean }
  ): Promise<GDPRDataExport> => {
    try {
      const { data, error } = await supabase.rpc('export_user_data', {
        user_uuid: userId,
      });

      if (error) throw error;

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const uid = userId || user?.id;
        if (uid) {
          const { notificationService } = await import('@/lib/notification/notification-service');
          await notificationService.createNotification({
            user_id: uid,
            type: 'dsar_export',
            title: 'Data export ready',
            message: 'Your WYA data export completed. Download it from Settings if you saved it.',
            link: '/settings',
          });
        }
      } catch (e) {
        console.warn('DSAR export notify failed', e);
      }

      if (!opts?.silent) toast.success('Data export completed successfully');
      return data;
    } catch (error) {
      console.error('Error exporting user data:', error);
      if (!opts?.silent) toast.error('Failed to export user data');
      throw error;
    }
  },

  deleteUserData: async (userId?: string, opts?: { silent?: boolean }): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('delete_user_data', {
        user_uuid: userId,
      });

      if (error) throw error;

      if (!opts?.silent) toast.success('User data deleted successfully');
      return data;
    } catch (error) {
      console.error('Error deleting user data:', error);
      if (!opts?.silent) toast.error('Failed to delete user data');
      throw error;
    }
  },

  anonymizeUserData: async (userId?: string, opts?: { silent?: boolean }): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('anonymize_user_data', {
        user_uuid: userId,
      });

      if (error) throw error;

      if (!opts?.silent) toast.success('User data anonymized successfully');
      return data;
    } catch (error) {
      console.error('Error anonymizing user data:', error);
      if (!opts?.silent) toast.error('Failed to anonymize user data');
      throw error;
    }
  },

  listMyDataSubjectRequests: async (limit = 20): Promise<DataSubjectRequestRow[]> => {
    const { data, error } = await supabase
      .from('data_subject_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as DataSubjectRequestRow[];
  },

  createDataSubjectRequest: async (params: {
    request_type: DataSubjectRequestType;
    metadata?: Record<string, unknown>;
  }): Promise<DataSubjectRequestRow> => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) throw new Error('Not signed in');

    const { data, error } = await supabase
      .from('data_subject_requests')
      .insert({
        user_id: uid,
        request_type: params.request_type,
        status: 'pending',
        metadata: params.metadata ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    return data as DataSubjectRequestRow;
  },

  updateDataSubjectRequest: async (
    id: string,
    patch: Partial<Pick<DataSubjectRequestRow, 'status' | 'completed_at' | 'failure_reason' | 'metadata'>>
  ): Promise<void> => {
    const { error } = await supabase.from('data_subject_requests').update(patch).eq('id', id);
    if (error) throw error;
  },

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
        additional_data: additionalData,
      });
    } catch (error) {
      console.error('Error logging data access:', error);
    }
  },
};
