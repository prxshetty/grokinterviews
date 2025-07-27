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
    <div className="w-full">
      <div className="bg-white dark:bg-black/60 rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-800">
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
            {newPassword && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <span>Password Strength: <span className={`font-medium ${strengthInfo.color}`}>{strengthInfo.label}</span></span>
                  <span>{passwordStrength.score * 20}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full ${
                      passwordStrength.score === 0 ? 'bg-gray-300' :
                      passwordStrength.score <= 2 ? 'bg-red-500' :
                      passwordStrength.score <= 3 ? 'bg-yellow-500' :
                      passwordStrength.score <= 4 ? 'bg-blue-500' :
                      'bg-green-500'
                    }`} 
                    style={{ width: `${passwordStrength.score * 20}%` }}
                  />
                </div>
                {passwordStrength.feedback.length > 0 && (
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <p className="font-medium">To improve your password:</p>
                    <ul className="list-disc list-inside">
                      {passwordStrength.feedback.map((tip, index) => (
                        <li key={index}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
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
    </div>
  )
} 