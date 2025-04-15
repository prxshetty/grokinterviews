'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// --- Define Groq Model Structure and List ---
interface GroqModel {
  id: string;
  name: string; // User-friendly name
  rpm: number; // Requests Per Minute
}

const availableGroqModels: GroqModel[] = [
  // Extracted from user-provided chart, sorted roughly by capability/recency
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', rpm: 30 },
  { id: 'llama3-8b-8192', name: 'Llama 3 8B (8k context)', rpm: 30 },
  { id: 'gemma2-9b-it', name: 'Gemma2 9B Instruct', rpm: 30 },
  { id: 'llama-guard-3-8b', name: 'Llama Guard 3 8B', rpm: 30 },
  { id: 'allam-2-7b', name: 'Allam 2 7B', rpm: 30 },
  { id: 'llama-3.2-1b-preview', name: 'Llama 3.2 1B Preview', rpm: 30 },
  { id: 'llama-3.2-3b-preview', name: 'Llama 3.2 3B Preview', rpm: 30 },
  { id: 'mistral-saba-24b', name: 'Mistral Saba 24B', rpm: 30 },
  { id: 'qwen-qwq-32b', name: 'Qwen QWQ 32B', rpm: 30 },
  { id: 'deepseek-r1-distill-qwen-32b', name: 'DeepSeek R1 Distill Qwen 32B', rpm: 30 },
  { id: 'llama3-70b-8192', name: 'Llama 3 70B (8k context)', rpm: 30 },
  { id: 'llama-3.3-70b-specdec', name: 'Llama 3.3 70B Speculative', rpm: 30 },
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', rpm: 30 },
  { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill Llama 70B', rpm: 30 },
  { id: 'llama-3.2-11b-vision-preview', name: 'Llama 3.2 11B Vision Preview', rpm: 30 },
  { id: 'llama-3.2-90b-vision-preview', name: 'Llama 3.2 90B Vision Preview', rpm: 15 },
  { id: 'meta-llama/llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout 17B Instruct', rpm: 30 },
  { id: 'meta-llama/llama-4-maverick-17b-128e-instruct', name: 'Llama 4 Maverick 17B Instruct', rpm: 30 },
  // Note: Excluded deprecated/duplicate qwen models mentioned in user text if qwen-qwq-32b is the intended replacement.
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
  custom_formatting_instructions?: string | null;
  theme?: string; // Include existing fields
  email_notifications?: boolean;
}

const DEFAULT_GROQ_MODEL_ID = 'llama-3.1-8b-instant';
// const DEFAULT_ANSWER_PROMPT = ... [REMOVED as prompt is now structured]

// Define types for new preferences
type AnswerFormat = 'bullet_points' | 'numbered_lists' | 'table' | 'paragraph' | 'markdown';
type AnswerDepth = 'brief' | 'standard' | 'comprehensive';

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState('personal'); 
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingApiKey, setSavingApiKey] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const router = useRouter();
  const supabase = createClientComponentClient();

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
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, username, avatar_url, custom_api_key') // Added avatar_url
        .eq('id', session.user.id)
        .single();

      // Fetch Preferences Data (model, answer prefs)
      const { data: preferencesData, error: preferencesError } = await supabase
        .from('user_preferences')
        .select('*') // Select all preference fields
        .eq('user_id', session.user.id)
        .maybeSingle(); // Use maybeSingle as it might not exist
      
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

  // Specific handler for slider (range input)
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
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
    if (!user) return;
    
    setSaving(true);
    setMessage({ type: '', text: '' });
    
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
      custom_formatting_instructions
    } = formData;

    try {
      // 1. Update profile table (full_name, username)
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          full_name,
          username,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileUpdateError) throw profileUpdateError;

      // 2. Upsert user_preferences table (model, answer prefs)
      const { error: preferencesUpsertError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id, // Make sure user_id is included for upsert
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
          custom_formatting_instructions,
          updated_at: new Date().toISOString(), // Update timestamp here too
        }, { 
           onConflict: 'user_id' // Specify the conflict column for upsert
        });
      
      if (preferencesUpsertError) throw preferencesUpsertError;
      
      setMessage({ type: 'success', text: 'Preferences saved successfully.' });
      
      // Update local state after successful saves
      setProfile(prev => {
        if (!prev) return null;
        return { ...prev, full_name, username };
      });
      setPreferences(prev => ({
        // Reconstruct preferences state from formData
        ...(prev || { user_id: user.id }), // Keep existing fields like theme if they were loaded
        specific_model_id,
        use_youtube_sources,
        use_pdf_sources,
        use_paper_sources,
        use_website_sources,
        use_book_sources,
        use_expert_opinion_sources,
        preferred_answer_format,
        preferred_answer_depth,
        custom_formatting_instructions,
      }));

      setTimeout(() => setMessage({ type: '', text: '' }), 3000);

    } catch (error: any) {
      console.error('Error updating profile/preferences:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to save preferences. Please try again.' });
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

    } catch (error: any) {
      console.error('Error saving API key:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to save API key. Please try again.' });
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
        <button
          type="button"
          onClick={saveChanges}
          disabled={saving}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : 'Save Changes'}
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="md:flex md:gap-10 lg:gap-16">
          {/* Left Navigation */}
          <div className="md:w-64 flex-shrink-0 mb-8 md:mb-0 md:pt-6">
            <nav className="flex flex-col space-y-1">
                {/* Personal Information Button */}
                <button
                  onClick={() => setActiveTab('personal')}
                  className={`flex items-center px-3 py-2 text-sm font-medium w-full text-left rounded-md ${ 
                    activeTab === 'personal'
                      ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-l-4 border-purple-600 dark:border-purple-400' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Personal Information
                </button>
                
                {/* Preferences Button (Groq Model & API Key) */}
                <button
                  onClick={() => setActiveTab('preferences')}
                  className={`flex items-center px-3 py-2 text-sm font-medium w-full text-left rounded-md ${ 
                    activeTab === 'preferences'
                      ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-l-4 border-purple-600 dark:border-purple-400' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Preferences
                </button>
              </nav>
          </div>

          {/* Right Content Area */}
          <div className="flex-1">
            <div className="py-6">
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
                <div>
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
              )}

              {/* Preferences Section (Groq Model & API Key) */}
              {activeTab === 'preferences' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Preferences</h2>
                  <div className="space-y-10"> 
                    
                    {/* Groq Model Selection Sub-section */}
                    <section>
                       <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Groq Model Selection</h3>
                       <div className="space-y-2"> {/* Reduced spacing */}
                          <div>
                            <label htmlFor="specific_model_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Groq AI Model
                            </label>
                            <select
                              id="specific_model_id"
                              name="specific_model_id" // Ensure name matches state key
                              value={formData.specific_model_id}
                              onChange={handleInputChange} // Use the general handler
                              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-900 dark:text-white sm:text-sm shadow-sm"
                            >
                              {availableGroqModels.map((model) => (
                                <option key={model.id} value={model.id}>
                                  {model.name} ({model.id})
                                </option>
                              ))}
                            </select>
                            {/* Display RPM for selected model */}
                            {getSelectedModelDetails() && (
                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Rate Limit: {getSelectedModelDetails()?.rpm} Requests / Minute
                              </p>
                            )}
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              Select the specific Groq model for generating answers. Requires your Groq API key (below).
                            </p>
                          </div>
                       </div>
                       {/* Save Button for Preferences (includes model) */}
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
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-900 dark:text-white sm:text-sm shadow-sm"
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
                        <button
                          type="button"
                          onClick={saveApiKey}
                          disabled={savingApiKey}
                          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {savingApiKey ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Saving Key...
                            </>
                          ) : 'Save API Key'}
                        </button>
                      </div>
                    </section>

                    {/* NEW Answer Preferences Section */}
                    <section className="pt-8 border-t border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Answer Preferences</h3>
                      
                      {/* Content Sources */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Content Sources</label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Select which types of supplementary resources (if available for the question) should be considered when generating answers.</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {(Object.keys(formData) as Array<keyof typeof formData>)
                            .filter(key => key.startsWith('use_'))
                            .map(key => (
                              <div key={key} className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={key}
                                  name={key}
                                  checked={formData[key as keyof typeof formData] as boolean}
                                  onChange={handleSwitchChange} // Use checkbox handler
                                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-purple-600 dark:focus:ring-offset-gray-800 rounded"
                                />
                                <label htmlFor={key} className="ml-2 block text-sm text-gray-900 dark:text-gray-100 capitalize">
                                  {key.replace('use_','').replace('_sources','').replace('_', ' ')}
                                </label>
                              </div>
                            ))}
                        </div>
                      </div>

                      {/* Answer Format */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Answer Format</label>
                        <select
                          id="preferred_answer_format"
                          name="preferred_answer_format"
                          value={formData.preferred_answer_format}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-900 dark:text-white sm:text-sm shadow-sm"
                        >
                          <option value="markdown">Markdown (Default - Recommended)</option>
                          <option value="bullet_points">Bullet Points</option>
                          <option value="numbered_lists">Numbered Lists</option>
                          <option value="paragraph">Paragraph Style</option>
                          <option value="table">Table Format (Experimental)</option>
                        </select>
                      </div>

                      {/* Answer Depth */}
                      <div className="mb-6">
                        <label htmlFor="answer_depth_slider" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Answer Depth</label>
                        <div className="flex items-center space-x-4">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Brief</span>
                          <input
                            type="range"
                            id="answer_depth_slider"
                            min="1"
                            max="3"
                            step="1"
                            value={formData.preferred_answer_depth === 'brief' ? 1 : formData.preferred_answer_depth === 'standard' ? 2 : 3}
                            onChange={handleSliderChange} 
                            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-black"
                          />
                           <span className="text-xs text-gray-500 dark:text-gray-400">Comprehensive</span>
                        </div>
                        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">{formData.preferred_answer_depth}</p>
                      </div>
                      
                      {/* Custom Instructions */}
                      <div className="mb-6">
                         <label htmlFor="custom_formatting_instructions" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                           Additional Formatting Instructions
                         </label>
                         <textarea
                           id="custom_formatting_instructions"
                           name="custom_formatting_instructions"
                           rows={3}
                           value={formData.custom_formatting_instructions || ''}
                           onChange={handleInputChange}
                           className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-900 dark:text-white sm:text-sm shadow-sm"
                           placeholder="e.g., Start with a summary. Use bold for key terms."
                         />
                       </div>

                       {/* Preview Button (Placeholder) */}
                       <div className="mb-6">
                          <button
                             type="button"
                             onClick={() => alert('Preview functionality not yet implemented.')} // Placeholder action
                             className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:focus:ring-offset-black"
                           >
                             Preview Sample Answer
                           </button>
                           <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">See an example of how answers might look with current settings (functionality coming soon).</p>
                       </div>

                      {/* Save Button (uses the same button as model/profile changes) */}
                       {renderSaveChangesButton()}
                    </section>

                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500 dark:text-gray-400">
          &copy; {new Date().getFullYear()} GrokInterviews. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
