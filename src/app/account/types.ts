// --- Groq Model Structure and List ---
export interface GroqModel {
  id: string
  name: string // User-friendly name
  rpm: number // Requests Per Minute
  notes?: string // Optional notes about the model's capabilities
}

export const availableGroqModels: GroqModel[] = [
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', rpm: 750, notes: 'Fastest for general text' },
  { id: 'gemma2-9b-it', name: 'Gemma2 9B Instruct', rpm: 500, notes: 'Excels in code/math, low resource' },
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', rpm: 276, notes: 'Fastest large model, 8 languages' },
  { id: 'whisper-large-v3-turbo', name: 'Whisper Large V3 Turbo', rpm: 600, notes: 'Fastest Whisper variant for speech-to-text' },
  { id: 'llama-guard-3-8b', name: 'Llama Guard 3 8B', rpm: 500, notes: 'Real-time content filtering' },
]

export const DEFAULT_GROQ_MODEL_ID = 'llama-3.1-8b-instant'

// --- User Profile and Preferences Interfaces ---
export interface UserProfile {
  id: string
  full_name: string
  avatar_url: string | null
  email: string
  custom_api_key: string | null
}

export interface UserPreferences {
  user_id: string // Foreign key to profiles.id
  specific_model_id: string | null
  use_youtube_sources?: boolean
  use_pdf_sources?: boolean
  use_paper_sources?: boolean
  use_website_sources?: boolean
  use_book_sources?: boolean
  use_image_sources?: boolean
  preferred_answer_format?: AnswerFormat
  preferred_answer_depth?: AnswerDepth
  include_code_snippets?: boolean
  include_latex_formulas?: boolean
  custom_formatting_instructions?: string | null
  theme?: string
  email_notifications?: boolean
}

export type AnswerFormat = 'bullet_points' | 'numbered_lists' | 'table' | 'paragraph' | 'markdown'
export type AnswerDepth = 'brief' | 'standard' | 'comprehensive'

// --- API Error Interface ---
export interface ApiError {
  message: string
  details?: string
  code?: string
  [key: string]: unknown
}

// --- Form Data Interface for Account Page ---
export interface AccountFormData {
  full_name: string
  email: string
  // Note: specific_model_id moved to localStorage (ai-config-storage)
  use_youtube_sources: boolean
  use_pdf_sources: boolean
  use_paper_sources: boolean
  use_website_sources: boolean
  use_book_sources: boolean
  use_image_sources: boolean
  preferred_answer_format: AnswerFormat
  preferred_answer_depth: AnswerDepth
  include_code_snippets: boolean
  include_latex_formulas: boolean
  custom_formatting_instructions: string
} 