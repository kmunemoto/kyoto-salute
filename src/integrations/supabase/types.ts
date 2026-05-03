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
      blocked_slots: {
        Row: {
          blocked_date: string
          created_at: string
          created_by: string
          end_blocked_date: string
          id: string
          reason: string | null
        }
        Insert: {
          blocked_date: string
          created_at?: string
          created_by: string
          end_blocked_date: string
          id?: string
          reason?: string | null
        }
        Update: {
          blocked_date?: string
          created_at?: string
          created_by?: string
          end_blocked_date?: string
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_date: string
          booking_type: string
          created_at: string
          google_event_id: string | null
          id: string
          status: string
          user_id: string
        }
        Insert: {
          booking_date: string
          booking_type?: string
          created_at?: string
          google_event_id?: string | null
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          booking_date?: string
          booking_type?: string
          created_at?: string
          google_event_id?: string | null
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      counseling_responses: {
        Row: {
          age: string | null
          created_at: string
          diet_pattern: string | null
          email: string | null
          exercise_habit: string | null
          experience_level: string | null
          first_name: string
          first_name_kana: string | null
          gender: string | null
          id: string
          last_name: string
          last_name_kana: string | null
          medical_history: string | null
          notes: string | null
          pain_areas: string[] | null
          phone: string | null
          purposes: string[] | null
          reviewed: boolean
          sleep_hours: string | null
          target_frequency: string | null
          trainer_memo: string | null
          ward: string | null
        }
        Insert: {
          age?: string | null
          created_at?: string
          diet_pattern?: string | null
          email?: string | null
          exercise_habit?: string | null
          experience_level?: string | null
          first_name: string
          first_name_kana?: string | null
          gender?: string | null
          id?: string
          last_name: string
          last_name_kana?: string | null
          medical_history?: string | null
          notes?: string | null
          pain_areas?: string[] | null
          phone?: string | null
          purposes?: string[] | null
          reviewed?: boolean
          sleep_hours?: string | null
          target_frequency?: string | null
          trainer_memo?: string | null
          ward?: string | null
        }
        Update: {
          age?: string | null
          created_at?: string
          diet_pattern?: string | null
          email?: string | null
          exercise_habit?: string | null
          experience_level?: string | null
          first_name?: string
          first_name_kana?: string | null
          gender?: string | null
          id?: string
          last_name?: string
          last_name_kana?: string | null
          medical_history?: string | null
          notes?: string | null
          pain_areas?: string[] | null
          phone?: string | null
          purposes?: string[] | null
          reviewed?: boolean
          sleep_hours?: string | null
          target_frequency?: string | null
          trainer_memo?: string | null
          ward?: string | null
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      exercises: {
        Row: {
          category: string
          created_at: string
          default_reps: number | null
          default_sets: number | null
          default_weight: number | null
          id: string
          muscle_group: string
          name: string
          notes: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          default_reps?: number | null
          default_sets?: number | null
          default_weight?: number | null
          id?: string
          muscle_group?: string
          name: string
          notes?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          default_reps?: number | null
          default_sets?: number | null
          default_weight?: number | null
          id?: string
          muscle_group?: string
          name?: string
          notes?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      google_calendar_tokens: {
        Row: {
          access_token: string
          calendar_id: string
          created_at: string
          expires_at: string
          id: string
          refresh_token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          calendar_id?: string
          created_at?: string
          expires_at: string
          id?: string
          refresh_token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          calendar_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          refresh_token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gym_settings: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      meals: {
        Row: {
          analyzed: boolean
          calories: number | null
          carbs: number | null
          created_at: string
          dishes: Json | null
          fat: number | null
          feedback: string | null
          fiber: number | null
          id: string
          image_url: string
          meal_type: string
          protein: number | null
          user_id: string | null
        }
        Insert: {
          analyzed?: boolean
          calories?: number | null
          carbs?: number | null
          created_at?: string
          dishes?: Json | null
          fat?: number | null
          feedback?: string | null
          fiber?: number | null
          id?: string
          image_url: string
          meal_type?: string
          protein?: number | null
          user_id?: string | null
        }
        Update: {
          analyzed?: boolean
          calories?: number | null
          carbs?: number | null
          created_at?: string
          dishes?: Json | null
          fat?: number | null
          feedback?: string | null
          fiber?: number | null
          id?: string
          image_url?: string
          meal_type?: string
          protein?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      monthly_reports: {
        Row: {
          created_at: string
          id: string
          month: string
          trainer_comment: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          month: string
          trainer_comment?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          month?: string
          trainer_comment?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          created_at: string
          id: string
          reminder_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reminder_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reminder_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          best_streak: number
          calendar_token: string
          created_at: string
          cycle_start_date: string | null
          display_name: string | null
          id: string
          last_streak_notified: number
          line_user_id: string | null
          paid_this_month: boolean
          plan: string | null
          show_usage_period: boolean
          trial_completed: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          best_streak?: number
          calendar_token?: string
          created_at?: string
          cycle_start_date?: string | null
          display_name?: string | null
          id?: string
          last_streak_notified?: number
          line_user_id?: string | null
          paid_this_month?: boolean
          plan?: string | null
          show_usage_period?: boolean
          trial_completed?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          best_streak?: number
          calendar_token?: string
          created_at?: string
          cycle_start_date?: string | null
          display_name?: string | null
          id?: string
          last_streak_notified?: number
          line_user_id?: string | null
          paid_this_month?: boolean
          plan?: string | null
          show_usage_period?: boolean
          trial_completed?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      skeletal_diagnoses: {
        Row: {
          confidence: number
          created_at: string
          id: string
          image_url: string | null
          metrics: Json
          scores: Json
          skeletal_type: string
          user_id: string
        }
        Insert: {
          confidence: number
          created_at?: string
          id?: string
          image_url?: string | null
          metrics?: Json
          scores?: Json
          skeletal_type: string
          user_id: string
        }
        Update: {
          confidence?: number
          created_at?: string
          id?: string
          image_url?: string | null
          metrics?: Json
          scores?: Json
          skeletal_type?: string
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      trial_bookings: {
        Row: {
          booking_date: string
          booking_type: string
          created_at: string
          google_event_id: string | null
          guest_contact: string
          guest_name: string
          id: string
          status: string
        }
        Insert: {
          booking_date: string
          booking_type?: string
          created_at?: string
          google_event_id?: string | null
          guest_contact: string
          guest_name: string
          id?: string
          status?: string
        }
        Update: {
          booking_date?: string
          booking_type?: string
          created_at?: string
          google_event_id?: string | null
          guest_contact?: string
          guest_name?: string
          id?: string
          status?: string
        }
        Relationships: []
      }
      user_measurements: {
        Row: {
          body_fat: number | null
          created_at: string
          id: string
          measured_date: string
          updated_at: string
          user_id: string
          weight: number | null
        }
        Insert: {
          body_fat?: number | null
          created_at?: string
          id?: string
          measured_date?: string
          updated_at?: string
          user_id: string
          weight?: number | null
        }
        Update: {
          body_fat?: number | null
          created_at?: string
          id?: string
          measured_date?: string
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workouts: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          reps: number | null
          sets: Json | null
          user_id: string
          weight: number | null
          workout_date: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          reps?: number | null
          sets?: Json | null
          user_id: string
          weight?: number | null
          workout_date?: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          reps?: number | null
          sets?: Json | null
          user_id?: string
          weight?: number | null
          workout_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "workouts_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_customer_cascade: {
        Args: { _customer_id: string }
        Returns: undefined
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_booked_slots: {
        Args: { check_date: string }
        Returns: {
          booking_date: string
          end_booking_date: string
          status: string
        }[]
      }
      get_trainer_ids: {
        Args: never
        Returns: {
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "customer" | "trainer"
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
      app_role: ["customer", "trainer"],
    },
  },
} as const
