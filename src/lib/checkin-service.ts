import { supabase } from './supabase';
import { toast } from 'sonner';

export interface CheckInData {
  id: number;
  event_id: number;
  user_id: string;
  ticket_id: number;
  qr_code: string;
  checkin_code: string;
  checked_in_at: string;
  checkin_method: string;
  location_data?: any;
  device_info?: any;
  verified: boolean;
}

export interface QRCodeData {
  ticket_id: number;
  event_id: number;
  user_id: string;
  checkin_code: string;
  timestamp: number;
  type: string;
}

export interface AttendanceAnalytics {
  event_id: number;
  total_registered: number;
  total_checked_in: number;
  checkin_rate: number;
  checkin_timeline: Array<{
    time: string;
    count: number;
  }>;
  peak_attendance_time: string;
  last_updated: string;
}

export const checkinService = {
  // Generate QR code for ticket
  generateTicketQRCode: async (
    ticketId: number,
    eventId: number,
    userId: string
  ): Promise<string> => {
    try {
      const { data, error } = await supabase.rpc('generate_ticket_qr_code', {
        p_ticket_id: ticketId,
        p_event_id: eventId,
        p_user_id: userId
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
      throw error;
    }
  },

  // Process check-in with QR code
  processCheckIn: async (
    qrCode: string,
    checkinLocation?: any,
    deviceInfo?: any
  ): Promise<any> => {
    try {
      const { data, error } = await supabase.rpc('process_checkin', {
        p_qr_code: qrCode,
        p_checkin_location: checkinLocation,
        p_device_info: deviceInfo
      });

      if (error) throw error;

      toast.success('Successfully checked in to event!');
      return data;
    } catch (error) {
      console.error('Error processing check-in:', error);
      toast.error('Failed to process check-in');
      throw error;
    }
  },

  // Get event attendance analytics
  getEventAttendanceAnalytics: async (eventId: number): Promise<AttendanceAnalytics> => {
    try {
      const { data, error } = await supabase.rpc('get_event_attendance_analytics', {
        p_event_id: eventId
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error getting attendance analytics:', error);
      throw error;
    }
  },

  // Generate bulk QR codes for event
  generateBulkQRCodes: async (eventId: number): Promise<any> => {
    try {
      const { data, error } = await supabase.rpc('generate_bulk_qr_codes', {
        p_event_id: eventId
      });

      if (error) throw error;

      toast.success('Bulk QR codes generated successfully');
      return data;
    } catch (error) {
      console.error('Error generating bulk QR codes:', error);
      toast.error('Failed to generate bulk QR codes');
      throw error;
    }
  },

  // Get user's check-ins
  getUserCheckIns: async (userId?: string): Promise<CheckInData[]> => {
    try {
      const { data, error } = await supabase
        .from('event_checkins')
        .select('*')
        .eq('user_id', userId)
        .order('checked_in_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting user check-ins:', error);
      throw error;
    }
  },

  // Get event check-ins (for organizers)
  getEventCheckIns: async (eventId: number): Promise<CheckInData[]> => {
    try {
      const { data, error } = await supabase
        .from('event_checkins')
        .select(`
          *,
          profiles:user_id(id, full_name, avatar_url, username),
          tickets:ticket_id(id, ticket_type, reference_code)
        `)
        .eq('event_id', eventId)
        .order('checked_in_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting event check-ins:', error);
      throw error;
    }
  },

  // Validate QR code without processing check-in
  validateQRCode: async (qrCode: string): Promise<any> => {
    try {
      const { data, error } = await supabase
        .from('qr_code_logs')
        .select(`
          *,
          tickets:ticket_id(id, ticket_type, status, event_id),
          events:event_id(id, title, date, location)
        `)
        .eq('qr_code', qrCode)
        .eq('status', 'active')
        .single();

      if (error) throw error;

      // Check if QR code is expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        throw new Error('QR code has expired');
      }

      return data;
    } catch (error) {
      console.error('Error validating QR code:', error);
      throw error;
    }
  },

  // Get QR code status
  getQRCodeStatus: async (qrCode: string): Promise<any> => {
    try {
      const { data, error } = await supabase
        .from('qr_code_logs')
        .select('*')
        .eq('qr_code', qrCode)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error getting QR code status:', error);
      throw error;
    }
  }
};
