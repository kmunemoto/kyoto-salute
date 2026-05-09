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
      announcement_reads: {
        Row: {
          announcement_id: string
          id: string
          read_at: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          id?: string
          read_at?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          icon: string
          id: string
          published_at: string
          target: string
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          icon?: string
          id?: string
          published_at?: string
          target?: string
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          icon?: string
          id?: string
          published_at?: string
          target?: string
          title?: string
        }
        Relationships: []
      }
      avatar_achievements: {
        Row: {
          achievement_key: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_key: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_key?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      avatar_collection_rewards: {
        Row: {
          coins_awarded: number
          created_at: string
          id: string
          milestone: number
          user_id: string
        }
        Insert: {
          coins_awarded?: number
          created_at?: string
          id?: string
          milestone: number
          user_id: string
        }
        Update: {
          coins_awarded?: number
          created_at?: string
          id?: string
          milestone?: number
          user_id?: string
        }
        Relationships: []
      }
      avatar_customization_items: {
        Row: {
          category: string
          created_at: string
          id: string
          item_key: string
          name: string
          price: number
          rarity: string
          required_level: number
          sort_order: number
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          item_key: string
          name: string
          price?: number
          rarity?: string
          required_level?: number
          sort_order?: number
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          item_key?: string
          name?: string
          price?: number
          rarity?: string
          required_level?: number
          sort_order?: number
        }
        Relationships: []
      }
      avatar_exp_logs: {
        Row: {
          created_at: string
          exp_amount: number
          id: string
          reason: string
          reference_date: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          exp_amount: number
          id?: string
          reason: string
          reference_date?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          exp_amount?: number
          id?: string
          reason?: string
          reference_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      avatar_frames: {
        Row: {
          created_at: string
          frame_key: string
          frame_name: string
          id: string
          image_path: string
          rarity: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          frame_key: string
          frame_name: string
          id?: string
          image_path: string
          rarity: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          frame_key?: string
          frame_name?: string
          id?: string
          image_path?: string
          rarity?: string
          sort_order?: number
        }
        Relationships: []
      }
      avatar_rank_up_rewards: {
        Row: {
          coins_awarded: number
          created_at: string
          id: string
          rank_name: string
          tickets_awarded: number
          user_id: string
        }
        Insert: {
          coins_awarded?: number
          created_at?: string
          id?: string
          rank_name: string
          tickets_awarded?: number
          user_id: string
        }
        Update: {
          coins_awarded?: number
          created_at?: string
          id?: string
          rank_name?: string
          tickets_awarded?: number
          user_id?: string
        }
        Relationships: []
      }
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
      coin_purchases: {
        Row: {
          amount_jpy: number
          coins_added: number
          created_at: string
          environment: string
          id: string
          price_id: string
          stripe_session_id: string
          user_id: string
        }
        Insert: {
          amount_jpy: number
          coins_added: number
          created_at?: string
          environment?: string
          id?: string
          price_id: string
          stripe_session_id: string
          user_id: string
        }
        Update: {
          amount_jpy?: number
          coins_added?: number
          created_at?: string
          environment?: string
          id?: string
          price_id?: string
          stripe_session_id?: string
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
      daily_login_bonuses: {
        Row: {
          claimed_at: string
          day_number: number
          id: string
          login_date: string
          reward_amount: number
          reward_type: string
          user_id: string
        }
        Insert: {
          claimed_at?: string
          day_number: number
          id?: string
          login_date: string
          reward_amount: number
          reward_type: string
          user_id: string
        }
        Update: {
          claimed_at?: string
          day_number?: number
          id?: string
          login_date?: string
          reward_amount?: number
          reward_type?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_missions: {
        Row: {
          all_completed: boolean
          completed_keys: string[]
          created_at: string
          exp_earned: number
          id: string
          mission_date: string
          mission_keys: string[]
          user_id: string
        }
        Insert: {
          all_completed?: boolean
          completed_keys?: string[]
          created_at?: string
          exp_earned?: number
          id?: string
          mission_date: string
          mission_keys: string[]
          user_id: string
        }
        Update: {
          all_completed?: boolean
          completed_keys?: string[]
          created_at?: string
          exp_earned?: number
          id?: string
          mission_date?: string
          mission_keys?: string[]
          user_id?: string
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
      equipment_items: {
        Row: {
          atk_bonus: number
          created_at: string
          def_bonus: number
          hp_bonus: number
          icon_name: string
          id: string
          image_path: string | null
          item_key: string
          item_name: string
          item_type: string
          rarity: string
          source: string
        }
        Insert: {
          atk_bonus?: number
          created_at?: string
          def_bonus?: number
          hp_bonus?: number
          icon_name: string
          id?: string
          image_path?: string | null
          item_key: string
          item_name: string
          item_type: string
          rarity: string
          source: string
        }
        Update: {
          atk_bonus?: number
          created_at?: string
          def_bonus?: number
          hp_bonus?: number
          icon_name?: string
          id?: string
          image_path?: string | null
          item_key?: string
          item_name?: string
          item_type?: string
          rarity?: string
          source?: string
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
      gacha_results: {
        Row: {
          created_at: string
          id: string
          rarity: string
          result_date: string
          reward_amount: number | null
          reward_key: string | null
          reward_type: string
          ticket_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rarity: string
          result_date: string
          reward_amount?: number | null
          reward_key?: string | null
          reward_type: string
          ticket_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rarity?: string
          result_date?: string
          reward_amount?: number | null
          reward_key?: string | null
          reward_type?: string
          ticket_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gacha_results_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "user_gacha_tickets"
            referencedColumns: ["id"]
          },
        ]
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
      progress_photos: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          photo_type: string
          photo_url: string
          taken_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          photo_type: string
          photo_url: string
          taken_date: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          photo_type?: string
          photo_url?: string
          taken_date?: string
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
      quest_battle_logs: {
        Row: {
          boss_atk: number
          boss_counter_damage: number
          boss_def: number
          boss_hp_after: number
          boss_hp_before: number
          created_at: string
          damage_dealt: number
          id: string
          is_boss_defeated: boolean
          is_full_power: boolean
          player_atk: number
          player_def: number
          player_hp: number
          session_volume: number
          stage_id: number
          user_id: string
        }
        Insert: {
          boss_atk: number
          boss_counter_damage: number
          boss_def: number
          boss_hp_after: number
          boss_hp_before: number
          created_at?: string
          damage_dealt: number
          id?: string
          is_boss_defeated?: boolean
          is_full_power: boolean
          player_atk: number
          player_def: number
          player_hp: number
          session_volume?: number
          stage_id: number
          user_id: string
        }
        Update: {
          boss_atk?: number
          boss_counter_damage?: number
          boss_def?: number
          boss_hp_after?: number
          boss_hp_before?: number
          created_at?: string
          damage_dealt?: number
          id?: string
          is_boss_defeated?: boolean
          is_full_power?: boolean
          player_atk?: number
          player_def?: number
          player_hp?: number
          session_volume?: number
          stage_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quest_battle_logs_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "quest_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      quest_bosses: {
        Row: {
          boss_atk: number
          boss_def: number
          boss_description: string
          boss_hp: number
          boss_icon: string
          boss_image_url: string | null
          boss_name: string
          created_at: string
          gender: string
          id: number
          stage_id: number
        }
        Insert: {
          boss_atk: number
          boss_def: number
          boss_description: string
          boss_hp: number
          boss_icon?: string
          boss_image_url?: string | null
          boss_name: string
          created_at?: string
          gender?: string
          id?: number
          stage_id: number
        }
        Update: {
          boss_atk?: number
          boss_def?: number
          boss_description?: string
          boss_hp?: number
          boss_icon?: string
          boss_image_url?: string | null
          boss_name?: string
          created_at?: string
          gender?: string
          id?: number
          stage_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "quest_bosses_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "quest_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      quest_stage_conditions: {
        Row: {
          condition_type: string
          display_label: string
          id: string
          sort_order: number
          stage_id: number
          target_value: number
        }
        Insert: {
          condition_type: string
          display_label: string
          id?: string
          sort_order?: number
          stage_id: number
          target_value: number
        }
        Update: {
          condition_type?: string
          display_label?: string
          id?: string
          sort_order?: number
          stage_id?: number
          target_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "quest_stage_conditions_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "quest_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      quest_stages: {
        Row: {
          background_image_url: string | null
          created_at: string
          description: string
          id: number
          name: string
          name_before: string
          reward_badge_key: string | null
          reward_coins: number
          reward_exp: number
          reward_frame: boolean
          reward_title: string | null
          stage_number: number
          story_complete: string
          story_intro: string
          theme_dark_from: string
          theme_dark_to: string
          theme_gradient_from: string
          theme_gradient_to: string
          theme_icon: string
        }
        Insert: {
          background_image_url?: string | null
          created_at?: string
          description: string
          id: number
          name: string
          name_before: string
          reward_badge_key?: string | null
          reward_coins: number
          reward_exp: number
          reward_frame?: boolean
          reward_title?: string | null
          stage_number: number
          story_complete: string
          story_intro: string
          theme_dark_from: string
          theme_dark_to: string
          theme_gradient_from: string
          theme_gradient_to: string
          theme_icon: string
        }
        Update: {
          background_image_url?: string | null
          created_at?: string
          description?: string
          id?: number
          name?: string
          name_before?: string
          reward_badge_key?: string | null
          reward_coins?: number
          reward_exp?: number
          reward_frame?: boolean
          reward_title?: string | null
          stage_number?: number
          story_complete?: string
          story_intro?: string
          theme_dark_from?: string
          theme_dark_to?: string
          theme_gradient_from?: string
          theme_gradient_to?: string
          theme_icon?: string
        }
        Relationships: []
      }
      raid_bosses: {
        Row: {
          boss_hp: number
          boss_image_url: string | null
          boss_name: string
          created_at: string
          current_damage: number
          defeated: boolean
          defeated_at: string | null
          end_date: string
          id: string
          reward_coins: number
          reward_exp: number
          start_date: string
          theme_color: string | null
        }
        Insert: {
          boss_hp: number
          boss_image_url?: string | null
          boss_name: string
          created_at?: string
          current_damage?: number
          defeated?: boolean
          defeated_at?: string | null
          end_date: string
          id?: string
          reward_coins?: number
          reward_exp?: number
          start_date: string
          theme_color?: string | null
        }
        Update: {
          boss_hp?: number
          boss_image_url?: string | null
          boss_name?: string
          created_at?: string
          current_damage?: number
          defeated?: boolean
          defeated_at?: string | null
          end_date?: string
          id?: string
          reward_coins?: number
          reward_exp?: number
          start_date?: string
          theme_color?: string | null
        }
        Relationships: []
      }
      raid_damage_logs: {
        Row: {
          created_at: string
          damage: number
          id: string
          raid_id: string
          user_id: string
          workout_date: string
        }
        Insert: {
          created_at?: string
          damage: number
          id?: string
          raid_id: string
          user_id: string
          workout_date: string
        }
        Update: {
          created_at?: string
          damage?: number
          id?: string
          raid_id?: string
          user_id?: string
          workout_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "raid_damage_logs_raid_id_fkey"
            columns: ["raid_id"]
            isOneToOne: false
            referencedRelation: "raid_bosses"
            referencedColumns: ["id"]
          },
        ]
      }
      raid_reward_items: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          item_key: string
          name: string
          raid_boss_id: string | null
          required_rank: string
          theme_color: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          item_key: string
          name: string
          raid_boss_id?: string | null
          required_rank: string
          theme_color?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          item_key?: string
          name?: string
          raid_boss_id?: string | null
          required_rank?: string
          theme_color?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "raid_reward_items_raid_boss_id_fkey"
            columns: ["raid_boss_id"]
            isOneToOne: false
            referencedRelation: "raid_bosses"
            referencedColumns: ["id"]
          },
        ]
      }
      rival_battle_entries: {
        Row: {
          entered_at: string
          id: string
          matched: boolean
          user_id: string
          week_start: string
        }
        Insert: {
          entered_at?: string
          id?: string
          matched?: boolean
          user_id: string
          week_start: string
        }
        Update: {
          entered_at?: string
          id?: string
          matched?: boolean
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      rival_battle_rewards: {
        Row: {
          battle_id: string
          claimed: boolean
          claimed_at: string | null
          coins_earned: number
          created_at: string
          exp_earned: number
          id: string
          result: string
          streak_bonus_coins: number
          user_id: string
          win_streak: number
        }
        Insert: {
          battle_id: string
          claimed?: boolean
          claimed_at?: string | null
          coins_earned: number
          created_at?: string
          exp_earned: number
          id?: string
          result: string
          streak_bonus_coins?: number
          user_id: string
          win_streak?: number
        }
        Update: {
          battle_id?: string
          claimed?: boolean
          claimed_at?: string | null
          coins_earned?: number
          created_at?: string
          exp_earned?: number
          id?: string
          result?: string
          streak_bonus_coins?: number
          user_id?: string
          win_streak?: number
        }
        Relationships: [
          {
            foreignKeyName: "rival_battle_rewards_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "rival_battles"
            referencedColumns: ["id"]
          },
        ]
      }
      rival_battles: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          player1_id: string
          player1_volume: number
          player2_id: string
          player2_volume: number
          status: string
          week_end: string
          week_start: string
          winner_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          player1_id: string
          player1_volume?: number
          player2_id: string
          player2_volume?: number
          status?: string
          week_end: string
          week_start: string
          winner_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          player1_id?: string
          player1_volume?: number
          player2_id?: string
          player2_volume?: number
          status?: string
          week_end?: string
          week_start?: string
          winner_id?: string | null
        }
        Relationships: []
      }
      season_event_tasks: {
        Row: {
          created_at: string
          event_id: string
          id: string
          sort_order: number
          target_value: number
          task_description: string | null
          task_icon: string | null
          task_key: string
          task_name: string
          task_type: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          sort_order?: number
          target_value: number
          task_description?: string | null
          task_icon?: string | null
          task_key: string
          task_name: string
          task_type: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          sort_order?: number
          target_value?: number
          task_description?: string | null
          task_icon?: string | null
          task_key?: string
          task_name?: string
          task_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "season_event_tasks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "season_events"
            referencedColumns: ["id"]
          },
        ]
      }
      season_events: {
        Row: {
          badge_icon: string | null
          badge_name: string | null
          created_at: string
          end_date: string
          event_description: string | null
          event_icon: string | null
          event_name: string
          id: string
          is_active: boolean
          reward_badge_key: string | null
          reward_coins: number
          reward_exp: number
          start_date: string
        }
        Insert: {
          badge_icon?: string | null
          badge_name?: string | null
          created_at?: string
          end_date: string
          event_description?: string | null
          event_icon?: string | null
          event_name: string
          id?: string
          is_active?: boolean
          reward_badge_key?: string | null
          reward_coins?: number
          reward_exp?: number
          start_date: string
        }
        Update: {
          badge_icon?: string | null
          badge_name?: string | null
          created_at?: string
          end_date?: string
          event_description?: string | null
          event_icon?: string | null
          event_name?: string
          id?: string
          is_active?: boolean
          reward_badge_key?: string | null
          reward_coins?: number
          reward_exp?: number
          start_date?: string
        }
        Relationships: []
      }
      season_pass_config: {
        Row: {
          created_at: string
          end_date: string
          id: string
          month: string
          name: string
          premium_cost_coins: number
          premium_daily_coins: number
          premium_exp_multiplier: number
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          month: string
          name: string
          premium_cost_coins?: number
          premium_daily_coins?: number
          premium_exp_multiplier?: number
          start_date: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          month?: string
          name?: string
          premium_cost_coins?: number
          premium_daily_coins?: number
          premium_exp_multiplier?: number
          start_date?: string
        }
        Relationships: []
      }
      season_pass_levels: {
        Row: {
          config_id: string
          free_reward_amount: number
          free_reward_key: string | null
          free_reward_type: string | null
          id: string
          level: number
          premium_reward_amount: number
          premium_reward_key: string | null
          premium_reward_type: string | null
          required_points: number
        }
        Insert: {
          config_id: string
          free_reward_amount?: number
          free_reward_key?: string | null
          free_reward_type?: string | null
          id?: string
          level: number
          premium_reward_amount?: number
          premium_reward_key?: string | null
          premium_reward_type?: string | null
          required_points: number
        }
        Update: {
          config_id?: string
          free_reward_amount?: number
          free_reward_key?: string | null
          free_reward_type?: string | null
          id?: string
          level?: number
          premium_reward_amount?: number
          premium_reward_key?: string | null
          premium_reward_type?: string | null
          required_points?: number
        }
        Relationships: [
          {
            foreignKeyName: "season_pass_levels_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "season_pass_config"
            referencedColumns: ["id"]
          },
        ]
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
      user_avatars: {
        Row: {
          coins: number
          combo_5_count: number
          combo_count: number
          created_at: string
          equipped_background: string | null
          equipped_emote: string | null
          equipped_frame: string | null
          equipped_title: string | null
          equipped_weapon: string | null
          featured_badges: string[]
          gender: string | null
          hair_color: string
          id: string
          last_session_date: string | null
          level: number
          max_combo_reached: number
          total_exp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          coins?: number
          combo_5_count?: number
          combo_count?: number
          created_at?: string
          equipped_background?: string | null
          equipped_emote?: string | null
          equipped_frame?: string | null
          equipped_title?: string | null
          equipped_weapon?: string | null
          featured_badges?: string[]
          gender?: string | null
          hair_color?: string
          id?: string
          last_session_date?: string | null
          level?: number
          max_combo_reached?: number
          total_exp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          coins?: number
          combo_5_count?: number
          combo_count?: number
          created_at?: string
          equipped_background?: string | null
          equipped_emote?: string | null
          equipped_frame?: string | null
          equipped_title?: string | null
          equipped_weapon?: string | null
          featured_badges?: string[]
          gender?: string | null
          hair_color?: string
          id?: string
          last_session_date?: string | null
          level?: number
          max_combo_reached?: number
          total_exp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_customization_items: {
        Row: {
          acquired_at: string
          id: string
          item_key: string
          user_id: string
        }
        Insert: {
          acquired_at?: string
          id?: string
          item_key: string
          user_id: string
        }
        Update: {
          acquired_at?: string
          id?: string
          item_key?: string
          user_id?: string
        }
        Relationships: []
      }
      user_equipment: {
        Row: {
          equipped: boolean
          id: string
          item_id: string
          obtained_at: string
          user_id: string
        }
        Insert: {
          equipped?: boolean
          id?: string
          item_id: string
          obtained_at?: string
          user_id: string
        }
        Update: {
          equipped?: boolean
          id?: string
          item_id?: string
          obtained_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_equipment_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "equipment_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_event_completion: {
        Row: {
          completed_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          completed_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_event_completion_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "season_events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_event_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          current_value: number
          event_id: string
          id: string
          task_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          current_value?: number
          event_id: string
          id?: string
          task_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          current_value?: number
          event_id?: string
          id?: string
          task_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_event_progress_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "season_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_event_progress_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "season_event_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_frame_inventory: {
        Row: {
          frame_key: string
          id: string
          obtained_at: string
          obtained_via: string
          user_id: string
        }
        Insert: {
          frame_key: string
          id?: string
          obtained_at?: string
          obtained_via?: string
          user_id: string
        }
        Update: {
          frame_key?: string
          id?: string
          obtained_at?: string
          obtained_via?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_frame_inventory_frame_key_fkey"
            columns: ["frame_key"]
            isOneToOne: false
            referencedRelation: "avatar_frames"
            referencedColumns: ["frame_key"]
          },
        ]
      }
      user_gacha_tickets: {
        Row: {
          created_at: string
          id: string
          session_date: string | null
          used: boolean
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          session_date?: string | null
          used?: boolean
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          session_date?: string | null
          used?: boolean
          used_at?: string | null
          user_id?: string
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
      user_quest_boss_progress: {
        Row: {
          boss_current_hp: number
          created_at: string
          defeated: boolean
          defeated_at: string | null
          id: string
          stage_id: number
          total_damage_dealt: number
          total_turns: number
          updated_at: string
          user_id: string
        }
        Insert: {
          boss_current_hp: number
          created_at?: string
          defeated?: boolean
          defeated_at?: string | null
          id?: string
          stage_id: number
          total_damage_dealt?: number
          total_turns?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          boss_current_hp?: number
          created_at?: string
          defeated?: boolean
          defeated_at?: string | null
          id?: string
          stage_id?: number
          total_damage_dealt?: number
          total_turns?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quest_boss_progress_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "quest_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quest_progress: {
        Row: {
          created_at: string
          current_stage: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_stage?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_stage?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_quest_stage_completions: {
        Row: {
          completed_at: string
          id: string
          rewards_claimed: boolean
          stage_id: number
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          rewards_claimed?: boolean
          stage_id: number
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          rewards_claimed?: boolean
          stage_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quest_stage_completions_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "quest_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      user_raid_rewards: {
        Row: {
          earned_at: string
          earned_rank: string
          id: string
          item_key: string
          raid_boss_id: string | null
          user_id: string
        }
        Insert: {
          earned_at?: string
          earned_rank: string
          id?: string
          item_key: string
          raid_boss_id?: string | null
          user_id: string
        }
        Update: {
          earned_at?: string
          earned_rank?: string
          id?: string
          item_key?: string
          raid_boss_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_raid_rewards_raid_boss_id_fkey"
            columns: ["raid_boss_id"]
            isOneToOne: false
            referencedRelation: "raid_bosses"
            referencedColumns: ["id"]
          },
        ]
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
      user_season_pass: {
        Row: {
          config_id: string
          created_at: string
          current_level: number
          current_points: number
          id: string
          is_premium: boolean
          premium_purchased_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          config_id: string
          created_at?: string
          current_level?: number
          current_points?: number
          id?: string
          is_premium?: boolean
          premium_purchased_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          config_id?: string
          created_at?: string
          current_level?: number
          current_points?: number
          id?: string
          is_premium?: boolean
          premium_purchased_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_season_pass_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "season_pass_config"
            referencedColumns: ["id"]
          },
        ]
      }
      user_season_pass_claims: {
        Row: {
          claimed_at: string
          config_id: string
          id: string
          level: number
          track: string
          user_id: string
        }
        Insert: {
          claimed_at?: string
          config_id: string
          id?: string
          level: number
          track: string
          user_id: string
        }
        Update: {
          claimed_at?: string
          config_id?: string
          id?: string
          level?: number
          track?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_season_pass_claims_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "season_pass_config"
            referencedColumns: ["id"]
          },
        ]
      }
      user_titles: {
        Row: {
          id: string
          title_key: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          id?: string
          title_key: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          id?: string
          title_key?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workouts: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          notes: string | null
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
          notes?: string | null
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
          notes?: string | null
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
      _quest_condition_values: { Args: { _user_id: string }; Returns: Json }
      add_season_pass_points: {
        Args: { p_action?: string; p_points: number; p_user_id: string }
        Returns: Json
      }
      apply_raid_damage: {
        Args: { _damage: number; _user_id: string; _workout_date: string }
        Returns: Json
      }
      check_collection_milestones: { Args: { _user_id: string }; Returns: Json }
      claim_daily_login_bonus: { Args: { p_user_id: string }; Returns: Json }
      claim_rival_reward: { Args: { p_battle_id: string }; Returns: Json }
      claim_season_pass_reward: {
        Args: { p_level: number; p_track: string; p_user_id: string }
        Returns: Json
      }
      complete_quest_stage: {
        Args: { p_stage_id: number; p_user_id: string }
        Returns: Json
      }
      complete_rival_battles: { Args: { p_week_start: string }; Returns: Json }
      current_jst_monday: { Args: never; Returns: string }
      delete_customer_cascade: {
        Args: { _customer_id: string }
        Returns: undefined
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      distribute_raid_rewards: {
        Args: { p_raid_boss_id: string }
        Returns: Json
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      enter_rival_battle: { Args: never; Returns: Json }
      equip_frame: { Args: { p_frame_key: string }; Returns: Json }
      equip_item: {
        Args: { p_item_id: string; p_user_id: string }
        Returns: Json
      }
      execute_quest_battle: {
        Args: { p_session_volume: number; p_user_id: string }
        Returns: Json
      }
      get_booked_slots: {
        Args: { check_date: string }
        Returns: {
          booking_date: string
          end_booking_date: string
          status: string
        }[]
      }
      get_current_season_config: {
        Args: never
        Returns: {
          created_at: string
          end_date: string
          id: string
          month: string
          name: string
          premium_cost_coins: number
          premium_daily_coins: number
          premium_exp_multiplier: number
          start_date: string
        }
        SetofOptions: {
          from: "*"
          to: "season_pass_config"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_login_bonus_status: { Args: { p_user_id: string }; Returns: Json }
      get_player_combat_stats: { Args: { p_user_id: string }; Returns: Json }
      get_quest_progress: { Args: { p_user_id: string }; Returns: Json }
      get_ranking: { Args: { p_gender: string; p_type: string }; Returns: Json }
      get_trainer_ids: {
        Args: never
        Returns: {
          user_id: string
        }[]
      }
      grant_equipment: {
        Args: { p_item_key: string; p_obtained_via?: string; p_user_id: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      initialize_quest_boss_progress: { Args: never; Returns: Json }
      initialize_quest_progress: { Args: never; Returns: Json }
      initialize_starter_equipment: { Args: never; Returns: Json }
      initialize_starter_equipment_for_user: {
        Args: { p_user_id: string }
        Returns: Json
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
      process_session_rewards: {
        Args: { _user_id: string; _workout_date: string }
        Returns: Json
      }
      purchase_customization_item: {
        Args: { p_item_key: string }
        Returns: Json
      }
      purchase_premium_pass: { Args: { p_user_id: string }; Returns: Json }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      recalculate_event_progress: {
        Args: { p_event_id: string }
        Returns: Json
      }
      run_rival_matching: { Args: { p_week_start: string }; Returns: Json }
      set_featured_badges: { Args: { p_badges: string[] }; Returns: undefined }
      spin_gacha: {
        Args: { _result_date: string; _user_id: string }
        Returns: Json
      }
      update_event_progress: { Args: { _user_id: string }; Returns: Json }
      update_rival_battle_volumes: {
        Args: { p_week_start: string }
        Returns: Json
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
