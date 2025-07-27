'use client'

import type { ChangeEvent } from 'react'
import type { AccountFormData, AnswerFormat, AnswerDepth } from '@/app/account/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ChevronDown } from 'lucide-react'

interface AnswerPreferencesSectionProps {
  formData: Pick<
    AccountFormData,
    | 'use_youtube_sources'
    | 'use_pdf_sources'
    | 'use_paper_sources'
    | 'use_website_sources'
    | 'use_book_sources'
    | 'use_image_sources'
    | 'preferred_answer_format'
    | 'preferred_answer_depth'
    | 'include_code_snippets'
    | 'include_latex_formulas'
    | 'custom_formatting_instructions'
  >
  handleInputChange: (e: ChangeEvent<HTMLTextAreaElement | HTMLSelectElement>) => void
  handleSwitchChange: (e: ChangeEvent<HTMLInputElement>) => void
  setFormData: React.Dispatch<React.SetStateAction<AccountFormData>>
  renderSaveChangesButton: () => React.ReactElement
}

// Define types for keys used in contentSources and formData
type ContentSourceKey = Extract<keyof AccountFormData, `use_${string}_sources`>;

const contentSources: ReadonlyArray<{ id: ContentSourceKey; name: string; tag: string; description: string }> = [
  { id: 'use_youtube_sources', name: 'YouTube', tag: 'Relevant videos', description: 'Videos based on keywords' },
  { id: 'use_pdf_sources', name: 'PDF', tag: 'Documents', description: 'Notes from Reddit, blogs, drives' },
  { id: 'use_paper_sources', name: 'Papers', tag: 'Beta', description: 'Academic research papers' },
  { id: 'use_website_sources', name: 'Websites', tag: 'Articles', description: 'Relevant web articles' },
  { id: 'use_book_sources', name: 'Books', tag: 'References', description: 'Amazon book links' },
  { id: 'use_image_sources', name: 'Illustrations', tag: 'Diagrams', description: 'Articles with diagrams & illustrations' }
];

const answerFormats: ReadonlyArray<{ id: AnswerFormat; name: string; tag: string }> = [
  { id: 'markdown', name: 'Markdown', tag: 'Default' },
  { id: 'bullet_points', name: 'Bullet Points', tag: 'Concise' },
  { id: 'table', name: 'Table Format', tag: 'Experimental' },
  { id: 'paragraph', name: 'Paragraph Style', tag: 'Narrative' }
];

export function AnswerPreferencesSection({
  formData,
  handleInputChange,
  handleSwitchChange,
  setFormData,
  renderSaveChangesButton,
}: AnswerPreferencesSectionProps) {
  return (
    <div className="w-full">
      <div className="bg-white dark:bg-black/60 rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-800">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 lg:mb-6">Answer Preferences</h2>
        <div className="space-y-6 lg:space-y-8">
          {/* Content Sources */}
          <section>
            <h3 className="text-base lg:text-lg font-medium text-gray-800 dark:text-gray-200 mb-3 lg:mb-4">Content Sources</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 lg:mb-4">Select which types of supplementary resources should be considered when generating answers.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
              {contentSources.map((source) => {
                const isSelected = formData[source.id]
                const isBeta = source.tag === 'Beta';
                return (
                  <div
                    key={source.id}
                    className={`relative rounded-lg border-2 ${isSelected ? 'border-black dark:border-white' : 'border-gray-200 dark:border-gray-700'} p-3 lg:p-4 cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors`}
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        [source.id]: !isSelected
                      }))
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm lg:text-base font-medium text-gray-900 dark:text-white">{source.name}</h4>
                        <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full border ${isBeta ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400' : 'border-gray-800 dark:border-gray-200 text-gray-800 dark:text-gray-200'} bg-transparent`}>
                          {source.tag}
                        </span>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{source.description}</p>
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
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              Resources are shown when their relevance score is closer to your desired topic and context.
            </p>
          </section>

          {/* Answer Format */}
          <section className="pt-4 lg:pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-base lg:text-lg font-medium text-gray-800 dark:text-gray-200 mb-3 lg:mb-4">Answer Format</h3>
            <div className="mb-4 lg:mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Format Style</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                {answerFormats.map((format) => {
                  const isSelected = formData.preferred_answer_format === format.id
                  return (
                    <div
                      key={format.id}
                      className={`relative rounded-lg border-2 ${isSelected ? 'border-black dark:border-white' : 'border-gray-200 dark:border-gray-700'} p-3 lg:p-4 cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors`}
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          preferred_answer_format: format.id
                        }))
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm lg:text-base font-medium text-gray-900 dark:text-white">{format.name}</h4>
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full border border-gray-800 dark:border-gray-200 text-gray-800 dark:text-gray-200 bg-transparent">
                            {format.tag}
                          </span>
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
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                Choose how you'd like answers to be structured. Markdown is recommended for most cases.
              </p>
            </div>

            {/* Answer Add-ons Section */}
            <div className="mb-6">
              <h4 className="text-base font-medium text-gray-800 dark:text-gray-200 mb-3">Answer Add-ons</h4>
              <div className="mb-4 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <label htmlFor="include_code_snippets" className="block text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                    Include Code Snippets
                  </label>
                  <label className="relative inline-block w-10 mr-2 align-middle select-none cursor-pointer" htmlFor="include_code_snippets">
                    <input
                      type="checkbox"
                      id="include_code_snippets"
                      name="include_code_snippets"
                      checked={formData.include_code_snippets}
                      onChange={handleSwitchChange}
                      className="sr-only"
                    />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${formData.include_code_snippets ? 'bg-black dark:bg-black' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                    <div className={`absolute left-1 top-1 w-4 h-4 rounded-full transition-transform bg-white transform ${formData.include_code_snippets ? 'translate-x-4' : 'translate-x-0'}`}></div>
                  </label>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  When enabled, answers will include code examples for programming-related questions. Disable to focus on theory and save tokens.
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <label htmlFor="include_latex_formulas" className="block text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                    Include LaTeX Formulas <span className="text-xs text-amber-600 dark:text-amber-400 ml-1">(Experimental)</span>
                  </label>
                  <label className="relative inline-block w-10 mr-2 align-middle select-none cursor-pointer" htmlFor="include_latex_formulas">
                    <input
                      type="checkbox"
                      id="include_latex_formulas"
                      name="include_latex_formulas"
                      checked={formData.include_latex_formulas || false}
                      onChange={handleSwitchChange}
                      className="sr-only"
                    />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${(formData.include_latex_formulas || false) ? 'bg-black dark:bg-black' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                    <div className={`absolute left-1 top-1 w-4 h-4 rounded-full transition-transform bg-white transform ${(formData.include_latex_formulas || false) ? 'translate-x-4' : 'translate-x-0'}`}></div>
                  </label>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  When enabled, mathematical formulas will be rendered using LaTeX notation. Useful for math, physics, and engineering questions.
                </p>
              </div>
            </div>

            {/* Answer Depth */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <label htmlFor="preferred_answer_depth" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Answer Depth
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="min-w-[140px] justify-between text-sm capitalize bg-white dark:text-gray-200 dark:bg-gray-900 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      {formData.preferred_answer_depth || 'Select depth'}
                      <ChevronDown className="h-4 w-4 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    sideOffset={8}
                    className="w-40 bg-white/80 dark:bg-black/80 backdrop-blur-md border border-border/50 shadow-lg rounded-lg overflow-hidden p-1.5 mt-1"
                  >
                    {(['brief', 'standard', 'comprehensive'] as AnswerDepth[]).map((depth) => (
                      <DropdownMenuItem
                        key={depth}
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            preferred_answer_depth: depth
                          }));
                        }}
                        className={`px-2 py-1.5 text-sm rounded-md cursor-pointer font-normal transition-colors capitalize ${
                          formData.preferred_answer_depth === depth
                            ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100'
                        }`}
                      >
                        {depth}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </section>

          {/* Custom Instructions */}
          <section className="pt-4 lg:pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-base lg:text-lg font-medium text-gray-800 dark:text-gray-200 mb-3 lg:mb-4">Custom Instructions</h3>
            <div className="mb-4 lg:mb-6">
              <label htmlFor="custom_formatting_instructions" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Additional Formatting Instructions
              </label>
              <textarea
                id="custom_formatting_instructions"
                name="custom_formatting_instructions"
                rows={3}
                value={formData.custom_formatting_instructions || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-2 border-gray-300 dark:border-gray-700 focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-900 dark:text-white text-sm shadow-sm px-3 lg:px-4 py-2 lg:py-3"
                placeholder="e.g., Start with a summary. Use bold for key terms."
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Add any specific instructions for how you'd like answers to be formatted or structured.
              </p>
            </div>
          </section>
          <div className="mt-4 lg:mt-6">
            {renderSaveChangesButton()}
          </div>
        </div>
      </div>
    </div>
  )
} 