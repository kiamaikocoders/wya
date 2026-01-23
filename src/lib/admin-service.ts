import { supabase } from './supabase';
import { toast } from 'sonner';

export interface AdminUser {
  id: string;
  email?: string;
  name: string;
  username?: string;
  role: 'attendee' | 'organizer' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  profile_picture?: string;
  bio?: string;
  location?: string;
  events_attended?: number;
  events_created?: number;
  followers_count?: number;
  following_count?: number;
  created_at: string;
  last_active?: string;
}

export interface AdminUserStats {
  total_users: number;
  active_users: number;
  new_users_this_month: number;
  attendees: number;
  organizers: number;
  admins: number;
  average_events_per_user: number;
}

export interface AdminEvent {
  id: number;
  title: string;
  description?: string;
  date: string;
  time?: string;
  location: string;
  image_url?: string;
  capacity?: number;
  price?: number;
  category?: string;
  category_id?: number | null;
  organizer_id?: string;
  organizer_name?: string;
  featured?: boolean;
  status?: 'pending' | 'approved' | 'rejected';
  created_at?: string;
  updated_at?: string;
  tickets_sold?: number;
  attendees_count?: number;
  ticket_link?: string | null;
}

export interface AdminEventStats {
  total_events: number;
  pending_events: number;
  approved_events: number;
  rejected_events: number;
  events_this_month: number;
  total_revenue: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminStory {
  id: number;
  user_id: string;
  user_name?: string;
  user_image?: string;
  event_id?: number;
  event_title?: string;
  content: string;
  caption: string;
  media_url?: string;
  media_type: 'image' | 'video';
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at?: string;
}

export const adminService = {
  // ==========================================
  // USER MANAGEMENT
  // ==========================================
  
  // Test function to verify RPC and admin status
  testEmailRPC: async (): Promise<{ success: boolean; message: string; data?: any }> => {
    try {
      // First, verify we're an admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, message: 'No authenticated user' };
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      if (!profile || profile.username !== 'admin') {
        return { 
          success: false, 
          message: `Not an admin. Current username: ${profile?.username || 'not found'}` 
        };
      }

      // Test RPC with a single user ID (the current admin)
      const { data: testEmails, error: testError } = await supabase.rpc('get_user_emails', {
        user_ids: [user.id]
      });

      if (testError) {
        return {
          success: false,
          message: `RPC Error: ${testError.message}`,
          data: testError
        };
      }

      return {
        success: true,
        message: `RPC working! Found ${testEmails?.length || 0} email(s)`,
        data: testEmails
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Exception: ${error?.message || error}`,
        data: error
      };
    }
  },
  
  getUsers: async (options: {
    page?: number;
    pageSize?: number;
    search?: string;
    role?: 'attendee' | 'organizer' | 'admin' | 'all';
    status?: 'active' | 'inactive' | 'suspended' | 'all';
    sortBy?: 'created_at' | 'name' | 'email';
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<AdminUser>> => {
    try {
      const {
        page = 1,
        pageSize = 50,
        search = '',
        role = 'all',
        status = 'all',
        sortBy = 'created_at',
        sortOrder = 'desc',
      } = options;

      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' });

      // Apply search filter
      if (search) {
        query = query.or(`full_name.ilike.%${search}%,username.ilike.%${search}%`);
      }

      // Apply role filter
      if (role !== 'all') {
        if (role === 'admin') {
          query = query.eq('username', 'admin');
        } else {
          // For attendees/organizers, we need to check events they've created
          // This is a simplified approach - in production you might want a roles table
          query = query.neq('username', 'admin');
        }
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // Get user stats (events attended, created, etc.)
      const userIds = data?.map(p => p.id) || [];
      
      // Fetch emails from auth.users using RPC function
      // This requires the get_user_emails RPC function to be created in the database
      let emailMap = new Map<string, string>();
      if (userIds.length > 0) {
        try {
          const { data: userEmails, error: emailError } = await supabase.rpc('get_user_emails', { 
            user_ids: userIds 
          });
          
          if (emailError) {
            // Log error for debugging - this is important to see
            console.error('Failed to fetch user emails via RPC:', {
              error: emailError,
              message: emailError.message,
              details: emailError.details,
              hint: emailError.hint,
              userIdsCount: userIds.length
            });
            console.error('Make sure the get_user_emails RPC function exists. Run migration: 20250124_add_user_emails_rpc.sql');
            // Don't throw - continue without emails but log the error clearly
          } else if (userEmails && Array.isArray(userEmails)) {
            console.log(`Successfully fetched ${userEmails.length} emails for ${userIds.length} users`);
            userEmails.forEach((u: { user_id?: string; id?: string; email: string | null }) => {
              // Handle both old format (id) and new format (user_id)
              const userId = u.user_id || u.id;
              // Only add to map if email exists and is not null/empty
              if (userId && u.email && u.email.trim() !== '') {
                emailMap.set(userId, u.email);
              } else {
                console.warn(`User ${userId} has no email or empty email`);
              }
            });
            console.log(`Email map contains ${emailMap.size} entries`);
          } else {
            console.warn('RPC returned unexpected data format:', userEmails);
          }
        } catch (error: any) {
          // Log but continue - emails are optional
          console.error('Exception fetching user emails:', {
            error,
            message: error?.message,
            stack: error?.stack
          });
          console.error('To fix: Run migration 20250124_add_user_emails_rpc.sql to create the RPC function');
        }
      }
      
      // Get events created count
      const { data: eventsCreated } = await supabase
        .from('events')
        .select('organizer_id')
        .in('organizer_id', userIds);

      // Get events attended count (from tickets)
      const { data: tickets } = await supabase
        .from('tickets')
        .select('user_id')
        .in('user_id', userIds);

      // Get followers/following counts
      const { data: followers } = await supabase
        .from('follows')
        .select('following_id, follower_id')
        .in('following_id', userIds);

      // Build stats maps
      const eventsCreatedMap = new Map<string, number>();
      eventsCreated?.forEach(e => {
        const count = eventsCreatedMap.get(e.organizer_id) || 0;
        eventsCreatedMap.set(e.organizer_id, count + 1);
      });

      const eventsAttendedMap = new Map<string, number>();
      tickets?.forEach(t => {
        const count = eventsAttendedMap.get(t.user_id) || 0;
        eventsAttendedMap.set(t.user_id, count + 1);
      });

      const followersMap = new Map<string, number>();
      const followingMap = new Map<string, number>();
      followers?.forEach(f => {
        const followerCount = followersMap.get(f.following_id) || 0;
        followersMap.set(f.following_id, followerCount + 1);
        const followingCount = followingMap.get(f.follower_id) || 0;
        followingMap.set(f.follower_id, followingCount + 1);
      });

      // Transform data
      const users: AdminUser[] = (data || []).map(profile => {
        const userRole: 'attendee' | 'organizer' | 'admin' = 
          profile.username === 'admin' ? 'admin' :
          (eventsCreatedMap.get(profile.id) || 0) > 0 ? 'organizer' : 'attendee';

        return {
          id: profile.id,
          email: emailMap.get(profile.id) || '',
          name: profile.full_name || profile.username || 'Unknown',
          username: profile.username,
          role: userRole,
          status: 'active' as const, // TODO: Add status field to profiles table
          profile_picture: profile.avatar_url,
          bio: profile.bio,
          location: profile.location,
          events_attended: eventsAttendedMap.get(profile.id) || 0,
          events_created: eventsCreatedMap.get(profile.id) || 0,
          followers_count: followersMap.get(profile.id) || 0,
          following_count: followingMap.get(profile.id) || 0,
          created_at: profile.created_at || new Date().toISOString(),
        };
      });

      // Filter by status (after transformation since status is computed)
      const filteredUsers = status === 'all' 
        ? users 
        : users.filter(u => u.status === status);

      const total = count || 0;
      const totalPages = Math.ceil(total / pageSize);

      return {
        data: filteredUsers,
        total,
        page,
        pageSize,
        totalPages,
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
      throw error;
    }
  },

  getUserStats: async (): Promise<AdminUserStats> => {
    try {
      // Get total users (EXCLUDE ghost users from total count)
      // Get all profiles first, then filter out ghost users by is_ghost flag
      // Note: Some ghost users might have is_ghost=false, so we'll filter by checking auth users
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id, is_ghost')
        .eq('is_ghost', false);
      
      // Also get auth users to check for ghost email pattern
      const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
      const ghostUserIds = new Set(
        authUsers
          ?.filter(u => u.email?.includes('ghost.') && u.email?.endsWith('@wya.local'))
          .map(u => u.id) || []
      );
      
      // Filter out any profiles that are ghost users (by email pattern)
      const realUserProfiles = allProfiles?.filter(p => !ghostUserIds.has(p.id)) || [];
      const totalUsers = realUserProfiles.length;

      // Get admins
      const { count: admins } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('username', 'admin');

      // Get organizers (users who created events)
      const { data: organizerIds } = await supabase
        .from('events')
        .select('organizer_id')
        .not('organizer_id', 'is', null);

      const uniqueOrganizers = new Set(organizerIds?.map(e => e.organizer_id) || []);
      const organizers = uniqueOrganizers.size;

      const attendees = (totalUsers || 0) - admins - organizers;

      // Get active users (users who logged in within last 30 days)
      // EXCLUDE ghost users from active count (by is_ghost flag AND email pattern)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: activeProfiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_ghost', false)
        .gte('updated_at', thirtyDaysAgo.toISOString());
      
      // Filter out ghost users by email pattern
      const realActiveUsers = activeProfiles?.filter(p => !ghostUserIds.has(p.id)) || [];
      const activeUsers = realActiveUsers.length;

      // Get new users this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: newUsersThisMonth } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString());

      // Get average events per user
      const { data: tickets } = await supabase
        .from('tickets')
        .select('user_id');

      const uniqueAttendees = new Set(tickets?.map(t => t.user_id) || []);
      const totalEventsAttended = tickets?.length || 0;
      const averageEventsPerUser = uniqueAttendees.size > 0 
        ? totalEventsAttended / uniqueAttendees.size 
        : 0;

      return {
        total_users: totalUsers || 0,
        active_users: activeUsers || 0,
        new_users_this_month: newUsersThisMonth || 0,
        attendees,
        organizers,
        admins: admins || 0,
        average_events_per_user: Math.round(averageEventsPerUser * 10) / 10,
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  },

  updateUserRole: async (userId: string, role: 'attendee' | 'organizer' | 'admin'): Promise<void> => {
    try {
      // For admin role, update username to 'admin'
      // For others, we'd need a roles table in production
      if (role === 'admin') {
        const { error } = await supabase
          .from('profiles')
          .update({ username: 'admin' })
          .eq('id', userId);
        
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  },

  suspendUser: async (userId: string, reason?: string): Promise<void> => {
    try {
      // TODO: Add status field to profiles table
      // For now, fail explicitly instead of pretending success.
      // Proper suspension should be implemented via a status field + RLS or via a server-side admin endpoint.
      void userId;
      void reason;
      throw new Error('Suspend user is not implemented yet');
    } catch (error) {
      console.error('Error suspending user:', error);
      throw error;
    }
  },

  // ==========================================
  // EVENT MANAGEMENT
  // ==========================================

  getEvents: async (options: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: 'pending' | 'approved' | 'rejected' | 'all';
    category?: string;
    sortBy?: 'created_at' | 'date' | 'title';
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<AdminEvent>> => {
    try {
      const {
        page = 1,
        pageSize = 50,
        search = '',
        status = 'all',
        category,
        sortBy = 'created_at',
        sortOrder = 'desc',
      } = options;

      let query = supabase
        .from('events')
        .select('*', { count: 'exact' });

      // Apply search filter
      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%`);
      }

      // Apply category filter
      if (category) {
        query = query.eq('category', category);
      }

      // Apply status filter
      if (status !== 'all') {
        query = query.eq('status', status);
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // Get organizer IDs and fetch their profiles
      const organizerIds = [...new Set((data || []).map(e => e.organizer_id).filter(Boolean))] as string[];
      const organizerMap = new Map<string, { full_name?: string; username?: string }>();
      
      if (organizerIds.length > 0) {
        const { data: organizers } = await supabase
          .from('profiles')
          .select('id, full_name, username')
          .in('id', organizerIds);
        
        organizers?.forEach(org => {
          organizerMap.set(org.id, { full_name: org.full_name || undefined, username: org.username || undefined });
        });
      }

      // Get ticket counts for each event
      const eventIds = data?.map(e => e.id) || [];
      const { data: tickets } = await supabase
        .from('tickets')
        .select('event_id')
        .in('event_id', eventIds);

      const ticketCountMap = new Map<number, number>();
      tickets?.forEach(t => {
        const count = ticketCountMap.get(t.event_id) || 0;
        ticketCountMap.set(t.event_id, count + 1);
      });

      // Transform data
      const events: AdminEvent[] = (data || []).map(event => {
        const organizer = event.organizer_id ? organizerMap.get(event.organizer_id) : null;
        return {
          id: event.id,
          title: event.title,
          description: event.description,
          date: event.date,
          time: event.time,
          location: event.location,
          image_url: event.image_url,
          capacity: event.capacity,
          price: event.price,
          category: event.category,
          category_id: event.category_id ?? null,
          organizer_id: event.organizer_id,
          organizer_name: organizer?.full_name || organizer?.username || 'Unknown',
          featured: event.featured,
          status: (event.status as 'pending' | 'approved' | 'rejected') || 'approved',
          created_at: event.created_at,
          updated_at: event.updated_at,
          tickets_sold: ticketCountMap.get(event.id) || 0,
          attendees_count: ticketCountMap.get(event.id) || 0,
          ticket_link: event.ticket_link ?? null,
        };
      });

      const total = count || 0;
      const totalPages = Math.ceil(total / pageSize);

      return {
        data: events,
        total,
        page,
        pageSize,
        totalPages,
      };
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to fetch events');
      throw error;
    }
  },

  getEventStats: async (): Promise<AdminEventStats> => {
    try {
      const { count: totalEvents } = await supabase
        .from('events')
        .select('id', { count: 'exact', head: true });

      // Get events this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: eventsThisMonth } = await supabase
        .from('events')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString());

      // Get revenue from tickets
      const { data: tickets } = await supabase
        .from('tickets')
        .select('event_id, price');

      const { data: events } = await supabase
        .from('events')
        .select('id, price')
        .in('id', tickets?.map(t => t.event_id) || []);

      const eventPriceMap = new Map(events?.map(e => [e.id, e.price || 0]) || []);
      const totalRevenue = tickets?.reduce((sum, t) => {
        const price = eventPriceMap.get(t.event_id) || 0;
        return sum + price;
      }, 0) || 0;

      // Get pending events count
      const { count: pendingEvents } = await supabase
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Get approved events count
      const { count: approvedEvents } = await supabase
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'approved');

      // Get rejected events count
      const { count: rejectedEvents } = await supabase
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'rejected');

      return {
        total_events: totalEvents || 0,
        pending_events: pendingEvents || 0,
        approved_events: approvedEvents || 0,
        rejected_events: rejectedEvents || 0,
        events_this_month: eventsThisMonth || 0,
        total_revenue: totalRevenue,
      };
    } catch (error) {
      console.error('Error fetching event stats:', error);
      throw error;
    }
  },

  approveEvent: async (eventId: number): Promise<void> => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ status: 'approved', featured: true })
        .eq('id', eventId);

      if (error) throw error;
    } catch (error) {
      console.error('Error approving event:', error);
      throw error;
    }
  },

  rejectEvent: async (eventId: number, reason?: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ status: 'rejected' })
        .eq('id', eventId);

      if (error) throw error;
    } catch (error) {
      console.error('Error rejecting event:', error);
      throw error;
    }
  },

  deleteEvent: async (eventId: number): Promise<void> => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  },

  // ==========================================
  // EXPORT FUNCTIONALITY
  // ==========================================

  exportUsersToCSV: async (users: AdminUser[]): Promise<string> => {
    const headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Events Attended', 'Events Created', 'Joined'];
    const rows = users.map(user => [
      user.id,
      user.name,
      user.email || '',
      user.role,
      user.status,
      user.events_attended || 0,
      user.events_created || 0,
      new Date(user.created_at).toLocaleDateString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  },

  exportEventsToCSV: async (events: AdminEvent[]): Promise<string> => {
    const headers = ['ID', 'Title', 'Category', 'Location', 'Date', 'Organizer', 'Tickets Sold', 'Price', 'Status'];
    const rows = events.map(event => [
      event.id,
      event.title,
      event.category || '',
      event.location,
      new Date(event.date).toLocaleDateString(),
      event.organizer_name || '',
      event.tickets_sold || 0,
      event.price || 0,
      event.status || 'approved',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  },

  exportUsersToPDF: async (users: AdminUser[], title: string = 'Users Report'): Promise<void> => {
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
    
    // Table headers
    const headers = [['Name', 'Email', 'Role', 'Status', 'Events Attended', 'Events Created', 'Joined']];
    const rows = users.map(user => [
      user.name.substring(0, 20),
      (user.email || '').substring(0, 25),
      user.role,
      user.status,
      (user.events_attended || 0).toString(),
      (user.events_created || 0).toString(),
      new Date(user.created_at).toLocaleDateString(),
    ]);
    
    // Add table
    autoTable(doc, {
      head: headers,
      body: rows,
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
    });
    
    // Save PDF
    doc.save(`users-report-${new Date().toISOString().split('T')[0]}.pdf`);
  },

  exportEventsToPDF: async (events: AdminEvent[], title: string = 'Events Report'): Promise<void> => {
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
    
    // Table headers
    const headers = [['Title', 'Category', 'Location', 'Date', 'Organizer', 'Tickets Sold', 'Price', 'Status']];
    const rows = events.map(event => [
      event.title.substring(0, 25),
      (event.category || '').substring(0, 15),
      event.location.substring(0, 20),
      new Date(event.date).toLocaleDateString(),
      (event.organizer_name || '').substring(0, 20),
      (event.tickets_sold || 0).toString(),
      `KES ${event.price || 0}`,
      event.status || 'approved',
    ]);
    
    // Add table
    autoTable(doc, {
      head: headers,
      body: rows,
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
    });
    
    // Save PDF
    doc.save(`events-report-${new Date().toISOString().split('T')[0]}.pdf`);
  },

  // ==========================================
  // BULK OPERATIONS
  // ==========================================

  bulkApproveEvents: async (eventIds: number[]): Promise<void> => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ status: 'approved', featured: true })
        .in('id', eventIds);

      if (error) throw error;
    } catch (error) {
      console.error('Error bulk approving events:', error);
      throw error;
    }
  },

  bulkRejectEvents: async (eventIds: number[]): Promise<void> => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ status: 'rejected' })
        .in('id', eventIds);

      if (error) throw error;
    } catch (error) {
      console.error('Error bulk rejecting events:', error);
      throw error;
    }
  },

  bulkDeleteEvents: async (eventIds: number[]): Promise<void> => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .in('id', eventIds);

      if (error) throw error;
    } catch (error) {
      console.error('Error bulk deleting events:', error);
      throw error;
    }
  },

  bulkUpdateUserRoles: async (userIds: string[], role: 'attendee' | 'organizer' | 'admin'): Promise<void> => {
    try {
      if (role === 'admin') {
        const { error } = await supabase
          .from('profiles')
          .update({ username: 'admin' })
          .in('id', userIds);

        if (error) throw error;
      }
      // For other roles, we'd need a roles table in production
    } catch (error) {
      console.error('Error bulk updating user roles:', error);
      throw error;
    }
  },

  // ==========================================
  // GHOST STORY MANAGEMENT
  // ==========================================

  /**
   * Get all stories created by ghost users
   */
  getGhostStories: async (): Promise<AdminStory[]> => {
    try {
      // Get all ghost user IDs
      const { data: ghostUsers, error: ghostError } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_ghost', true);

      if (ghostError) throw ghostError;

      if (!ghostUsers || ghostUsers.length === 0) {
        console.log('No ghost users found');
        return [];
      }

      const ghostUserIds = ghostUsers.map(u => u.id);
      console.log(`Found ${ghostUserIds.length} ghost users, fetching their stories...`);

      // Get stories by ghost users
      const { data: stories, error: storiesError } = await supabase
        .from('stories')
        .select(`
          id,
          user_id,
          event_id,
          content,
          caption,
          media_url,
          media_type,
          likes_count,
          comments_count,
          created_at
        `)
        .in('user_id', ghostUserIds)
        .order('created_at', { ascending: false });

      if (storiesError) {
        console.error('Error fetching stories:', storiesError);
        throw storiesError;
      }

      if (!stories || stories.length === 0) {
        console.log(`No stories found for ${ghostUserIds.length} ghost users`);
        return [];
      }

      console.log(`Found ${stories.length} stories from ghost users`);

      // Get user profiles
      const userIds = [...new Set(stories.map(s => s.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', userIds);

      const profileMap = (profiles || []).reduce((map: any, profile: any) => {
        map[profile.id] = profile;
        return map;
      }, {} as Record<string, any>);

      // Get event titles if event_id exists
      const eventIds = [...new Set(stories.map(s => s.event_id).filter(Boolean))];
      let eventMap: Record<number, string> = {};
      if (eventIds.length > 0) {
        const { data: events } = await supabase
          .from('events')
          .select('id, title')
          .in('id', eventIds);
        
        if (events) {
          eventMap = events.reduce((map: any, event: any) => {
            map[event.id] = event.title;
            return map;
          }, {} as Record<number, string>);
        }
      }

      // Transform to AdminStory format
      return stories.map(story => {
        const profile = profileMap[story.user_id];
        return {
          id: story.id,
          user_id: story.user_id,
          user_name: profile?.username || profile?.full_name || 'Ghost User',
          user_image: profile?.avatar_url || null,
          event_id: story.event_id || undefined,
          event_title: story.event_id ? eventMap[story.event_id] : undefined,
          content: story.content,
          caption: story.caption,
          media_url: story.media_url || undefined,
          media_type: story.media_type as 'image' | 'video',
          likes_count: story.likes_count || 0,
          comments_count: story.comments_count || 0,
          created_at: story.created_at,
          updated_at: undefined, // Stories table doesn't have updated_at column
        };
      });
    } catch (error) {
      console.error('Error fetching ghost stories:', error);
      toast.error('Failed to fetch ghost stories');
      throw error;
    }
  },

  /**
   * Update a ghost story (admin can update any ghost story)
   */
  updateGhostStory: async (storyId: number, updates: {
    content?: string;
    caption?: string;
    media_url?: string;
    media_type?: 'image' | 'video';
  }): Promise<AdminStory> => {
    try {
      // Verify admin status
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to update stories');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      if (!profile || profile.username !== 'admin') {
        throw new Error('Only admins can update ghost stories');
      }

      const updateData: any = {
        // Note: stories table doesn't have updated_at column
      };

      if (updates.content !== undefined) updateData.content = updates.content;
      if (updates.caption !== undefined) updateData.caption = updates.caption;
      if (updates.media_url !== undefined) updateData.media_url = updates.media_url;
      if (updates.media_type !== undefined) updateData.media_type = updates.media_type;

      const { data, error } = await supabase
        .from('stories')
        .update(updateData)
        .eq('id', storyId)
        .select();

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('Story not found or you do not have permission to update it');
      }

      const updatedStory = data[0];

      // Fetch story owner's profile and event for response
      const { data: storyOwnerProfile } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .eq('id', updatedStory.user_id)
        .single();

      let eventTitle: string | undefined;
      if (updatedStory.event_id) {
        const { data: event } = await supabase
          .from('events')
          .select('title')
          .eq('id', updatedStory.event_id)
          .single();
        eventTitle = event?.title;
      }

      toast.success('Story updated successfully');
      
      return {
        id: updatedStory.id,
        user_id: updatedStory.user_id,
        user_name: storyOwnerProfile?.username || storyOwnerProfile?.full_name || 'Ghost User',
        user_image: storyOwnerProfile?.avatar_url || null,
        event_id: updatedStory.event_id || undefined,
        event_title: eventTitle,
        content: updatedStory.content,
        caption: updatedStory.caption,
        media_url: updatedStory.media_url || undefined,
        media_type: updatedStory.media_type as 'image' | 'video',
        likes_count: updatedStory.likes_count || 0,
        comments_count: updatedStory.comments_count || 0,
        created_at: updatedStory.created_at,
        updated_at: undefined, // Stories table doesn't have updated_at column
      };
    } catch (error) {
      console.error('Error updating ghost story:', error);
      toast.error('Failed to update story');
      throw error;
    }
  },

  /**
   * Delete a ghost story (admin can delete any ghost story)
   */
  deleteGhostStory: async (storyId: number): Promise<boolean> => {
    try {
      // Verify admin status
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to delete stories');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      if (!profile || profile.username !== 'admin') {
        throw new Error('Only admins can delete ghost stories');
      }

      // Delete the story
      const { data, error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId)
        .select();

      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }

      // Check if any rows were deleted
      if (!data || data.length === 0) {
        throw new Error('Story not found or you do not have permission to delete it');
      }

      console.log(`Successfully deleted story ${storyId}`);
      return true;
    } catch (error: any) {
      console.error('Error deleting ghost story:', error);
      const errorMessage = error?.message || 'Failed to delete story';
      throw new Error(errorMessage);
    }
  },
};

