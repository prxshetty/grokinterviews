export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          full_name: string
          avatar_url: string | null
          email: string
          custom_api_key: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          full_name: string
          avatar_url?: string | null
          email: string
          custom_api_key?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          full_name?: string
          avatar_url?: string | null
          email?: string
          custom_api_key?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          theme: string
          email_notifications: boolean
          preferred_model: string
          specific_model_id: string | null
          use_youtube_sources: boolean
          use_pdf_sources: boolean
          use_paper_sources: boolean
          use_website_sources: boolean
          use_book_sources: boolean
          use_expert_opinion_sources: boolean
          preferred_answer_format: string
          preferred_answer_depth: string
          include_code_snippets: boolean
          include_latex_formulas: boolean
          custom_formatting_instructions: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          theme?: string
          email_notifications?: boolean
          preferred_model?: string
          specific_model_id?: string | null
          use_youtube_sources?: boolean
          use_pdf_sources?: boolean
          use_paper_sources?: boolean
          use_website_sources?: boolean
          use_book_sources?: boolean
          use_expert_opinion_sources?: boolean
          preferred_answer_format?: string
          preferred_answer_depth?: string
          include_code_snippets?: boolean
          include_latex_formulas?: boolean
          custom_formatting_instructions?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          theme?: string
          email_notifications?: boolean
          preferred_model?: string
          specific_model_id?: string | null
          use_youtube_sources?: boolean
          use_pdf_sources?: boolean
          use_paper_sources?: boolean
          use_website_sources?: boolean
          use_book_sources?: boolean
          use_expert_opinion_sources?: boolean
          preferred_answer_format?: string
          preferred_answer_depth?: string
          include_code_snippets?: boolean
          include_latex_formulas?: boolean
          custom_formatting_instructions?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      topics: {
        Row: {
          id: string
          name: string
          slug: string
          description: string
          domain: string
          section_name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description: string
          domain: string
          section_name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string
          domain?: string
          section_name?: string
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          topic_id: string
          name: string
          slug: string
          description: string | null
          order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          topic_id: string
          name: string
          slug: string
          description?: string | null
          order: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          topic_id?: string
          name?: string
          slug?: string
          description?: string | null
          order?: number
          created_at?: string
          updated_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          category_id: string
          question_text: string
          difficulty: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id: string
          question_text: string
          difficulty: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          question_text?: string
          difficulty?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          question_id: string
          topic_id: string
          category_id: string
          status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          question_id: string
          topic_id: string
          category_id: string
          status: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          question_id?: string
          topic_id?: string
          category_id?: string
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_activity: {
        Row: {
          id: string
          user_id: string
          activity_type: string
          topic_id: string | null
          category_id: string | null
          question_id: string | null
          domain: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          activity_type: string
          topic_id?: string | null
          category_id?: string | null
          question_id?: string | null
          domain?: string | null
          metadata: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          activity_type?: string
          topic_id?: string | null
          category_id?: string | null
          question_id?: string | null
          domain?: string | null
          metadata?: Json
          created_at?: string
        }
      }
      resources: {
        Row: {
          id: string
          question_id: string
          resource_type: string
          title: string | null
          url: string | null
          content: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          question_id: string
          resource_type: string
          title?: string | null
          url?: string | null
          content?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          question_id?: string
          resource_type?: string
          title?: string | null
          url?: string | null
          content?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_progress_summary: {
        Row: {
          id: string
          user_id: string
          entity_type: string
          entity_id: string
          entity_name: string
          domain: string
          section_name: string | null
          completion_percentage: number
          questions_completed: number
          total_questions: number
          completed_children: number
          partially_completed_children: number
          total_children: number
          last_updated: string
        }
        Insert: {
          id?: string
          user_id: string
          entity_type: string
          entity_id: string
          entity_name: string
          domain: string
          section_name?: string | null
          completion_percentage: number
          questions_completed: number
          total_questions: number
          completed_children: number
          partially_completed_children: number
          total_children: number
          last_updated?: string
        }
        Update: {
          id?: string
          user_id?: string
          entity_type?: string
          entity_id?: string
          entity_name?: string
          domain?: string
          section_name?: string | null
          completion_percentage?: number
          questions_completed?: number
          total_questions?: number
          completed_children?: number
          partially_completed_children?: number
          total_children?: number
          last_updated?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Insertable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updatable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'] 