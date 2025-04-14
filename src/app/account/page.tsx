'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  email: string;
  preferred_model: string;
  custom_api_key: string | null;
  specific_model_id: string | null;
}

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState('personal');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
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
    preferred_model: 'claude',
  });

  const [apiKeyInput, setApiKeyInput] = useState('');

  // --- New: Map preferred model type to a specific model ID ---
  const modelTypeToSpecificIdMap: { [key: string]: string } = {
    claude: 'claude-3-sonnet-20240229', // Example ID, update if needed
    llama: 'llama-3-70b-chat',       // Example ID, update if needed
    gpt4: 'gpt-4-turbo',           // Example ID, update if needed
    gemini: 'gemini-1.5-pro-latest', // Example ID, update if needed
    groq: 'llama-3.1-8b-instant',     // Confirmed from previous step
  };
  // -------------------------------------------------------------

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/signin');
        return;
      }

      setUser(session.user);
      
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (profileData) {
        setProfile(profileData);
        setFormData({
          full_name: profileData.full_name || '',
          username: profileData.username || '',
          email: session.user.email || '',
          preferred_model: profileData.preferred_model || 'claude',
        });
        setApiKeyInput(profileData.custom_api_key || '');
      } else if (session.user.email) {
        setFormData(prev => ({ ...prev, email: session.user.email! }));
      }
      
      setLoading(false);
    };

    checkUser();
  }, [supabase, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  // Saves Full Name, Username, Preferred Model, and Specific Model ID
  const saveChanges = async () => {
    if (!user) return;
    
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    // --- Determine the specific model ID based on the selected preference ---
    const specific_model_id = modelTypeToSpecificIdMap[formData.preferred_model] || null;
    // -----------------------------------------------------------------------

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          username: formData.username,
          preferred_model: formData.preferred_model,
          specific_model_id: specific_model_id, // --- Save the specific ID ---
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Preferences saved successfully.' });
      
      // Update local profile state optimistically
      setProfile(prev => {
        if (!prev) return null;
        return {
          ...prev,
          full_name: formData.full_name,
          username: formData.username,
          preferred_model: formData.preferred_model,
          specific_model_id: specific_model_id, // --- Update local state too ---
        };
      });

      setTimeout(() => setMessage({ type: '', text: '' }), 3000);

    } catch (error: any) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to save preferences. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

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
          <div className="md:w-64 flex-shrink-0 mb-8 md:mb-0 md:pt-6">
            <nav className="flex flex-col space-y-1">
                <button
                  onClick={() => setActiveTab('personal')}
                  className={`flex items-center px-3 py-2 text-sm font-medium w-full text-left ${ 
                    activeTab === 'personal'
                      ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-l-4 border-purple-600 dark:border-purple-400' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100 rounded-md'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Personal Information
                </button>
                
                <button
                  onClick={() => setActiveTab('preferences')}
                  className={`flex items-center px-3 py-2 text-sm font-medium w-full text-left ${ 
                    activeTab === 'preferences'
                      ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-l-4 border-purple-600 dark:border-purple-400' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100 rounded-md'
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

          <div className="flex-1">
            <div className="py-6">
              {message.text && (
                <div className={`mb-6 p-3 rounded-md text-sm ${
                  message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700/50' : 
                  message.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700/50' :
                  'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50'
                }`}>
                  {message.text}
                </div>
              )}

              {activeTab === 'personal' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Personal Information</h2>
                  <div className="space-y-6">
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
                  {renderSaveChangesButton()}
                </div>
              )}

              {activeTab === 'preferences' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Preferences</h2>
                  <div className="space-y-10">
                    
                    <section>
                       <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Model Selection</h3>
                       <div className="space-y-6">
                          <div>
                            <label htmlFor="preferred_model" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Preferred AI Model
                            </label>
                            <select
                              id="preferred_model"
                              name="preferred_model"
                              value={formData.preferred_model}
                              onChange={handleInputChange}
                              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-900 dark:text-white sm:text-sm shadow-sm"
                            >
                              <option value="claude">Claude (Anthropic)</option>
                              <option value="llama">Llama 3 (Meta)</option>
                              <option value="gpt4">GPT-4 (OpenAI)</option>
                              <option value="gemini">Gemini (Google)</option>
                              <option value="groq">Groq (Llama 3.1 via Groq)</option>
                            </select>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              Select the AI model for generating answers. If using Groq, provide your key below.
                            </p>
                          </div>
                          
                          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-md border border-gray-200 dark:border-gray-700">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Model Comparison</h4>
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead>
                                  <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Model</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Strengths</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Best For</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-xs text-gray-700 dark:text-gray-300">
                                   <tr>
                                    <td className="px-3 py-2">Claude</td>
                                    <td className="px-3 py-2">Detailed explanations, nuanced responses</td>
                                    <td className="px-3 py-2">System design, conceptual questions</td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2">Llama 3</td>
                                    <td className="px-3 py-2">Open-source, efficient, customizable</td>
                                    <td className="px-3 py-2">Coding problems, algorithms</td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2">GPT-4</td>
                                    <td className="px-3 py-2">Broad knowledge, code generation</td>
                                    <td className="px-3 py-2">General interview prep, diverse topics</td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2">Gemini</td>
                                    <td className="px-3 py-2">Multimodal capabilities, research-focused</td>
                                    <td className="px-3 py-2">ML/AI questions, research topics</td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2">Groq</td>
                                    <td className="px-3 py-2">Speed, low latency (via Llama 3.1)</td>
                                    <td className="px-3 py-2">Real-time generation, conversational AI</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                       </div>
                       {renderSaveChangesButton()} 
                    </section>

                    <section className="pt-8 border-t border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">API Key Settings</h3>
                      <div className="space-y-6">
                        <div>
                          <label htmlFor="custom_api_key" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Custom API Key (Optional)
                          </label>
                          <input
                            type="password"
                            name="custom_api_key"
                            id="custom_api_key"
                            value={apiKeyInput}
                            onChange={handleApiKeyInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-900 dark:text-white sm:text-sm shadow-sm"
                            placeholder="Enter your API key (e.g., Groq API Key)"
                            autoComplete="off"
                          />
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Provide your own API key (e.g., from Groq) to use the 'Groq' model preference. This allows generation using your own account.
                          </p>
                        </div>
                        
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
                                <p>Using your own API key means any usage will be billed to your personal account with the AI provider (e.g., Groq).</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
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
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-16 py-8 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500 dark:text-gray-400">
          &copy; {new Date().getFullYear()} GrokInterviews. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
