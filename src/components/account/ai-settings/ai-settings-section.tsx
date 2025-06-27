'use client'

import type { GroqModel, AccountFormData } from '@/app/account/types'

interface AiSettingsSectionProps {
  formData: Pick<AccountFormData, 'specific_model_id'> // Use Pick for relevant part of AccountFormData
  availableGroqModels: GroqModel[]
  getSelectedModelDetails: () => GroqModel | undefined
  renderSaveChangesButton: () => React.ReactElement
  setFormData: React.Dispatch<React.SetStateAction<AccountFormData>> // Use AccountFormData
}

export function AiSettingsSection({
  formData,
  availableGroqModels,
  getSelectedModelDetails,
  renderSaveChangesButton,
  setFormData,
}: AiSettingsSectionProps) {
  const selectedModelDetails = getSelectedModelDetails()

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
      {/* Model Preview Panel - Mobile First */}
      <div className="lg:order-2 w-full lg:w-80 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-black/80 rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col">
        <h3 className="text-sm sm:text-lg font-medium text-gray-800 dark:text-gray-200 mb-3 lg:mb-4">Model Preview</h3>
        {selectedModelDetails && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 lg:p-4 shadow-sm border border-gray-200 dark:border-gray-700 mb-4 lg:mb-6">
            <div className="mb-3">
              <div className="flex items-center mb-2">
                <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">{selectedModelDetails.name}</h4>
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
                    <th className="py-2 px-2 lg:px-3 text-left font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">RPM</th>
                    <th className="py-2 px-2 lg:px-3 text-left font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">TPM</th>
                    <th className="py-2 px-2 lg:px-3 text-left font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">TPD</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white dark:bg-gray-800">
                    <td className="py-2 px-2 lg:px-3 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                      {selectedModelDetails.rpm || '-'}
                    </td>
                    <td className="py-2 px-2 lg:px-3 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                      {selectedModelDetails.id === 'whisper-large-v3-turbo' ? '-' :
                       selectedModelDetails.id === 'llama-3.1-8b-instant' || selectedModelDetails.id === 'llama-3.3-70b-versatile' ? '6,000' : '15,000'}
                    </td>
                    <td className="py-2 px-2 lg:px-3 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
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
                <div className="h-3 lg:h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
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
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Model Status</h4>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${selectedModelDetails ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {selectedModelDetails ? 'Model Selected' : 'No Model Selected'}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {selectedModelDetails
              ? 'Your model is selected and ready for generating answers.'
              : 'Please select a model to use for generating answers.'}
          </p>
        </div>
      </div>

      {/* Settings Form Panel */}
      <div className="lg:order-1 flex-1 bg-white dark:bg-black/60 rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-800">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 lg:mb-6">AI Settings</h2>
        <div className="space-y-6 lg:space-y-10">

          {/* Groq Model Selection Sub-section */}
          <section>
             <h3 className="text-base lg:text-lg font-medium text-gray-800 dark:text-gray-200 mb-3 lg:mb-4">Groq Model Selection</h3>
             <div className="space-y-2"> 
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Groq AI Model
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                          className={`relative rounded-lg border-2 ${isSelected ? 'border-black dark:border-white' : 'border-gray-200 dark:border-gray-700'} p-3 lg:p-4 cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors`}
                          onClick={() => {
                            setFormData((prev: AccountFormData) => ({ // Explicitly type prev
                              ...prev,
                              specific_model_id: model.id
                            }))
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-sm lg:text-base font-medium text-gray-900 dark:text-white">{model.name}</h4>
                              <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full border border-gray-800 dark:border-gray-200 text-gray-800 dark:text-gray-200 bg-transparent">
                                {tag}
                              </span>
                            </div>
                            <div className={`w-5 h-5 rounded-full border ${isSelected ? 'border-black dark:border-white bg-black dark:bg-white' : 'border-gray-300 dark:border-gray-600'} flex items-center justify-center flex-shrink-0`}>
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
             <div className="mt-4 lg:mt-6">
               {renderSaveChangesButton()}
             </div>
          </section>

        </div>
      </div>
    </div>
  )
} 