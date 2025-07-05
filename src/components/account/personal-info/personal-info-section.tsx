'use client'

import { Input } from '@/components/ui'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useImagePreloader } from '@/hooks'
import { DEFAULT_AVATAR_URL } from '@/config'
import type { ReactElement } from 'react'; // Import ReactElement

interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
}

interface PersonalInfoSectionProps {
  formData: {
    full_name: string
    email: string
  }
  profile: UserProfile | null
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  renderSaveChangesButton: () => ReactElement // Changed to ReactElement
}

export function PersonalInfoSection({
  formData,
  profile,
  handleInputChange,
  renderSaveChangesButton,
}: PersonalInfoSectionProps) {
  // Preload the default avatar image for instant loading
  useImagePreloader([DEFAULT_AVATAR_URL], true)

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
      {/* Profile Preview Panel - Mobile First */}
      <div className="lg:order-2 w-full lg:w-80 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-black/80 rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center">
        <div className="relative mb-4 lg:mb-6">
          <Avatar className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 border-2 lg:border-4 border-white dark:border-gray-800 shadow-lg">
            <AvatarImage 
              src={profile?.avatar_url && profile.avatar_url.trim() !== '' ? profile.avatar_url : DEFAULT_AVATAR_URL} 
              alt="Profile" 
            />
            <AvatarFallback className="bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <img
                src={DEFAULT_AVATAR_URL}
                alt="Default Avatar"
                className="w-full h-full object-cover"
              />
            </AvatarFallback>
          </Avatar>
          <div className="absolute bottom-0 right-0 bg-white dark:bg-gray-800 rounded-full p-1.5 lg:p-2 shadow-md border border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 lg:h-5 lg:w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>

        <div className="text-center">
          <h3 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white">
            {formData.full_name || 'Your Name'}
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 lg:mt-4">
            Profile picture upload coming soon
          </p>
        </div>
      </div>

      {/* Form Panel */}
      <div className="lg:order-1 flex-1 bg-white dark:bg-black/60 rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-800">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 lg:mb-6">Personal Information</h2>
        <div className="space-y-4 lg:space-y-6">
          {/* Full Name Input */}
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Full Name
            </label>
            <Input
              type="text"
              name="full_name"
              id="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              className="mt-1 text-gray-900 dark:text-gray-100"
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
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 text-sm bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed shadow-sm px-3 py-2"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Email address cannot be changed. Contact support if you need to update your email.
            </p>
          </div>
        </div>
        {/* Save Button for Personal Info */}
        <div className="mt-4 lg:mt-6">
          {renderSaveChangesButton()}
        </div>
      </div>
    </div>
  )
} 