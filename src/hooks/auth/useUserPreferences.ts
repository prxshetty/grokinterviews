import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/utils/supabase/client';
import { UserPreferences, DEFAULT_USER_PREFERENCES } from '@/components/questions/ResourceUtils';

interface UseUserPreferencesProps {
  isLoggedIn: boolean;
  userId?: string | null;
}

interface UseUserPreferencesReturn {
  preferences: UserPreferences;
  loading: boolean;
  error: string | null;
  updatePreferences: (newPrefs: Partial<UserPreferences>) => Promise<void>;
}

export function useUserPreferences({ 
  isLoggedIn, 
  userId 
}: UseUserPreferencesProps): UseUserPreferencesReturn {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    if (!isLoggedIn || !userId) {
      setPreferences(DEFAULT_USER_PREFERENCES);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected for new users
        console.error('Error fetching preferences:', fetchError);
        setError('Failed to load preferences');
        return;
      }

      if (data) {
        setPreferences({
          ...DEFAULT_USER_PREFERENCES,
          ...data
        });
      } else {
        // No preferences found, use defaults
        setPreferences(DEFAULT_USER_PREFERENCES);
      }
    } catch (err) {
      console.error('Unexpected error fetching preferences:', err);
      setError('An unexpected error occurred');
      setPreferences(DEFAULT_USER_PREFERENCES);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, userId]);

  const updatePreferences = async (newPrefs: Partial<UserPreferences>) => {
    if (!isLoggedIn || !userId) return;

    try {
      const updatedPrefs = { ...preferences, ...newPrefs };
      
      const { error: updateError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          ...updatedPrefs
        });

      if (updateError) {
        console.error('Error updating preferences:', updateError);
        throw new Error('Failed to update preferences');
      }

      setPreferences(updatedPrefs);
    } catch (err) {
      console.error('Error updating preferences:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    preferences,
    loading,
    error,
    updatePreferences
  };
}
