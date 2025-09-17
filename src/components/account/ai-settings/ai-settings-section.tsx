'use client'

import type { GroqModel, AccountFormData } from '@/app/account/types'
import { PERFORMANCE_TIERS, PerformanceTier, getTierByModelId, getModelIdByTier } from '@/app/account/ai-performance-tiers'
import { availableGroqModels } from '@/app/account/types'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'

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
  
  const getModelName = (modelId: string) => {
    return availableGroqModels.find(model => model.id === modelId)?.name || modelId
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

  return (
    <TooltipProvider>
      <div className="w-full">
        <div className="bg-white dark:bg-black/60 rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-800">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 lg:mb-6">AI Model Selection</h2>
          <div className="space-y-6 lg:space-y-8">
            {/* AI Model Selection */}
            <section>
               <h3 className="text-base lg:text-lg font-medium text-gray-800 dark:text-gray-200 mb-3 lg:mb-4">Performance Level</h3>
               <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 lg:mb-4">Choose the AI model for Topic Interview answer generation. This does not affect Voice Interview.</p>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                  {PERFORMANCE_TIERS.map((tier) => {
                    const isSelected = selectedTier === tier.id
                    
                    return (
                      <div
                        key={tier.id}
                        className={`relative rounded-lg border-2 ${isSelected ? 'border-black dark:border-white' : 'border-gray-200 dark:border-gray-700'} p-3 lg:p-4 cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors`}
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
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm lg:text-base font-medium text-gray-900 dark:text-white">
                                {tier.name}
                              </h4>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-xs">
                                  <div className="space-y-2">
                                    <div>
                                      <p className="font-medium text-sm">{getModelName(tier.modelId)}</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">{tier.description}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                                      <div>
                                        <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Speed</p>
                                        <div className="flex items-center gap-1">
                                          {renderSpeedMeter(tier.speed)}
                                          <span className="ml-1 text-xs text-gray-700 dark:text-gray-300">
                                            {['Slow', 'Moderate', 'Fast', 'Very Fast', 'Lightning'][tier.speed - 1]}
                                          </span>
                                        </div>
                                      </div>
                                      <div>
                                        <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Quality</p>
                                        <div className="flex items-center gap-1">
                                          {renderSpeedMeter(tier.quality)}
                                          <span className="ml-1 text-xs text-gray-700 dark:text-gray-300">
                                            {['Basic', 'Good', 'Great', 'Excellent', 'Best'][tier.quality - 1]}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <div className="mt-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-gray-800 dark:border-gray-200 text-gray-800 dark:text-gray-200 bg-transparent">
                                Best for: {tier.bestFor}
                              </span>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border ${isSelected ? 'border-black dark:border-white bg-black dark:bg-white' : 'border-gray-300 dark:border-gray-600'} flex items-center justify-center flex-shrink-0 ml-2`}>
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
              </section>

              <div className="mt-4 lg:mt-6">
                {renderSaveChangesButton()}
              </div>
            </div>
          </div>
        </div>
      </TooltipProvider>
    )
}