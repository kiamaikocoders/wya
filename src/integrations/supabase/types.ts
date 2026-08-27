export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
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
      events: {
        Row: {
          capacity: number | null
          category: string | null
          created_at: string | null
          date: string
          description: string | null
          end_date: string | null
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
          tags: string[] | null
          ticket_link: string | null
          time: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          capacity?: number | null
          category?: string | null
          created_at?: string | null
          date: string
          description?: string | null
          end_date?: string | null
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
          tags?: string[] | null
          ticket_link?: string | null
          time?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          capacity?: number | null
          category?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          end_date?: string | null
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
          tags?: string[] | null
          ticket_link?: string | null
          time?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
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
      forum_posts: {
        Row: {
          content: string
          created_at: string | null
          event_id: number | null
          id: number
          likes_count: number | null
          media_url: string | null
          moderation_status: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          event_id?: number | null
          id?: number
          likes_count?: number | null
          media_url?: string | null
          moderation_status?: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          event_id?: number | null
          id?: number
          likes_count?: number | null
          media_url?: string | null
          moderation_status?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_posts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          receiver_id: string | null
          sender_id: string | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          receiver_id?: string | null
          sender_id?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          receiver_id?: string | null
          sender_id?: string | null
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
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: number
          message: string
          read: boolean | null
          resource_id: number | null
          resource_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          message: string
          read?: boolean | null
          resource_id?: number | null
          resource_type?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          message?: string
          read?: boolean | null
          resource_id?: number | null
          resource_type?: string | null
          title?: string
          type?: string
          user_id?: string
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
          full_name: string | null
          id: string
          is_ghost: boolean | null
          last_login: string | null
          latitude: number | null
          location: string | null
          location_consent: boolean
          location_consent_at: string | null
          location_source: string | null
          location_confirm_needed: boolean
          longitude: number | null
          marketing_consent: boolean
          marketing_consent_at: string | null
          media_consent: boolean
          media_consent_at: string | null
          media_consent_version: string | null
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
          full_name?: string | null
          id: string
          is_ghost?: boolean | null
          last_login?: string | null
          latitude?: number | null
          location?: string | null
          location_consent?: boolean
          location_consent_at?: string | null
          location_source?: string | null
          location_confirm_needed?: boolean
          longitude?: number | null
          marketing_consent?: boolean
          marketing_consent_at?: string | null
          media_consent?: boolean
          media_consent_at?: string | null
          media_consent_version?: string | null
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
          full_name?: string | null
          id?: string
          is_ghost?: boolean | null
          last_login?: string | null
          latitude?: number | null
          location?: string | null
          location_consent?: boolean
          location_consent_at?: string | null
          location_source?: string | null
          location_confirm_needed?: boolean
          longitude?: number | null
          marketing_consent?: boolean
          marketing_consent_at?: string | null
          media_consent?: boolean
          media_consent_at?: string | null
          media_consent_version?: string | null
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
          budget: string | null
          category: string
          description: string
          estimated_date: string | null
          expected_attendees: number | null
          id: number
          location: string | null
          sponsor_needs: string | null
          status: string
          submitted_by: string
          submitted_on: string | null
          title: string
        }
        Insert: {
          budget?: string | null
          category: string
          description: string
          estimated_date?: string | null
          expected_attendees?: number | null
          id?: number
          location?: string | null
          sponsor_needs?: string | null
          status?: string
          submitted_by: string
          submitted_on?: string | null
          title: string
        }
        Update: {
          budget?: string | null
          category?: string
          description?: string
          estimated_date?: string | null
          expected_attendees?: number | null
          id?: number
          location?: string | null
          sponsor_needs?: string | null
          status?: string
          submitted_by?: string
          submitted_on?: string | null
          title?: string
        }
        Relationships: []
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
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_set_account_status: {
        Args: {
          p_target: string
          p_status: string
          p_reason?: string | null
        }
        Returns: undefined
      }
      admin_soft_delete_user: {
        Args: {
          p_target: string
          p_reason?: string | null
        }
        Returns: undefined
      }
      events_within_radius: {
        Args: {
          p_lat: number
          p_lng: number
          p_radius_km?: number
          p_limit?: number
          p_offset?: number
          p_date_from?: string | null
        }
        Returns: {
          id: number
          title: string
          description: string | null
          date: string
          end_date: string | null
          time: string | null
          location: string
          image_url: string | null
          capacity: number | null
          price: number | null
          category: string | null
          organizer_id: string | null
          featured: boolean | null
          created_at: string | null
          updated_at: string | null
          tags: string[] | null
          latitude: number | null
          longitude: number | null
          performing_artists: string[] | null
          distance_km: number
        }[]
      }
      events_within_radius_count: {
        Args: {
          p_lat: number
          p_lng: number
          p_radius_km?: number
          p_date_from?: string | null
        }
        Returns: number
      }
      get_companion_home_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      notify_admins: {
        Args: {
          p_type: string
          p_title: string
          p_message: string
          p_link?: string | null
          p_resource_type?: string | null
          p_resource_id?: number | null
          p_resource_uuid?: string | null
          p_data?: Json | null
        }
        Returns: number
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
