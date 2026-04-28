// Inlined Supabase database types — kept in sync with packages/supabase/src/types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_2fa: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          last_verified_at: string | null
          totp_secret_encrypted: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          last_verified_at?: string | null
          totp_secret_encrypted: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          last_verified_at?: string | null
          totp_secret_encrypted?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_audit_logs: {
        Row: {
          action: string
          admin_user_id: string
          after_data: Json | null
          before_data: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          description: string | null
          is_public: boolean
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          description?: string | null
          is_public?: boolean
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          description?: string | null
          is_public?: boolean
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      contact_role_history: {
        Row: {
          id: string
          contact_id: string
          role: string | null
          organisation: string | null
          recorded_at: string
          source: string
          import_id: string | null
        }
        Insert: {
          id?: string
          contact_id: string
          role?: string | null
          organisation?: string | null
          recorded_at?: string
          source?: string
          import_id?: string | null
        }
        Update: {
          id?: string
          contact_id?: string
          role?: string | null
          organisation?: string | null
          recorded_at?: string
          source?: string
          import_id?: string | null
        }
        Relationships: []
      }
      email_suppressions: {
        Row: {
          id: string
          email: string
          reason: string
          added_at: string
          added_by: string | null
        }
        Insert: {
          id?: string
          email: string
          reason?: string
          added_at?: string
          added_by?: string | null
        }
        Update: {
          id?: string
          email?: string
          reason?: string
          added_at?: string
          added_by?: string | null
        }
        Relationships: []
      }
      contact_reports: {
        Row: {
          contact_id: string
          created_at: string
          details: string | null
          id: string
          reason: string
          resolved_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          resolved_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          resolved_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      contact_unlocks: {
        Row: {
          contact_id: string
          created_at: string
          id: string
          metadata: Json | null
          plan_id: string | null
          subscription_id: string | null
          unlock_type: string
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          plan_id?: string | null
          subscription_id?: string | null
          unlock_type?: string
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          plan_id?: string | null
          subscription_id?: string | null
          unlock_type?: string
          user_id?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          category: string | null
          city: string | null
          country: string | null
          created_at: string
          data_confidence_score: number | null
          email: string | null
          id: string
          instagram_url: string | null
          cron_queued_at: string | null
          last_verified_at: string | null
          level: string | null
          linkedin_url: string | null
          name: string
          notes: string | null
          organisation: string | null
          other_social_url: string | null
          phone: string | null
          region: string | null
          role: string | null
          search_vector: unknown
          source: string | null
          source_notes: string | null
          suppression_status: string
          tags: string[] | null
          updated_at: string
          verified_status: string
          visibility_status: string
          website: string | null
          x_url: string | null
          has_email: boolean
          has_phone: boolean
          has_linkedin: boolean
          role_category: string | null
          organisation_id: string | null
        }
        Insert: {
          category?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          cron_queued_at?: string | null
          data_confidence_score?: number | null
          email?: string | null
          id?: string
          instagram_url?: string | null
          last_verified_at?: string | null
          level?: string | null
          linkedin_url?: string | null
          name: string
          notes?: string | null
          organisation?: string | null
          other_social_url?: string | null
          phone?: string | null
          region?: string | null
          role?: string | null
          search_vector?: unknown
          source?: string | null
          source_notes?: string | null
          suppression_status?: string
          tags?: string[] | null
          updated_at?: string
          verified_status?: string
          visibility_status?: string
          website?: string | null
          x_url?: string | null
          role_category?: string | null
          organisation_id?: string | null
        }
        Update: {
          category?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          cron_queued_at?: string | null
          data_confidence_score?: number | null
          email?: string | null
          id?: string
          instagram_url?: string | null
          last_verified_at?: string | null
          level?: string | null
          linkedin_url?: string | null
          name?: string
          notes?: string | null
          organisation?: string | null
          other_social_url?: string | null
          phone?: string | null
          region?: string | null
          role?: string | null
          search_vector?: unknown
          source?: string | null
          source_notes?: string | null
          suppression_status?: string
          tags?: string[] | null
          updated_at?: string
          verified_status?: string
          visibility_status?: string
          website?: string | null
          x_url?: string | null
          role_category?: string | null
          organisation_id?: string | null
        }
        Relationships: []
      }
      organisations: {
        Row: {
          id: string
          name: string
          normalised_name: string
          org_type: string | null
          logo_url: string | null
          website: string | null
          country: string | null
          city: string | null
          league: string | null
          level: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          org_type?: string | null
          logo_url?: string | null
          website?: string | null
          country?: string | null
          city?: string | null
          league?: string | null
          level?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          org_type?: string | null
          logo_url?: string | null
          website?: string | null
          country?: string | null
          city?: string | null
          league?: string | null
          level?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      csv_import_rows: {
        Row: {
          contact_id: string | null
          created_at: string
          csv_import_id: string
          error_message: string | null
          id: string
          raw_data: Json
          row_number: number
          status: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          csv_import_id: string
          error_message?: string | null
          id?: string
          raw_data: Json
          row_number: number
          status?: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          csv_import_id?: string
          error_message?: string | null
          id?: string
          raw_data?: Json
          row_number?: number
          status?: string
        }
        Relationships: []
      }
      csv_imports: {
        Row: {
          admin_user_id: string
          completed_at: string | null
          created_at: string
          failed_rows: number | null
          filename: string
          id: string
          import_mode: string
          status: string
          skipped_rows: number | null
          successful_rows: number | null
          suppressed_rows: number | null
          total_rows: number | null
          updated_rows: number | null
        }
        Insert: {
          admin_user_id: string
          completed_at?: string | null
          created_at?: string
          failed_rows?: number | null
          filename: string
          id?: string
          import_mode?: string
          skipped_rows?: number | null
          status?: string
          successful_rows?: number | null
          suppressed_rows?: number | null
          total_rows?: number | null
          updated_rows?: number | null
        }
        Update: {
          admin_user_id?: string
          completed_at?: string | null
          created_at?: string
          failed_rows?: number | null
          filename?: string
          id?: string
          import_mode?: string
          skipped_rows?: number | null
          status?: string
          successful_rows?: number | null
          suppressed_rows?: number | null
          total_rows?: number | null
          updated_rows?: number | null
        }
        Relationships: []
      }
      email_verification_tasks: {
        Row: {
          id: string
          reoon_task_id: string
          task_name: string | null
          status: string
          count_submitted: number | null
          count_processing: number | null
          count_duplicates_removed: number | null
          progress_percentage: number | null
          created_by: string
          created_at: string
          completed_at: string | null
          error_message: string | null
          results_applied: boolean | null
        }
        Insert: {
          id?: string
          reoon_task_id: string
          task_name?: string | null
          status?: string
          count_submitted?: number | null
          count_processing?: number | null
          count_duplicates_removed?: number | null
          progress_percentage?: number | null
          created_by?: string | null
          created_at?: string
          completed_at?: string | null
          error_message?: string | null
          results_applied?: boolean | null
        }
        Update: {
          id?: string
          reoon_task_id?: string
          task_name?: string | null
          status?: string
          count_submitted?: number | null
          count_processing?: number | null
          count_duplicates_removed?: number | null
          progress_percentage?: number | null
          created_by?: string
          created_at?: string
          completed_at?: string | null
          error_message?: string | null
          results_applied?: boolean | null
        }
        Relationships: []
      }
      exports: {
        Row: {
          contact_count: number
          created_at: string
          export_type: string
          id: string
          ip_address: string | null
          list_id: string | null
          plan_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          contact_count?: number
          created_at?: string
          export_type?: string
          id?: string
          ip_address?: string | null
          list_id?: string | null
          plan_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          contact_count?: number
          created_at?: string
          export_type?: string
          id?: string
          ip_address?: string | null
          list_id?: string | null
          plan_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      list_contacts: {
        Row: {
          contact_id: string
          created_at: string
          id: string
          list_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          id?: string
          list_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          id?: string
          list_id?: string
        }
        Relationships: []
      }
      lists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          age_group: string | null
          application_method: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          deadline: string | null
          description: string
          event_date: string | null
          external_url: string | null
          gender_eligibility: string | null
          id: string
          is_premium: boolean
          location: string | null
          organisation: string | null
          requirements: string | null
          skill_level: string | null
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          age_group?: string | null
          application_method?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          description: string
          event_date?: string | null
          external_url?: string | null
          gender_eligibility?: string | null
          id?: string
          is_premium?: boolean
          location?: string | null
          organisation?: string | null
          requirements?: string | null
          skill_level?: string | null
          status?: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          age_group?: string | null
          application_method?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          description?: string
          event_date?: string | null
          external_url?: string | null
          gender_eligibility?: string | null
          id?: string
          is_premium?: boolean
          location?: string | null
          organisation?: string | null
          requirements?: string | null
          skill_level?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      opportunity_responses: {
        Row: {
          age: number | null
          current_club: string | null
          highlight_video_url: string | null
          id: string
          level: string
          location: string
          message: string
          name: string
          opportunity_id: string
          position: string | null
          submitted_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          current_club?: string | null
          highlight_video_url?: string | null
          id?: string
          level: string
          location: string
          message: string
          name: string
          opportunity_id: string
          position?: string | null
          submitted_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          current_club?: string | null
          highlight_video_url?: string | null
          id?: string
          level?: string
          location?: string
          message?: string
          name?: string
          opportunity_id?: string
          position?: string | null
          submitted_at?: string
          user_id?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          code: string
          created_at: string
          features: Json
          id: string
          is_active: boolean
          monthly_export_limit: number
          monthly_price_gbp: number
          monthly_unlock_limit: number
          name: string
          sort_order: number
          stripe_monthly_price_id: string | null
          stripe_yearly_price_id: string | null
          updated_at: string
          yearly_price_gbp: number | null
        }
        Insert: {
          code: string
          created_at?: string
          features?: Json
          id?: string
          is_active?: boolean
          monthly_export_limit?: number
          monthly_price_gbp?: number
          monthly_unlock_limit?: number
          name: string
          sort_order?: number
          stripe_monthly_price_id?: string | null
          stripe_yearly_price_id?: string | null
          updated_at?: string
          yearly_price_gbp?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          features?: Json
          id?: string
          is_active?: boolean
          monthly_export_limit?: number
          monthly_price_gbp?: number
          monthly_unlock_limit?: number
          name?: string
          sort_order?: number
          stripe_monthly_price_id?: string | null
          stripe_yearly_price_id?: string | null
          updated_at?: string
          yearly_price_gbp?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          bonus_unlock_credits: number
          country: string | null
          created_at: string
          current_club: string | null
          email: string | null
          first_name: string | null
          football_level: string | null
          free_unlock_used: boolean
          full_name: string | null
          highlight_video_url: string | null
          id: string
          is_suspended: boolean
          last_name: string | null
          onboarding_completed: boolean | null
          onboarding_last_updated: string | null
          onboarding_step: number | null
          open_to_opportunities: string | null
          player_age_group: string | null
          position: string | null
          primary_goals: Json | null
          role: string | null
          suspended_reason: string | null
          updated_at: string
          user_type: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bonus_unlock_credits?: number
          city?: string | null
          country?: string | null
          created_at?: string
          current_club?: string | null
          email?: string | null
          first_name?: string | null
          football_level?: string | null
          free_unlock_used?: boolean
          full_name?: string | null
          highlight_video_url?: string | null
          id: string
          is_suspended?: boolean
          last_name?: string | null
          onboarding_completed?: boolean | null
          onboarding_last_updated?: string | null
          onboarding_step?: number | null
          open_to_opportunities?: string | null
          player_age_group?: string | null
          position?: string | null
          primary_goals?: Json | null
          role?: string | null
          suspended_reason?: string | null
          updated_at?: string
          user_type?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bonus_unlock_credits?: number
          city?: string | null
          country?: string | null
          created_at?: string
          current_club?: string | null
          email?: string | null
          first_name?: string | null
          football_level?: string | null
          free_unlock_used?: boolean
          full_name?: string | null
          highlight_video_url?: string | null
          id?: string
          is_suspended?: boolean
          last_name?: string | null
          onboarding_completed?: boolean | null
          onboarding_last_updated?: string | null
          onboarding_step?: number | null
          open_to_opportunities?: string | null
          player_age_group?: string | null
          position?: string | null
          primary_goals?: Json | null
          role?: string | null
          suspended_reason?: string | null
          updated_at?: string
          user_type?: string | null
          username?: string | null
        }
        Relationships: []
      }
      recently_viewed_contacts: {
        Row: {
          contact_id: string
          id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          contact_id: string
          id?: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          contact_id?: string
          id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: []
      }
      removal_requests: {
        Row: {
          admin_notes: string | null
          contact_id: string | null
          created_at: string
          id: string
          reason: string
          requester_email: string
          requester_name: string
          resolved_at: string | null
          status: string
        }
        Insert: {
          admin_notes?: string | null
          contact_id?: string | null
          created_at?: string
          id?: string
          reason: string
          requester_email: string
          requester_name: string
          resolved_at?: string | null
          status?: string
        }
        Update: {
          admin_notes?: string | null
          contact_id?: string | null
          created_at?: string
          id?: string
          reason?: string
          requester_email?: string
          requester_name?: string
          resolved_at?: string | null
          status?: string
        }
        Relationships: []
      }
      saved_searches: {
        Row: {
          created_at: string
          filters: Json | null
          id: string
          name: string
          query: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filters?: Json | null
          id?: string
          name: string
          query?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          filters?: Json | null
          id?: string
          name?: string
          query?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_usage_periods: {
        Row: {
          created_at: string
          export_count: number
          id: string
          period_end: string
          period_start: string
          plan_id: string | null
          subscription_id: string | null
          unlock_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          export_count?: number
          id?: string
          period_end: string
          period_start: string
          plan_id?: string | null
          subscription_id?: string | null
          unlock_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          export_count?: number
          id?: string
          period_end?: string
          period_start?: string
          plan_id?: string | null
          subscription_id?: string | null
          unlock_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      is_admin: { Args: { check_user_id?: string }; Returns: boolean }
      get_admin_secret: { Args: { name: string }; Returns: string }
      unlock_contact: { Args: { p_contact_id: string }; Returns: Json }
      get_unlock_usage: { Args: Record<string, never>; Returns: Json }
      increment_bonus_credits: { Args: { p_user_id: string; p_amount: number }; Returns: undefined }
      log_export: {
        Args: {
          p_contact_count: number
          p_list_id?: string | null
          p_export_type?: string
        }
        Returns: Json
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<T extends keyof DefaultSchema["Tables"] & string> =
  DefaultSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof DefaultSchema["Tables"] & string> =
  DefaultSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof DefaultSchema["Tables"] & string> =
  DefaultSchema["Tables"][T]["Update"]
