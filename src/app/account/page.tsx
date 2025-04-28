'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient, User } from '@supabase/auth-helpers-nextjs';
import { motion } from 'framer-motion';
import { DemoButton, AnswerDepthSliderSimple } from '../components/ui';
import Image from 'next/image';

// --- Define Groq Model Structure and List ---
interface GroqModel {
  id: string;
  name: string; // User-friendly name
  rpm: number; // Requests Per Minute
  notes?: string; // Optional notes about the model's capabilities
}

const availableGroqModels: GroqModel[] = [
  // Curated list of high-performance models for different use cases
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', rpm: 750, notes: 'Fastest for general text' },
  { id: 'gemma2-9b-it', name: 'Gemma2 9B Instruct', rpm: 500, notes: 'Excels in code/math, low resource' },
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', rpm: 276, notes: 'Fastest large model, 8 languages' },
  { id: 'whisper-large-v3-turbo', name: 'Whisper Large V3 Turbo', rpm: 600, notes: 'Fastest Whisper variant for speech-to-text' },
  { id: 'llama-guard-3-8b', name: 'Llama Guard 3 8B', rpm: 500, notes: 'Real-time content filtering' },
];
// ----------------------------------------------

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  email: string;
  custom_api_key: string | null;
}

// Separate interface for preferences
interface UserPreferences {
  user_id: string; // Foreign key to profiles.id
  specific_model_id: string | null;
  use_youtube_sources?: boolean; // Optional as they might not exist yet
  use_pdf_sources?: boolean;
  use_paper_sources?: boolean;
  use_website_sources?: boolean;
  use_book_sources?: boolean;
  use_expert_opinion_sources?: boolean;
  preferred_answer_format?: AnswerFormat;
  preferred_answer_depth?: AnswerDepth;
  include_code_snippets?: boolean; // Whether to include code examples in answers
  include_latex_formulas?: boolean; // Whether to include LaTeX formulas in answers
  custom_formatting_instructions?: string | null;
  theme?: string; // Include existing fields
  email_notifications?: boolean;
}

const DEFAULT_GROQ_MODEL_ID = 'llama-3.1-8b-instant';
// const DEFAULT_ANSWER_PROMPT = ... [REMOVED as prompt is now structured]

// Define types for new preferences
type AnswerFormat = 'bullet_points' | 'numbered_lists' | 'table' | 'paragraph' | 'markdown';
type AnswerDepth = 'brief' | 'standard' | 'comprehensive';

// Define a generic error type
interface ApiError {
  message: string;
  details?: string;
  code?: string;
  [key: string]: unknown;
}

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState('personal');
  const [user, setUser] = useState<User | null>(null);
  // profile state is used in saveChanges, saveApiKey functions, and profile display
  const [profile, setProfile] = useState<UserProfile | null>(null);
  // preferences state is used in saveChanges function - needed for state management
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingApiKey, setSavingApiKey] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Effect to initialize cursor position
  useEffect(() => {
    // Wait for DOM to be ready
    setTimeout(() => {
      const activeTabElement = document.querySelector(`[data-tab="${activeTab}"]`) as HTMLElement;
      if (activeTabElement) {
        const cursor = document.querySelector('.nav-cursor') as HTMLElement;
        if (cursor) {
          cursor.style.width = `${activeTabElement.getBoundingClientRect().width}px`;
          cursor.style.left = `${activeTabElement.offsetLeft}px`;
          cursor.style.opacity = '1';
        }
      }
    }, 100);
  }, [activeTab]);

  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    specific_model_id: DEFAULT_GROQ_MODEL_ID,
    // answer_generation_prompt: DEFAULT_ANSWER_PROMPT, // [REMOVED]

    // Initialize new preferences with defaults
    use_youtube_sources: true,
    use_pdf_sources: true,
    use_paper_sources: true,
    use_website_sources: true,
    use_book_sources: false, // Default off for less common sources
    use_expert_opinion_sources: false, // Default off
    preferred_answer_format: 'markdown' as AnswerFormat, // Default format
    preferred_answer_depth: 'standard' as AnswerDepth, // Default depth
    include_code_snippets: true, // Default to including code snippets
    include_latex_formulas: false, // Default to not including LaTeX formulas (experimental)
    custom_formatting_instructions: '',
  });

  const [apiKeyInput, setApiKeyInput] = useState('');

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/signin');
        return;
      }

      setUser(session.user);

      // Fetch Profile Data (name, username, api key)
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('full_name, username, avatar_url, custom_api_key') // Added avatar_url
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      }

      // Fetch Preferences Data (model, answer prefs)
      const { data: preferencesData, error: prefError } = await supabase
        .from('user_preferences')
        .select('*') // Select all preference fields
        .eq('user_id', session.user.id)
        .maybeSingle(); // Use maybeSingle as it might not exist

      if (prefError) {
        console.error('Error fetching preferences:', prefError);
      }

      if (profileData) {
        // Combine fetched data with session info, ensure all UserProfile fields are present
        setProfile({
            id: session.user.id,
            email: session.user.email || '',
            full_name: profileData.full_name,
            username: profileData.username,
            avatar_url: profileData.avatar_url, // Make sure avatar_url is included
            custom_api_key: profileData.custom_api_key
        });
        setFormData(prev => ({
          ...prev, // Keep existing preferences state
          full_name: profileData.full_name || '',
          username: profileData.username || '',
          email: session.user.email || '', // Email from session
        }));
        setApiKeyInput(profileData.custom_api_key || '');
      } else if (session.user.email) {
        // Profile doesn't exist, but we have email from session
        setFormData(prev => ({ ...prev, email: session.user.email! }));
      }

      if (preferencesData) {
        setPreferences(preferencesData); // Store raw preferences
        // Update form data with fetched preferences, using defaults if needed
        setFormData(prev => ({
          ...prev, // Keep profile info
          specific_model_id: preferencesData.specific_model_id || DEFAULT_GROQ_MODEL_ID,
          use_youtube_sources: preferencesData.use_youtube_sources ?? true,
          use_pdf_sources: preferencesData.use_pdf_sources ?? true,
          use_paper_sources: preferencesData.use_paper_sources ?? true,
          use_website_sources: preferencesData.use_website_sources ?? true,
          use_book_sources: preferencesData.use_book_sources ?? false,
          use_expert_opinion_sources: preferencesData.use_expert_opinion_sources ?? false,
          preferred_answer_format: (preferencesData.preferred_answer_format || 'markdown') as AnswerFormat,
          preferred_answer_depth: (preferencesData.preferred_answer_depth || 'standard') as AnswerDepth,
          include_code_snippets: preferencesData.include_code_snippets ?? true,
          include_latex_formulas: preferencesData.include_latex_formulas ?? false,
          custom_formatting_instructions: preferencesData.custom_formatting_instructions || '',
        }));
      } else {
        // Preferences don't exist, form data already has defaults
        setPreferences(null);
      }

      setLoading(false);
    };

    checkUser();
  }, [supabase, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { // Added HTMLTextAreaElement
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (message.text) setMessage({ type: '', text: '' });
  };

  const handleApiKeyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKeyInput(e.target.value);
    if (message.text) setMessage({ type: '', text: '' });
  };

  // Specific handler for checkbox/toggle switches
  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
    if (message.text) setMessage({ type: '', text: '' });
  };

  // Specific handler for answer depth slider
  const handleAnswerDepthChange = (value: number) => {
    let depth: AnswerDepth = 'standard';
    if (value === 1) depth = 'brief';
    else if (value === 3) depth = 'comprehensive';

    setFormData(prev => ({
      ...prev,
      preferred_answer_depth: depth
    }));
    if (message.text) setMessage({ type: '', text: '' });
  };

  // Saves Full Name, Username (to profiles) AND Model/Answer Prefs (to user_preferences)
  const saveChanges = async () => {
    if (!user) {
      console.error('No user found. User must be authenticated to save changes.');
      setMessage({ type: 'error', text: 'You must be signed in to save changes.' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    // Log the current user and form data for debugging
    console.log('Current user:', user);
    console.log('Form data to save:', formData);

    // Destructure all fields from the combined form data
    const {
      full_name,
      username,
      specific_model_id,
      use_youtube_sources,
      use_pdf_sources,
      use_paper_sources,
      use_website_sources,
      use_book_sources,
      use_expert_opinion_sources,
      preferred_answer_format,
      preferred_answer_depth,
      include_code_snippets,
      include_latex_formulas,
      custom_formatting_instructions
    } = formData;

    try {
      // 1. Update profile table (full_name, username)
      console.log('Updating profile for user ID:', user.id);
      const { data: profileData, error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          full_name,
          username,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select();

      if (profileUpdateError) {
        console.error('Profile update error:', profileUpdateError);
        throw profileUpdateError;
      }

      console.log('Profile updated successfully:', profileData);

      // 2. Upsert user_preferences table (model, answer prefs)
      console.log('Upserting preferences for user ID:', user.id);

      // Create the preferences object
      const preferencesData = {
        user_id: user.id as string, // Make sure user_id is included for upsert
        specific_model_id,
        preferred_model: 'groq', // Keep setting this for potential legacy use
        use_youtube_sources,
        use_pdf_sources,
        use_paper_sources,
        use_website_sources,
        use_book_sources,
        use_expert_opinion_sources,
        preferred_answer_format,
        preferred_answer_depth,
        include_code_snippets,
        include_latex_formulas,
        custom_formatting_instructions,
        updated_at: new Date().toISOString(), // Update timestamp here too
      };

      console.log('Preferences data to upsert:', preferencesData);

      const { data: upsertedData, error: preferencesUpsertError } = await supabase
        .from('user_preferences')
        .upsert(preferencesData, {
           onConflict: 'user_id' // Specify the conflict column for upsert
        })
        .select();

      if (preferencesUpsertError) {
        console.error('Preferences upsert error:', preferencesUpsertError);
        throw preferencesUpsertError;
      }

      console.log('Preferences upserted successfully:', upsertedData);

      console.log('All database operations completed successfully');
      setMessage({ type: 'success', text: 'Preferences saved successfully.' });

      // Update local state after successful saves
      setProfile(prev => {
        if (!prev) return null;
        const updatedProfile = { ...prev, full_name, username };
        console.log('Updated profile state:', updatedProfile);
        return updatedProfile;
      });

      setPreferences(prev => {
        // Reconstruct preferences state from formData
        const updatedPreferences = {
          ...(prev || { user_id: user.id as string }), // Keep existing fields like theme if they were loaded
          specific_model_id,
          use_youtube_sources,
          use_pdf_sources,
          use_paper_sources,
          use_website_sources,
          use_book_sources,
          use_expert_opinion_sources,
          preferred_answer_format,
          preferred_answer_depth,
          include_code_snippets,
          include_latex_formulas,
          custom_formatting_instructions,
        };
        console.log('Updated preferences state:', updatedPreferences);
        return updatedPreferences;
      });

      setTimeout(() => setMessage({ type: '', text: '' }), 3000);

    } catch (error) {
      const err = error as ApiError;
      console.error('Error updating profile/preferences:', err);
      console.log('Error details:', JSON.stringify(err, null, 2));
      setMessage({ type: 'error', text: err.message || 'Failed to save preferences. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  // Saves only the Custom API Key (Groq Key) - Stays targeting profiles table
  const saveApiKey = async () => {
    if (!user) return;
    setSavingApiKey(true);
    setMessage({ type: '', text: '' });

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          custom_api_key: apiKeyInput.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'API Key saved successfully.' });

      setProfile(prev => {
        if (!prev) return null;
        return { ...prev, custom_api_key: apiKeyInput.trim() || null };
      });

      setTimeout(() => setMessage({ type: '', text: '' }), 3000);

    } catch (error) {
      const err = error as ApiError;
      console.error('Error saving API key:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to save API key. Please try again.' });
    } finally {
      setSavingApiKey(false);
    }
  };

  // Helper to find model details by ID
  const getSelectedModelDetails = () => {
    return availableGroqModels.find(model => model.id === formData.specific_model_id);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 dark:border-purple-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your account...</p>
        </div>
      </div>
    );
  }

  const renderSaveChangesButton = () => {
    return (
      <div className="mt-8 pt-5 border-t border-gray-200 dark:border-gray-800 flex justify-end">
        <DemoButton
          onClick={saveChanges}
          isLoading={saving}
        >
          Save Changes
        </DemoButton>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black bg-gradient-to-br from-white to-gray-50 dark:from-black dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Content Container */}
        <div className="flex flex-col">
          {/* Left Side Navigation */}
          <div className="w-full flex-shrink-0 mb-8">
            <h2 className="text-2xl font-light text-gray-900 dark:text-white mb-6">Account</h2>
            <nav className="relative">
              <ul
                className="relative flex w-fit rounded-full border border-gray-200 dark:border-gray-700 bg-white/20 dark:bg-black/20 backdrop-blur-sm p-1"
                onMouseLeave={() => {
                  // Reset cursor to active tab position when mouse leaves
                  const activeTabElement = document.querySelector(`[data-tab="${activeTab}"]`) as HTMLElement;
                  if (activeTabElement) {
                    const cursor = document.querySelector('.nav-cursor') as HTMLElement;
                    if (cursor) {
                      cursor.style.width = `${activeTabElement.getBoundingClientRect().width}px`;
                      cursor.style.left = `${activeTabElement.offsetLeft}px`;
                      cursor.style.opacity = '1';
                    }
                  }
                }}
              >
                {/* Animated Background Cursor */}
                <motion.li
                  className="nav-cursor absolute z-0 h-9 rounded-full bg-gray-100 dark:bg-gray-800"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30
                  }}
                />

                {/* Personal Information Tab */}
                <li
                  data-tab="personal"
                  className="relative z-10 block cursor-pointer"
                  onMouseEnter={(e) => {
                    // Only apply hover effect if this isn't the active tab
                    if (activeTab !== 'personal') {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const cursor = document.querySelector('.nav-cursor') as HTMLElement;
                      if (cursor) {
                        cursor.style.width = `${rect.width}px`;
                        cursor.style.left = `${e.currentTarget.offsetLeft}px`;
                        cursor.style.opacity = '1';
                      }
                    }
                  }}
                >
                  <button
                    onClick={(e) => {
                      setActiveTab('personal');
                      // Update cursor position immediately for smoother transition
                      const parentElement = e.currentTarget.parentElement as HTMLElement;
                      if (parentElement) {
                        const cursor = document.querySelector('.nav-cursor') as HTMLElement;
                        if (cursor) {
                          cursor.style.width = `${parentElement.getBoundingClientRect().width}px`;
                          cursor.style.left = `${parentElement.offsetLeft}px`;
                          cursor.style.opacity = '1';
                        }
                      }
                    }}
                    className={`px-4 py-2 text-sm font-medium block ${activeTab === 'personal' ? 'text-gray-800 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'}`}
                  >
                    Personal
                  </button>
                </li>

                {/* AI Settings Tab */}
                <li
                  data-tab="ai-settings"
                  className="relative z-10 block cursor-pointer"
                  onMouseEnter={(e) => {
                    // Only apply hover effect if this isn't the active tab
                    if (activeTab !== 'ai-settings') {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const cursor = document.querySelector('.nav-cursor') as HTMLElement;
                      if (cursor) {
                        cursor.style.width = `${rect.width}px`;
                        cursor.style.left = `${e.currentTarget.offsetLeft}px`;
                        cursor.style.opacity = '1';
                      }
                    }
                  }}
                >
                  <button
                    onClick={(e) => {
                      setActiveTab('ai-settings');
                      // Update cursor position immediately for smoother transition
                      const parentElement = e.currentTarget.parentElement as HTMLElement;
                      if (parentElement) {
                        const cursor = document.querySelector('.nav-cursor') as HTMLElement;
                        if (cursor) {
                          cursor.style.width = `${parentElement.getBoundingClientRect().width}px`;
                          cursor.style.left = `${parentElement.offsetLeft}px`;
                          cursor.style.opacity = '1';
                        }
                      }
                    }}
                    className={`px-4 py-2 text-sm font-medium block ${activeTab === 'ai-settings' ? 'text-gray-800 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'}`}
                  >
                    AI Settings
                  </button>
                </li>

                {/* Answer Preferences Tab */}
                <li
                  data-tab="answer-preferences"
                  className="relative z-10 block cursor-pointer"
                  onMouseEnter={(e) => {
                    // Only apply hover effect if this isn't the active tab
                    if (activeTab !== 'answer-preferences') {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const cursor = document.querySelector('.nav-cursor') as HTMLElement;
                      if (cursor) {
                        cursor.style.width = `${rect.width}px`;
                        cursor.style.left = `${e.currentTarget.offsetLeft}px`;
                        cursor.style.opacity = '1';
                      }
                    }
                  }}
                >
                  <button
                    onClick={(e) => {
                      setActiveTab('answer-preferences');
                      // Update cursor position immediately for smoother transition
                      const parentElement = e.currentTarget.parentElement as HTMLElement;
                      if (parentElement) {
                        const cursor = document.querySelector('.nav-cursor') as HTMLElement;
                        if (cursor) {
                          cursor.style.width = `${parentElement.getBoundingClientRect().width}px`;
                          cursor.style.left = `${parentElement.offsetLeft}px`;
                          cursor.style.opacity = '1';
                        }
                      }
                    }}
                    className={`px-4 py-2 text-sm font-medium block ${activeTab === 'answer-preferences' ? 'text-gray-800 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'}`}
                  >
                    Answer Preferences
                  </button>
                </li>
              </ul>

              {/* No Tab Description */}
            </nav>
          </div>

          {/* Content Area */}
          <div className="w-full">
            {/* Message Display Area */}
            {message.text && (
              <div className={`mb-6 p-3 rounded-md text-sm ${
                message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700/50' :
                message.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700/50' :
                'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50'
              }`}>
                {message.text}
              </div>
            )}

            {/* Personal Information Section */}
            {activeTab === 'personal' && (
              <div className="flex gap-8">
                {/* Left Panel - Form */}
                <div className="flex-1 bg-white dark:bg-black/60 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Personal Information</h2>
                  <div className="space-y-6">
                    {/* Full Name Input */}
                    <div>
                      <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="full_name"
                        id="full_name"
                        value={formData.full_name}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-900 dark:text-white sm:text-sm shadow-sm"
                      />
                    </div>
                    {/* Username Input */}
                    <div>
                      <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Username
                      </label>
                      <input
                        type="text"
                        name="username"
                        id="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-900 dark:text-white sm:text-sm shadow-sm"
                      />
                    </div>
                    {/* Email Display (Disabled) */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        value={formData.email}
                        disabled
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 sm:text-sm bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed shadow-sm"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Email address cannot be changed. Contact support if you need to update your email.
                      </p>
                    </div>
                  </div>
                  {/* Save Button for Personal Info */}
                  {renderSaveChangesButton()}
                </div>

                {/* Right Panel - Profile Preview */}
                <div className="w-80 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-black/80 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center">
                  <div className="relative mb-6">
                    <div className="w-32 h-32 rounded-full bg-black dark:bg-white flex items-center justify-center overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg">
                      {profile?.avatar_url ? (
                        <Image
                          src={profile.avatar_url}
                          alt="Profile"
                          className="w-full h-full object-cover"
                          width={128}
                          height={128}
                        />
                      ) : (
                        <div className="text-4xl font-light text-white dark:text-black">
                          {formData.full_name ? formData.full_name.charAt(0).toUpperCase() : formData.username ? formData.username.charAt(0).toUpperCase() : '?'}
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-0 right-0 bg-white dark:bg-gray-800 rounded-full p-2 shadow-md border border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-50">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  </div>

                  <div className="text-center">
                    <h3 className="text-xl font-medium text-gray-900 dark:text-white">
                      {formData.full_name || 'Your Name'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      @{formData.username || 'username'}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
                      Profile picture upload coming soon
                    </p>
                  </div>
                </div>
              </div>
              )}

            {/* AI Settings Section (Groq Model & API Key) */}
            {activeTab === 'ai-settings' && (
              <div className="flex gap-8">
                {/* Left Panel - Settings Form */}
                <div className="flex-1 bg-white dark:bg-black/60 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">AI Settings</h2>
                  <div className="space-y-10">

                    {/* Groq Model Selection Sub-section */}
                    <section>
                       <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Groq Model Selection</h3>
                       <div className="space-y-2"> {/* Reduced spacing */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Groq AI Model
                            </label>

                            <div className="grid grid-cols-2 gap-3">
                              {availableGroqModels.filter(model => model.id !== 'whisper-large-v3-turbo').map((model) => {
                                // Define tags for each model
                                let tag = '';

                                if (model.id === 'llama-3.1-8b-instant') {
                                  tag = 'Fastest';
                                } else if (model.id === 'gemma2-9b-it') {
                                  tag = 'Code & Math';
                                } else if (model.id === 'llama-3.3-70b-versatile') {
                                  tag = 'General';
                                } else if (model.id === 'llama-guard-3-8b') {
                                  tag = 'Safety';
                                }

                                const isSelected = formData.specific_model_id === model.id;

                                return (
                                  <div
                                    key={model.id}
                                    className={`relative rounded-lg border-2 ${isSelected ? 'border-black dark:border-white' : 'border-gray-200 dark:border-gray-700'} p-4 cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors`}
                                    onClick={() => {
                                      setFormData(prev => ({
                                        ...prev,
                                        specific_model_id: model.id
                                      }));
                                    }}
                                  >
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white">{model.name}</h4>
                                        <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full border border-gray-800 dark:border-gray-200 text-gray-800 dark:text-gray-200 bg-transparent">
                                          {tag}
                                        </span>
                                      </div>
                                      <div className={`w-5 h-5 rounded-full border ${isSelected ? 'border-black dark:border-white bg-black dark:bg-white' : 'border-gray-300 dark:border-gray-600'} flex items-center justify-center`}>
                                        {isSelected && (
                                          <svg className="w-3 h-3 text-white dark:text-black" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                          </svg>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                              Select a model for generating answers. Model details will appear in the preview panel.
                            </p>
                          </div>
                       </div>
                       {/* Save Button for AI Settings (includes model) */}
                       {renderSaveChangesButton()}
                    </section>

                    {/* Groq API Key Sub-section */}
                    <section className="pt-8 border-t border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Groq API Key</h3>
                      <div className="space-y-6">
                        <div>
                          <label htmlFor="custom_api_key" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Your Groq API Key
                          </label>
                          <input
                            type="password"
                            name="custom_api_key"
                            id="custom_api_key"
                            value={apiKeyInput}
                            onChange={handleApiKeyInputChange}
                            className="mt-1 block w-full rounded-md border-2 border-gray-300 dark:border-gray-700 focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-900 dark:text-white sm:text-sm shadow-sm pl-3 py-2"
                            placeholder="Enter your Groq API key (starts with gsk_...)"
                            autoComplete="off"
                          />
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Provide your own API key from Groq to use the selected model. Your key is required for generation.
                          </p>
                        </div>

                        {/* Security Information Box */}
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md border border-yellow-200 dark:border-yellow-700/50">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-yellow-400 dark:text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Important Security Information</h4>
                              <div className="mt-2 text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                                <p>Your API key is stored securely in the database.</p>
                                <p>Using your own API key means any usage will be billed to your personal Groq account.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Save API Key Button */}
                      <div className="mt-8 pt-5 border-t border-gray-200 dark:border-gray-800 flex justify-end">
                        <DemoButton
                          onClick={saveApiKey}
                          isLoading={savingApiKey}
                        >
                          Save API Key
                        </DemoButton>
                      </div>
                    </section>
                  </div>
                </div>

                {/* Right Panel - Model Preview */}
                <div className="w-80 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-black/80 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Model Preview</h3>

                  {/* Model Information - Only show for selected model */}
                  {getSelectedModelDetails() && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                      <div className="mb-3">
                        <div className="flex items-center mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">{getSelectedModelDetails()?.name}</h4>
                          <span className="ml-2 inline-block px-2 py-0.5 text-xs font-medium rounded-full border border-gray-800 dark:border-gray-200 text-gray-800 dark:text-gray-200 bg-transparent">
                            {getSelectedModelDetails()?.id === 'llama-3.1-8b-instant' ? 'Fastest' :
                             getSelectedModelDetails()?.id === 'gemma2-9b-it' ? 'Code/Math' :
                             getSelectedModelDetails()?.id === 'llama-3.3-70b-versatile' ? 'General' :
                             getSelectedModelDetails()?.id === 'llama-guard-3-8b' ? 'Safety' : ''}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                          {getSelectedModelDetails()?.notes}
                        </p>
                      </div>

                    <div className="mb-4">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        <span className="font-medium">Model Statistics:</span> Performance and rate limits for the selected model
                      </p>

                      <div className="overflow-x-auto">
                        <table className="min-w-full text-xs border-collapse">
                          <thead>
                            <tr className="bg-gray-100 dark:bg-gray-700">
                              <th className="py-2 px-3 text-left font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">RPM</th>
                              <th className="py-2 px-3 text-left font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">TPM</th>
                              <th className="py-2 px-3 text-left font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">TPD</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="bg-white dark:bg-gray-800">
                              <td className="py-2 px-3 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                                {getSelectedModelDetails()?.rpm || '-'}
                              </td>
                              <td className="py-2 px-3 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                                {!getSelectedModelDetails() ? '-' :
                                 getSelectedModelDetails()?.id === 'whisper-large-v3-turbo' ? '-' :
                                 getSelectedModelDetails()?.id === 'llama-3.1-8b-instant' || getSelectedModelDetails()?.id === 'llama-3.3-70b-versatile' ? '6,000' : '15,000'}
                              </td>
                              <td className="py-2 px-3 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                                {!getSelectedModelDetails() ? '-' :
                                 getSelectedModelDetails()?.id === 'whisper-large-v3-turbo' ? '-' :
                                 getSelectedModelDetails()?.id === 'llama-3.3-70b-versatile' ? '100,000' : '500,000'}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Bar chart visualization */}
                      {getSelectedModelDetails() && getSelectedModelDetails()?.id !== 'whisper-large-v3-turbo' && (
                        <div className="mt-4">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tokens Per Day Capacity</p>
                          <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${getSelectedModelDetails()?.id === 'llama-3.3-70b-versatile' ? 'bg-amber-500 dark:bg-amber-600' : 'bg-green-500 dark:bg-green-600'}`}
                              style={{ width: `${getSelectedModelDetails()?.id === 'llama-3.3-70b-versatile' ? '20%' : '100%'}` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <span>0</span>
                            <span>250K</span>
                            <span>500K</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <p><span className="font-medium">RPM:</span> Requests per minute</p>
                      <p><span className="font-medium">TPM:</span> Tokens per minute</p>
                      <p><span className="font-medium">TPD:</span> Tokens per day</p>
                    </div>
                  </div>
                  )}

                  {/* API Status */}
                  <div className="mt-auto">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">API Status</h4>
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${apiKeyInput ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {apiKeyInput ? 'API Key Provided' : 'No API Key'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {apiKeyInput
                        ? 'Your API key is set. You can generate answers with the selected model.'
                        : 'Please provide a Groq API key to use this model for generating answers.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Answer Preferences Section */}
            {activeTab === 'answer-preferences' && (
              <div className="flex gap-8">
                {/* Left Panel - Preferences Form (60%) */}
                <div className="w-3/5 bg-white dark:bg-black/60 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Answer Preferences</h2>
                  <div className="space-y-8">
                    {/* Content Sources */}
                    <section>
                      <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Content Sources</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Select which types of supplementary resources should be considered when generating answers.</p>
                      <div className="grid grid-cols-3 gap-3 mt-2">
                        {[
                          { id: 'use_youtube_sources', name: 'YouTube', tag: 'Relevant videos', description: 'Videos based on keywords' },
                          { id: 'use_pdf_sources', name: 'PDF', tag: 'Documents', description: 'Notes from Reddit, blogs, drives' },
                          { id: 'use_paper_sources', name: 'Papers', tag: 'Research', description: 'Academic research papers' },
                          { id: 'use_website_sources', name: 'Websites', tag: 'Articles', description: 'Relevant web articles' },
                          { id: 'use_book_sources', name: 'Books', tag: 'References', description: 'Amazon book links' },
                          { id: 'use_expert_opinion_sources', name: 'Expert Opinion', tag: 'Coming Soon', description: 'Twitter citations to concepts' }
                        ].map((source) => {
                          const isSelected = formData[source.id as keyof typeof formData] as boolean;
                          const isComingSoon = source.id === 'use_expert_opinion_sources';
                          return (
                            <div
                              key={source.id}
                              className={`relative rounded-lg border-2 ${isSelected ? 'border-black dark:border-white' : 'border-gray-200 dark:border-gray-700'} p-4 ${isComingSoon ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:border-gray-400 dark:hover:border-gray-500'} transition-colors`}
                              onClick={() => {
                                if (!isComingSoon) {
                                  setFormData(prev => ({
                                    ...prev,
                                    [source.id]: !isSelected
                                  }));
                                  if (message.text) setMessage({ type: '', text: '' });
                                }
                              }}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium text-gray-900 dark:text-white">{source.name}</h4>
                                  <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full border ${isComingSoon ? 'border-amber-500 dark:border-amber-400 text-amber-600 dark:text-amber-400' : 'border-gray-800 dark:border-gray-200 text-gray-800 dark:text-gray-200'} bg-transparent`}>
                                    {source.tag}
                                  </span>
                                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{source.description}</p>
                                </div>
                                <div className={`w-5 h-5 rounded-full border ${isSelected ? 'border-black dark:border-white bg-black dark:bg-white' : 'border-gray-300 dark:border-gray-600'} flex items-center justify-center`}>
                                  {isSelected && (
                                    <svg className="w-3 h-3 text-white dark:text-black" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                    </svg>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                        Select the sources you want to include in your answers. <span className="text-amber-600 dark:text-amber-400">Coming Soon</span> features will be available in future updates.
                      </p>
                    </section>

                    {/* Answer Format */}
                    <section className="pt-6 border-t border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Answer Format</h3>
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Format Style</label>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          {[
                            { id: 'markdown', name: 'Markdown', tag: 'Default' },
                            { id: 'bullet_points', name: 'Bullet Points', tag: 'Concise' },
                            { id: 'table', name: 'Table Format', tag: 'Experimental' },
                            { id: 'paragraph', name: 'Paragraph Style', tag: 'Narrative' }
                          ].map((format) => {
                            const isSelected = formData.preferred_answer_format === format.id;
                            return (
                              <div
                                key={format.id}
                                className={`relative rounded-lg border-2 ${isSelected ? 'border-black dark:border-white' : 'border-gray-200 dark:border-gray-700'} p-4 cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors`}
                                onClick={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    preferred_answer_format: format.id as AnswerFormat
                                  }));
                                  if (message.text) setMessage({ type: '', text: '' });
                                }}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white">{format.name}</h4>
                                    <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full border border-gray-800 dark:border-gray-200 text-gray-800 dark:text-gray-200 bg-transparent">
                                      {format.tag}
                                    </span>
                                  </div>
                                  <div className={`w-5 h-5 rounded-full border ${isSelected ? 'border-black dark:border-white bg-black dark:bg-white' : 'border-gray-300 dark:border-gray-600'} flex items-center justify-center`}>
                                    {isSelected && (
                                      <svg className="w-3 h-3 text-white dark:text-black" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                      </svg>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                          Choose how you'd like answers to be structured. Markdown is recommended for most cases.
                        </p>
                      </div>

                      {/* Answer Add-ons Section */}
                      <div className="mb-6">
                        <h4 className="text-base font-medium text-gray-800 dark:text-gray-200 mb-3">Answer Add-ons</h4>

                        {/* Code Snippets Toggle */}
                        <div className="mb-4 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between">
                            <label htmlFor="include_code_snippets" className="block text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                              Include Code Snippets
                            </label>
                            <label className="relative inline-block w-10 mr-2 align-middle select-none cursor-pointer" htmlFor="include_code_snippets">
                              <input
                                type="checkbox"
                                id="include_code_snippets"
                                name="include_code_snippets"
                                checked={formData.include_code_snippets}
                                onChange={handleSwitchChange}
                                className="sr-only"
                              />
                              <div className={`block w-10 h-6 rounded-full transition-colors ${formData.include_code_snippets ? 'bg-black dark:bg-black' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                              <div className={`absolute left-1 top-1 w-4 h-4 rounded-full transition-transform bg-white transform ${formData.include_code_snippets ? 'translate-x-4' : 'translate-x-0'}`}></div>
                            </label>
                          </div>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            When enabled, answers will include code examples for programming-related questions. Disable to focus on theory and save tokens.
                          </p>
                        </div>

                        {/* LaTeX Formulas Toggle */}
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between">
                            <label htmlFor="include_latex_formulas" className="block text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                              Include LaTeX Formulas <span className="text-xs text-amber-600 dark:text-amber-400 ml-1">(Experimental)</span>
                            </label>
                            <label className="relative inline-block w-10 mr-2 align-middle select-none cursor-pointer" htmlFor="include_latex_formulas">
                              <input
                                type="checkbox"
                                id="include_latex_formulas"
                                name="include_latex_formulas"
                                checked={formData.include_latex_formulas || false}
                                onChange={handleSwitchChange}
                                className="sr-only"
                              />
                              <div className={`block w-10 h-6 rounded-full transition-colors ${(formData.include_latex_formulas || false) ? 'bg-black dark:bg-black' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                              <div className={`absolute left-1 top-1 w-4 h-4 rounded-full transition-transform bg-white transform ${(formData.include_latex_formulas || false) ? 'translate-x-4' : 'translate-x-0'}`}></div>
                            </label>
                          </div>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            When enabled, mathematical formulas will be rendered using LaTeX notation. Useful for math, physics, and engineering questions.
                          </p>
                        </div>
                      </div>

                      {/* Answer Depth */}
                      <div className="mb-6">
                        <AnswerDepthSliderSimple
                          value={formData.preferred_answer_depth === 'brief' ? 1 : formData.preferred_answer_depth === 'standard' ? 2 : 3}
                          onChange={handleAnswerDepthChange}
                          className="mt-2"
                        />
                      </div>
                    </section>

                    {/* Custom Instructions */}
                    <section className="pt-6 border-t border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Custom Instructions</h3>
                      <div className="mb-6">
                        <label htmlFor="custom_formatting_instructions" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Additional Formatting Instructions
                        </label>
                        <textarea
                          id="custom_formatting_instructions"
                          name="custom_formatting_instructions"
                          rows={3}
                          value={formData.custom_formatting_instructions || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-2 border-gray-300 dark:border-gray-700 focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-900 dark:text-white sm:text-sm shadow-sm px-4 py-3"
                          placeholder="e.g., Start with a summary. Use bold for key terms."
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Add any specific instructions for how you'd like answers to be formatted or structured.
                        </p>
                      </div>
                    </section>

                    {/* Save Button */}
                    {renderSaveChangesButton()}
                  </div>
                </div>

                {/* Right Panel - Answer Preview (40%) */}
                <div className="w-2/5 bg-gradient-to-br from-gray-50 to-white dark:from-black/90 dark:to-black rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Answer Preview</h3>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 mb-6 overflow-auto max-h-[500px]">
                    <div className="prose dark:prose-invert prose-sm max-w-none">
                      {formData.preferred_answer_format === 'markdown' && (
                        <div>
                          <h4>Binary Search Tree Implementation</h4>
                          <p>A Binary Search Tree (BST) is a data structure where each node has at most two children:</p>
                          <ul>
                            <li>Left child contains value less than the node</li>
                            <li>Right child contains value greater than the node</li>
                          </ul>
                          <p>Here's a basic implementation in JavaScript:</p>
                          <pre className="bg-gray-100 dark:bg-gray-900 p-2 rounded">
                            <code className="text-xs">{`class Node {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
  }
}`}</code>
                          </pre>
                        </div>
                      )}

                      {formData.preferred_answer_format === 'bullet_points' && (
                        <div>
                          <p><strong>Binary Search Tree Implementation:</strong></p>
                          <ul>
                            <li>BST is a tree data structure with specific ordering properties</li>
                            <li>Each node has at most two children (left and right)</li>
                            <li>Left subtree contains values less than the node's value</li>
                            <li>Right subtree contains values greater than the node's value</li>
                            <li>Implementation requires a Node class with value and pointers</li>
                            <li>Common operations: insert, search, delete, traverse</li>
                          </ul>
                        </div>
                      )}

                      {/* Numbered lists option removed */}

                      {formData.preferred_answer_format === 'paragraph' && (
                        <div>
                          <p>A Binary Search Tree (BST) is a fundamental data structure in computer science that maintains an ordered collection of values. Each node in a BST contains a value and references to two child nodes. The left child contains values less than the parent node, while the right child contains values greater than the parent node. This ordering property makes BSTs efficient for operations like searching, insertion, and deletion, typically with O(log n) time complexity in balanced trees. Implementation involves creating a Node class with value and child pointers, then building tree operations that maintain the BST property during modifications.</p>
                        </div>
                      )}

                      {formData.preferred_answer_format === 'table' && (
                        <div>
                          <p><strong>Binary Search Tree Operations</strong></p>
                          <div className="overflow-x-auto">
                            <table className="min-w-full border-collapse text-sm">
                              <thead>
                                <tr className="bg-gray-100 dark:bg-gray-800">
                                  <th className="border border-gray-300 dark:border-gray-700 px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Operation</th>
                                  <th className="border border-gray-300 dark:border-gray-700 px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Time Complexity</th>
                                  <th className="border border-gray-300 dark:border-gray-700 px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Description</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="bg-white dark:bg-gray-900">
                                  <td className="border border-gray-300 dark:border-gray-700 px-3 py-2 text-gray-700 dark:text-gray-300">Insert</td>
                                  <td className="border border-gray-300 dark:border-gray-700 px-3 py-2 text-gray-700 dark:text-gray-300">O(log n)</td>
                                  <td className="border border-gray-300 dark:border-gray-700 px-3 py-2 text-gray-700 dark:text-gray-300">Add new node</td>
                                </tr>
                                <tr className="bg-gray-50 dark:bg-gray-800/50">
                                  <td className="border border-gray-300 dark:border-gray-700 px-3 py-2 text-gray-700 dark:text-gray-300">Search</td>
                                  <td className="border border-gray-300 dark:border-gray-700 px-3 py-2 text-gray-700 dark:text-gray-300">O(log n)</td>
                                  <td className="border border-gray-300 dark:border-gray-700 px-3 py-2 text-gray-700 dark:text-gray-300">Find value</td>
                                </tr>
                                <tr className="bg-white dark:bg-gray-900">
                                  <td className="border border-gray-300 dark:border-gray-700 px-3 py-2 text-gray-700 dark:text-gray-300">Delete</td>
                                  <td className="border border-gray-300 dark:border-gray-700 px-3 py-2 text-gray-700 dark:text-gray-300">O(log n)</td>
                                  <td className="border border-gray-300 dark:border-gray-700 px-3 py-2 text-gray-700 dark:text-gray-300">Remove node</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-auto">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Settings</h4>
                    <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                      <p><span className="font-medium">Format:</span> {formData.preferred_answer_format.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                      <p><span className="font-medium">Depth:</span> {formData.preferred_answer_depth.charAt(0).toUpperCase() + formData.preferred_answer_depth.slice(1)}</p>
                      <p><span className="font-medium">Add-ons:</span>
                        {[formData.include_code_snippets ? 'Code Snippets' : null,
                          formData.include_latex_formulas ? 'LaTeX Formulas' : null]
                          .filter(Boolean)
                          .join(', ') || 'None'}
                      </p>
                      <p><span className="font-medium">Sources:</span> {(Object.keys(formData) as Array<keyof typeof formData>)
                        .filter(key => key.startsWith('use_') && formData[key as keyof typeof formData] === true)
                        .map(key => key.replace('use_','').replace('_sources','').replace('_', ' '))
                        .join(', ') || 'None selected'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
