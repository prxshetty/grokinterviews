'use client';

import { useState, useEffect, ChangeEvent, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { DemoButton } from '@/components/ui';
import { LoadingSpinner } from '@/components/ui';
import { TabNav } from '@/components/ui/tab-nav';
import { toast } from 'sonner';
import { PersonalInfoSection } from '@/components/account/personal-info/personal-info-section';
import { AiSettingsSection } from '@/components/account/ai-settings/ai-settings-section';
import { AnswerPreferencesSection } from '@/components/account/answer-preferences/answer-preferences-section';
import { PasswordSecuritySection } from '@/components/account/password-security/password-security-section';
import type { UserPreferences, AnswerFormat, AnswerDepth, AccountFormData } from './types';

function AccountPageContent() {
  const [activeTab, setActiveTab] = useState('personal');
  const { user, profile, loading: authLoading, refreshAuth, supabase } = useAuth();
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMounted = useRef(true);

  const [formData, setFormData] = useState<AccountFormData>({
    full_name: '',
    email: '',
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

  const accountTabs = [
    { id: 'personal', label: 'Personal' },
    { id: 'ai-settings', label: 'AI Settings' },
    { id: 'answer-preferences', label: 'Answer Preferences' },
    { id: 'password-security', label: 'Password Security' },
  ];

  useEffect(() => {
    isMounted.current = true;

    const tab = searchParams.get('tab');
    if (tab && ['personal', 'ai-settings', 'answer-preferences', 'password-security'].includes(tab)) {
      setActiveTab(tab);
    }

    return () => {
      isMounted.current = false;
    };
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchUserPreferences = async () => {
      if (user && isMounted.current && supabase) {
        const { data: preferencesData, error: prefError } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (prefError) {
          console.error('Error fetching preferences:', prefError);
          toast.error('Could not load your preferences.');
        }

        if (isMounted.current && preferencesData) {
          setFormData(prev => ({
            ...prev,
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
      }
    };

    if (profile && user) {
      setFormData(prev => ({
        ...prev,
        full_name: profile.full_name || '',
        email: user.email || '',
      }));
      fetchUserPreferences();
    }
  }, [profile, user, supabase]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
    if (!supabase) {
      toast.error("Database connection not available.");
      setSaving(false);
      return;
    }
    console.log("Saving changes for user:", user.id);
    console.log("Form data:", formData);

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: formData.full_name,
        }, { onConflict: 'id' });

      if (profileError) {
        console.error('Error saving profile:', profileError);
        toast.error(`Failed to save profile: ${profileError.message}`);
        return;
      }
      console.log("Profile data upserted successfully.");

      const preferenceDataToSave: Omit<UserPreferences, 'theme' | 'email_notifications' | 'specific_model_id'> & { user_id: string } = {
        user_id: user.id,
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

      await refreshAuth();
      toast.success('Settings saved successfully!');
    } catch (error: any) {
      console.error('Unexpected error during saveChanges:', error);
      toast.error(`An unexpected error occurred: ${error.message || 'Please try again.'}`);
    } finally {
      setSaving(false);
    }
  };


  if (authLoading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen pt-32 sm:pt-36 md:pt-40">
        <LoadingSpinner size="xl" text="Loading Account..." fullScreen={false} />
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
          className="bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white border-none focus:ring-emerald-400 dark:focus:ring-emerald-500 px-3.5 py-1.5 text-sm"
        >
          Save Changes
        </DemoButton>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 pt-6 sm:pt-12 md:pt-16">
        <div className="flex flex-col">
          <div className="w-full flex-shrink-0 mb-6 sm:mb-8">
            <h2 className="text-3xl font-editorial font-light sm:text-3xl text-gray-900 dark:text-white mb-4 sm:mb-6">Account</h2>
            <TabNav
              items={accountTabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              variant="button"
            />
          </div>

          <div className="w-full">
            {activeTab === 'personal' && (
              <PersonalInfoSection
                formData={{
                  full_name: formData.full_name,
                  email: formData.email,
                }}
                profile={profile}
                handleInputChange={handleInputChange}
                renderSaveChangesButton={renderSaveChangesButton}
              />
            )}

            {activeTab === 'ai-settings' && (
              <AiSettingsSection />
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

            {activeTab === 'password-security' && (
              <PasswordSecuritySection
                renderSaveChangesButton={renderSaveChangesButton}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen pt-32 sm:pt-36 md:pt-40">
          <LoadingSpinner size="xl" text="Loading Account..." fullScreen={false} />
        </div>
      }
    >
      <AccountPageContent />
    </Suspense>
  );
}

export default AccountPage;
