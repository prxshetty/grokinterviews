'use client'

import { useState, useEffect } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Info, Eye, EyeOff, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  type AIProvider,
  PROVIDER_INFO,
  getModelsForProvider,
  getDefaultModel
} from '@/utils/ai-client'
import {
  getSelectedProvider,
  setSelectedProvider,
  setAPIKey,
  getSelectedModel,
  setSelectedModel,
  hasAPIKey,
} from '@/utils/ai-config-storage'

export function AiSettingsSection() {
  // State
  const [provider, setProvider] = useState<AIProvider | null>(null)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null)
  const [isKeyStored, setIsKeyStored] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Load stored config on mount
  useEffect(() => {
    setMounted(true)
    const storedProvider = getSelectedProvider()
    if (storedProvider) {
      setProvider(storedProvider)
      setIsKeyStored(hasAPIKey(storedProvider))
      const storedModel = getSelectedModel(storedProvider)
      setSelectedModelId(storedModel)
    }
  }, [])

  // Handle provider change
  const handleProviderChange = (newProvider: AIProvider) => {
    setProvider(newProvider)
    setSelectedProvider(newProvider)
    setIsKeyStored(hasAPIKey(newProvider))
    setApiKeyInput('')

    // Load stored model for this provider or set default
    const storedModel = getSelectedModel(newProvider)
    if (storedModel) {
      setSelectedModelId(storedModel)
    } else {
      const defaultModel = getDefaultModel(newProvider)
      setSelectedModelId(defaultModel.id)
      setSelectedModel(newProvider, defaultModel.id)
    }
  }

  // Handle model change
  const handleModelChange = (modelId: string) => {
    if (!provider) return
    const model = getModelsForProvider(provider).find(m => m.id === modelId)
    if (!model) return

    setSelectedModelId(modelId)
    setSelectedModel(provider, modelId)

    // Show toast notification with model details
    toast.success(`Switched to ${model.name}`, {
      description: `$${model.inputPrice}/M input • $${model.outputPrice}/M output`
    })
  }

  // Handle API key save with connection test
  const handleSaveApiKey = async () => {
    if (!provider || !apiKeyInput.trim()) return

    setIsSaving(true)
    const keyToTest = apiKeyInput.trim()

    try {
      // Test the key first
      const response = await fetch('/api/test-ai-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey: keyToTest }),
      })

      if (response.ok) {
        // Only save if valid
        setAPIKey(provider, keyToTest)
        setIsKeyStored(true)
        setApiKeyInput('') // Clear input for security

        toast.success("API Key Saved", {
          description: "Your API key has been verified and stored securely in your browser."
        })
      } else {
        const data = await response.json()
        toast.error("Connection Failed", {
          description: data.error || "Could not verify your API key. Please check it and try again."
        })
      }
    } catch (error) {
      toast.error("Error", {
        description: "An unexpected error occurred while testing the connection."
      })
    } finally {
      setIsSaving(false)
    }
  }

  const renderSpeedMeter = (count: number) => (
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${i < count ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`}
        />
      ))}
    </div>
  )

  const models = provider ? getModelsForProvider(provider) : []

  if (!mounted) {
    return (
      <div className="w-full">
        <div className="bg-white dark:bg-black/60 rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="w-full">
        <div className="bg-white dark:bg-black/60 rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-800">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 lg:mb-6">AI Configuration</h2>

          <div className="space-y-6 lg:space-y-8">
            {/* Provider Selection */}
            <section>
              <h3 className="text-base lg:text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">AI Provider</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Choose your AI provider. You'll need to provide your own API key.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(Object.keys(PROVIDER_INFO) as AIProvider[]).map((p) => {
                  const info = PROVIDER_INFO[p]
                  const isSelected = provider === p
                  const hasKey = mounted && hasAPIKey(p)

                  return (
                    <div
                      key={p}
                      className={`relative rounded-lg border-2 ${isSelected ? 'border-black dark:border-white' : 'border-gray-200 dark:border-gray-700'} p-4 cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors`}
                      onClick={() => handleProviderChange(p)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-medium text-gray-900 dark:text-white">
                              {info.name}
                            </h4>
                            {hasKey && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                                <Check className="w-3 h-3 mr-1" /> Key saved
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {info.description}
                          </p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border ${isSelected ? 'border-black dark:border-white bg-black dark:bg-white' : 'border-gray-300 dark:border-gray-600'} flex items-center justify-center flex-shrink-0 ml-2`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white dark:text-black" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* API Key Input */}
            {provider && (
              <section>
                <h3 className="text-base lg:text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">API Key</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Your API key is stored locally in your browser and never sent to our servers.
                  {provider === 'openai' && (
                    <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-500 hover:underline">
                      Get your OpenAI key →
                    </a>
                  )}
                  {provider === 'google' && (
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-500 hover:underline">
                      Get your Google AI key →
                    </a>
                  )}
                </p>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder={isKeyStored ? '••••••••••••••••••••' : 'Enter your API key'}
                      className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    onClick={handleSaveApiKey}
                    disabled={!apiKeyInput.trim() || isSaving}
                    className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[80px] flex items-center justify-center"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                  </button>
                </div>
              </section>
            )}

            {/* Model Selection */}
            {provider && (
              <section>
                <h3 className="text-base lg:text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">Model</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Choose a model based on your speed vs quality preference.</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {models.map((model) => {
                    const isSelected = selectedModelId === model.id

                    return (
                      <div
                        key={model.id}
                        className={`relative rounded-lg border-2 ${isSelected ? 'border-black dark:border-white' : 'border-gray-200 dark:border-gray-700'} p-3 lg:p-4 cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors`}
                        onClick={() => handleModelChange(model.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm lg:text-base font-medium text-gray-900 dark:text-white">
                                {model.name}
                              </h4>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-xs">
                                  <div className="space-y-2">
                                    <div>
                                      <p className="font-medium text-sm">{model.name}</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">{model.description}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                                      <div>
                                        <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Speed</p>
                                        <div className="flex items-center gap-1">
                                          {renderSpeedMeter(model.speed)}
                                        </div>
                                      </div>
                                      <div>
                                        <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Quality</p>
                                        <div className="flex items-center gap-1">
                                          {renderSpeedMeter(model.quality)}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                                      <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Pricing (per 1M tokens)</p>
                                      <div className="space-y-0.5">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Input: ${model.inputPrice.toFixed(2)}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Output: ${model.outputPrice.toFixed(2)}</p>
                                      </div>
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <div className="mt-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${model.tier === 'cheap' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                model.tier === 'balanced' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                                  'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                }`}>
                                {model.tier === 'cheap' ? 'Fast' :
                                  model.tier === 'balanced' ? 'Balanced' :
                                    'Premium'}
                              </span>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border ${isSelected ? 'border-black dark:border-white bg-black dark:bg-white' : 'border-gray-300 dark:border-gray-600'} flex items-center justify-center flex-shrink-0 ml-2`}>
                            {isSelected && (
                              <svg className="w-3 h-3 text-white dark:text-black" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Voice Interview Section */}
            <section className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-base lg:text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">🎤 Voice Interviews</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Voice interview features use OpenAI's audio models for the best experience.
              </p>

              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                      Uses your OpenAI API Key
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-200">
                      {hasAPIKey('openai') ? (
                        <span className="flex items-center gap-1">
                          <Check className="w-3 h-3" /> Your OpenAI key is configured. Voice interviews are ready.
                        </span>
                      ) : (
                        <span>Please configure your OpenAI API key above to use voice interviews.</span>
                      )}
                    </p>
                    <div className="mt-3 space-y-1">
                      <p className="text-xs text-blue-600 dark:text-blue-300">
                        <span className="font-medium">Speech-to-Text:</span> Whisper (whisper-1)
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-300">
                        <span className="font-medium">Text-to-Speech:</span> TTS-1
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Not Configured Warning */}
            {!provider && (
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  ⚠️ Please select an AI provider and configure your API key to generate answers.
                </p>
              </div>
            )}

            {provider && !isKeyStored && (
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  ⚠️ Please enter your {PROVIDER_INFO[provider].name} API key to generate answers.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}