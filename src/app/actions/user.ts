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
 * This is called after a user signs in, ensuring that every user has a profile record.
 * Also creates default user preferences.
 * @param user The user object from Supabase Auth.
 * @returns An object containing the new or existing profile data, or an error.
 */
export async function createProfileForUser(user: User) {
  if (!user) {
    return { error: { message: 'User not provided' } }
  }

  const supabase = await createClient()

  // First, check if a profile already exists.
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (existingProfile) {
    console.log('Profile already exists for user:', user.id)
    
    // Check if user preferences exist, create if they don't
    const { data: existingPreferences } = await supabase
      .from('user_preferences')
      .select('user_id')
      .eq('user_id', user.id)
      .single()

    if (!existingPreferences) {
      console.log('Creating missing user preferences for existing user:', user.id)
      await createDefaultUserPreferences(user.id, supabase)
    }

    // Return the full profile
    const { data: fullProfile, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    return { data: fullProfile, error }
  }

  console.log('No profile found for user, creating one:', user.id)

  // Extract metadata, providing sensible defaults.
  const fullName =
    user.user_metadata?.full_name ??
    (user.user_metadata?.first_name && user.user_metadata?.last_name
      ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`.trim()
      : user.email?.split('@')[0]) ??
    'New User'
  
  const username = 
    user.user_metadata?.username ?? 
    user.email?.split('@')[0] ?? 
    `user-${Date.now()}`

  // Create the new profile.
  const { data: newProfile, error } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      email: user.email,
      full_name: fullName,
      username: username,
      avatar_url: user.user_metadata?.avatar_url ?? null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating profile in server action:', error)
    return { data: null, error }
  }

  console.log('Profile created successfully:', newProfile)

  // Create default user preferences for the new user
  const preferencesResult = await createDefaultUserPreferences(user.id, supabase)
  if (preferencesResult.error) {
    console.error('Failed to create default preferences for new user:', user.id)
    // Don't fail the entire operation, just log the error
  }

  return { data: newProfile, error: null }
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