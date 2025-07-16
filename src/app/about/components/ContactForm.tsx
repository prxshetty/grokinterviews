'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { submitFeedback } from '@/app/actions/feedback'
import { FeedbackFormData } from '@/types'

export default function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<FeedbackFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    message: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const result = await submitFeedback(formData)

      if (result.success) {
        toast.success('Thank you! Your message has been sent successfully.')
        // Reset form
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          message: ''
        })
      } else {
        toast.error(result.error || 'There was an error sending your message. Please try again.')
      }
    } catch {
      toast.error('There was an error sending your message. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">First name</label>
          <Input 
            type="text" 
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            placeholder="John"
            className="bg-gray-950/5 dark:bg-white/5 border-0 focus:ring-0 focus:outline-none"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">Last name</label>
          <Input 
            type="text" 
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            placeholder="Doe"
            className="bg-gray-950/5 dark:bg-white/5 border-0 focus:ring-0 focus:outline-none"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">Email</label>
          <Input 
            type="email" 
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="john.doe@example.com"
            className="bg-gray-950/5 dark:bg-white/5 border-0 focus:ring-0 focus:outline-none"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">Phone number</label>
          <Input 
            type="text" 
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+1 (555) 123-4567"
            className="bg-gray-950/5 dark:bg-white/5 border-0 focus:ring-0 focus:outline-none"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm text-gray-600 dark:text-gray-400">Message</label>
        <div className="relative">
          <Textarea 
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Hi! I have a question about the AI-powered features and how they can help with my interview preparation..."
            className="min-h-[120px] bg-gray-950/5 dark:bg-white/5 border-0 focus:ring-0 focus:outline-none pr-12"
            required
          />
          <Button 
            type="submit"
            variant="ghost"
            size="sm"
            disabled={isSubmitting}
            className="absolute bottom-3 right-3 px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200"
          >
            {isSubmitting ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </div>
    </form>
  )
}