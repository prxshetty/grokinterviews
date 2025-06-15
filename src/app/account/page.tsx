'use client';

import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';
import { DemoButton } from '@/components/ui';
import { LoadingSpinner } from '@/components/ui';
import { toast } from 'sonner';
import { AccountTab, Cursor } from '@/components/account/account-tabs';
import { PersonalInfoSection } from '@/components/account/personal-info/personal-info-section';
import { AiSettingsSection } from '@/components/account/ai-settings/ai-settings-section';
import { AnswerPreferencesSection } from '@/components/account/answer-preferences/answer-preferences-section';
import type { UserProfile, UserPreferences, AnswerFormat, AnswerDepth, AccountFormData } from './types';
import { availableGroqModels, DEFAULT_GROQ_MODEL_ID } from './types';

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState('personal');
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingApiKey, setSavingApiKey] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const [position, setPosition] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });

  const [formData, setFormData] = useState<AccountFormData>({
    full_name: '',
    username: '',
    email: '',
    specific_model_id: DEFAULT_GROQ_MODEL_ID,
    use_youtube_sources: true,
    use_pdf_sources: true,
    use_paper_sources: true,
    use_website_sources: true,
    use_book_sources: false,
    use_image_sources: false,
    preferred_answer_format: 'markdown' as AnswerFormat,
    preferred_answer_depth: 'standard' as AnswerDepth,
    include_code_snippets: true,
    include_latex_formulas: false,
    custom_formatting_instructions: '',
  });

  const [apiKeyInput, setApiKeyInput] = useState('');

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user: fetchedUser }, error: userError } = await supabase.auth.getUser();
      if (userError || !fetchedUser) {
        router.push('/signin');
        return;
      }

      setUser(fetchedUser);

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('full_name, username, avatar_url, custom_api_key')
        .eq('id', fetchedUser.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      }

      const { data: preferencesData, error: prefError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', fetchedUser.id)
        .maybeSingle();

      if (prefError) {
        console.error('Error fetching preferences:', prefError);
      }

      if (profileData) {
        setProfile({
            id: fetchedUser.id,
            email: fetchedUser.email || '',
            full_name: profileData.full_name,
            username: profileData.username,
            avatar_url: profileData.avatar_url,
            custom_api_key: profileData.custom_api_key
        });
        setFormData(prev => ({
          ...prev,
          full_name: profileData.full_name || '',
          username: profileData.username || '',
          email: fetchedUser.email || '',
        }));
        setApiKeyInput(profileData.custom_api_key || '');
      } else if (fetchedUser.email) {
        setFormData(prev => ({ ...prev, email: fetchedUser.email! }));
      }
      if (preferencesData) {
        setFormData(prev => ({
          ...prev,
          specific_model_id: preferencesData.specific_model_id || DEFAULT_GROQ_MODEL_ID,
          use_youtube_sources: preferencesData.use_youtube_sources ?? true,
          use_pdf_sources: preferencesData.use_pdf_sources ?? true,
          use_paper_sources: preferencesData.use_paper_sources ?? true,
          use_website_sources: preferencesData.use_website_sources ?? true,
          use_book_sources: preferencesData.use_book_sources ?? false,
          use_image_sources: preferencesData.use_image_sources ?? false,
          preferred_answer_format: preferencesData.preferred_answer_format || 'markdown',
          preferred_answer_depth: preferencesData.preferred_answer_depth || 'standard',
          include_code_snippets: preferencesData.include_code_snippets ?? true,
          include_latex_formulas: preferencesData.include_latex_formulas ?? false,
          custom_formatting_instructions: preferencesData.custom_formatting_instructions || '',
        }));
      }

      setLoading(false);
    };

    checkUser();
  }, [router, supabase]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApiKeyInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setApiKeyInput(e.target.value);
  };

  const handleSwitchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const saveChanges = async () => {
    if (!user) {
      console.error('No user found. User must be authenticated to save changes.');
      toast.error('You must be signed in to save changes.');
      return;
    }

    setSaving(true);
    console.log("Saving changes for user:", user.id);
    console.log("Form data:", formData);

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: formData.full_name,
          username: formData.username,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

      if (profileError) {
        console.error('Error saving profile:', profileError);
        toast.error(`Failed to save profile: ${profileError.message}`);
        return;
      }
      console.log("Profile data upserted successfully.");

      const preferenceDataToSave: Omit<UserPreferences, 'theme' | 'email_notifications'> & { user_id: string } = {
        user_id: user.id,
        specific_model_id: formData.specific_model_id || DEFAULT_GROQ_MODEL_ID,
        use_youtube_sources: formData.use_youtube_sources,
        use_pdf_sources: formData.use_pdf_sources,
        use_paper_sources: formData.use_paper_sources,
        use_website_sources: formData.use_website_sources,
        use_book_sources: formData.use_book_sources,
        use_image_sources: formData.use_image_sources,
        preferred_answer_format: formData.preferred_answer_format,
        preferred_answer_depth: formData.preferred_answer_depth,
        include_code_snippets: formData.include_code_snippets,
        include_latex_formulas: formData.include_latex_formulas,
        custom_formatting_instructions: formData.custom_formatting_instructions || null,
      };
      console.log("Attempting to upsert preferences:", preferenceDataToSave);

      const { error: preferencesError } = await supabase
        .from('user_preferences')
        .upsert(preferenceDataToSave, { onConflict: 'user_id' });

      if (preferencesError) {
        console.error('Error saving preferences:', preferencesError);
        toast.error(`Failed to save preferences: ${preferencesError.message}`);
        return;
      }
      console.log("User preferences upserted successfully.");

      setProfile(prev => prev ? { ...prev, full_name: formData.full_name, username: formData.username } : null);
      toast.success('Settings saved successfully!');
    } catch (error: any) {
      console.error('Unexpected error during saveChanges:', error);
      toast.error(`An unexpected error occurred: ${error.message || 'Please try again.'}`);
    } finally {
      setSaving(false);
    }
  };

  const saveApiKey = async () => {
    if (!user) {
      console.error('No user found. Cannot save API key.');
      toast.error('You must be signed in to save the API key.');
      return;
    }
    setSavingApiKey(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ custom_api_key: apiKeyInput || null })
        .eq('id', user.id);

      if (error) {
        console.error('Error saving API key:', error);
        toast.error(`Failed to save API key: ${error.message}`);
      } else {
        console.log('API key saved successfully.');
        setProfile(prev => prev ? { ...prev, custom_api_key: apiKeyInput || null } : null);
        toast.success('API key saved successfully!');
      }
    } catch (error: any) {
      console.error('Unexpected error saving API key:', error);
      toast.error(`An unexpected error occurred: ${error.message || 'Please try again.'}`);
    } finally {
      setSavingApiKey(false);
    }
  };

  const getSelectedModelDetails = () => {
    return availableGroqModels.find(model => model.id === formData.specific_model_id);
  };

  const setInitialCursorPosition = useCallback(() => {
    const activeTabElement = document.querySelector(`[data-tab-value="${activeTab}"]`) as HTMLElement;
    if (activeTabElement) {
      const { width } = activeTabElement.getBoundingClientRect();
      const left = activeTabElement.offsetLeft;
      setPosition({
        width,
        opacity: 1,
        left,
      });
    }
  }, [activeTab]);

  useEffect(() => {
    if (!loading) {
      setInitialCursorPosition();
    }
  }, [loading, activeTab, setInitialCursorPosition]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black">
        <LoadingSpinner 
          size="lg" 
          color="primary" 
          text="Loading your account..."
          centered={true}
        />
      </div>
    );
  }

  const renderSaveChangesButton = () => {
    return (
      <div className="mt-6 flex justify-end">
        <DemoButton
          onClick={saveChanges}
          isLoading={saving}
          buttonText="Save Changes"
          className="bg-emerald-500 hover:bg-emerald-600 text-black dark:text-white border-none focus:ring-emerald-400 px-3.5 py-1.5 text-sm"
        >
          Save Changes
        </DemoButton>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col">
          <div className="w-full flex-shrink-0 mb-8">
            <h2 className="text-2xl font-light text-gray-900 dark:text-white mb-6">Account</h2>
            <nav className="relative">
              <ul
                className="relative flex w-fit rounded-full border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-1"
                onMouseLeave={() => {
                  const activeTabElement = document.querySelector(`[data-tab-value="${activeTab}"]`) as HTMLElement;
                  if (activeTabElement) {
                    const { width } = activeTabElement.getBoundingClientRect();
                    setPosition({
                      left: activeTabElement.offsetLeft,
                      width,
                      opacity: 1,
                    });
                  } else {
                    setPosition(pv => ({ ...pv, opacity: 0 }));
                  }
                }}
              >
                <AccountTab
                  tabValue="personal"
                  currentActiveTab={activeTab}
                  setActiveTab={setActiveTab}
                  setPosition={setPosition}
                  position={position}
                >
                  Personal
                </AccountTab>
                <AccountTab
                  tabValue="ai-settings"
                  currentActiveTab={activeTab}
                  setActiveTab={setActiveTab}
                  setPosition={setPosition}
                  position={position}
                >
                  AI Settings
                </AccountTab>
                <AccountTab
                  tabValue="answer-preferences"
                  currentActiveTab={activeTab}
                  setActiveTab={setActiveTab}
                  setPosition={setPosition}
                  position={position}
                >
                  Answer Preferences
                </AccountTab>
                <Cursor position={position} />
              </ul>
            </nav>
          </div>

          <div className="w-full">
            {activeTab === 'personal' && (
              <PersonalInfoSection
                formData={{
                  full_name: formData.full_name,
                  username: formData.username,
                  email: formData.email,
                }}
                profile={profile}
                handleInputChange={handleInputChange}
                renderSaveChangesButton={renderSaveChangesButton}
              />
            )}

            {activeTab === 'ai-settings' && (
              <AiSettingsSection
                formData={{ specific_model_id: formData.specific_model_id }}
                apiKeyInput={apiKeyInput}
                availableGroqModels={availableGroqModels}
                handleApiKeyInputChange={handleApiKeyInputChange}
                saveApiKey={saveApiKey}
                savingApiKey={savingApiKey}
                getSelectedModelDetails={getSelectedModelDetails}
                renderSaveChangesButton={renderSaveChangesButton}
                setFormData={setFormData}
              />
            )}

            {activeTab === 'answer-preferences' && (
              <AnswerPreferencesSection
                formData={{
                  use_youtube_sources: formData.use_youtube_sources,
                  use_pdf_sources: formData.use_pdf_sources,
                  use_paper_sources: formData.use_paper_sources,
                  use_website_sources: formData.use_website_sources,
                  use_book_sources: formData.use_book_sources,
                  use_image_sources: formData.use_image_sources,
                  preferred_answer_format: formData.preferred_answer_format,
                  preferred_answer_depth: formData.preferred_answer_depth,
                  include_code_snippets: formData.include_code_snippets,
                  include_latex_formulas: formData.include_latex_formulas,
                  custom_formatting_instructions: formData.custom_formatting_instructions,
                }}
                handleInputChange={handleInputChange}
                handleSwitchChange={handleSwitchChange}
                setFormData={setFormData}
                renderSaveChangesButton={renderSaveChangesButton}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
