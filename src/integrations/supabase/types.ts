export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: number
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: number
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: number
          metadata?: Json
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          granted_at: string
          granted_by: string | null
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      app_feedback: {
        Row: {
          category: string
          created_at: string
          id: string
          message: string
          page_path: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          message: string
          page_path?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          message?: string
          page_path?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          icon: string | null
          id: number
          name: string
          order_index: number | null
          parent_id: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: number
          name: string
          order_index?: number | null
          parent_id?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: number
          name?: string
          order_index?: number | null
          parent_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_templates: {
        Row: {
          category: string
          description: string | null
          html: string
          id: string
          name: string
          subject: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category?: string
          description?: string | null
          html: string
          id: string
          name: string
          subject: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: string
          description?: string | null
          html?: string
          id?: string
          name?: string
          subject?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      consent_audit: {
        Row: {
          consent_type: string
          created_at: string
          granted: boolean | null
          id: number
          metadata: Json | null
          policy_version: string | null
          user_id: string
        }
        Insert: {
          consent_type: string
          created_at?: string
          granted?: boolean | null
          id?: number
          metadata?: Json | null
          policy_version?: string | null
          user_id: string
        }
        Update: {
          consent_type?: string
          created_at?: string
          granted?: boolean | null
          id?: number
          metadata?: Json | null
          policy_version?: string | null
          user_id?: string
        }
        Relationships: []
      }
      copilot_messages: {
        Row: {
          budget_estimate: Json | null
          content: string
          created_at: string
          event_ids: number[]
          id: string
          role: string
          session_id: string
          user_id: string
          vibe_label: string | null
        }
        Insert: {
          budget_estimate?: Json | null
          content: string
          created_at?: string
          event_ids?: number[]
          id?: string
          role: string
          session_id: string
          user_id: string
          vibe_label?: string | null
        }
        Update: {
          budget_estimate?: Json | null
          content?: string
          created_at?: string
          event_ids?: number[]
          id?: string
          role?: string
          session_id?: string
          user_id?: string
          vibe_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "copilot_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "copilot_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      copilot_sessions: {
        Row: {
          city: string | null
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string | null
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      data_subject_requests: {
        Row: {
          completed_at: string | null
          created_at: string
          failure_reason: string | null
          id: string
          metadata: Json | null
          request_type: string
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          failure_reason?: string | null
          id?: string
          metadata?: Json | null
          request_type: string
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          failure_reason?: string | null
          id?: string
          metadata?: Json | null
          request_type?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      email_reminder_log: {
        Row: {
          event_id: number
          id: number
          sent_at: string
          user_id: string
          window_label: string
        }
        Insert: {
          event_id: number
          id?: number
          sent_at?: string
          user_id: string
          window_label: string
        }
        Update: {
          event_id?: number
          id?: number
          sent_at?: string
          user_id?: string
          window_label?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error: string | null
          id: number
          metadata: Json
          provider_id: string | null
          status: string
          subject: string
          template_id: string
          to_email: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: number
          metadata?: Json
          provider_id?: string | null
          status?: string
          subject: string
          template_id: string
          to_email: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: number
          metadata?: Json
          provider_id?: string | null
          status?: string
          subject?: string
          template_id?: string
          to_email?: string
          user_id?: string | null
        }
        Relationships: []
      }
      event_attendance: {
        Row: {
          average_checkin_duration: string | null
          checkin_rate: number | null
          event_id: number | null
          id: number
          last_updated: string | null
          peak_attendance_time: string | null
          total_checked_in: number | null
          total_registered: number | null
        }
        Insert: {
          average_checkin_duration?: string | null
          checkin_rate?: number | null
          event_id?: number | null
          id?: number
          last_updated?: string | null
          peak_attendance_time?: string | null
          total_checked_in?: number | null
          total_registered?: number | null
        }
        Update: {
          average_checkin_duration?: string | null
          checkin_rate?: number | null
          event_id?: number | null
          id?: number
          last_updated?: string | null
          peak_attendance_time?: string | null
          total_checked_in?: number | null
          total_registered?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_attendance_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_categories: {
        Row: {
          category_id: number
          created_at: string | null
          event_id: number
        }
        Insert: {
          category_id: number
          created_at?: string | null
          event_id: number
        }
        Update: {
          category_id?: number
          created_at?: string | null
          event_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_categories_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_checkins: {
        Row: {
          checked_in_at: string | null
          checkin_code: string
          checkin_method: string | null
          created_at: string | null
          device_info: Json | null
          event_id: number | null
          id: number
          location_data: Json | null
          qr_code: string
          ticket_id: number | null
          user_id: string | null
          verified: boolean | null
        }
        Insert: {
          checked_in_at?: string | null
          checkin_code: string
          checkin_method?: string | null
          created_at?: string | null
          device_info?: Json | null
          event_id?: number | null
          id?: number
          location_data?: Json | null
          qr_code: string
          ticket_id?: number | null
          user_id?: string | null
          verified?: boolean | null
        }
        Update: {
          checked_in_at?: string | null
          checkin_code?: string
          checkin_method?: string | null
          created_at?: string | null
          device_info?: Json | null
          event_id?: number | null
          id?: number
          location_data?: Json | null
          qr_code?: string
          ticket_id?: number | null
          user_id?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "event_checkins_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_checkins_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      event_media_share_links: {
        Row: {
          created_at: string
          created_by: string | null
          event_id: number
          expires_at: string
          id: string
          revoked_at: string | null
          token_hash: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          event_id: number
          expires_at: string
          id?: string
          revoked_at?: string | null
          token_hash: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          event_id?: number
          expires_at?: string
          id?: string
          revoked_at?: string | null
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_media_share_links_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_series: {
        Row: {
          byweekday: number[] | null
          created_at: string
          created_by: string | null
          dtstart: string
          duration_days: number
          frequency: string
          id: string
          interval_count: number
          occurrence_count: number | null
          organizer_id: string | null
          time_of_day: string | null
          timezone: string
          until_date: string | null
          updated_at: string
        }
        Insert: {
          byweekday?: number[] | null
          created_at?: string
          created_by?: string | null
          dtstart: string
          duration_days?: number
          frequency: string
          id?: string
          interval_count?: number
          occurrence_count?: number | null
          organizer_id?: string | null
          time_of_day?: string | null
          timezone?: string
          until_date?: string | null
          updated_at?: string
        }
        Update: {
          byweekday?: number[] | null
          created_at?: string
          created_by?: string | null
          dtstart?: string
          duration_days?: number
          frequency?: string
          id?: string
          interval_count?: number
          occurrence_count?: number | null
          organizer_id?: string | null
          time_of_day?: string | null
          timezone?: string
          until_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_series_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_sponsors: {
        Row: {
          created_at: string | null
          event_id: number | null
          id: number
          sponsor_id: number | null
          sponsorship_type: string
        }
        Insert: {
          created_at?: string | null
          event_id?: number | null
          id?: number
          sponsor_id?: number | null
          sponsorship_type: string
        }
        Update: {
          created_at?: string | null
          event_id?: number | null
          id?: number
          sponsor_id?: number | null
          sponsorship_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_sponsors_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_sponsors_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      event_teasers: {
        Row: {
          created_at: string | null
          description: string | null
          event_id: number | null
          id: number
          is_active: boolean | null
          media_type: string | null
          media_url: string | null
          release_date: string | null
          teaser_type: string
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_id?: number | null
          id?: number
          is_active?: boolean | null
          media_type?: string | null
          media_url?: string | null
          release_date?: string | null
          teaser_type: string
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_id?: number | null
          id?: number
          is_active?: boolean | null
          media_type?: string | null
          media_url?: string | null
          release_date?: string | null
          teaser_type?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_teasers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_ticket_types: {
        Row: {
          capacity: number | null
          created_at: string
          description: string | null
          event_id: number
          id: number
          is_active: boolean
          name: string
          price: number
          sale_ends_at: string | null
          sale_starts_at: string | null
          sort_order: number
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          description?: string | null
          event_id: number
          id?: number
          is_active?: boolean
          name: string
          price?: number
          sale_ends_at?: string | null
          sale_starts_at?: string | null
          sort_order?: number
        }
        Update: {
          capacity?: number | null
          created_at?: string
          description?: string | null
          event_id?: number
          id?: number
          is_active?: boolean
          name?: string
          price?: number
          sale_ends_at?: string | null
          sale_starts_at?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_ticket_types_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_translations: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          event_id: number | null
          id: number
          language_code: string | null
          location: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          event_id?: number | null
          id?: number
          language_code?: string | null
          location?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          event_id?: number | null
          id?: number
          language_code?: string | null
          location?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_translations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_translations_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "supported_languages"
            referencedColumns: ["code"]
          },
        ]
      }
      events: {
        Row: {
          cancelled_at: string | null
          capacity: number | null
          category: string | null
          category_id: number | null
          created_at: string | null
          date: string
          description: string | null
          end_date: string | null
          end_time: string | null
          event_first_day: string | null
          event_last_day: string | null
          featured: boolean | null
          id: number
          image_url: string | null
          latitude: number | null
          location: string
          location_url: string | null
          longitude: number | null
          organizer_id: string | null
          performing_artists: string[] | null
          price: number | null
          save_count: number | null
          series_id: string | null
          series_index: number | null
          status: string | null
          tags: string[] | null
          ticket_link: string | null
          time: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          cancelled_at?: string | null
          capacity?: number | null
          category?: string | null
          category_id?: number | null
          created_at?: string | null
          date: string
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          event_first_day?: string | null
          event_last_day?: string | null
          featured?: boolean | null
          id?: number
          image_url?: string | null
          latitude?: number | null
          location: string
          location_url?: string | null
          longitude?: number | null
          organizer_id?: string | null
          performing_artists?: string[] | null
          price?: number | null
          save_count?: number | null
          series_id?: string | null
          series_index?: number | null
          status?: string | null
          tags?: string[] | null
          ticket_link?: string | null
          time?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          cancelled_at?: string | null
          capacity?: number | null
          category?: string | null
          category_id?: number | null
          created_at?: string | null
          date?: string
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          event_first_day?: string | null
          event_last_day?: string | null
          featured?: boolean | null
          id?: number
          image_url?: string | null
          latitude?: number | null
          location?: string
          location_url?: string | null
          longitude?: number | null
          organizer_id?: string | null
          performing_artists?: string[] | null
          price?: number | null
          save_count?: number | null
          series_id?: string | null
          series_index?: number | null
          status?: string | null
          tags?: string[] | null
          ticket_link?: string | null
          time?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organizer_id_profiles_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "event_series"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string | null
          event_id: number | null
          id: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id?: number | null
          id?: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: number | null
          id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      featured_creators: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string | null
          feature_type: string
          id: number
          is_active: boolean | null
          media_url: string | null
          start_date: string | null
          title: string
          user_id: string | null
          venue_id: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          feature_type: string
          id?: number
          is_active?: boolean | null
          media_url?: string | null
          start_date?: string | null
          title: string
          user_id?: string | null
          venue_id?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          feature_type?: string
          id?: number
          is_active?: boolean | null
          media_url?: string | null
          start_date?: string | null
          title?: string
          user_id?: string | null
          venue_id?: number | null
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string | null
          following_id: string | null
          id: string
          status: string
        }
        Insert: {
          created_at?: string | null
          follower_id?: string | null
          following_id?: string | null
          id?: string
          status?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string | null
          following_id?: string | null
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_comments: {
        Row: {
          content: string
          created_at: string | null
          id: number
          media_url: string | null
          post_id: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: number
          media_url?: string | null
          post_id?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: number
          media_url?: string | null
          post_id?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_post_likes: {
        Row: {
          created_at: string | null
          id: number
          post_id: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          post_id: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          post_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_post_translations: {
        Row: {
          content: string
          created_at: string | null
          id: number
          language_code: string | null
          post_id: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: number
          language_code?: string | null
          post_id?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: number
          language_code?: string | null
          post_id?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_post_translations_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "supported_languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "forum_post_translations_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_posts: {
        Row: {
          category: string | null
          comments_count: number | null
          content: string
          created_at: string | null
          event_id: number | null
          id: number
          is_featured: boolean | null
          is_pinned: boolean | null
          likes_count: number | null
          location: string | null
          media_url: string | null
          moderation_status: string
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
          views_count: number | null
        }
        Insert: {
          category?: string | null
          comments_count?: number | null
          content: string
          created_at?: string | null
          event_id?: number | null
          id?: number
          is_featured?: boolean | null
          is_pinned?: boolean | null
          likes_count?: number | null
          location?: string | null
          media_url?: string | null
          moderation_status?: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
          views_count?: number | null
        }
        Update: {
          category?: string | null
          comments_count?: number | null
          content?: string
          created_at?: string | null
          event_id?: number | null
          id?: number
          is_featured?: boolean | null
          is_pinned?: boolean | null
          likes_count?: number | null
          location?: string | null
          media_url?: string | null
          moderation_status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_posts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_posts_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ghost_action_log: {
        Row: {
          action_type: string
          error_message: string | null
          executed_at: string | null
          ghost_user_id: string | null
          id: number
          queue_id: number | null
          success: boolean | null
          target_id: string | null
          target_type: string
        }
        Insert: {
          action_type: string
          error_message?: string | null
          executed_at?: string | null
          ghost_user_id?: string | null
          id?: number
          queue_id?: number | null
          success?: boolean | null
          target_id?: string | null
          target_type: string
        }
        Update: {
          action_type?: string
          error_message?: string | null
          executed_at?: string | null
          ghost_user_id?: string | null
          id?: number
          queue_id?: number | null
          success?: boolean | null
          target_id?: string | null
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ghost_action_log_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "ghost_action_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      ghost_action_queue: {
        Row: {
          action_type: string
          created_at: string | null
          created_by: string | null
          error_message: string | null
          executed_at: string | null
          ghost_user_ids: string[] | null
          id: number
          metadata: Json | null
          persona_group_id: number | null
          scheduled_at: string | null
          status: string | null
          target_id: string | null
          target_type: string
          updated_at: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          executed_at?: string | null
          ghost_user_ids?: string[] | null
          id?: number
          metadata?: Json | null
          persona_group_id?: number | null
          scheduled_at?: string | null
          status?: string | null
          target_id?: string | null
          target_type: string
          updated_at?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          executed_at?: string | null
          ghost_user_ids?: string[] | null
          id?: number
          metadata?: Json | null
          persona_group_id?: number | null
          scheduled_at?: string | null
          status?: string | null
          target_id?: string | null
          target_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ghost_action_queue_persona_group_id_fkey"
            columns: ["persona_group_id"]
            isOneToOne: false
            referencedRelation: "ghost_persona_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      ghost_persona_groups: {
        Row: {
          comment_probability: number | null
          content_creation_rate: number | null
          created_at: string | null
          description: string | null
          engagement_rate: number | null
          id: number
          like_probability: number | null
          max_delay_seconds: number | null
          metadata: Json | null
          min_delay_seconds: number | null
          name: string
          share_probability: number | null
          updated_at: string | null
        }
        Insert: {
          comment_probability?: number | null
          content_creation_rate?: number | null
          created_at?: string | null
          description?: string | null
          engagement_rate?: number | null
          id?: number
          like_probability?: number | null
          max_delay_seconds?: number | null
          metadata?: Json | null
          min_delay_seconds?: number | null
          name: string
          share_probability?: number | null
          updated_at?: string | null
        }
        Update: {
          comment_probability?: number | null
          content_creation_rate?: number | null
          created_at?: string | null
          description?: string | null
          engagement_rate?: number | null
          id?: number
          like_probability?: number | null
          max_delay_seconds?: number | null
          metadata?: Json | null
          min_delay_seconds?: number | null
          name?: string
          share_probability?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      marketplace_listing_items: {
        Row: {
          created_at: string
          id: number
          listing_id: number
          locked_price: number
          ticket_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          listing_id: number
          locked_price: number
          ticket_id: number
        }
        Update: {
          created_at?: string
          id?: number
          listing_id?: number
          locked_price?: number
          ticket_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_listing_items_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_listing_items_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_listings: {
        Row: {
          closed_at: string | null
          created_at: string
          event_id: number
          expires_at: string
          fee_amount: number
          gross_amount: number
          id: number
          mode: string
          seller_id: string
          seller_payout_amount: number
          status: string
          ticket_count: number
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          event_id: number
          expires_at: string
          fee_amount?: number
          gross_amount?: number
          id?: number
          mode: string
          seller_id: string
          seller_payout_amount?: number
          status?: string
          ticket_count?: number
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          event_id?: number
          expires_at?: string
          fee_amount?: number
          gross_amount?: number
          id?: number
          mode?: string
          seller_id?: string
          seller_payout_amount?: number
          status?: string
          ticket_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_listings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_payouts: {
        Row: {
          amount: number
          attempt_count: number
          created_at: string
          id: number
          last_error: string | null
          paid_at: string | null
          payout_method: string | null
          seller_id: string
          status: string
          transfer_id: number
          updated_at: string
        }
        Insert: {
          amount: number
          attempt_count?: number
          created_at?: string
          id?: number
          last_error?: string | null
          paid_at?: string | null
          payout_method?: string | null
          seller_id: string
          status?: string
          transfer_id: number
          updated_at?: string
        }
        Update: {
          amount?: number
          attempt_count?: number
          created_at?: string
          id?: number
          last_error?: string | null
          paid_at?: string | null
          payout_method?: string | null
          seller_id?: string
          status?: string
          transfer_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_payouts_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "marketplace_transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_transfers: {
        Row: {
          buyer_id: string
          completed_at: string | null
          created_at: string
          error_message: string | null
          fee_amount: number
          gross_amount: number
          id: number
          listing_id: number
          mode: string
          payment_reference: string | null
          seller_id: string
          seller_payout_amount: number
          status: string
          updated_at: string
        }
        Insert: {
          buyer_id: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          fee_amount?: number
          gross_amount?: number
          id?: number
          listing_id: number
          mode: string
          payment_reference?: string | null
          seller_id: string
          seller_payout_amount?: number
          status?: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          fee_amount?: number
          gross_amount?: number
          id?: number
          listing_id?: number
          mode?: string
          payment_reference?: string | null
          seller_id?: string
          seller_payout_amount?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_transfers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_kind: string | null
          attachment_meta: Json
          attachment_url: string | null
          ciphertext: string | null
          content: string | null
          created_at: string | null
          deleted_at: string | null
          id: string
          is_read: boolean | null
          message_type: string
          receiver_id: string | null
          reply_to_id: string | null
          sender_id: string | null
          signal_registration_id: number | null
          updated_at: string | null
        }
        Insert: {
          attachment_kind?: string | null
          attachment_meta?: Json
          attachment_url?: string | null
          ciphertext?: string | null
          content?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: string
          receiver_id?: string | null
          reply_to_id?: string | null
          sender_id?: string | null
          signal_registration_id?: number | null
          updated_at?: string | null
        }
        Update: {
          attachment_kind?: string | null
          attachment_meta?: Json
          attachment_url?: string | null
          ciphertext?: string | null
          content?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: string
          receiver_id?: string | null
          reply_to_id?: string | null
          sender_id?: string | null
          signal_registration_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          confirmed: boolean
          created_at: string
          email: string
          id: number
          source: string
          unsubscribed_at: string | null
          user_id: string | null
        }
        Insert: {
          confirmed?: boolean
          created_at?: string
          email: string
          id?: number
          source?: string
          unsubscribed_at?: string | null
          user_id?: string | null
        }
        Update: {
          confirmed?: boolean
          created_at?: string
          email?: string
          id?: number
          source?: string
          unsubscribed_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: number
          link: string | null
          message: string
          read: boolean | null
          resource_id: number | null
          resource_type: string | null
          resource_uuid: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: number
          link?: string | null
          message: string
          read?: boolean | null
          resource_id?: number | null
          resource_type?: string | null
          resource_uuid?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: number
          link?: string | null
          message?: string
          read?: boolean | null
          resource_id?: number | null
          resource_type?: string | null
          resource_uuid?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      password_reset_attempts: {
        Row: {
          attempted_at: string
          email: string
          id: number
        }
        Insert: {
          attempted_at?: string
          email: string
          id?: number
        }
        Update: {
          attempted_at?: string
          email?: string
          id?: number
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          event_id: number | null
          id: number
          metadata: Json | null
          payment_method: string | null
          reference_code: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          event_id?: number | null
          id?: never
          metadata?: Json | null
          payment_method?: string | null
          reference_code?: string | null
          status: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          event_id?: number | null
          id?: never
          metadata?: Json | null
          payment_method?: string | null
          reference_code?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      pinned_messages: {
        Row: {
          conversation_partner_id: string
          created_at: string
          id: string
          message_id: string
          pinned_by: string
        }
        Insert: {
          conversation_partner_id: string
          created_at?: string
          id?: string
          message_id: string
          pinned_by: string
        }
        Update: {
          conversation_partner_id?: string
          created_at?: string
          id?: string
          message_id?: string
          pinned_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "pinned_messages_conversation_partner_id_fkey"
            columns: ["conversation_partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pinned_messages_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pinned_messages_pinned_by_fkey"
            columns: ["pinned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_announcements: {
        Row: {
          audience: string
          audience_locations: string[]
          body: string
          channel: string
          created_at: string
          created_by: string | null
          id: number
          link: string | null
          published_at: string | null
          recipient_count: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          audience?: string
          audience_locations?: string[]
          body: string
          channel?: string
          created_at?: string
          created_by?: string | null
          id?: number
          link?: string | null
          published_at?: string | null
          recipient_count?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          audience?: string
          audience_locations?: string[]
          body?: string
          channel?: string
          created_at?: string
          created_by?: string | null
          id?: number
          link?: string | null
          published_at?: string | null
          recipient_count?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: number
          post_id: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          post_id: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          post_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: string
          account_status_changed_at: string | null
          account_status_changed_by: string | null
          account_status_reason: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          date_of_birth: string | null
          email_notifications: boolean
          favorite_categories: string[] | null
          full_name: string | null
          id: string
          is_ghost: boolean | null
          last_login: string | null
          last_seen_at: string | null
          latitude: number | null
          location: string | null
          location_confirm_needed: boolean
          location_consent: boolean
          location_consent_at: string | null
          location_source: string | null
          longitude: number | null
          marketing_consent: boolean
          marketing_consent_at: string | null
          media_consent: boolean
          media_consent_at: string | null
          media_consent_version: string | null
          notification_email_prefs: Json
          notification_preferences: Json
          organizer_content_sharing_opt_in: boolean
          phone: string | null
          privacy_accepted_at: string | null
          privacy_version_accepted: string | null
          profile_visibility: string
          push_notifications: boolean
          terms_accepted_at: string | null
          terms_version_accepted: string | null
          two_factor_auth: boolean
          updated_at: string | null
          username: string | null
        }
        Insert: {
          account_status?: string
          account_status_changed_at?: string | null
          account_status_changed_by?: string | null
          account_status_reason?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email_notifications?: boolean
          favorite_categories?: string[] | null
          full_name?: string | null
          id: string
          is_ghost?: boolean | null
          last_login?: string | null
          last_seen_at?: string | null
          latitude?: number | null
          location?: string | null
          location_confirm_needed?: boolean
          location_consent?: boolean
          location_consent_at?: string | null
          location_source?: string | null
          longitude?: number | null
          marketing_consent?: boolean
          marketing_consent_at?: string | null
          media_consent?: boolean
          media_consent_at?: string | null
          media_consent_version?: string | null
          notification_email_prefs?: Json
          notification_preferences?: Json
          organizer_content_sharing_opt_in?: boolean
          phone?: string | null
          privacy_accepted_at?: string | null
          privacy_version_accepted?: string | null
          profile_visibility?: string
          push_notifications?: boolean
          terms_accepted_at?: string | null
          terms_version_accepted?: string | null
          two_factor_auth?: boolean
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          account_status?: string
          account_status_changed_at?: string | null
          account_status_changed_by?: string | null
          account_status_reason?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email_notifications?: boolean
          favorite_categories?: string[] | null
          full_name?: string | null
          id?: string
          is_ghost?: boolean | null
          last_login?: string | null
          last_seen_at?: string | null
          latitude?: number | null
          location?: string | null
          location_confirm_needed?: boolean
          location_consent?: boolean
          location_consent_at?: string | null
          location_source?: string | null
          longitude?: number | null
          marketing_consent?: boolean
          marketing_consent_at?: string | null
          media_consent?: boolean
          media_consent_at?: string | null
          media_consent_version?: string | null
          notification_email_prefs?: Json
          notification_preferences?: Json
          organizer_content_sharing_opt_in?: boolean
          phone?: string | null
          privacy_accepted_at?: string | null
          privacy_version_accepted?: string | null
          profile_visibility?: string
          push_notifications?: boolean
          terms_accepted_at?: string | null
          terms_version_accepted?: string | null
          two_factor_auth?: boolean
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      proposals: {
        Row: {
          admin_notes: string | null
          budget: string | null
          category: string
          contact_email: string
          contact_phone: string | null
          description: string
          estimated_date: string | null
          expected_attendees: number | null
          id: number
          image_url: string | null
          location: string | null
          sponsor_needs: string | null
          status: string
          submitted_by: string | null
          submitted_on: string | null
          title: string
        }
        Insert: {
          admin_notes?: string | null
          budget?: string | null
          category: string
          contact_email: string
          contact_phone?: string | null
          description: string
          estimated_date?: string | null
          expected_attendees?: number | null
          id?: number
          image_url?: string | null
          location?: string | null
          sponsor_needs?: string | null
          status?: string
          submitted_by?: string | null
          submitted_on?: string | null
          title: string
        }
        Update: {
          admin_notes?: string | null
          budget?: string | null
          category?: string
          contact_email?: string
          contact_phone?: string | null
          description?: string
          estimated_date?: string | null
          expected_attendees?: number | null
          id?: number
          image_url?: string | null
          location?: string | null
          sponsor_needs?: string | null
          status?: string
          submitted_by?: string | null
          submitted_on?: string | null
          title?: string
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string | null
          id: string
          platform: string | null
          token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          platform?: string | null
          token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          platform?: string | null
          token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      qr_code_logs: {
        Row: {
          event_id: number | null
          expires_at: string | null
          generated_at: string | null
          id: number
          qr_code: string
          status: string | null
          ticket_id: number | null
          used_at: string | null
          user_id: string | null
        }
        Insert: {
          event_id?: number | null
          expires_at?: string | null
          generated_at?: string | null
          id?: number
          qr_code: string
          status?: string | null
          ticket_id?: number | null
          used_at?: string | null
          user_id?: string | null
        }
        Update: {
          event_id?: number | null
          expires_at?: string | null
          generated_at?: string | null
          id?: number
          qr_code?: string
          status?: string | null
          ticket_id?: number | null
          used_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qr_code_logs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_code_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_analytics: {
        Row: {
          average_ticket_price: number | null
          event_id: number | null
          id: number
          last_updated: string | null
          organizer_revenue: number | null
          platform_revenue: number | null
          revenue_per_attendee: number | null
          sponsor_revenue: number | null
          total_revenue: number | null
          total_tickets_sold: number | null
        }
        Insert: {
          average_ticket_price?: number | null
          event_id?: number | null
          id?: number
          last_updated?: string | null
          organizer_revenue?: number | null
          platform_revenue?: number | null
          revenue_per_attendee?: number | null
          sponsor_revenue?: number | null
          total_revenue?: number | null
          total_tickets_sold?: number | null
        }
        Update: {
          average_ticket_price?: number | null
          event_id?: number | null
          id?: number
          last_updated?: string | null
          organizer_revenue?: number | null
          platform_revenue?: number | null
          revenue_per_attendee?: number | null
          sponsor_revenue?: number | null
          total_revenue?: number | null
          total_tickets_sold?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "revenue_analytics_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_payouts: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          event_id: number | null
          id: number
          payout_details: Json | null
          payout_method: string
          processed_at: string | null
          recipient_id: string | null
          recipient_type: string
          status: string | null
          transaction_reference: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          event_id?: number | null
          id?: number
          payout_details?: Json | null
          payout_method: string
          processed_at?: string | null
          recipient_id?: string | null
          recipient_type: string
          status?: string | null
          transaction_reference?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          event_id?: number | null
          id?: number
          payout_details?: Json | null
          payout_method?: string
          processed_at?: string | null
          recipient_id?: string | null
          recipient_type?: string
          status?: string | null
          transaction_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "revenue_payouts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_sharing_config: {
        Row: {
          created_at: string | null
          event_id: number | null
          id: number
          organizer_commission_rate: number | null
          platform_commission_rate: number | null
          sponsor_commission_rate: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          event_id?: number | null
          id?: number
          organizer_commission_rate?: number | null
          platform_commission_rate?: number | null
          sponsor_commission_rate?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: number | null
          id?: number
          organizer_commission_rate?: number | null
          platform_commission_rate?: number | null
          sponsor_commission_rate?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "revenue_sharing_config_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_transactions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          event_id: number | null
          id: number
          organizer_commission: number | null
          payment_id: number | null
          platform_commission: number | null
          processed_at: string | null
          sponsor_commission: number | null
          status: string | null
          transaction_type: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          event_id?: number | null
          id?: number
          organizer_commission?: number | null
          payment_id?: number | null
          platform_commission?: number | null
          processed_at?: string | null
          sponsor_commission?: number | null
          status?: string | null
          transaction_type: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          event_id?: number | null
          id?: number
          organizer_commission?: number | null
          payment_id?: number | null
          platform_commission?: number | null
          processed_at?: string | null
          sponsor_commission?: number | null
          status?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_transactions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_transactions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_events: {
        Row: {
          created_at: string | null
          event_id: number
          id: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: number
          id?: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: number
          id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      signal_identity_keys: {
        Row: {
          created_at: string
          identity_key: string
          registration_id: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          identity_key: string
          registration_id: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          identity_key?: string
          registration_id?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "signal_identity_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      signal_one_time_prekeys: {
        Row: {
          created_at: string
          key_id: number
          public_key: string
          user_id: string
        }
        Insert: {
          created_at?: string
          key_id: number
          public_key: string
          user_id: string
        }
        Update: {
          created_at?: string
          key_id?: number
          public_key?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "signal_one_time_prekeys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      signal_signed_prekeys: {
        Row: {
          created_at: string
          key_id: number
          public_key: string
          signature: string
          user_id: string
        }
        Insert: {
          created_at?: string
          key_id: number
          public_key: string
          signature: string
          user_id: string
        }
        Update: {
          created_at?: string
          key_id?: number
          public_key?: string
          signature?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "signal_signed_prekeys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_content_blocks: {
        Row: {
          action_url: string | null
          created_at: string | null
          data: Json | null
          description: string | null
          expires_at: string | null
          id: number
          media_url: string | null
          order_position: number
          title: string | null
          type: string
          updated_at: string | null
          zone_id: number | null
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          data?: Json | null
          description?: string | null
          expires_at?: string | null
          id?: number
          media_url?: string | null
          order_position: number
          title?: string | null
          type: string
          updated_at?: string | null
          zone_id?: number | null
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          data?: Json | null
          description?: string | null
          expires_at?: string | null
          id?: number
          media_url?: string | null
          order_position?: number
          title?: string | null
          type?: string
          updated_at?: string | null
          zone_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_content_blocks_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "sponsor_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_zones: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          sponsor_id: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          sponsor_id?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          sponsor_id?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_zones_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsors: {
        Row: {
          brand_color: string | null
          brand_gradient: string | null
          content_category: string
          created_at: string | null
          description: string | null
          id: number
          logo_url: string
          name: string
          partnership_level: string
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          brand_color?: string | null
          brand_gradient?: string | null
          content_category?: string
          created_at?: string | null
          description?: string | null
          id?: number
          logo_url: string
          name: string
          partnership_level: string
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          brand_color?: string | null
          brand_gradient?: string | null
          content_category?: string
          created_at?: string | null
          description?: string | null
          id?: number
          logo_url?: string
          name?: string
          partnership_level?: string
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      stories: {
        Row: {
          caption: string | null
          comments_count: number | null
          content: string | null
          created_at: string | null
          event_id: number | null
          expires_at: string | null
          hashtags: string[] | null
          id: number
          is_featured: boolean | null
          likes_count: number | null
          media_type: string | null
          media_url: string | null
          moderation_status: string
          status: string | null
          user_id: string
        }
        Insert: {
          caption?: string | null
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          event_id?: number | null
          expires_at?: string | null
          hashtags?: string[] | null
          id?: never
          is_featured?: boolean | null
          likes_count?: number | null
          media_type?: string | null
          media_url?: string | null
          moderation_status?: string
          status?: string | null
          user_id: string
        }
        Update: {
          caption?: string | null
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          event_id?: number | null
          expires_at?: string | null
          hashtags?: string[] | null
          id?: never
          is_featured?: boolean | null
          likes_count?: number | null
          media_type?: string | null
          media_url?: string | null
          moderation_status?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stories_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      story_comments: {
        Row: {
          content: string
          created_at: string | null
          id: number
          story_id: number | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: never
          story_id?: number | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: never
          story_id?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_comments_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_likes: {
        Row: {
          created_at: string | null
          id: number
          story_id: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: never
          story_id?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: never
          story_id?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_likes_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_translations: {
        Row: {
          caption: string | null
          content: string | null
          created_at: string | null
          id: number
          language_code: string | null
          story_id: number | null
          updated_at: string | null
        }
        Insert: {
          caption?: string | null
          content?: string | null
          created_at?: string | null
          id?: number
          language_code?: string | null
          story_id?: number | null
          updated_at?: string | null
        }
        Update: {
          caption?: string | null
          content?: string | null
          created_at?: string | null
          id?: number
          language_code?: string | null
          story_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_translations_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "supported_languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "story_translations_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      supported_languages: {
        Row: {
          code: string
          created_at: string | null
          flag_emoji: string | null
          id: number
          is_active: boolean | null
          is_rtl: boolean | null
          name: string
          native_name: string
        }
        Insert: {
          code: string
          created_at?: string | null
          flag_emoji?: string | null
          id?: number
          is_active?: boolean | null
          is_rtl?: boolean | null
          name: string
          native_name: string
        }
        Update: {
          code?: string
          created_at?: string | null
          flag_emoji?: string | null
          id?: number
          is_active?: boolean | null
          is_rtl?: boolean | null
          name?: string
          native_name?: string
        }
        Relationships: []
      }
      survey_questions: {
        Row: {
          created_at: string | null
          id: number
          options: Json | null
          order_position: number
          question_text: string
          question_type: string
          required: boolean | null
          survey_id: number | null
        }
        Insert: {
          created_at?: string | null
          id?: never
          options?: Json | null
          order_position: number
          question_text: string
          question_type: string
          required?: boolean | null
          survey_id?: number | null
        }
        Update: {
          created_at?: string | null
          id?: never
          options?: Json | null
          order_position?: number
          question_text?: string
          question_type?: string
          required?: boolean | null
          survey_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_questions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          created_at: string | null
          id: number
          response_data: Json
          survey_id: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: never
          response_data: Json
          survey_id?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: never
          response_data?: Json
          survey_id?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      surveys: {
        Row: {
          created_at: string | null
          description: string | null
          event_id: number | null
          id: number
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_id?: number | null
          id?: never
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_id?: number | null
          id?: never
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "surveys_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      system_translations: {
        Row: {
          context: string | null
          created_at: string | null
          id: number
          key: string
          language_code: string | null
          updated_at: string | null
          value: string
        }
        Insert: {
          context?: string | null
          created_at?: string | null
          id?: number
          key: string
          language_code?: string | null
          updated_at?: string | null
          value: string
        }
        Update: {
          context?: string | null
          created_at?: string | null
          id?: number
          key?: string
          language_code?: string | null
          updated_at?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_translations_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "supported_languages"
            referencedColumns: ["code"]
          },
        ]
      }
      ticket_qr_tokens: {
        Row: {
          created_at: string
          id: number
          owner_id: string
          revoked_at: string | null
          status: string
          ticket_id: number
          token: string
        }
        Insert: {
          created_at?: string
          id?: number
          owner_id: string
          revoked_at?: string | null
          status?: string
          ticket_id: number
          token: string
        }
        Update: {
          created_at?: string
          id?: number
          owner_id?: string
          revoked_at?: string | null
          status?: string
          ticket_id?: number
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_qr_tokens_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_transfers: {
        Row: {
          created_at: string
          id: number
          message: string | null
          recipient_id: string
          sender_id: string
          status: string
          ticket_id: number
          transfer_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          message?: string | null
          recipient_id: string
          sender_id: string
          status?: string
          ticket_id: number
          transfer_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          message?: string | null
          recipient_id?: string
          sender_id?: string
          status?: string
          ticket_id?: number
          transfer_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_transfers_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_transfers_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_transfers_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          event_date: string
          event_id: number | null
          event_title: string
          id: number
          price: number | null
          purchase_date: string | null
          reference_code: string | null
          status: string
          ticket_type: string
          ticket_type_id: number | null
          transfer_version: number
          user_id: string
        }
        Insert: {
          event_date: string
          event_id?: number | null
          event_title: string
          id?: number
          price?: number | null
          purchase_date?: string | null
          reference_code?: string | null
          status: string
          ticket_type: string
          ticket_type_id?: number | null
          transfer_version?: number
          user_id: string
        }
        Update: {
          event_date?: string
          event_id?: number | null
          event_title?: string
          id?: number
          price?: number | null
          purchase_date?: string | null
          reference_code?: string | null
          status?: string
          ticket_type?: string
          ticket_type_id?: number | null
          transfer_version?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "event_ticket_types"
            referencedColumns: ["id"]
          },
        ]
      }
      top_moments: {
        Row: {
          created_at: string | null
          description: string | null
          event_id: number | null
          id: number
          is_featured: boolean | null
          media_type: string | null
          media_url: string | null
          rank_position: number
          story_id: number | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_id?: number | null
          id?: number
          is_featured?: boolean | null
          media_type?: string | null
          media_url?: string | null
          rank_position: number
          story_id?: number | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_id?: number | null
          id?: number
          is_featured?: boolean | null
          media_type?: string | null
          media_url?: string | null
          rank_position?: number
          story_id?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "top_moments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "top_moments_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      translation_requests: {
        Row: {
          completed_at: string | null
          content_id: number | null
          content_type: string
          created_at: string | null
          id: number
          original_text: string
          requested_by: string | null
          source_language: string | null
          status: string | null
          target_language: string | null
          translated_text: string | null
          translator_id: string | null
        }
        Insert: {
          completed_at?: string | null
          content_id?: number | null
          content_type: string
          created_at?: string | null
          id?: number
          original_text: string
          requested_by?: string | null
          source_language?: string | null
          status?: string | null
          target_language?: string | null
          translated_text?: string | null
          translator_id?: string | null
        }
        Update: {
          completed_at?: string | null
          content_id?: number | null
          content_type?: string
          created_at?: string | null
          id?: number
          original_text?: string
          requested_by?: string | null
          source_language?: string | null
          status?: string | null
          target_language?: string | null
          translated_text?: string | null
          translator_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "translation_requests_source_language_fkey"
            columns: ["source_language"]
            isOneToOne: false
            referencedRelation: "supported_languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "translation_requests_target_language_fkey"
            columns: ["target_language"]
            isOneToOne: false
            referencedRelation: "supported_languages"
            referencedColumns: ["code"]
          },
        ]
      }
      typing_status: {
        Row: {
          conversation_partner_id: string
          is_typing: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          conversation_partner_id: string
          is_typing?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          conversation_partner_id?: string
          is_typing?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "typing_status_conversation_partner_id_fkey"
            columns: ["conversation_partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "typing_status_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_event_filters: {
        Row: {
          created_at: string
          filters: Json
          id: string
          name: string
          page_size: number
          sort: string
          updated_at: string
          user_id: string
          view: string
        }
        Insert: {
          created_at?: string
          filters?: Json
          id?: string
          name: string
          page_size?: number
          sort?: string
          updated_at?: string
          user_id: string
          view?: string
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          name?: string
          page_size?: number
          sort?: string
          updated_at?: string
          user_id?: string
          view?: string
        }
        Relationships: []
      }
      user_language_preferences: {
        Row: {
          content_language: string | null
          created_at: string | null
          id: number
          interface_language: string | null
          primary_language: string | null
          secondary_language: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content_language?: string | null
          created_at?: string | null
          id?: number
          interface_language?: string | null
          primary_language?: string | null
          secondary_language?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content_language?: string | null
          created_at?: string | null
          id?: number
          interface_language?: string | null
          primary_language?: string | null
          secondary_language?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_language_preferences_content_language_fkey"
            columns: ["content_language"]
            isOneToOne: false
            referencedRelation: "supported_languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "user_language_preferences_interface_language_fkey"
            columns: ["interface_language"]
            isOneToOne: false
            referencedRelation: "supported_languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "user_language_preferences_primary_language_fkey"
            columns: ["primary_language"]
            isOneToOne: false
            referencedRelation: "supported_languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "user_language_preferences_secondary_language_fkey"
            columns: ["secondary_language"]
            isOneToOne: false
            referencedRelation: "supported_languages"
            referencedColumns: ["code"]
          },
        ]
      }
      user_onboarding_preferences: {
        Row: {
          collaboration_notes: string | null
          created_at: string | null
          home_base: string | null
          interests: string[] | null
          notify_ai_digest: boolean | null
          notify_community_highlights: boolean | null
          notify_partner_pitches: boolean | null
          preferred_cities: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          collaboration_notes?: string | null
          created_at?: string | null
          home_base?: string | null
          interests?: string[] | null
          notify_ai_digest?: boolean | null
          notify_community_highlights?: boolean | null
          notify_partner_pitches?: boolean | null
          preferred_cities?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          collaboration_notes?: string | null
          created_at?: string | null
          home_base?: string | null
          interests?: string[] | null
          notify_ai_digest?: boolean | null
          notify_community_highlights?: boolean | null
          notify_partner_pitches?: boolean | null
          preferred_cities?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_onboarding_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_audit: {
        Args: {
          p_action: string
          p_entity_id?: string
          p_entity_type: string
          p_metadata?: Json
        }
        Returns: number
      }
      admin_delete_ghost_story: { Args: { p_story_id: number }; Returns: Json }
      admin_finance_overview: { Args: never; Returns: Json }
      admin_force_cancel_marketplace_listing: {
        Args: { p_listing_id: number }
        Returns: Json
      }
      admin_get_system_settings: { Args: never; Returns: Json }
      admin_list_audit_log: {
        Args: { p_limit?: number }
        Returns: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: number
          metadata: Json
        }[]
        SetofOptions: {
          from: "*"
          to: "admin_audit_log"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      admin_mark_ticket_cancelled: {
        Args: { p_reason?: string; p_ticket_id: number }
        Returns: Json
      }
      admin_marketplace_stats: { Args: never; Returns: Json }
      admin_profiles: {
        Args: never
        Returns: {
          account_status: string
          account_status_changed_at: string | null
          account_status_changed_by: string | null
          account_status_reason: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          date_of_birth: string | null
          email_notifications: boolean
          favorite_categories: string[] | null
          full_name: string | null
          id: string
          is_ghost: boolean | null
          last_login: string | null
          last_seen_at: string | null
          latitude: number | null
          location: string | null
          location_confirm_needed: boolean
          location_consent: boolean
          location_consent_at: string | null
          location_source: string | null
          longitude: number | null
          marketing_consent: boolean
          marketing_consent_at: string | null
          media_consent: boolean
          media_consent_at: string | null
          media_consent_version: string | null
          notification_email_prefs: Json
          notification_preferences: Json
          organizer_content_sharing_opt_in: boolean
          phone: string | null
          privacy_accepted_at: string | null
          privacy_version_accepted: string | null
          profile_visibility: string
          push_notifications: boolean
          terms_accepted_at: string | null
          terms_version_accepted: string | null
          two_factor_auth: boolean
          updated_at: string | null
          username: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      admin_publish_announcement: {
        Args: { p_announcement_id: number }
        Returns: Json
      }
      admin_set_account_status: {
        Args: { p_reason?: string; p_status: string; p_target: string }
        Returns: undefined
      }
      admin_set_user_role: {
        Args: { p_role: string; p_target: string }
        Returns: undefined
      }
      admin_soft_delete_user: {
        Args: { p_reason?: string; p_target: string }
        Returns: undefined
      }
      admin_upsert_system_setting: {
        Args: { p_description?: string; p_key: string; p_value: Json }
        Returns: Json
      }
      anonymize_user_data: { Args: { user_uuid: string }; Returns: boolean }
      claim_signal_one_time_prekey: {
        Args: { target_user_id: string }
        Returns: {
          key_id: number
          public_key: string
        }[]
      }
      create_like_notification: {
        Args: {
          p_data?: Json
          p_link?: string
          p_message: string
          p_resource_id?: number
          p_resource_type?: string
          p_resource_uuid?: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: boolean
      }
      create_translation_request: {
        Args: {
          p_content_id: number
          p_content_type: string
          p_original_text: string
          p_source_language: string
          p_target_language: string
        }
        Returns: Json
      }
      current_profile_is_active: { Args: never; Returns: boolean }
      current_user_may_post_user_generated_content: {
        Args: never
        Returns: boolean
      }
      delete_user_data: { Args: { user_uuid: string }; Returns: boolean }
      events_within_radius: {
        Args: {
          p_date_from?: string
          p_lat: number
          p_limit?: number
          p_lng: number
          p_offset?: number
          p_radius_km?: number
        }
        Returns: {
          capacity: number
          category: string
          created_at: string
          date: string
          description: string
          distance_km: number
          end_date: string
          featured: boolean
          id: number
          image_url: string
          latitude: number
          location: string
          longitude: number
          organizer_id: string
          performing_artists: string[]
          price: number
          tags: string[]
          time: string
          title: string
          updated_at: string
        }[]
      }
      events_within_radius_count: {
        Args: {
          p_date_from?: string
          p_lat: number
          p_lng: number
          p_radius_km?: number
        }
        Returns: number
      }
      export_user_data: { Args: { user_uuid: string }; Returns: Json }
      get_available_languages: { Args: never; Returns: Json }
      get_category_name: { Args: { cat_id: number }; Returns: string }
      get_companion_home_stats: { Args: never; Returns: Json }
      get_ghost_users_by_persona: {
        Args: { p_persona_group_id?: number }
        Returns: {
          full_name: string
          id: string
          persona_group_id: number
          username: string
        }[]
      }
      get_my_profile: {
        Args: never
        Returns: {
          account_status: string
          account_status_changed_at: string | null
          account_status_changed_by: string | null
          account_status_reason: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          date_of_birth: string | null
          email_notifications: boolean
          favorite_categories: string[] | null
          full_name: string | null
          id: string
          is_ghost: boolean | null
          last_login: string | null
          last_seen_at: string | null
          latitude: number | null
          location: string | null
          location_confirm_needed: boolean
          location_consent: boolean
          location_consent_at: string | null
          location_source: string | null
          longitude: number | null
          marketing_consent: boolean
          marketing_consent_at: string | null
          media_consent: boolean
          media_consent_at: string | null
          media_consent_version: string | null
          notification_email_prefs: Json
          notification_preferences: Json
          organizer_content_sharing_opt_in: boolean
          phone: string | null
          privacy_accepted_at: string | null
          privacy_version_accepted: string | null
          profile_visibility: string
          push_notifications: boolean
          terms_accepted_at: string | null
          terms_version_accepted: string | null
          two_factor_auth: boolean
          updated_at: string | null
          username: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_public_platform_flags: { Args: never; Returns: Json }
      get_system_translation: {
        Args: { p_key: string; p_language_code?: string }
        Returns: string
      }
      get_translated_content: {
        Args: {
          p_content_id: number
          p_content_type: string
          p_language_code?: string
        }
        Returns: Json
      }
      get_user_emails: {
        Args: { user_ids: string[] }
        Returns: {
          email: string
          user_id: string
        }[]
      }
      get_user_language: { Args: { p_user_id?: string }; Returns: string }
      increment_forum_post_views: {
        Args: { p_post_id: number }
        Returns: number
      }
      is_admin: { Args: { p_uid?: string }; Returns: boolean }
      like_forum_post:
        | {
            Args: { p_post_id: number }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.like_forum_post(p_post_id => int8), public.like_forum_post(p_post_id => int4). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
        | {
            Args: { p_post_id: number }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.like_forum_post(p_post_id => int8), public.like_forum_post(p_post_id => int4). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
      log_ghost_action:
        | {
            Args: {
              p_action_type: string
              p_error_message?: string
              p_ghost_user_id: string
              p_queue_id: number
              p_success: boolean
              p_target_id: number
              p_target_type: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_action_type: string
              p_error_message?: string
              p_ghost_user_id: string
              p_queue_id: number
              p_success: boolean
              p_target_id: string
              p_target_type: string
            }
            Returns: undefined
          }
      lookup_auth_user_id_by_email: {
        Args: { p_email: string }
        Returns: string
      }
      marketplace_assert_enabled: { Args: never; Returns: undefined }
      marketplace_assert_transfer_window: {
        Args: { p_event_id: number }
        Returns: string
      }
      marketplace_cancel_listing: {
        Args: { p_listing_id: number }
        Returns: Json
      }
      marketplace_cancel_listings_for_event: {
        Args: { p_event_id: number }
        Returns: Json
      }
      marketplace_claim_gift: { Args: { p_listing_id: number }; Returns: Json }
      marketplace_complete_transfer: {
        Args: { p_transfer_id: number }
        Returns: Json
      }
      marketplace_confirm_payment: {
        Args: { p_payment_reference?: string; p_transfer_id: number }
        Returns: Json
      }
      marketplace_create_listing: {
        Args: { p_ticket_ids: number[] }
        Returns: Json
      }
      marketplace_ensure_ticket_qr: {
        Args: { p_ticket_id: number }
        Returns: string
      }
      marketplace_expire_due_listings: { Args: never; Returns: Json }
      marketplace_fee_per_ticket: { Args: never; Returns: number }
      marketplace_process_pending_payouts: {
        Args: { p_limit?: number }
        Returns: Json
      }
      marketplace_purchase_listing: {
        Args: { p_listing_id: number; p_payment_reference?: string }
        Returns: Json
      }
      marketplace_retry_payout: { Args: { p_payout_id: number }; Returns: Json }
      marketplace_rotate_ticket_qr: {
        Args: { p_new_owner_id: string; p_ticket_id: number }
        Returns: string
      }
      marketplace_setting_bool: {
        Args: { p_default: boolean; p_key: string }
        Returns: boolean
      }
      marketplace_setting_number: {
        Args: { p_default: number; p_key: string }
        Returns: number
      }
      marketplace_ticket_checked_in: {
        Args: { p_ticket_id: number }
        Returns: boolean
      }
      marketplace_ticket_in_active_listing: {
        Args: { p_ticket_id: number }
        Returns: boolean
      }
      marketplace_transfer_cutoff: {
        Args: { p_event_start: string }
        Returns: string
      }
      migrate_event_categories: { Args: never; Returns: undefined }
      notify_admins: {
        Args: {
          p_data?: Json
          p_link?: string
          p_message: string
          p_resource_id?: number
          p_resource_type?: string
          p_resource_uuid?: string
          p_title: string
          p_type: string
        }
        Returns: number
      }
      profile_matches_announcement_locations: {
        Args: { p_locations: string[]; p_profile_id: string }
        Returns: boolean
      }
      reset_stuck_processing_actions: {
        Args: never
        Returns: {
          action_ids: number[]
          reset_count: number
        }[]
      }
      submit_translation: {
        Args: { p_request_id: number; p_translated_text: string }
        Returns: Json
      }
      unlike_forum_post:
        | {
            Args: { p_post_id: number }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.unlike_forum_post(p_post_id => int8), public.unlike_forum_post(p_post_id => int4). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
        | {
            Args: { p_post_id: number }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.unlike_forum_post(p_post_id => int8), public.unlike_forum_post(p_post_id => int4). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
      update_ghost_action_status: {
        Args: { p_error_message?: string; p_queue_id: number; p_status: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
