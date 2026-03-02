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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      app_config: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          answers_json: Json
          confidence_pre_submit_json: Json | null
          created_at: string
          id: string
          overall_score: number | null
          quiz_id: string
          response_times_json: Json | null
          results_json: Json | null
        }
        Insert: {
          answers_json?: Json
          confidence_pre_submit_json?: Json | null
          created_at?: string
          id?: string
          overall_score?: number | null
          quiz_id: string
          response_times_json?: Json | null
          results_json?: Json | null
        }
        Update: {
          answers_json?: Json
          confidence_pre_submit_json?: Json | null
          created_at?: string
          id?: string
          overall_score?: number | null
          quiz_id?: string
          response_times_json?: Json | null
          results_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          id: string
          questions_json: Json
          session_id: string
          sources_json: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          questions_json?: Json
          session_id: string
          sources_json?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          questions_json?: Json
          session_id?: string
          sources_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendations: {
        Row: {
          certainty_statement: string
          created_at: string
          evidence_json: Json | null
          id: string
          learner_profile: string
          primary_action_json: Json
          risk_analysis: string
          secondary_actions_json: Json | null
          session_id: string | null
          user_id: string
        }
        Insert: {
          certainty_statement: string
          created_at?: string
          evidence_json?: Json | null
          id?: string
          learner_profile: string
          primary_action_json?: Json
          risk_analysis: string
          secondary_actions_json?: Json | null
          session_id?: string | null
          user_id: string
        }
        Update: {
          certainty_statement?: string
          created_at?: string
          evidence_json?: Json | null
          id?: string
          learner_profile?: string
          primary_action_json?: Json
          risk_analysis?: string
          secondary_actions_json?: Json | null
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          avg_focus_block_minutes: number | null
          confidence_post: number | null
          debrief_confusion: string | null
          debrief_key_points: string[] | null
          difficulty_post: number | null
          distraction_ratio: number | null
          duration_sec: number | null
          end_time: string | null
          fragmentation: number | null
          goal_type: Database["public"]["Enums"]["goal_type"]
          id: string
          notes_file_url: string | null
          notes_ratio: number | null
          practice_ratio: number | null
          research_ratio: number | null
          start_time: string
          switches_count: number | null
          switching_rate: number | null
          topic_tags: string[] | null
          user_id: string
        }
        Insert: {
          avg_focus_block_minutes?: number | null
          confidence_post?: number | null
          debrief_confusion?: string | null
          debrief_key_points?: string[] | null
          difficulty_post?: number | null
          distraction_ratio?: number | null
          duration_sec?: number | null
          end_time?: string | null
          fragmentation?: number | null
          goal_type?: Database["public"]["Enums"]["goal_type"]
          id?: string
          notes_file_url?: string | null
          notes_ratio?: number | null
          practice_ratio?: number | null
          research_ratio?: number | null
          start_time?: string
          switches_count?: number | null
          switching_rate?: number | null
          topic_tags?: string[] | null
          user_id: string
        }
        Update: {
          avg_focus_block_minutes?: number | null
          confidence_post?: number | null
          debrief_confusion?: string | null
          debrief_key_points?: string[] | null
          difficulty_post?: number | null
          distraction_ratio?: number | null
          duration_sec?: number | null
          end_time?: string | null
          fragmentation?: number | null
          goal_type?: Database["public"]["Enums"]["goal_type"]
          id?: string
          notes_file_url?: string | null
          notes_ratio?: number | null
          practice_ratio?: number | null
          research_ratio?: number | null
          start_time?: string
          switches_count?: number | null
          switching_rate?: number | null
          topic_tags?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      state_snapshots: {
        Row: {
          calibration_gap: number | null
          certainty: number | null
          concept_strength: number | null
          id: string
          recovery_rate: number | null
          risk_score: number | null
          stability: number | null
          stamina: number | null
          timestamp: string
          topic_tag: string
          user_id: string
          velocity_direction: number | null
          velocity_magnitude: number | null
        }
        Insert: {
          calibration_gap?: number | null
          certainty?: number | null
          concept_strength?: number | null
          id?: string
          recovery_rate?: number | null
          risk_score?: number | null
          stability?: number | null
          stamina?: number | null
          timestamp?: string
          topic_tag: string
          user_id: string
          velocity_direction?: number | null
          velocity_magnitude?: number | null
        }
        Update: {
          calibration_gap?: number | null
          certainty?: number | null
          concept_strength?: number | null
          id?: string
          recovery_rate?: number | null
          risk_score?: number | null
          stability?: number | null
          stamina?: number | null
          timestamp?: string
          topic_tag?: string
          user_id?: string
          velocity_direction?: number | null
          velocity_magnitude?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "state_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      goal_type: "revision" | "practice" | "research" | "notes" | "mixed"
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
      goal_type: ["revision", "practice", "research", "notes", "mixed"],
    },
  },
} as const
