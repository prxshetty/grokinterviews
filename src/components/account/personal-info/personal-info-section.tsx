'use client'

import { Input } from '@/components/ui'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useImagePreloader } from '@/hooks'
import Image from 'next/image'
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
    <div className="flex flex-col gap-6">
      {/* Profile Picture Section */}
      <div className="w-full flex flex-col items-center rounded-xl p-6">
        <div className="mb-4">
          <Avatar className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32">
            <AvatarImage 
              src={profile?.avatar_url && profile.avatar_url.trim() !== '' ? profile.avatar_url : DEFAULT_AVATAR_URL} 
              alt="Profile" 
              className="object-cover"
            />
            <AvatarFallback className="bg-transparent overflow-hidden">
              <Image
                src={DEFAULT_AVATAR_URL}
                alt="Default Avatar"
                width={128}
                height={128}
                loading="lazy"
                sizes="(max-width: 640px) 96px, (max-width: 1024px) 112px, 128px"
                className="w-full h-full object-cover"
              />
            </AvatarFallback>
          </Avatar>
        </div>
        <h3 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white">
          {formData.full_name || 'Your Name'}
        </h3>
      </div>

      {/* Form Panel */}
      <div className="bg-white dark:bg-black/60 rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-800">
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