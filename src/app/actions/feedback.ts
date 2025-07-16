'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { FeedbackFormData } from '@/types'

export async function submitFeedback(formData: FeedbackFormData) {
  const supabase = await createClient()

  try {
    // Insert the feedback data into the feedback table
    const { error } = await supabase
      .from('feedback')
      .insert([
        {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          message: formData.message,
          created_at: new Date().toISOString(),
        },
      ])

    if (error) {
      console.error('Error submitting feedback:', error)
      return { success: false, error: error.message }
    }

    // Revalidate the about page to reflect the changes
    revalidatePath('/about')
    
    return { success: true }
  } catch (error) {
    console.error('Error in submitFeedback:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    }
  }
}