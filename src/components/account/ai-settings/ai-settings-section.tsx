'use client'

import type { ChangeEvent } from 'react'
import { DemoButton } from '@/components/ui'
import type { GroqModel, AccountFormData } from '@/app/account/types' // Added AccountFormData

interface AiSettingsSectionProps {
  formData: Pick<AccountFormData, 'specific_model_id'> // Use Pick for relevant part of AccountFormData
  apiKeyInput: string
  availableGroqModels: GroqModel[]
  // handleInputChange is not directly used for model selection in this component
  handleApiKeyInputChange: (e: ChangeEvent<HTMLInputElement>) => void
  saveApiKey: () => Promise<void>
  savingApiKey: boolean
  getSelectedModelDetails: () => GroqModel | undefined
  renderSaveChangesButton: () => React.ReactElement
  setFormData: React.Dispatch<React.SetStateAction<AccountFormData>> // Use AccountFormData
}

export function AiSettingsSection({
  formData,
  apiKeyInput,
  availableGroqModels,
  handleApiKeyInputChange,
  saveApiKey,
  savingApiKey,
  getSelectedModelDetails,
  renderSaveChangesButton,
  setFormData,
}: AiSettingsSectionProps) {
  const selectedModelDetails = getSelectedModelDetails()

  return (
    <div className="flex gap-8">
      {/* Left Panel - Settings Form */}
      <div className="flex-1 bg-white dark:bg-black/60 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">AI Settings</h2>
        <div className="space-y-10">

          {/* Groq Model Selection Sub-section */}
          <section>
             <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Groq Model Selection</h3>
             <div className="space-y-2"> 
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Groq AI Model
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    {availableGroqModels.filter(model => model.id !== 'whisper-large-v3-turbo').map((model) => {
                      let tag = ''
                      if (model.id === 'llama-3.1-8b-instant') tag = 'Fastest'
                      else if (model.id === 'gemma2-9b-it') tag = 'Code & Math'
                      else if (model.id === 'llama-3.3-70b-versatile') tag = 'General'
                      else if (model.id === 'llama-guard-3-8b') tag = 'Safety'

                      const isSelected = formData.specific_model_id === model.id

                      return (
                        <div
                          key={model.id}
                          className={`relative rounded-lg border-2 ${isSelected ? 'border-black dark:border-white' : 'border-gray-200 dark:border-gray-700'} p-4 cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors`}
                          onClick={() => {
                            setFormData((prev: AccountFormData) => ({ // Explicitly type prev
                              ...prev,
                              specific_model_id: model.id
                            }))
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">{model.name}</h4>
                              <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full border border-gray-800 dark:border-gray-200 text-gray-800 dark:text-gray-200 bg-transparent">
                                {tag}
                              </span>
                            </div>
                            <div className={`w-5 h-5 rounded-full border ${isSelected ? 'border-black dark:border-white bg-black dark:bg-white' : 'border-gray-300 dark:border-gray-600'} flex items-center justify-center`}>
                              {isSelected && (
                                <svg className="w-3 h-3 text-white dark:text-black" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                </svg>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    Select a model for generating answers. Model details will appear in the preview panel.
                  </p>
                </div>
             </div>
             {renderSaveChangesButton()}
          </section>

          {/* Groq API Key Sub-section */}
          <section className="pt-8 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Groq API Key</h3>
            <div className="space-y-6">
              <div>
                <label htmlFor="custom_api_key" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Your Groq API Key
                </label>
                <input
                  type="password"
                  name="custom_api_key"
                  id="custom_api_key"
                  value={apiKeyInput}
                  onChange={handleApiKeyInputChange}
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 dark:border-gray-700 focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-900 dark:text-white sm:text-sm shadow-sm pl-3 py-2"
                  placeholder="Enter your Groq API key (starts with gsk_...)"
                  autoComplete="off"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Provide your own API key from Groq to use the selected model. Your key is required for generation.
                </p>
              </div>

              {/* Security Information Box */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md border border-yellow-200 dark:border-yellow-700/50">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400 dark:text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Important Security Information</h4>
                    <div className="mt-2 text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                      <p>Your API key is stored securely in the database.</p>
                      <p>Using your own API key means any usage will be billed to your personal Groq account.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-5 border-t border-gray-200 dark:border-gray-800 flex justify-end">
              <DemoButton
                onClick={saveApiKey}
                isLoading={savingApiKey}
                buttonText="Save API Key"
                className="bg-emerald-500 hover:bg-emerald-600 text-black dark:text-white border-none focus:ring-emerald-400 px-3.5 py-1.5 text-sm"
              >
                Save API Key
              </DemoButton>
            </div>
          </section>
        </div>
      </div>

      {/* Right Panel - Model Preview */}
      <div className="w-80 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-black/80 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Model Preview</h3>
        {selectedModelDetails && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <div className="mb-3">
              <div className="flex items-center mb-2">
                <h4 className="font-medium text-gray-900 dark:text-white">{selectedModelDetails.name}</h4>
                <span className="ml-2 inline-block px-2 py-0.5 text-xs font-medium rounded-full border border-gray-800 dark:border-gray-200 text-gray-800 dark:text-gray-200 bg-transparent">
                  {selectedModelDetails.id === 'llama-3.1-8b-instant' ? 'Fastest' :
                   selectedModelDetails.id === 'gemma2-9b-it' ? 'Code/Math' :
                   selectedModelDetails.id === 'llama-3.3-70b-versatile' ? 'General' :
                   selectedModelDetails.id === 'llama-guard-3-8b' ? 'Safety' : ''}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                {selectedModelDetails.notes}
              </p>
            </div>

          <div className="mb-4">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              <span className="font-medium">Model Statistics:</span> Performance and rate limits for the selected model
            </p>

            <div className="overflow-x-auto">
              <table className="min-w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    <th className="py-2 px-3 text-left font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">RPM</th>
                    <th className="py-2 px-3 text-left font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">TPM</th>
                    <th className="py-2 px-3 text-left font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">TPD</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white dark:bg-gray-800">
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                      {selectedModelDetails.rpm || '-'}
                    </td>
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                      {selectedModelDetails.id === 'whisper-large-v3-turbo' ? '-' :
                       selectedModelDetails.id === 'llama-3.1-8b-instant' || selectedModelDetails.id === 'llama-3.3-70b-versatile' ? '6,000' : '15,000'}
                    </td>
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                      {selectedModelDetails.id === 'whisper-large-v3-turbo' ? '-' :
                       selectedModelDetails.id === 'llama-3.3-70b-versatile' ? '100,000' : '500,000'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {selectedModelDetails.id !== 'whisper-large-v3-turbo' && (
              <div className="mt-4">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tokens Per Day Capacity</p>
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${selectedModelDetails.id === 'llama-3.3-70b-versatile' ? 'bg-amber-500 dark:bg-amber-600' : 'bg-green-500 dark:bg-green-600'}`}
                    style={{ width: `${selectedModelDetails.id === 'llama-3.3-70b-versatile' ? '20%' : '100%'}` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>0</span>
                  <span>250K</span>
                  <span>500K</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            <p><span className="font-medium">RPM:</span> Requests per minute</p>
            <p><span className="font-medium">TPM:</span> Tokens per minute</p>
            <p><span className="font-medium">TPD:</span> Tokens per day</p>
          </div>
        </div>
        )}

        <div className="mt-auto">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">API Status</h4>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${apiKeyInput ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {apiKeyInput ? 'API Key Provided' : 'No API Key'}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {apiKeyInput
              ? 'Your API key is set. You can generate answers with the selected model.'
              : 'Please provide a Groq API key to use this model for generating answers.'}
          </p>
        </div>
      </div>
    </div>
  )
} 