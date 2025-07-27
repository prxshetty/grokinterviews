'use client'

import type { GroqModel, AccountFormData } from '@/app/account/types'
import { PERFORMANCE_TIERS, PerformanceTier, getTierByModelId, getModelIdByTier } from '@/app/account/ai-performance-tiers'

interface AiSettingsSectionProps {
  formData: Pick<AccountFormData, 'specific_model_id'>
  availableAIModels: GroqModel[]
  getSelectedModelDetails: () => GroqModel | undefined
  renderSaveChangesButton: () => React.ReactElement
  setFormData: React.Dispatch<React.SetStateAction<AccountFormData>>
}

export function AiSettingsSection({
  formData,
  renderSaveChangesButton,
  setFormData,
}: Omit<AiSettingsSectionProps, 'getSelectedModelDetails' | 'availableAIModels'>) {
  const selectedTier = getTierByModelId(formData.specific_model_id) || 'fast'

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

  return (
    <div className="w-full">
      <div className="bg-white dark:bg-black/60 rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="space-y-6 lg:space-y-10">

          {/* AI Model Selection */}
          <section>
             <h3 className="text-base lg:text-lg font-medium text-gray-800 dark:text-gray-200 mb-3 lg:mb-4">AI Performance Settings</h3>
             <div className="space-y-2"> 
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    AI Performance Level
                  </label>

                  <div className="grid grid-cols-1 gap-4">
                    {PERFORMANCE_TIERS.map((tier) => {
                      const isSelected = selectedTier === tier.id
                      
                      return (
                        <div
                          key={tier.id}
                          className={`relative rounded-xl border-2 ${isSelected ? 'border-blue-500 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'} p-4 lg:p-5 cursor-pointer transition-all duration-200`}
                          onClick={() => {
                            const modelId = getModelIdByTier(tier.id as PerformanceTier)
                            if (modelId) {
                              setFormData((prev: AccountFormData) => ({
                                ...prev,
                                specific_model_id: modelId
                              }))
                            }
                          }}
                        >
                          <div className="flex flex-col space-y-3">
                            <div className="flex justify-between items-start">
                              <h4 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-white">
                                {tier.name}
                              </h4>
                              {isSelected && (
                                <div className="flex items-center bg-blue-100 dark:bg-blue-800/50 text-blue-800 dark:text-blue-200 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                  </svg>
                                  Selected
                                </div>
                              )}
                            </div>
                            
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {tier.description}
                            </p>
                            
                            <div className="grid grid-cols-2 gap-4 mt-2">
                              <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Speed</p>
                                <div className="flex items-center gap-1">
                                  {renderSpeedMeter(tier.speed)}
                                  <span className="ml-2 text-xs text-gray-700 dark:text-gray-300">
                                    {['Slow', 'Moderate', 'Fast', 'Very Fast', 'Lightning'][tier.speed - 1]}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Quality</p>
                                <div className="flex items-center gap-1">
                                  {renderSpeedMeter(tier.quality)}
                                  <span className="ml-2 text-xs text-gray-700 dark:text-gray-300">
                                    {['Basic', 'Good', 'Great', 'Excellent', 'Best'][tier.quality - 1]}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-1">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-300">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h2a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                                </svg>
                                Best for: {tier.bestFor}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
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