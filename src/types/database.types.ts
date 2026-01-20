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
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          name: string
          topic_id: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          name: string
          topic_id?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          name?: string
          topic_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      domains: {
        Row: {
          code: string
          created_at: string | null
          id: number
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: number
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          custom_api_key: string | null
          email: string | null
          full_name: string | null
          id: string
          preferred_model: string | null
          role: string | null
          specific_model_id: string | null
          updated_at: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          custom_api_key?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          preferred_model?: string | null
          role?: string | null
          specific_model_id?: string | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          custom_api_key?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          preferred_model?: string | null
          role?: string | null
          specific_model_id?: string | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }

      questions: {
        Row: {
          category_id: number | null
          created_at: string | null
          difficulty: string | null
          id: number
          keywords: string[] | null
          question_text: string
        }
        Insert: {
          category_id?: number | null
          created_at?: string | null
          difficulty?: string | null
          id?: number
          keywords?: string[] | null
          question_text: string
        }
        Update: {
          category_id?: number | null
          created_at?: string | null
          difficulty?: string | null
          id?: number
          keywords?: string[] | null
          question_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          created_at: string | null
          id: number
          question_id: number | null
          relevance_score: number | null
          title: string
          type: string
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          question_id?: number | null
          relevance_score?: number | null
          title: string
          type: string
          url: string
        }
        Update: {
          created_at?: string | null
          id?: number
          question_id?: number | null
          relevance_score?: number | null
          title?: string
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      sections: {
        Row: {
          created_at: string | null
          domain_id: number
          id: number
          name: string
        }
        Insert: {
          created_at?: string | null
          domain_id: number
          id?: number
          name: string
        }
        Update: {
          created_at?: string | null
          domain_id?: number
          id?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_sections_domain"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          created_at: string | null
          domain_id: number | null
          id: number
          name: string
          section_id: number | null
        }
        Insert: {
          created_at?: string | null
          domain_id?: number | null
          id?: number
          name: string
          section_id?: number | null
        }
        Update: {
          created_at?: string | null
          domain_id?: number | null
          id?: number
          name?: string
          section_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_topics_domain"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_topics_section"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity: {
        Row: {
          activity_type: string
          category_id: number | null
          created_at: string | null
          domain_id: number | null
          id: string
          metadata: Json | null
          question_id: number | null
          status: string | null
          topic_id: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          activity_type: string
          category_id?: number | null
          created_at?: string | null
          domain_id?: number | null
          id?: string
          metadata?: Json | null
          question_id?: number | null
          status?: string | null
          topic_id?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          category_id?: number | null
          created_at?: string | null
          domain_id?: number | null
          id?: string
          metadata?: Json | null
          question_id?: number | null
          status?: string | null
          topic_id?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_activity_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user_activity_domain"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user_activity_question"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user_activity_topic"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }

      user_preferences: {
        Row: {
          created_at: string | null
          custom_formatting_instructions: string | null
          email_notifications: boolean | null
          id: string
          include_code_snippets: boolean | null
          include_latex_formulas: boolean | null
          preferred_answer_depth: string | null
          preferred_answer_format: string | null
          preferred_model: string | null
          specific_model_id: string | null
          theme: string | null
          updated_at: string | null
          use_book_sources: boolean | null
          use_image_sources: boolean | null
          use_paper_sources: boolean | null
          use_pdf_sources: boolean | null
          use_website_sources: boolean | null
          use_youtube_sources: boolean | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          custom_formatting_instructions?: string | null
          email_notifications?: boolean | null
          id?: string
          include_code_snippets?: boolean | null
          include_latex_formulas?: boolean | null
          preferred_answer_depth?: string | null
          preferred_answer_format?: string | null
          preferred_model?: string | null
          specific_model_id?: string | null
          theme?: string | null
          updated_at?: string | null
          use_book_sources?: boolean | null
          use_image_sources?: boolean | null
          use_paper_sources?: boolean | null
          use_pdf_sources?: boolean | null
          use_website_sources?: boolean | null
          use_youtube_sources?: boolean | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          custom_formatting_instructions?: string | null
          email_notifications?: boolean | null
          id?: string
          include_code_snippets?: boolean | null
          include_latex_formulas?: boolean | null
          preferred_answer_depth?: string | null
          preferred_answer_format?: string | null
          preferred_model?: string | null
          specific_model_id?: string | null
          theme?: string | null
          updated_at?: string | null
          use_book_sources?: boolean | null
          use_image_sources?: boolean | null
          use_paper_sources?: boolean | null
          use_pdf_sources?: boolean | null
          use_website_sources?: boolean | null
          use_youtube_sources?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          category_id: number | null
          created_at: string | null
          id: string
          notes: string | null
          question_id: number | null
          status: string | null
          topic_id: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category_id?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          question_id?: number | null
          status?: string | null
          topic_id: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category_id?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          question_id?: number | null
          status?: string | null
          topic_id?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_progress_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user_progress_question"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user_progress_topic"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      calculate_entity_progress: {
        Args: {
          p_user_id: string
          p_entity_type: string
          p_entity_id: number
          p_domain: string
          p_section_name?: string
        }
        Returns: undefined
      }
      calculate_section_progress: {
        Args: { p_user_id: string; p_domain?: string; p_section_name?: string }
        Returns: {
          user_id: string
          domain: string
          section_name: string
          completed_subtopics: number
          total_subtopics: number
          completion_percentage: number
          last_updated: string
        }[]
      }
      cleanup_user_activity: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      complete_question_with_context: {
        Args: { p_user_id: string; p_question_id: number }
        Returns: Json
      }
      get_categories_for_topic: {
        Args: { topic_id_param: number }
        Returns: {
          id: number
          topic_id: number
          name: string
          description: string
          created_at: string
        }[]
      }
      get_completed_questions_for_topic: {
        Args: { p_topic_id: number; p_user_id: string }
        Returns: number
      }
      get_domain_counts: {
        Args: { user_id_param: string }
        Returns: {
          domain: string
          count: number
        }[]
      }
      get_section_progress: {
        Args: { p_user_id: string; p_domain: string; p_section_name: string }
        Returns: {
          completed_subtopics: number
          total_subtopics: number
          completion_percentage: number
        }[]
      }
      get_table_columns: {
        Args: { table_name: string }
        Returns: {
          column_name: string
          data_type: string
          is_nullable: boolean
        }[]
      }
      get_tables: {
        Args: Record<PropertyKey, never>
        Returns: {
          table_name: string
        }[]
      }
      get_total_questions_for_topic: {
        Args: { p_topic_id: number }
        Returns: number
      }
      get_user_domain_stats: {
        Args: { p_user_id: string }
        Returns: {
          domain: string
          domainName: string
          totalQuestions: number
          completedQuestions: number
          completionPercentage: number
        }[]
      }
      get_user_identities: {
        Args: { user_email: string }
        Returns: {
          provider: string
          user_id: string
        }[]
      }
      populate_initial_progress_data: {
        Args: { p_user_id?: string }
        Returns: number
      }
      populate_ml_foundations_progress: {
        Args: { p_user_id: string }
        Returns: number
      }
      populate_user_progress_summary: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }

      recalculate_entity_progress: {
        Args: {
          p_entity_type: string
          p_entity_id: number
          p_user_id: string
          p_domain: string
          p_section_name?: string
        }
        Returns: undefined
      }
      refresh_section_progress: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_section_progress_with_index: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_all_section_progress: {
        Args: { p_user_id: string; p_domain?: string }
        Returns: number
      }
      update_entity_progress: {
        Args: {
          p_user_id: string
          p_entity_type: string
          p_entity_id: number
          p_entity_name: string
          p_domain: string
          p_section_name: string
        }
        Returns: undefined
      }
      update_section_progress_cache: {
        Args: { p_user_id: string; p_domain: string; p_section_name: string }
        Returns: undefined
      }
      update_user_progress: {
        Args: {
          p_user_id: string
          p_question_id: number
          p_topic_id: number
          p_category_id: number
          p_status: string
          p_activity_type: string
          p_metadata: Json
        }
        Returns: boolean
      }
      user_exists: {
        Args: { user_email: string }
        Returns: boolean
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
