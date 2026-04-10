export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      business_listings: {
        Row: {
          address: string | null
          annual_revenue_range: string | null
          can_provide_financials: boolean | null
          can_provide_tax_returns: boolean | null
          cash_flow_range: string | null
          city: string | null
          contact_email: string | null
          country_code: string | null
          county: string | null
          created_at: string | null
          description: string | null
          ebitda_range: string | null
          employee_count_range: string | null
          geocode_confidence: number | null
          geocode_place_id: string | null
          geocoded_at: string | null
          geocoded_lat: number | null
          geocoded_lng: number | null
          id: string
          industry: string
          is_active: boolean | null
          is_hidden: boolean
          listing_image_alt: string | null
          listing_image_choice: string | null
          listing_image_h: number | null
          listing_image_path: string | null
          listing_image_w: number | null
          owner_id: string
          ownership_percentage: number | null
          postal_code: string | null
          state_code: string | null
          status: string
          stripe_subscription_id: string | null
          title: string
          updated_at: string | null
          years_in_business: string | null
        }
        Insert: {
          address?: string | null
          annual_revenue_range?: string | null
          can_provide_financials?: boolean | null
          can_provide_tax_returns?: boolean | null
          cash_flow_range?: string | null
          city?: string | null
          contact_email?: string | null
          country_code?: string | null
          county?: string | null
          created_at?: string | null
          description?: string | null
          ebitda_range?: string | null
          employee_count_range?: string | null
          geocode_confidence?: number | null
          geocode_place_id?: string | null
          geocoded_at?: string | null
          geocoded_lat?: number | null
          geocoded_lng?: number | null
          id?: string
          industry: string
          is_active?: boolean | null
          is_hidden?: boolean
          listing_image_alt?: string | null
          listing_image_choice?: string | null
          listing_image_h?: number | null
          listing_image_path?: string | null
          listing_image_w?: number | null
          owner_id: string
          ownership_percentage?: number | null
          postal_code?: string | null
          state_code?: string | null
          status?: string
          stripe_subscription_id?: string | null
          title: string
          updated_at?: string | null
          years_in_business?: string | null
        }
        Update: {
          address?: string | null
          annual_revenue_range?: string | null
          can_provide_financials?: boolean | null
          can_provide_tax_returns?: boolean | null
          cash_flow_range?: string | null
          city?: string | null
          contact_email?: string | null
          country_code?: string | null
          county?: string | null
          created_at?: string | null
          description?: string | null
          ebitda_range?: string | null
          employee_count_range?: string | null
          geocode_confidence?: number | null
          geocode_place_id?: string | null
          geocoded_at?: string | null
          geocoded_lat?: number | null
          geocoded_lng?: number | null
          id?: string
          industry?: string
          is_active?: boolean | null
          is_hidden?: boolean
          listing_image_alt?: string | null
          listing_image_choice?: string | null
          listing_image_h?: number | null
          listing_image_path?: string | null
          listing_image_w?: number | null
          owner_id?: string
          ownership_percentage?: number | null
          postal_code?: string | null
          state_code?: string | null
          status?: string
          stripe_subscription_id?: string | null
          title?: string
          updated_at?: string | null
          years_in_business?: string | null
        }
        Relationships: []
      }
      business_memberships: {
        Row: {
          billing_interval: string
          canceled_at: string | null
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          max_listings: number
          plan_code: string
          product_name: string
          status: string
          stripe_customer_id: string
          stripe_price_id: string
          stripe_subscription_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_interval: string
          canceled_at?: string | null
          created_at?: string
          current_period_end: string
          current_period_start: string
          id?: string
          max_listings?: number
          plan_code: string
          product_name: string
          status: string
          stripe_customer_id: string
          stripe_price_id: string
          stripe_subscription_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_interval?: string
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          max_listings?: number
          plan_code?: string
          product_name?: string
          status?: string
          stripe_customer_id?: string
          stripe_price_id?: string
          stripe_subscription_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          id: string
          stripe_customer_id: string | null
        }
        Insert: {
          id: string
          stripe_customer_id?: string | null
        }
        Update: {
          id?: string
          stripe_customer_id?: string | null
        }
        Relationships: []
      }
      investor_profiles: {
        Row: {
          additional_industries: string[] | null
          avatar_alt: string | null
          avatar_h: number | null
          avatar_path: string | null
          avatar_updated_at: string | null
          avatar_w: number | null
          bio: string | null
          city: string | null
          contact_email: string | null
          created_at: string | null
          first_name: string | null
          full_name_lc: string | null
          id: string
          industry_experience: string | null
          is_accredited_investor: boolean | null
          is_hidden: boolean
          last_name: string | null
          net_worth: string | null
          org_name_lc: string | null
          organization_entity: string | null
          ownership_max: number | null
          ownership_min: number | null
          primary_industry: string | null
          status: string
          target_cash_flow: string | null
          target_ebitda: string | null
          updated_at: string | null
          user_id: string
          willing_to_sign_nda: boolean | null
          years_in_target_industry: string | null
        }
        Insert: {
          additional_industries?: string[] | null
          avatar_alt?: string | null
          avatar_h?: number | null
          avatar_path?: string | null
          avatar_updated_at?: string | null
          avatar_w?: number | null
          bio?: string | null
          city?: string | null
          contact_email?: string | null
          created_at?: string | null
          first_name?: string | null
          full_name_lc?: string | null
          id?: string
          industry_experience?: string | null
          is_accredited_investor?: boolean | null
          is_hidden?: boolean
          last_name?: string | null
          net_worth?: string | null
          org_name_lc?: string | null
          organization_entity?: string | null
          ownership_max?: number | null
          ownership_min?: number | null
          primary_industry?: string | null
          status?: string
          target_cash_flow?: string | null
          target_ebitda?: string | null
          updated_at?: string | null
          user_id: string
          willing_to_sign_nda?: boolean | null
          years_in_target_industry?: string | null
        }
        Update: {
          additional_industries?: string[] | null
          avatar_alt?: string | null
          avatar_h?: number | null
          avatar_path?: string | null
          avatar_updated_at?: string | null
          avatar_w?: number | null
          bio?: string | null
          city?: string | null
          contact_email?: string | null
          created_at?: string | null
          first_name?: string | null
          full_name_lc?: string | null
          id?: string
          industry_experience?: string | null
          is_accredited_investor?: boolean | null
          is_hidden?: boolean
          last_name?: string | null
          net_worth?: string | null
          org_name_lc?: string | null
          organization_entity?: string | null
          ownership_max?: number | null
          ownership_min?: number | null
          primary_industry?: string | null
          status?: string
          target_cash_flow?: string | null
          target_ebitda?: string | null
          updated_at?: string | null
          user_id?: string
          willing_to_sign_nda?: boolean | null
          years_in_target_industry?: string | null
        }
        Relationships: []
      }
      legacy_pmpro_members: {
        Row: {
          billing_amount: number | null
          cycle_number: number | null
          cycle_period: string | null
          discount_code: string | null
          discount_code_id: number | null
          email: string | null
          expires: string | null
          firstname: string | null
          id: number | null
          joined: string | null
          lastname: string | null
          membership: string | null
          next_payment_date: string | null
          startdate: string | null
          subscription_transaction_id: string | null
          username: string | null
        }
        Insert: {
          billing_amount?: number | null
          cycle_number?: number | null
          cycle_period?: string | null
          discount_code?: string | null
          discount_code_id?: number | null
          email?: string | null
          expires?: string | null
          firstname?: string | null
          id?: number | null
          joined?: string | null
          lastname?: string | null
          membership?: string | null
          next_payment_date?: string | null
          startdate?: string | null
          subscription_transaction_id?: string | null
          username?: string | null
        }
        Update: {
          billing_amount?: number | null
          cycle_number?: number | null
          cycle_period?: string | null
          discount_code?: string | null
          discount_code_id?: number | null
          email?: string | null
          expires?: string | null
          firstname?: string | null
          id?: number | null
          joined?: string | null
          lastname?: string | null
          membership?: string | null
          next_payment_date?: string | null
          startdate?: string | null
          subscription_transaction_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      listing_evaluations: {
        Row: {
          access_type: string | null
          created_at: string
          id: number
          listing_id: string
          status: string
          stripe_payment_intent_id: string | null
          updated_at: string
        }
        Insert: {
          access_type?: string | null
          created_at?: string
          id?: number
          listing_id: string
          status: string
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          access_type?: string | null
          created_at?: string
          id?: number
          listing_id?: string
          status?: string
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_evaluations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "business_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_evaluations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_business_listings_with_promo"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_promotions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          id: number
          listing_id: string
          status: string
          stripe_subscription_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          id?: number
          listing_id: string
          status: string
          stripe_subscription_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          id?: number
          listing_id?: string
          status?: string
          stripe_subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_promotions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "business_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_promotions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_business_listings_with_promo"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          first_name: string | null
          id: string
          last_name: string | null
          migrated_at: string | null
          migration_status: string | null
          updated_at: string | null
          user_type: string
          username: string | null
          wordpress_user_id: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          migrated_at?: string | null
          migration_status?: string | null
          updated_at?: string | null
          user_type?: string
          username?: string | null
          wordpress_user_id?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          migrated_at?: string | null
          migration_status?: string | null
          updated_at?: string | null
          user_type?: string
          username?: string | null
          wordpress_user_id?: number | null
        }
        Relationships: []
      }
      public_valuations: {
        Row: {
          created_at: string | null
          email: string
          id: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_issue_open: boolean | null
          cancel_at: string | null
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          cancellation_feedback: string | null
          cancellation_feedback_submitted: boolean | null
          cancellation_reason: string | null
          cancellation_requested_at: string | null
          cancellation_type: string | null
          created: string
          current_period_end: string
          current_period_start: string
          dunning_canceled_email_sent_at: string | null
          dunning_stage: string | null
          ended_at: string | null
          first_payment_failed_at: string | null
          id: string
          last_dunning_email_sent_at: string | null
          last_pause_resumed_at: string | null
          last_pause_started_at: string | null
          listing_id: string | null
          metadata: Json | null
          pause_activated_email_sent_at: string | null
          pause_count: number | null
          pause_email_sent_at: string | null
          pause_ends_at: string | null
          pause_feedback: string | null
          pause_reason: string | null
          pause_resumed_email_sent_at: string | null
          pause_scheduled_email_sent_at: string | null
          pause_scope: string | null
          pause_starts_at: string | null
          pause_status: string | null
          paused_boost_restore_completed_at: string | null
          paused_boost_restore_dismissed_at: string | null
          paused_boost_restore_pending: boolean | null
          paused_boost_subscription_id: string | null
          paused_until: string | null
          payment_recovered_email_sent_at: string | null
          price_currency: string | null
          price_id: string | null
          price_interval: string | null
          price_interval_count: number | null
          price_lookup_key: string | null
          price_metadata: Json | null
          price_nickname: string | null
          price_unit_amount: number | null
          product_id: string | null
          product_metadata: Json | null
          product_name: string | null
          purpose_sub: string | null
          quantity: number | null
          resume_email_sent_at: string | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          trial_end: string | null
          trial_start: string | null
          user_id: string
          winback_email_sent_at: string | null
        }
        Insert: {
          billing_issue_open?: boolean | null
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          cancellation_feedback?: string | null
          cancellation_feedback_submitted?: boolean | null
          cancellation_reason?: string | null
          cancellation_requested_at?: string | null
          cancellation_type?: string | null
          created?: string
          current_period_end?: string
          current_period_start?: string
          dunning_canceled_email_sent_at?: string | null
          dunning_stage?: string | null
          ended_at?: string | null
          first_payment_failed_at?: string | null
          id: string
          last_dunning_email_sent_at?: string | null
          last_pause_resumed_at?: string | null
          last_pause_started_at?: string | null
          listing_id?: string | null
          metadata?: Json | null
          pause_activated_email_sent_at?: string | null
          pause_count?: number | null
          pause_email_sent_at?: string | null
          pause_ends_at?: string | null
          pause_feedback?: string | null
          pause_reason?: string | null
          pause_resumed_email_sent_at?: string | null
          pause_scheduled_email_sent_at?: string | null
          pause_scope?: string | null
          pause_starts_at?: string | null
          pause_status?: string | null
          paused_boost_restore_completed_at?: string | null
          paused_boost_restore_dismissed_at?: string | null
          paused_boost_restore_pending?: boolean | null
          paused_boost_subscription_id?: string | null
          paused_until?: string | null
          payment_recovered_email_sent_at?: string | null
          price_currency?: string | null
          price_id?: string | null
          price_interval?: string | null
          price_interval_count?: number | null
          price_lookup_key?: string | null
          price_metadata?: Json | null
          price_nickname?: string | null
          price_unit_amount?: number | null
          product_id?: string | null
          product_metadata?: Json | null
          product_name?: string | null
          purpose_sub?: string | null
          quantity?: number | null
          resume_email_sent_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          trial_end?: string | null
          trial_start?: string | null
          user_id: string
          winback_email_sent_at?: string | null
        }
        Update: {
          billing_issue_open?: boolean | null
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          cancellation_feedback?: string | null
          cancellation_feedback_submitted?: boolean | null
          cancellation_reason?: string | null
          cancellation_requested_at?: string | null
          cancellation_type?: string | null
          created?: string
          current_period_end?: string
          current_period_start?: string
          dunning_canceled_email_sent_at?: string | null
          dunning_stage?: string | null
          ended_at?: string | null
          first_payment_failed_at?: string | null
          id?: string
          last_dunning_email_sent_at?: string | null
          last_pause_resumed_at?: string | null
          last_pause_started_at?: string | null
          listing_id?: string | null
          metadata?: Json | null
          pause_activated_email_sent_at?: string | null
          pause_count?: number | null
          pause_email_sent_at?: string | null
          pause_ends_at?: string | null
          pause_feedback?: string | null
          pause_reason?: string | null
          pause_resumed_email_sent_at?: string | null
          pause_scheduled_email_sent_at?: string | null
          pause_scope?: string | null
          pause_starts_at?: string | null
          pause_status?: string | null
          paused_boost_restore_completed_at?: string | null
          paused_boost_restore_dismissed_at?: string | null
          paused_boost_restore_pending?: boolean | null
          paused_boost_subscription_id?: string | null
          paused_until?: string | null
          payment_recovered_email_sent_at?: string | null
          price_currency?: string | null
          price_id?: string | null
          price_interval?: string | null
          price_interval_count?: number | null
          price_lookup_key?: string | null
          price_metadata?: Json | null
          price_nickname?: string | null
          price_unit_amount?: number | null
          product_id?: string | null
          product_metadata?: Json | null
          product_name?: string | null
          purpose_sub?: string | null
          quantity?: number | null
          resume_email_sent_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          trial_end?: string | null
          trial_start?: string | null
          user_id?: string
          winback_email_sent_at?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          id: string
          role: string
        }
        Insert: {
          id: string
          role: string
        }
        Update: {
          id?: string
          role?: string
        }
        Relationships: []
      }
      valuation_leads: {
        Row: {
          campaign: string
          created_at: string
          email: string
          email_error: string | null
          email_sent_at: string | null
          full_name: string
          id: number
          resend_email_id: string | null
          source_page: string
          source_path: string | null
        }
        Insert: {
          campaign?: string
          created_at?: string
          email: string
          email_error?: string | null
          email_sent_at?: string | null
          full_name: string
          id?: number
          resend_email_id?: string | null
          source_page?: string
          source_path?: string | null
        }
        Update: {
          campaign?: string
          created_at?: string
          email?: string
          email_error?: string | null
          email_sent_at?: string | null
          full_name?: string
          id?: number
          resend_email_id?: string | null
          source_page?: string
          source_path?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          first_name: string | null
          id: string | null
          last_name: string | null
        }
        Insert: {
          first_name?: string | null
          id?: string | null
          last_name?: string | null
        }
        Update: {
          first_name?: string | null
          id?: string | null
          last_name?: string | null
        }
        Relationships: []
      }
      v_business_listings_with_promo: {
        Row: {
          annual_revenue_range: string | null
          book_value_range: string | null
          can_provide_financials: boolean | null
          can_provide_tax_returns: boolean | null
          city: string | null
          contact_email: string | null
          country_code: string | null
          county: string | null
          created_at: string | null
          description: string | null
          ebitda_range: string | null
          employee_count_range: string | null
          geocode_confidence: number | null
          geocode_place_id: string | null
          geocoded_at: string | null
          geocoded_lat: number | null
          geocoded_lng: number | null
          has_purchased_valuation: boolean | null
          id: string | null
          industry: string | null
          is_active: boolean | null
          is_hidden: boolean | null
          is_promoted_effective: boolean | null
          listing_image_alt: string | null
          listing_image_choice: string | null
          listing_image_h: number | null
          listing_image_path: string | null
          listing_image_w: number | null
          owner_id: string | null
          ownership_percentage: number | null
          postal_code: string | null
          state_code: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          years_in_business: string | null
        }
        Insert: {
          annual_revenue_range?: string | null
          book_value_range?: string | null
          can_provide_financials?: boolean | null
          can_provide_tax_returns?: boolean | null
          city?: string | null
          contact_email?: string | null
          country_code?: string | null
          county?: string | null
          created_at?: string | null
          description?: string | null
          ebitda_range?: string | null
          employee_count_range?: string | null
          geocode_confidence?: number | null
          geocode_place_id?: string | null
          geocoded_at?: string | null
          geocoded_lat?: number | null
          geocoded_lng?: number | null
          has_purchased_valuation?: never
          id?: string | null
          industry?: string | null
          is_active?: boolean | null
          is_hidden?: boolean | null
          is_promoted_effective?: never
          listing_image_alt?: string | null
          listing_image_choice?: string | null
          listing_image_h?: number | null
          listing_image_path?: string | null
          listing_image_w?: number | null
          owner_id?: string | null
          ownership_percentage?: number | null
          postal_code?: string | null
          state_code?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          years_in_business?: string | null
        }
        Update: {
          annual_revenue_range?: string | null
          book_value_range?: string | null
          can_provide_financials?: boolean | null
          can_provide_tax_returns?: boolean | null
          city?: string | null
          contact_email?: string | null
          country_code?: string | null
          county?: string | null
          created_at?: string | null
          description?: string | null
          ebitda_range?: string | null
          employee_count_range?: string | null
          geocode_confidence?: number | null
          geocode_place_id?: string | null
          geocoded_at?: string | null
          geocoded_lat?: number | null
          geocoded_lng?: number | null
          has_purchased_valuation?: never
          id?: string | null
          industry?: string | null
          is_active?: boolean | null
          is_hidden?: boolean | null
          is_promoted_effective?: never
          listing_image_alt?: string | null
          listing_image_choice?: string | null
          listing_image_h?: number | null
          listing_image_path?: string | null
          listing_image_w?: number | null
          owner_id?: string | null
          ownership_percentage?: number | null
          postal_code?: string | null
          state_code?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          years_in_business?: string | null
        }
        Relationships: []
      }
      v_investor_profiles_public: {
        Row: {
          additional_industries: string[] | null
          avatar_alt: string | null
          avatar_h: number | null
          avatar_path: string | null
          avatar_updated_at: string | null
          avatar_w: number | null
          bio: string | null
          city: string | null
          contact_email: string | null
          created_at: string | null
          first_name: string | null
          full_name_lc: string | null
          has_paid_access: boolean | null
          id: string | null
          industry_experience: string | null
          is_accredited_investor: boolean | null
          is_hidden: boolean | null
          last_name: string | null
          net_worth: string | null
          org_name_lc: string | null
          organization_entity: string | null
          ownership_max: number | null
          ownership_min: number | null
          primary_industry: string | null
          status: string | null
          target_cash_flow: string | null
          target_ebitda: string | null
          updated_at: string | null
          user_id: string | null
          willing_to_sign_nda: boolean | null
          years_in_target_industry: string | null
        }
        Insert: {
          additional_industries?: string[] | null
          avatar_alt?: string | null
          avatar_h?: number | null
          avatar_path?: string | null
          avatar_updated_at?: string | null
          avatar_w?: number | null
          bio?: string | null
          city?: string | null
          contact_email?: string | null
          created_at?: string | null
          first_name?: string | null
          full_name_lc?: string | null
          has_paid_access?: never
          id?: string | null
          industry_experience?: string | null
          is_accredited_investor?: boolean | null
          is_hidden?: boolean | null
          last_name?: string | null
          net_worth?: string | null
          org_name_lc?: string | null
          organization_entity?: string | null
          ownership_max?: number | null
          ownership_min?: number | null
          primary_industry?: string | null
          status?: string | null
          target_cash_flow?: string | null
          target_ebitda?: string | null
          updated_at?: string | null
          user_id?: string | null
          willing_to_sign_nda?: boolean | null
          years_in_target_industry?: string | null
        }
        Update: {
          additional_industries?: string[] | null
          avatar_alt?: string | null
          avatar_h?: number | null
          avatar_path?: string | null
          avatar_updated_at?: string | null
          avatar_w?: number | null
          bio?: string | null
          city?: string | null
          contact_email?: string | null
          created_at?: string | null
          first_name?: string | null
          full_name_lc?: string | null
          has_paid_access?: never
          id?: string | null
          industry_experience?: string | null
          is_accredited_investor?: boolean | null
          is_hidden?: boolean | null
          last_name?: string | null
          net_worth?: string | null
          org_name_lc?: string | null
          organization_entity?: string | null
          ownership_max?: number | null
          ownership_min?: number | null
          primary_industry?: string | null
          status?: string | null
          target_cash_flow?: string | null
          target_ebitda?: string | null
          updated_at?: string | null
          user_id?: string | null
          willing_to_sign_nda?: boolean | null
          years_in_target_industry?: string | null
        }
        Relationships: []
      }
      v_user_listing_entitlements: {
        Row: {
          allowed_active_listings: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      current_user_type: { Args: never; Returns: string }
      get_investor_email_by_profile_id: {
        Args: { p_profile_id: string }
        Returns: {
          email: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      pricing_plan_interval: "day" | "week" | "month" | "year"
      pricing_type: "one_time" | "recurring"
      subscription_status:
        | "trialing"
        | "active"
        | "canceled"
        | "incomplete"
        | "incomplete_expired"
        | "past_due"
        | "unpaid"
        | "paused"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      pricing_plan_interval: ["day", "week", "month", "year"],
      pricing_type: ["one_time", "recurring"],
      subscription_status: [
        "trialing",
        "active",
        "canceled",
        "incomplete",
        "incomplete_expired",
        "past_due",
        "unpaid",
        "paused",
      ],
    },
  },
} as const

