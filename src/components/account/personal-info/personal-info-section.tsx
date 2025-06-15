'use client'

import Image from 'next/image'
import type { UserProfile } from '@/app/account/types' // Corrected import path
import { Input } from '@/components/ui'
import type { ReactElement } from 'react'; // Import ReactElement

interface PersonalInfoSectionProps {
  formData: {
    full_name: string
    username: string
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
  return (
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
            <Input
              type="text"
              name="full_name"
              id="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              className="mt-1"
            />
          </div>
          {/* Username Input */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Username
            </label>
            <Input
              type="text"
              name="username"
              id="username"
              value={formData.username}
              onChange={handleInputChange}
              className="mt-1"
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
  )
} 