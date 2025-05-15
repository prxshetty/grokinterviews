'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function DirectSignOutButton() {
  const handleSignOut = async () => {
    try {
      console.log('DirectSignOutButton - Signing out...');

      // Create a direct Supabase client
      const supabase = createClientComponentClient();

      // Call signOut directly
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('DirectSignOutButton - Error signing out:', error);
        alert(`Error signing out: ${error.message}`);
        return;
      }

      console.log('DirectSignOutButton - Sign out successful');

      // Force a full page reload and redirect to home
      window.location.href = '/';
    } catch (error) {
      console.error('DirectSignOutButton - Exception during sign out:', error);
      alert(`Exception during sign out: ${error}`);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors shadow-lg border-2 border-red-400 dark:border-red-800"
    >
      Emergency Sign Out
    </button>
  );
}
