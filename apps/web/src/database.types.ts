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
      campaign_enrollments: {
        Row: {
          campaign: string
          completed_at: string | null
          enrolled_at: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          campaign: string
          completed_at?: string | null
          enrolled_at?: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          campaign?: string
          completed_at?: string | null
          enrolled_at?: string
          id?: string
          status?: string
          user_id?: string
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
        Relationships: [
          {
            foreignKeyName: "contact_reports_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_reports_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_role_history: {
        Row: {
          change_type: string | null
          contact_id: string
          id: string
          import_id: string | null
          new_email: string | null
          new_organisation_id: string | null
          new_phone: string | null
          organisation: string | null
          prev_email: string | null
          prev_organisation: string | null
          prev_organisation_id: string | null
          prev_phone: string | null
          prev_role: string | null
          recorded_at: string
          review_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          role: string | null
          source: string
        }
        Insert: {
          change_type?: string | null
          contact_id: string
          id?: string
          import_id?: string | null
          new_email?: string | null
          new_organisation_id?: string | null
          new_phone?: string | null
          organisation?: string | null
          prev_email?: string | null
          prev_organisation?: string | null
          prev_organisation_id?: string | null
          prev_phone?: string | null
          prev_role?: string | null
          recorded_at?: string
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          role?: string | null
          source?: string
        }
        Update: {
          change_type?: string | null
          contact_id?: string
          id?: string
          import_id?: string | null
          new_email?: string | null
          new_organisation_id?: string | null
          new_phone?: string | null
          organisation?: string | null
          prev_email?: string | null
          prev_organisation?: string | null
          prev_organisation_id?: string | null
          prev_phone?: string | null
          prev_role?: string | null
          recorded_at?: string
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          role?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_role_history_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_role_history_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_role_history_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "csv_imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_role_history_new_organisation_id_fkey"
            columns: ["new_organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_role_history_prev_organisation_id_fkey"
            columns: ["prev_organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "contact_unlocks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_unlocks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_unlocks_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_unlocks_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_views: {
        Row: {
          contact_id: string
          id: number
          ip: string | null
          user_agent: string | null
          user_id: string
          viewed_at: string
        }
        Insert: {
          contact_id: string
          id?: number
          ip?: string | null
          user_agent?: string | null
          user_id: string
          viewed_at?: string
        }
        Update: {
          contact_id?: string
          id?: number
          ip?: string | null
          user_agent?: string | null
          user_id?: string
          viewed_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          category: string | null
          city: string | null
          country: string | null
          created_at: string
          cron_queued_at: string | null
          data_confidence_score: number | null
          email: string | null
          has_email: boolean | null
          has_linkedin: boolean | null
          has_phone: boolean | null
          id: string
          import_status: string
          instagram_url: string | null
          is_honeypot: boolean
          last_verified_at: string | null
          level: string | null
          linkedin_url: string | null
          name: string
          notes: string | null
          organisation: string | null
          organisation_id: string | null
          other_social_url: string | null
          phone: string | null
          region: string | null
          role: string | null
          role_category: string | null
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
        }
        Insert: {
          category?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          cron_queued_at?: string | null
          data_confidence_score?: number | null
          email?: string | null
          has_email?: boolean | null
          has_linkedin?: boolean | null
          has_phone?: boolean | null
          id?: string
          import_status?: string
          instagram_url?: string | null
          is_honeypot?: boolean
          last_verified_at?: string | null
          level?: string | null
          linkedin_url?: string | null
          name: string
          notes?: string | null
          organisation?: string | null
          organisation_id?: string | null
          other_social_url?: string | null
          phone?: string | null
          region?: string | null
          role?: string | null
          role_category?: string | null
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
        }
        Update: {
          category?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          cron_queued_at?: string | null
          data_confidence_score?: number | null
          email?: string | null
          has_email?: boolean | null
          has_linkedin?: boolean | null
          has_phone?: boolean | null
          id?: string
          import_status?: string
          instagram_url?: string | null
          is_honeypot?: boolean
          last_verified_at?: string | null
          level?: string | null
          linkedin_url?: string | null
          name?: string
          notes?: string | null
          organisation?: string | null
          organisation_id?: string | null
          other_social_url?: string | null
          phone?: string | null
          region?: string | null
          role?: string | null
          role_category?: string | null
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
        }
        Relationships: [
          {
            foreignKeyName: "contacts_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts_legacy: {
        Row: {
          Cleaned_company_name: string | null
          Company_address: string | null
          Company_annual_revenue: string | null
          Company_blog_link: string | null
          Company_city: string | null
          Company_country: string | null
          Company_facebook_link: string | null
          Company_founded_year: string | null
          company_id: number | null
          Company_keywords: Json | null
          Company_latest_funding_amount: string | null
          Company_latest_funding_type: string | null
          Company_linkedIn_link: string | null
          Company_market_cap: string | null
          Company_name: string | null
          Company_phone_number: string | null
          Company_postal_code: string | null
          Company_sEO_description: string | null
          Company_short_description: string | null
          Company_state: string | null
          Company_street: string | null
          Company_technologies: Json | null
          Company_total_funding: string | null
          Company_twitter_link: string | null
          Company_website_full: string | null
          Company_website_short: string | null
          created_at: string | null
          Departments: string | null
          Email: string | null
          Email_status: string | null
          email_visible: boolean | null
          Employee_count: string | null
          First_name: string | null
          Full_name: string | null
          Functions: string | null
          Headline: string | null
          id: number
          Industry: string | null
          Is_likely_to_engage: string | null
          is_saved: boolean | null
          Last_fund_raised_at: string | null
          Last_name: string | null
          Lead_city: string | null
          Lead_country: string | null
          Lead_state: string | null
          LinkedIn_link: string | null
          Number_of_retail_locations: string | null
          Personal_email: string | null
          search_vector: unknown
          Seniority: string | null
          Subdepartments: string | null
          Title: string | null
          updated_at: string | null
        }
        Insert: {
          Cleaned_company_name?: string | null
          Company_address?: string | null
          Company_annual_revenue?: string | null
          Company_blog_link?: string | null
          Company_city?: string | null
          Company_country?: string | null
          Company_facebook_link?: string | null
          Company_founded_year?: string | null
          company_id?: number | null
          Company_keywords?: Json | null
          Company_latest_funding_amount?: string | null
          Company_latest_funding_type?: string | null
          Company_linkedIn_link?: string | null
          Company_market_cap?: string | null
          Company_name?: string | null
          Company_phone_number?: string | null
          Company_postal_code?: string | null
          Company_sEO_description?: string | null
          Company_short_description?: string | null
          Company_state?: string | null
          Company_street?: string | null
          Company_technologies?: Json | null
          Company_total_funding?: string | null
          Company_twitter_link?: string | null
          Company_website_full?: string | null
          Company_website_short?: string | null
          created_at?: string | null
          Departments?: string | null
          Email?: string | null
          Email_status?: string | null
          email_visible?: boolean | null
          Employee_count?: string | null
          First_name?: string | null
          Full_name?: string | null
          Functions?: string | null
          Headline?: string | null
          id?: number
          Industry?: string | null
          Is_likely_to_engage?: string | null
          is_saved?: boolean | null
          Last_fund_raised_at?: string | null
          Last_name?: string | null
          Lead_city?: string | null
          Lead_country?: string | null
          Lead_state?: string | null
          LinkedIn_link?: string | null
          Number_of_retail_locations?: string | null
          Personal_email?: string | null
          search_vector?: unknown
          Seniority?: string | null
          Subdepartments?: string | null
          Title?: string | null
          updated_at?: string | null
        }
        Update: {
          Cleaned_company_name?: string | null
          Company_address?: string | null
          Company_annual_revenue?: string | null
          Company_blog_link?: string | null
          Company_city?: string | null
          Company_country?: string | null
          Company_facebook_link?: string | null
          Company_founded_year?: string | null
          company_id?: number | null
          Company_keywords?: Json | null
          Company_latest_funding_amount?: string | null
          Company_latest_funding_type?: string | null
          Company_linkedIn_link?: string | null
          Company_market_cap?: string | null
          Company_name?: string | null
          Company_phone_number?: string | null
          Company_postal_code?: string | null
          Company_sEO_description?: string | null
          Company_short_description?: string | null
          Company_state?: string | null
          Company_street?: string | null
          Company_technologies?: Json | null
          Company_total_funding?: string | null
          Company_twitter_link?: string | null
          Company_website_full?: string | null
          Company_website_short?: string | null
          created_at?: string | null
          Departments?: string | null
          Email?: string | null
          Email_status?: string | null
          email_visible?: boolean | null
          Employee_count?: string | null
          First_name?: string | null
          Full_name?: string | null
          Functions?: string | null
          Headline?: string | null
          id?: number
          Industry?: string | null
          Is_likely_to_engage?: string | null
          is_saved?: boolean | null
          Last_fund_raised_at?: string | null
          Last_name?: string | null
          Lead_city?: string | null
          Lead_country?: string | null
          Lead_state?: string | null
          LinkedIn_link?: string | null
          Number_of_retail_locations?: string | null
          Personal_email?: string | null
          search_vector?: unknown
          Seniority?: string | null
          Subdepartments?: string | null
          Title?: string | null
          updated_at?: string | null
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
        Relationships: [
          {
            foreignKeyName: "csv_import_rows_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "csv_import_rows_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "csv_import_rows_csv_import_id_fkey"
            columns: ["csv_import_id"]
            isOneToOne: false
            referencedRelation: "csv_imports"
            referencedColumns: ["id"]
          },
        ]
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
          skipped_rows: number | null
          status: string
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
      email_events: {
        Row: {
          email_job_id: string | null
          event_type: string
          id: string
          payload: Json
          provider: string
          provider_event_id: string
          received_at: string
          resend_message_id: string | null
        }
        Insert: {
          email_job_id?: string | null
          event_type: string
          id?: string
          payload: Json
          provider?: string
          provider_event_id: string
          received_at?: string
          resend_message_id?: string | null
        }
        Update: {
          email_job_id?: string | null
          event_type?: string
          id?: string
          payload?: Json
          provider?: string
          provider_event_id?: string
          received_at?: string
          resend_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_events_email_job_id_fkey"
            columns: ["email_job_id"]
            isOneToOne: false
            referencedRelation: "email_dlq"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_events_email_job_id_fkey"
            columns: ["email_job_id"]
            isOneToOne: false
            referencedRelation: "email_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      email_jobs: {
        Row: {
          attempt_count: number
          cancelled_at: string | null
          category: string
          created_at: string
          delivered_at: string | null
          failed_at: string | null
          id: string
          idempotency_key: string
          last_error: string | null
          locked_at: string | null
          max_attempts: number
          next_retry_at: string | null
          provider: string
          reply_to: string | null
          resend_message_id: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["email_job_status"]
          template_id: string
          template_props: Json
          to_email: string
          to_name: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          attempt_count?: number
          cancelled_at?: string | null
          category?: string
          created_at?: string
          delivered_at?: string | null
          failed_at?: string | null
          id?: string
          idempotency_key: string
          last_error?: string | null
          locked_at?: string | null
          max_attempts?: number
          next_retry_at?: string | null
          provider?: string
          reply_to?: string | null
          resend_message_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["email_job_status"]
          template_id: string
          template_props?: Json
          to_email: string
          to_name?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          attempt_count?: number
          cancelled_at?: string | null
          category?: string
          created_at?: string
          delivered_at?: string | null
          failed_at?: string | null
          id?: string
          idempotency_key?: string
          last_error?: string | null
          locked_at?: string | null
          max_attempts?: number
          next_retry_at?: string | null
          provider?: string
          reply_to?: string | null
          resend_message_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["email_job_status"]
          template_id?: string
          template_props?: Json
          to_email?: string
          to_name?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      email_suppressions: {
        Row: {
          category: string
          created_at: string
          details: Json
          email: string
          id: string
          reason: Database["public"]["Enums"]["email_suppression_reason"]
          source: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          details?: Json
          email: string
          id?: string
          reason?: Database["public"]["Enums"]["email_suppression_reason"]
          source?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          details?: Json
          email?: string
          id?: string
          reason?: Database["public"]["Enums"]["email_suppression_reason"]
          source?: string | null
        }
        Relationships: []
      }
      email_verification_tasks: {
        Row: {
          completed_at: string | null
          count_duplicates_removed: number | null
          count_processing: number | null
          count_submitted: number | null
          created_at: string
          created_by: string | null
          error_message: string | null
          id: string
          progress_percentage: number | null
          reoon_task_id: string
          results_applied: boolean | null
          status: string
          task_name: string | null
        }
        Insert: {
          completed_at?: string | null
          count_duplicates_removed?: number | null
          count_processing?: number | null
          count_submitted?: number | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          progress_percentage?: number | null
          reoon_task_id: string
          results_applied?: boolean | null
          status?: string
          task_name?: string | null
        }
        Update: {
          completed_at?: string | null
          count_duplicates_removed?: number | null
          count_processing?: number | null
          count_submitted?: number | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          progress_percentage?: number | null
          reoon_task_id?: string
          results_applied?: boolean | null
          status?: string
          task_name?: string | null
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
        Relationships: [
          {
            foreignKeyName: "exports_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exports_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "list_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_contacts_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "opportunity_responses_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      organisations: {
        Row: {
          city: string | null
          country: string | null
          created_at: string | null
          domain: string | null
          id: string
          league: string | null
          level: string | null
          linkedin_url: string | null
          logo_url: string | null
          name: string
          normalised_name: string | null
          org_type: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          domain?: string | null
          id?: string
          league?: string | null
          level?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          name: string
          normalised_name?: string | null
          org_type?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          domain?: string | null
          id?: string
          league?: string | null
          level?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          name?: string
          normalised_name?: string | null
          org_type?: string | null
          updated_at?: string | null
          website?: string | null
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
          bonus_unlock_credits: number
          city: string | null
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
          lifetime_unlocks_used: number
          dashboard_welcome_dismissed: boolean
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          onboarding_last_updated: string | null
          onboarding_step: number | null
          open_to_opportunities: string | null
          player_age_group: string | null
          position: string | null
          preferred_region: string | null
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
          lifetime_unlocks_used?: number
          dashboard_welcome_dismissed?: boolean
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_last_updated?: string | null
          onboarding_step?: number | null
          open_to_opportunities?: string | null
          player_age_group?: string | null
          position?: string | null
          preferred_region?: string | null
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
          lifetime_unlocks_used?: number
          dashboard_welcome_dismissed?: boolean
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_last_updated?: string | null
          onboarding_step?: number | null
          open_to_opportunities?: string | null
          player_age_group?: string | null
          position?: string | null
          preferred_region?: string | null
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
        Relationships: [
          {
            foreignKeyName: "recently_viewed_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recently_viewed_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_safe"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "removal_requests_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "removal_requests_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_safe"
            referencedColumns: ["id"]
          },
        ]
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
      scraper_flags: {
        Row: {
          flagged_at: string
          id: number
          reason: string
          reviewed: boolean
          user_id: string
        }
        Insert: {
          flagged_at?: string
          id?: number
          reason: string
          reviewed?: boolean
          user_id: string
        }
        Update: {
          flagged_at?: string
          id?: number
          reason?: string
          reviewed?: boolean
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
        Relationships: [
          {
            foreignKeyName: "subscription_usage_periods_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_usage_periods_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          past_due_since: string | null
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
          past_due_since?: string | null
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
          past_due_since?: string | null
          plan_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      contacts_safe: {
        Row: {
          category: string | null
          city: string | null
          country: string | null
          created_at: string | null
          cron_queued_at: string | null
          data_confidence_score: number | null
          has_email: boolean | null
          has_linkedin: boolean | null
          has_phone: boolean | null
          id: string | null
          import_status: string | null
          is_honeypot: boolean | null
          last_verified_at: string | null
          level: string | null
          name: string | null
          organisation: string | null
          organisation_id: string | null
          region: string | null
          role: string | null
          role_category: string | null
          search_vector: unknown
          source: string | null
          source_notes: string | null
          suppression_status: string | null
          tags: string[] | null
          updated_at: string | null
          verified_status: string | null
          visibility_status: string | null
        }
        Insert: {
          category?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          cron_queued_at?: string | null
          data_confidence_score?: number | null
          has_email?: boolean | null
          has_linkedin?: boolean | null
          has_phone?: boolean | null
          id?: string | null
          import_status?: string | null
          is_honeypot?: boolean | null
          last_verified_at?: string | null
          level?: string | null
          name?: string | null
          organisation?: string | null
          organisation_id?: string | null
          region?: string | null
          role?: string | null
          role_category?: string | null
          search_vector?: unknown
          source?: string | null
          source_notes?: string | null
          suppression_status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          verified_status?: string | null
          visibility_status?: string | null
        }
        Update: {
          category?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          cron_queued_at?: string | null
          data_confidence_score?: number | null
          has_email?: boolean | null
          has_linkedin?: boolean | null
          has_phone?: boolean | null
          id?: string | null
          import_status?: string | null
          is_honeypot?: boolean | null
          last_verified_at?: string | null
          level?: string | null
          name?: string | null
          organisation?: string | null
          organisation_id?: string | null
          region?: string | null
          role?: string | null
          role_category?: string | null
          search_vector?: unknown
          source?: string | null
          source_notes?: string | null
          suppression_status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          verified_status?: string | null
          visibility_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_dlq: {
        Row: {
          attempt_count: number | null
          category: string | null
          created_at: string | null
          failed_at: string | null
          id: string | null
          idempotency_key: string | null
          last_error: string | null
          max_attempts: number | null
          template_id: string | null
          to_email: string | null
        }
        Insert: {
          attempt_count?: number | null
          category?: string | null
          created_at?: string | null
          failed_at?: string | null
          id?: string | null
          idempotency_key?: string | null
          last_error?: string | null
          max_attempts?: number | null
          template_id?: string | null
          to_email?: string | null
        }
        Update: {
          attempt_count?: number | null
          category?: string | null
          created_at?: string | null
          failed_at?: string | null
          id?: string | null
          idempotency_key?: string | null
          last_error?: string | null
          max_attempts?: number | null
          template_id?: string | null
          to_email?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_prorated_credits:
        | {
            Args: {
              current_period_end: string
              current_period_start: string
              new_credits: number
              old_credits: number
            }
            Returns: number
          }
        | {
            Args: {
              current_credits_remaining?: number
              current_period_end: string
              current_period_start: string
              new_credits: number
              old_credits: number
            }
            Returns: number
          }
      check_index_exists: { Args: { index_name: string }; Returns: boolean }
      check_login_attempts: {
        Args: { email_address: string; ip: string }
        Returns: boolean
      }
      check_user_limits: {
        Args: { action_type: string; user_id: string }
        Returns: Json
      }
      claim_email_jobs: {
        Args: { batch_size: number }
        Returns: {
          attempt_count: number
          cancelled_at: string | null
          category: string
          created_at: string
          delivered_at: string | null
          failed_at: string | null
          id: string
          idempotency_key: string
          last_error: string | null
          locked_at: string | null
          max_attempts: number
          next_retry_at: string | null
          provider: string
          reply_to: string | null
          resend_message_id: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["email_job_status"]
          template_id: string
          template_props: Json
          to_email: string
          to_name: string | null
          updated_at: string
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "email_jobs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      detect_scraper_sequential: { Args: never; Returns: undefined }
      detect_scraper_velocity: { Args: never; Returns: undefined }
      detect_shared_ip_accounts: { Args: never; Returns: undefined }
      force_logout_other_sessions: {
        Args: { p_current_session_id: number; p_user_id: string }
        Returns: undefined
      }
      get_admin_secret: { Args: { name: string }; Returns: string }
      get_public_profile_fields: {
        Args: { p_username: string }
        Returns: {
          avatar_url: string
          banner_url: string
          bio: string
          city: string
          country: string
          created_at: string
          first_name: string
          id: string
          last_name: string
          title: string
          username: string
          website_url: string
        }[]
      }
      get_reactivation_audience: {
        Args: never
        Returns: {
          email: string
          first_name: string
          full_name: string
          id: string
        }[]
      }
      get_unlock_usage: { Args: never; Returns: Json }
      handle_credit_suspension: {
        Args: {
          p_admin_id?: string
          p_reason: string
          p_suspended: boolean
          p_user_id: string
        }
        Returns: Json
      }
      handle_onboarding_subscription: {
        Args: { plan_name: string; user_id: string }
        Returns: undefined
      }
      handle_subscription_credit_reset: {
        Args: { p_payment_date?: string; p_plan_id: number; p_user_id: string }
        Returns: undefined
      }
      handle_subscription_dispute: {
        Args: {
          p_action: string
          p_reason: string
          p_subscription_id: string
          p_user_id: string
        }
        Returns: Json
      }
      handle_subscription_downgrade: {
        Args: {
          p_apply_at_period_end?: boolean
          p_new_plan_id: number
          p_user_id: string
        }
        Returns: Json
      }
      handle_subscription_refund: {
        Args: {
          p_admin_id?: string
          p_notes?: string
          p_refund_amount: number
          p_subscription_id: string
          p_user_id: string
        }
        Returns: Json
      }
      handle_subscription_upgrade:
        | {
            Args: {
              p_new_plan_id: number
              p_stripe_subscription_id: string
              p_user_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_interval?: string
              p_new_plan_id: number
              p_stripe_subscription_id: string
              p_user_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_interval?: string
              p_minimum_credits?: number
              p_new_plan_id: number
              p_stripe_subscription_id: string
              p_user_id: string
            }
            Returns: Json
          }
      health_email_status_breakdown: {
        Args: never
        Returns: {
          count: number
          status: string
        }[]
      }
      health_weekly_growth: {
        Args: never
        Returns: {
          added: number
          week_start: string
        }[]
      }
      increment_bonus_credits: {
        Args: { p_amount: number; p_user_id: string }
        Returns: undefined
      }
      is_admin: { Args: { check_user_id?: string }; Returns: boolean }
      is_org_member: {
        Args: { org_id: number; user_uuid: string }
        Returns: boolean
      }
      is_org_owner: {
        Args: { org_id: number; user_uuid: string }
        Returns: boolean
      }
      log_export: {
        Args: {
          p_contact_count: number
          p_export_type?: string
          p_list_id?: string
        }
        Returns: Json
      }
      log_query_execution: {
        Args: { execution_time_ms: number; params?: Json; query_name: string }
        Returns: undefined
      }
      process_due_credit_resets: { Args: never; Returns: number }
      purge_old_contact_views: { Args: never; Returns: undefined }
      requeue_stuck_email_jobs: {
        Args: { lock_minutes: number }
        Returns: number
      }
      reset_user_credits: { Args: never; Returns: undefined }
      restore_contact_list: {
        Args: { p_list_id: number; p_user_id: string }
        Returns: boolean
      }
      retry_failed_email_job: { Args: { job_id: string }; Returns: undefined }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      text_similarity: {
        Args: {
          company_name: string
          first_name: string
          last_name: string
          search_term: string
          title: string
        }
        Returns: number
      }
      unlock_contact: { Args: { p_contact_id: string }; Returns: Json }
      get_contact_for_user: { Args: { p_contact_id: string }; Returns: Json }
    }
    Enums: {
      email_job_status:
        | "pending"
        | "sending"
        | "sent"
        | "delivered"
        | "delivery_delayed"
        | "bounced"
        | "complained"
        | "failed"
        | "cancelled"
      email_suppression_reason:
        | "bounce"
        | "complaint"
        | "unsubscribe"
        | "manual"
        | "invalid"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      email_job_status: [
        "pending",
        "sending",
        "sent",
        "delivered",
        "delivery_delayed",
        "bounced",
        "complained",
        "failed",
        "cancelled",
      ],
      email_suppression_reason: [
        "bounce",
        "complaint",
        "unsubscribe",
        "manual",
        "invalid",
      ],
    },
  },
} as const

