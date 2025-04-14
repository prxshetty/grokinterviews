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
}

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState('personal');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    preferred_model: 'claude',
    custom_api_key: '',
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/signin');
        return;
      }

      setUser(session.user);
      
      // Fetch user profile
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
          custom_api_key: profileData.custom_api_key || '',
        });
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
  };

  const saveChanges = async () => {
    if (!user) return;
    
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          username: formData.username,
          preferred_model: formData.preferred_model,
          custom_api_key: formData.custom_api_key || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Your changes have been saved successfully.' });
      
      // Update local profile state
      setProfile(prev => {
        if (!prev) return null;
        return {
          ...prev,
          full_name: formData.full_name,
          username: formData.username,
          preferred_model: formData.preferred_model,
          custom_api_key: formData.custom_api_key || null,
        };
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to save changes. Please try again.' });
    } finally {
      setSaving(false);
      
      // Clear success message after 3 seconds
      if (message.type === 'success') {
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      }
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

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="md:flex md:gap-10 lg:gap-16">
          {/* Sidebar Navigation */}
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
                  onClick={() => setActiveTab('model')}
                  className={`flex items-center px-3 py-2 text-sm font-medium w-full text-left ${ 
                    activeTab === 'model'
                      ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-l-4 border-purple-600 dark:border-purple-400' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100 rounded-md'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Model Preferences
                </button>
                
                <button
                  onClick={() => setActiveTab('api')}
                  className={`flex items-center px-3 py-2 text-sm font-medium w-full text-left ${ 
                    activeTab === 'api'
                      ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-l-4 border-purple-600 dark:border-purple-400' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100 rounded-md'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  API Settings
                </button>
                
                <Link
                  href="/dashboard"
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100 rounded-md"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Back to Dashboard
                </Link>
              </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="py-6">
              {/* Personal Information Tab */}
              {activeTab === 'personal' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Personal Information</h2>
                  
                  {message.text && (
                    <div className={`mb-4 p-3 rounded-md ${
                      message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 
                      'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                    }`}>
                      {message.text}
                    </div>
                  )}
                  
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
                </div>
              )}

              {/* Model Preferences Tab */}
              {activeTab === 'model' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Model Preferences</h2>
                  
                  {message.text && (
                    <div className={`mb-4 p-3 rounded-md ${
                      message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 
                      'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                    }`}>
                      {message.text}
                    </div>
                  )}
                  
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
                      </select>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Select the AI model you prefer for generating interview answers.
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-md border border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Model Comparison</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead>
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Model</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Strengths</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Best For</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            <tr>
                              <td className="px-3 py-2 text-xs text-gray-700 dark:text-gray-300">Claude</td>
                              <td className="px-3 py-2 text-xs text-gray-700 dark:text-gray-300">Detailed explanations, nuanced responses</td>
                              <td className="px-3 py-2 text-xs text-gray-700 dark:text-gray-300">System design, conceptual questions</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2 text-xs text-gray-700 dark:text-gray-300">Llama 3</td>
                              <td className="px-3 py-2 text-xs text-gray-700 dark:text-gray-300">Open-source, efficient, customizable</td>
                              <td className="px-3 py-2 text-xs text-gray-700 dark:text-gray-300">Coding problems, algorithms</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2 text-xs text-gray-700 dark:text-gray-300">GPT-4</td>
                              <td className="px-3 py-2 text-xs text-gray-700 dark:text-gray-300">Broad knowledge, code generation</td>
                              <td className="px-3 py-2 text-xs text-gray-700 dark:text-gray-300">General interview prep, diverse topics</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2 text-xs text-gray-700 dark:text-gray-300">Gemini</td>
                              <td className="px-3 py-2 text-xs text-gray-700 dark:text-gray-300">Multimodal capabilities, research-focused</td>
                              <td className="px-3 py-2 text-xs text-gray-700 dark:text-gray-300">ML/AI questions, research topics</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* API Settings Tab */}
              {activeTab === 'api' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">API Settings</h2>
                  
                  {message.text && (
                    <div className={`mb-4 p-3 rounded-md ${
                      message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 
                      'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                    }`}>
                      {message.text}
                    </div>
                  )}
                  
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="custom_api_key" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Custom API Key (Optional)
                      </label>
                      <input
                        type="password"
                        name="custom_api_key"
                        id="custom_api_key"
                        value={formData.custom_api_key}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-900 dark:text-white sm:text-sm shadow-sm"
                        placeholder="Enter your API key"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Provide your own API key to use with your preferred model. This allows you to generate answers using your own account.
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
                          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Important Security Information</h3>
                          <div className="mt-2 text-xs text-yellow-700 dark:text-yellow-300">
                            <p>
                              Your API key is stored securely and encrypted. We never share your API key with third parties.
                              Using your own API key means any usage will be billed to your account with the respective AI provider.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
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
          <div className="flex justify-center space-x-6 mb-4">
            <Link href="/" className="hover:text-gray-700 dark:hover:text-gray-300">Home</Link>
            <Link href="/topics" className="hover:text-gray-700 dark:hover:text-gray-300">Topics</Link>
            {/* <Link href="/contact" className="hover:text-gray-700 dark:hover:text-gray-300">Contact</Link> */}
          </div>
          &copy; {new Date().getFullYear()} GrokInterviews. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
