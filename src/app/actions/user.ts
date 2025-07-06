'use server'

import { createClient } from '@/utils/supabase/server'
import { type User } from '@supabase/supabase-js'

// Default model ID for new users
const DEFAULT_GROQ_MODEL_ID = 'llama-3.1-8b-instant'

/**
 * Creates default user preferences for a new user
 * @param userId The user ID to create preferences for
 * @param supabase The Supabase client instance
 */
async function createDefaultUserPreferences(userId: string, supabase: any) {
  console.log('Creating default user preferences for user:', userId)
  
  const defaultPreferences = {
    user_id: userId,
    specific_model_id: DEFAULT_GROQ_MODEL_ID,
    preferred_model: 'groq',
    use_youtube_sources: true,
    use_pdf_sources: true,
    use_paper_sources: true,
    use_website_sources: true,
    use_book_sources: false,
    use_image_sources: true,
    preferred_answer_format: 'markdown',
    preferred_answer_depth: 'standard',
    include_code_snippets: true,
    include_latex_formulas: false,
    custom_formatting_instructions: null,
    theme: 'system',
    email_notifications: true,
  }

  const { error: preferencesError } = await supabase
    .from('user_preferences')
    .insert(defaultPreferences)

  if (preferencesError) {
    console.error('Error creating default user preferences:', preferencesError)
    return { error: preferencesError }
  }

  console.log('Default user preferences created successfully for user:', userId)
  return { error: null }
}

/**
 * Creates a profile for a new user if one doesn't already exist.
 * This is called after a user signs in to ensure that every user has a profile record.
 * Note: User preferences are automatically created by the database trigger handle_new_user.
 * This function is mainly for edge cases where the trigger might not have fired.
 * @param user The user object from Supabase Auth.
 * @returns An object containing the new or existing profile data, or an error.
 */
export async function createProfileForUser(user: User) {
  if (!user) {
    return { error: { message: 'User not provided' } }
  }

  const supabase = await createClient()

  // First, check if a profile already exists.
  const { data: existingProfile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError && profileError.code !== 'PGRST116') {
    console.error('Error checking existing profile:', profileError)
    return { error: { message: 'Failed to check existing profile' } }
  }

  if (existingProfile) {
    console.log('Profile already exists for user:', user.id)
    return { data: existingProfile }
  }

  // If no profile exists, create one
  // Note: This should rarely happen as the database trigger should handle this
  const { data: newProfile, error: insertError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      full_name: user.user_metadata?.full_name || null,
      avatar_url: user.user_metadata?.avatar_url || null,
      email: user.email || null,
    })
    .select()
    .single()

  if (insertError) {
    console.error('Error creating profile:', insertError)
    return { error: { message: 'Failed to create profile' } }
  }

  console.log('Profile created successfully for user:', user.id)
  return { data: newProfile }
}

/**
 * Ensures user preferences exist for a user, creating them if they don't
 * This can be called from other parts of the application
 * @param userId The user ID to ensure preferences for
 */
export async function ensureUserPreferences(userId: string) {
  if (!userId) {
    return { error: { message: 'User ID not provided' } }
  }

  const supabase = await createClient()

  // Check if preferences already exist
  const { data: existingPreferences } = await supabase
    .from('user_preferences')
    .select('user_id')
    .eq('user_id', userId)
    .single()

  if (existingPreferences) {
    return { error: null, message: 'Preferences already exist' }
  }

  // Create default preferences
  return await createDefaultUserPreferences(userId, supabase)
} 