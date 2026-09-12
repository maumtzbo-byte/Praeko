// Generated from the live Frames Supabase project (hpjcgitivizvrzeihoxi).
// Regenerate after any migration with:
//   supabase gen types typescript --project-id hpjcgitivizvrzeihoxi > src/lib/supabase/types.ts

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
      approval_links: {
        Row: {
          business_id: string
          completed_at: string | null
          created_at: string
          desde: string
          expires_at: string
          hasta: string
          id: string
          opened_at: string | null
          token: string
        }
        Insert: {
          business_id: string
          completed_at?: string | null
          created_at?: string
          desde: string
          expires_at?: string
          hasta: string
          id?: string
          opened_at?: string | null
          token: string
        }
        Update: {
          business_id?: string
          completed_at?: string | null
          created_at?: string
          desde?: string
          expires_at?: string
          hasta?: string
          id?: string
          opened_at?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_links_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_assets: {
        Row: {
          asset_type: Database["public"]["Enums"]["brand_asset_type"]
          business_id: string
          created_at: string
          id: string
          liked: boolean
          metadata: Json
          storage_path: string
        }
        Insert: {
          asset_type: Database["public"]["Enums"]["brand_asset_type"]
          business_id: string
          created_at?: string
          id?: string
          liked?: boolean
          metadata?: Json
          storage_path: string
        }
        Update: {
          asset_type?: Database["public"]["Enums"]["brand_asset_type"]
          business_id?: string
          created_at?: string
          id?: string
          liked?: boolean
          metadata?: Json
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_assets_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_profiles: {
        Row: {
          additional_info: string | null
          address: string | null
          admired_companies: string[]
          ai_forbidden_topics: string | null
          ai_forbidden_words: string[]
          ai_response_style: string | null
          average_ticket: string | null
          brand_tone: string | null
          brand_values: string[]
          business_hours: Json
          business_id: string
          color_palette: string[] | null
          created_at: string
          faqs: Json
          frequent_promotions: string | null
          goals: string[]
          goals_other: string | null
          liked_content_examples: string[] | null
          main_competitors: string[]
          main_products: string[]
          mission: string | null
          other_social_links: Json
          personality: string | null
          preferred_fonts: string[] | null
          product_categories: string[]
          questionnaire: Json
          sells_description: string | null
          services_offered: string | null
          social_links: Json
          style_references: string[]
          target_audience: string | null
          updated_at: string
        }
        Insert: {
          additional_info?: string | null
          address?: string | null
          admired_companies?: string[]
          ai_forbidden_topics?: string | null
          ai_forbidden_words?: string[]
          ai_response_style?: string | null
          average_ticket?: string | null
          brand_tone?: string | null
          brand_values?: string[]
          business_hours?: Json
          business_id: string
          color_palette?: string[] | null
          created_at?: string
          faqs?: Json
          frequent_promotions?: string | null
          goals?: string[]
          goals_other?: string | null
          liked_content_examples?: string[] | null
          main_competitors?: string[]
          main_products?: string[]
          mission?: string | null
          other_social_links?: Json
          personality?: string | null
          preferred_fonts?: string[] | null
          product_categories?: string[]
          questionnaire?: Json
          sells_description?: string | null
          services_offered?: string | null
          social_links?: Json
          style_references?: string[]
          target_audience?: string | null
          updated_at?: string
        }
        Update: {
          additional_info?: string | null
          address?: string | null
          admired_companies?: string[]
          ai_forbidden_topics?: string | null
          ai_forbidden_words?: string[]
          ai_response_style?: string | null
          average_ticket?: string | null
          brand_tone?: string | null
          brand_values?: string[]
          business_hours?: Json
          business_id?: string
          color_palette?: string[] | null
          created_at?: string
          faqs?: Json
          frequent_promotions?: string | null
          goals?: string[]
          goals_other?: string | null
          liked_content_examples?: string[] | null
          main_competitors?: string[]
          main_products?: string[]
          mission?: string | null
          other_social_links?: Json
          personality?: string | null
          preferred_fonts?: string[] | null
          product_categories?: string[]
          questionnaire?: Json
          sells_description?: string | null
          services_offered?: string | null
          social_links?: Json
          style_references?: string[]
          target_audience?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_members: {
        Row: {
          business_id: string
          created_at: string
          role: Database["public"]["Enums"]["business_role"]
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          role?: Database["public"]["Enums"]["business_role"]
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          role?: Database["public"]["Enums"]["business_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          auto_reply_enabled: boolean
          city: string | null
          contact_email: string | null
          country: string | null
          created_at: string
          customer_number: number
          description: string | null
          id: string
          industry: string | null
          name: string
          notification_preferences: Json
          onboarding_completed_at: string | null
          onboarding_step: number
          phone: string | null
          primary_language: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          auto_reply_enabled?: boolean
          city?: string | null
          contact_email?: string | null
          country?: string | null
          created_at?: string
          customer_number?: never
          description?: string | null
          id?: string
          industry?: string | null
          name: string
          notification_preferences?: Json
          onboarding_completed_at?: string | null
          onboarding_step?: number
          phone?: string | null
          primary_language?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          auto_reply_enabled?: boolean
          city?: string | null
          contact_email?: string | null
          country?: string | null
          created_at?: string
          customer_number?: never
          description?: string | null
          id?: string
          industry?: string | null
          name?: string
          notification_preferences?: Json
          onboarding_completed_at?: string | null
          onboarding_step?: number
          phone?: string | null
          primary_language?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          brief: string
          business_id: string
          created_at: string
          end_date: string
          id: string
          name: string
          start_date: string
          status: Database["public"]["Enums"]["campaign_status"]
          updated_at: string
        }
        Insert: {
          brief: string
          business_id: string
          created_at?: string
          end_date: string
          id?: string
          name: string
          start_date: string
          status?: Database["public"]["Enums"]["campaign_status"]
          updated_at?: string
        }
        Update: {
          brief?: string
          business_id?: string
          created_at?: string
          end_date?: string
          id?: string
          name?: string
          start_date?: string
          status?: Database["public"]["Enums"]["campaign_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      content_calendar: {
        Row: {
          business_id: string
          campaign_id: string | null
          client_feedback: string | null
          client_reviewed_at: string | null
          client_verdict: Database["public"]["Enums"]["client_verdict"] | null
          content_kind: Database["public"]["Enums"]["content_kind"]
          created_at: string
          external_post_id: string | null
          format: Database["public"]["Enums"]["content_format"]
          id: string
          published_platform:
            | Database["public"]["Enums"]["social_platform"]
            | null
          recommended_publish_time: string | null
          review_feedback: string | null
          review_result:
            | Database["public"]["Enums"]["quality_review_result"]
            | null
          scheduled_date: string
          script: string | null
          status: Database["public"]["Enums"]["content_status"]
          target_duration_seconds: number | null
          topic: string
          updated_at: string
        }
        Insert: {
          business_id: string
          campaign_id?: string | null
          client_feedback?: string | null
          client_reviewed_at?: string | null
          client_verdict?: Database["public"]["Enums"]["client_verdict"] | null
          content_kind: Database["public"]["Enums"]["content_kind"]
          created_at?: string
          external_post_id?: string | null
          format: Database["public"]["Enums"]["content_format"]
          id?: string
          published_platform?:
            | Database["public"]["Enums"]["social_platform"]
            | null
          recommended_publish_time?: string | null
          review_feedback?: string | null
          review_result?:
            | Database["public"]["Enums"]["quality_review_result"]
            | null
          scheduled_date: string
          script?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          target_duration_seconds?: number | null
          topic: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          campaign_id?: string | null
          client_feedback?: string | null
          client_reviewed_at?: string | null
          client_verdict?: Database["public"]["Enums"]["client_verdict"] | null
          content_kind?: Database["public"]["Enums"]["content_kind"]
          created_at?: string
          external_post_id?: string | null
          format?: Database["public"]["Enums"]["content_format"]
          id?: string
          published_platform?:
            | Database["public"]["Enums"]["social_platform"]
            | null
          recommended_publish_time?: string | null
          review_feedback?: string | null
          review_result?:
            | Database["public"]["Enums"]["quality_review_result"]
            | null
          scheduled_date?: string
          script?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          target_duration_seconds?: number | null
          topic?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_calendar_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_calendar_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      content_generation_runs: {
        Row: {
          business_id: string
          created_at: string
          days_requested: number
          id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          days_requested: number
          id?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          days_requested?: number
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_generation_runs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_submissions: {
        Row: {
          business_id: string
          created_at: string
          id: string
          rating: number
          recommendation: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          rating: number
          recommendation?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          rating?: number
          recommendation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_submissions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          ciudad: string | null
          created_at: string
          estado: string
          estilos: string[]
          fotos: string[]
          giro: string
          id: string
          instagram: string | null
          negocio: string
          nombre: string
          notas: string | null
          origen: string | null
          sitio_web: string | null
          preguntan: string | null
          vende: string | null
          whatsapp: string
        }
        Insert: {
          ciudad?: string | null
          created_at?: string
          estado?: string
          estilos?: string[]
          fotos?: string[]
          giro: string
          id?: string
          instagram?: string | null
          negocio: string
          nombre: string
          notas?: string | null
          origen?: string | null
          sitio_web?: string | null
          preguntan?: string | null
          vende?: string | null
          whatsapp: string
        }
        Update: {
          ciudad?: string | null
          created_at?: string
          estado?: string
          estilos?: string[]
          fotos?: string[]
          giro?: string
          id?: string
          instagram?: string | null
          negocio?: string
          nombre?: string
          notas?: string | null
          origen?: string | null
          sitio_web?: string | null
          preguntan?: string | null
          vende?: string | null
          whatsapp?: string
        }
        Relationships: []
      }
      generations: {
        Row: {
          business_id: string
          content_calendar_id: string | null
          content_kind: Database["public"]["Enums"]["content_kind"]
          cost_usd: number
          created_at: string
          duration_seconds: number
          id: string
          job_status: string
          provider: string
          provider_job_id: string | null
          quality_review_result:
            | Database["public"]["Enums"]["quality_review_result"]
            | null
          storage_path: string | null
        }
        Insert: {
          business_id: string
          content_calendar_id?: string | null
          content_kind: Database["public"]["Enums"]["content_kind"]
          cost_usd?: number
          created_at?: string
          duration_seconds?: number
          id?: string
          job_status?: string
          provider: string
          provider_job_id?: string | null
          quality_review_result?:
            | Database["public"]["Enums"]["quality_review_result"]
            | null
          storage_path?: string | null
        }
        Update: {
          business_id?: string
          content_calendar_id?: string | null
          content_kind?: Database["public"]["Enums"]["content_kind"]
          cost_usd?: number
          created_at?: string
          duration_seconds?: number
          id?: string
          job_status?: string
          provider?: string
          provider_job_id?: string | null
          quality_review_result?:
            | Database["public"]["Enums"]["quality_review_result"]
            | null
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generations_content_calendar_id_fkey"
            columns: ["content_calendar_id"]
            isOneToOne: false
            referencedRelation: "content_calendar"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          burns_subtitles: boolean
          display_name: string
          has_analytics_dashboard: boolean
          has_optimized_schedule: boolean
          has_priority_queue: boolean
          has_watermark_free_downloads: boolean
          images_per_month: number
          key: Database["public"]["Enums"]["plan_key"]
          price_usd_cents: number
          social_network_limit: number
          video_avg_seconds: number
          video_max_seconds: number
          video_provider: string
          videos_per_month: number
        }
        Insert: {
          burns_subtitles?: boolean
          display_name: string
          has_analytics_dashboard?: boolean
          has_optimized_schedule?: boolean
          has_priority_queue?: boolean
          has_watermark_free_downloads?: boolean
          images_per_month: number
          key: Database["public"]["Enums"]["plan_key"]
          price_usd_cents: number
          social_network_limit: number
          video_avg_seconds: number
          video_max_seconds: number
          video_provider: string
          videos_per_month: number
        }
        Update: {
          burns_subtitles?: boolean
          display_name?: string
          has_analytics_dashboard?: boolean
          has_optimized_schedule?: boolean
          has_priority_queue?: boolean
          has_watermark_free_downloads?: boolean
          images_per_month?: number
          key?: Database["public"]["Enums"]["plan_key"]
          price_usd_cents?: number
          social_network_limit?: number
          video_avg_seconds?: number
          video_max_seconds?: number
          video_provider?: string
          videos_per_month?: number
        }
        Relationships: []
      }
      social_connection_tokens: {
        Row: {
          access_token: string
          connection_id: string
          expires_at: string | null
          refresh_token: string | null
        }
        Insert: {
          access_token: string
          connection_id: string
          expires_at?: string | null
          refresh_token?: string | null
        }
        Update: {
          access_token?: string
          connection_id?: string
          expires_at?: string | null
          refresh_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_connection_tokens_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: true
            referencedRelation: "social_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      social_connections: {
        Row: {
          business_id: string
          connected_by: string | null
          created_at: string
          external_account_avatar_url: string | null
          external_account_id: string
          external_account_name: string
          id: string
          platform: Database["public"]["Enums"]["social_platform"]
          status: Database["public"]["Enums"]["social_connection_status"]
          updated_at: string
        }
        Insert: {
          business_id: string
          connected_by?: string | null
          created_at?: string
          external_account_avatar_url?: string | null
          external_account_id: string
          external_account_name: string
          id?: string
          platform: Database["public"]["Enums"]["social_platform"]
          status?: Database["public"]["Enums"]["social_connection_status"]
          updated_at?: string
        }
        Update: {
          business_id?: string
          connected_by?: string | null
          created_at?: string
          external_account_avatar_url?: string | null
          external_account_id?: string
          external_account_name?: string
          id?: string
          platform?: Database["public"]["Enums"]["social_platform"]
          status?: Database["public"]["Enums"]["social_connection_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_connections_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      social_follower_snapshots: {
        Row: {
          business_id: string
          captured_date: string
          connection_id: string
          created_at: string
          followers_count: number
          id: string
          platform: Database["public"]["Enums"]["social_platform"]
        }
        Insert: {
          business_id: string
          captured_date?: string
          connection_id: string
          created_at?: string
          followers_count: number
          id?: string
          platform: Database["public"]["Enums"]["social_platform"]
        }
        Update: {
          business_id?: string
          captured_date?: string
          connection_id?: string
          created_at?: string
          followers_count?: number
          id?: string
          platform?: Database["public"]["Enums"]["social_platform"]
        }
        Relationships: [
          {
            foreignKeyName: "social_follower_snapshots_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_follower_snapshots_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "social_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      social_interactions: {
        Row: {
          author_name: string | null
          business_id: string
          connection_id: string | null
          created_at: string
          external_interaction_id: string
          id: string
          inbound_text: string
          interaction_type: Database["public"]["Enums"]["interaction_type"]
          platform: Database["public"]["Enums"]["social_platform"]
          rating: number | null
          reply_status: Database["public"]["Enums"]["interaction_reply_status"]
          reply_text: string | null
        }
        Insert: {
          author_name?: string | null
          business_id: string
          connection_id?: string | null
          created_at?: string
          external_interaction_id: string
          id?: string
          inbound_text: string
          interaction_type: Database["public"]["Enums"]["interaction_type"]
          platform: Database["public"]["Enums"]["social_platform"]
          rating?: number | null
          reply_status: Database["public"]["Enums"]["interaction_reply_status"]
          reply_text?: string | null
        }
        Update: {
          author_name?: string | null
          business_id?: string
          connection_id?: string | null
          created_at?: string
          external_interaction_id?: string
          id?: string
          inbound_text?: string
          interaction_type?: Database["public"]["Enums"]["interaction_type"]
          platform?: Database["public"]["Enums"]["social_platform"]
          rating?: number | null
          reply_status?: Database["public"]["Enums"]["interaction_reply_status"]
          reply_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_interactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_interactions_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "social_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          business_id: string
          created_at: string
          current_period_end: string | null
          custom_carousels_per_month: number | null
          custom_images_per_month: number | null
          custom_price_usd_cents: number | null
          custom_video_max_seconds: number | null
          custom_videos_per_month: number | null
          id: string
          is_beta_trial: boolean
          plan_key: Database["public"]["Enums"]["plan_key"]
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          current_period_end?: string | null
          custom_carousels_per_month?: number | null
          custom_images_per_month?: number | null
          custom_price_usd_cents?: number | null
          custom_video_max_seconds?: number | null
          custom_videos_per_month?: number | null
          id?: string
          is_beta_trial?: boolean
          plan_key: Database["public"]["Enums"]["plan_key"]
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          current_period_end?: string | null
          id?: string
          is_beta_trial?: boolean
          plan_key?: Database["public"]["Enums"]["plan_key"]
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_key_fkey"
            columns: ["plan_key"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["key"]
          },
        ]
      }
      support_chat_messages: {
        Row: {
          business_id: string
          created_at: string
          id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_chat_messages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_counters: {
        Row: {
          business_id: string
          images_used: number
          period_month: string
          video_seconds_used: number
          videos_used: number
        }
        Insert: {
          business_id: string
          images_used?: number
          period_month: string
          video_seconds_used?: number
          videos_used?: number
        }
        Update: {
          business_id?: string
          images_used?: number
          period_month?: string
          video_seconds_used?: number
          videos_used?: number
        }
        Relationships: [
          {
            foreignKeyName: "usage_counters_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          created_at: string
          entrante: boolean
          enviado_at: string
          id: string
          nombre_perfil: string | null
          telefono: string
          texto: string | null
          tipo: string
          wa_id: string
          wam_id: string
        }
        Insert: {
          created_at?: string
          entrante: boolean
          enviado_at: string
          id?: string
          nombre_perfil?: string | null
          telefono: string
          texto?: string | null
          tipo: string
          wa_id: string
          wam_id: string
        }
        Update: {
          created_at?: string
          entrante?: boolean
          enviado_at?: string
          id?: string
          nombre_perfil?: string | null
          telefono?: string
          texto?: string | null
          tipo?: string
          wa_id?: string
          wam_id?: string
        }
        Relationships: []
      }
      whatsapp_exits: {
        Row: {
          boton: string
          created_at: string
          id: string
          origen: string | null
          ruta: string | null
        }
        Insert: {
          boton: string
          created_at?: string
          id?: string
          origen?: string | null
          ruta?: string | null
        }
        Update: {
          boton?: string
          created_at?: string
          id?: string
          origen?: string | null
          ruta?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_and_increment_usage: {
        Args: {
          p_business_id: string
          p_kind: string
          p_max_carousels: number
          p_max_images: number
          p_max_seconds: number
          p_max_videos: number
          p_period_month: string
          p_requested_seconds: number
        }
        Returns: string
      }
      refund_usage_counters: {
        Args: {
          p_business_id: string
          p_carousels_delta?: number
          p_images_delta?: number
          p_period_month: string
          p_video_seconds_delta?: number
          p_videos_delta?: number
        }
        Returns: undefined
      }
      create_business_for_current_user: {
        Args: {
          p_city: string
          p_contact_email: string
          p_country: string
          p_description: string
          p_industry: string
          p_name: string
          p_phone: string
          p_primary_language: string
          p_website_url: string
        }
        Returns: {
          auto_reply_enabled: boolean
          city: string | null
          contact_email: string | null
          country: string | null
          created_at: string
          customer_number: number
          description: string | null
          id: string
          industry: string | null
          name: string
          notification_preferences: Json
          onboarding_completed_at: string | null
          onboarding_step: number
          phone: string | null
          primary_language: string | null
          updated_at: string
          website_url: string | null
        }
        SetofOptions: {
          from: "*"
          to: "businesses"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      increment_usage_counters: {
        Args: {
          p_business_id: string
          p_images_delta?: number
          p_period_month: string
          p_video_seconds_delta?: number
          p_videos_delta?: number
        }
        Returns: undefined
      }
      is_business_member: {
        Args: { target_business_id: string }
        Returns: boolean
      }
    }
    Enums: {
      brand_asset_type: "logo" | "photo" | "video" | "template_reference"
      business_role: "owner" | "editor"
      campaign_status: "activa" | "completada" | "cancelada"
      content_format: "reel" | "carrusel" | "imagen_unica" | "promocion"
      content_kind: "imagen" | "video"
      client_verdict: "aprobado" | "cambios"
      content_status:
        | "pendiente"
        | "generada"
        | "en_revision"
        | "publicada"
        | "fallida"
      interaction_reply_status: "respondido" | "necesita_revision" | "fallido"
      interaction_type: "comentario" | "mensaje_directo" | "reseña"
      plan_key: "basico" | "pro" | "max"
      quality_review_result:
        | "aprobado"
        | "necesita_revision_humana"
        | "rechazado"
      social_connection_status: "active" | "error"
      social_platform: "instagram" | "facebook" | "tiktok" | "google_business"
      subscription_status: "active" | "past_due" | "canceled" | "incomplete"
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
      brand_asset_type: ["logo", "photo", "video", "template_reference"],
      business_role: ["owner", "editor"],
      campaign_status: ["activa", "completada", "cancelada"],
      client_verdict: ["aprobado", "cambios"],
      content_format: ["reel", "carrusel", "imagen_unica", "promocion"],
      content_kind: ["imagen", "video"],
      content_status: [
        "pendiente",
        "generada",
        "en_revision",
        "publicada",
        "fallida",
      ],
      interaction_reply_status: ["respondido", "necesita_revision", "fallido"],
      interaction_type: ["comentario", "mensaje_directo", "reseña"],
      plan_key: ["basico", "pro", "max"],
      quality_review_result: [
        "aprobado",
        "necesita_revision_humana",
        "rechazado",
      ],
      social_connection_status: ["active", "error"],
      social_platform: ["instagram", "facebook", "tiktok", "google_business"],
      subscription_status: ["active", "past_due", "canceled", "incomplete"],
    },
  },
} as const
