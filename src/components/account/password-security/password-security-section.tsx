'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui'
import { DemoButton } from '@/components/ui/demo-button'
import { useAuth } from '@/components/AuthProvider'
import { toast } from 'sonner'
import type { ReactElement } from 'react'

interface PasswordSecuritySectionProps {
  renderSaveChangesButton: () => ReactElement
}

// Password strength calculation
function calculatePasswordStrength(password: string): { score: number; feedback: string[] } {
  let score = 0
  const feedback: string[] = []

  if (password.length >= 8) {
    score += 1
  } else {
    feedback.push('At least 8 characters')
  }

  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Include lowercase letters')
  }

  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Include uppercase letters')
  }

  if (/\d/.test(password)) {
    score += 1
  } else {
    feedback.push('Include numbers')
  }

  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 1
  } else {
    feedback.push('Include special characters')
  }

  return { score, feedback }
}

function getStrengthLabel(score: number): { label: string; color: string } {
  if (score === 0) return { label: 'Enter password', color: 'text-gray-400' }
  if (score <= 2) return { label: 'Weak', color: 'text-red-500' }
  if (score <= 3) return { label: 'Fair', color: 'text-yellow-500' }
  if (score <= 4) return { label: 'Good', color: 'text-blue-500' }
  return { label: 'Strong', color: 'text-green-500' }
}

export function PasswordSecuritySection({
  renderSaveChangesButton: _renderSaveChangesButton,
}: PasswordSecuritySectionProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPasswordResetMode, setIsPasswordResetMode] = useState(false)
  
  const { supabase, user: _user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const toastShownRef = useRef(false)

  const passwordStrength = calculatePasswordStrength(newPassword)
  const strengthInfo = getStrengthLabel(passwordStrength.score)

  useEffect(() => {
    // Check if we're coming from a password reset email
    const mode = searchParams.get('mode')
    if (mode === 'reset') {
      setIsPasswordResetMode(true)
      
      // Show a friendly toast notification (only once)
      if (!toastShownRef.current) {
        toast.info('Password reset link used successfully. You can update your password below when ready.', {
          duration: 5000,
        })
        toastShownRef.current = true
      }
    } else {
      setIsPasswordResetMode(false)
      toastShownRef.current = false
    }
  }, [searchParams])

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all required fields.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    // If not in password reset mode, require current password
    if (!isPasswordResetMode && !currentPassword) {
      setError('Please enter your current password.')
      return
    }

    setLoading(true)

    try {
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      // Update password (works for both reset mode and normal mode)
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      })
      
      if (error) throw error
      
      toast.success('Password updated successfully!')
      
      // If this was from a password reset, clear the mode
      if (isPasswordResetMode) {
        setIsPasswordResetMode(false)
        
        // Clean up URL parameters
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.delete('mode')
        router.replace(newUrl.pathname + '?tab=password-security')
      }

      // Clear form
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

    } catch (error: any) {
      console.error('Password update error:', error)
      setError(error.message || 'Failed to update password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
      {/* Form Panel - Mobile First, Desktop Left */}
      <div className="lg:order-1 flex-1 bg-white dark:bg-black/60 rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-800">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 lg:mb-6">
          Update Password
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-sm rounded-md border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handlePasswordUpdate} className="space-y-4 lg:space-y-6">
          {!isPasswordResetMode && (
            <div>
              <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Current Password
              </label>
              <Input
                type="password"
                name="current_password"
                id="current_password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1"
                placeholder="Enter your current password"
                required={!isPasswordResetMode}
              />
            </div>
          )}

          <div>
            <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              New Password
            </label>
            <Input
              type="password"
              name="new_password"
              id="new_password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1"
              placeholder="Enter your new password"
              required
              minLength={6}
            />
          </div>

          <div>
            <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Confirm New Password
            </label>
            <Input
              type="password"
              name="confirm_password"
              id="confirm_password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1"
              placeholder="Confirm your new password"
              required
            />
          </div>

          <div className="pt-4">
            <DemoButton
              type="submit"
              isLoading={loading}
              buttonText={loading ? 'Updating...' : 'Update Password'}
              className="bg-emerald-500 hover:bg-emerald-600 text-black dark:text-white border-none focus:ring-emerald-400 px-3.5 py-1.5 text-sm"
            >
              Update Password
            </DemoButton>
          </div>
        </form>
      </div>

      {/* Security Info Panel - Mobile Second, Desktop Right */}
      <div className="lg:order-2 w-full lg:w-80 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-black/80 rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Password Security
        </h3>

        {/* Password Strength Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Password Strength
            </span>
            <span className={`text-sm font-medium ${strengthInfo.color}`}>
              {strengthInfo.label}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                passwordStrength.score === 0 ? 'w-0 bg-gray-300' :
                passwordStrength.score <= 2 ? 'w-2/5 bg-red-500' :
                passwordStrength.score <= 3 ? 'w-3/5 bg-yellow-500' :
                passwordStrength.score <= 4 ? 'w-4/5 bg-blue-500' :
                'w-full bg-green-500'
              }`}
            />
          </div>

          {newPassword && passwordStrength.feedback.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                To improve strength:
              </p>
              {passwordStrength.feedback.map((item, index) => (
                <div key={index} className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <span className="mr-2">•</span>
                  {item}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security Requirements */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Password Requirements
          </h4>
          <div className="space-y-2">
            {[
              { test: newPassword.length >= 8, label: 'At least 8 characters' },
              { test: /[a-z]/.test(newPassword), label: 'One lowercase letter' },
              { test: /[A-Z]/.test(newPassword), label: 'One uppercase letter' },
              { test: /\d/.test(newPassword), label: 'One number' },
              { test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword), label: 'One special character' },
            ].map((req, index) => (
              <div key={index} className="flex items-center text-xs">
                <svg 
                  className={`w-3 h-3 mr-2 ${
                    !newPassword ? 'text-gray-300 dark:text-gray-600' :
                    req.test ? 'text-green-500' : 'text-red-500'
                  }`} 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                    clipRule="evenodd" 
                  />
                </svg>
                <span className={
                  !newPassword ? 'text-gray-500 dark:text-gray-400' :
                  req.test ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
                }>
                  {req.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {isPasswordResetMode && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-sm rounded-md border border-green-200 dark:border-green-800">
            <p className="font-medium">✓ Password reset link authenticated</p>
            <p className="mt-1 text-xs">
              No current password required since you came from a valid reset link.
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 