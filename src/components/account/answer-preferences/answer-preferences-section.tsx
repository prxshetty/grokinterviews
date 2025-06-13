'use client'

import type { ChangeEvent } from 'react'
import type { AccountFormData, AnswerFormat, AnswerDepth } from '@/app/account/types'

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
  { id: 'use_paper_sources', name: 'Papers', tag: 'Research', description: 'Academic research papers' },
  { id: 'use_website_sources', name: 'Websites', tag: 'Articles', description: 'Relevant web articles' },
  { id: 'use_book_sources', name: 'Books', tag: 'References', description: 'Amazon book links' },
  { id: 'use_image_sources', name: 'Visual Guides', tag: 'Diagrams', description: 'Articles with diagrams & illustrations' }
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
    <div className="flex gap-8">
      {/* Left Panel - Preferences Form (60%) */}
      <div className="w-3/5 bg-white dark:bg-black/60 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Answer Preferences</h2>
        <div className="space-y-8">
          {/* Content Sources */}
          <section>
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Content Sources</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Select which types of supplementary resources should be considered when generating answers.</p>
            <div className="grid grid-cols-3 gap-3 mt-2">
              {contentSources.map((source) => {
                const isSelected = formData[source.id]
                const isComingSoon = false;
                return (
                  <div
                    key={source.id}
                    className={`relative rounded-lg border-2 ${isSelected ? 'border-black dark:border-white' : 'border-gray-200 dark:border-gray-700'} p-4 ${isComingSoon ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:border-gray-400 dark:hover:border-gray-500'} transition-colors`}
                    onClick={() => {
                      if (!isComingSoon) {
                        setFormData(prev => ({
                          ...prev,
                          [source.id]: !isSelected
                        }))
                      }
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{source.name}</h4>
                        <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full border ${isComingSoon ? 'border-amber-500 dark:border-amber-400 text-amber-600 dark:text-amber-400' : 'border-gray-800 dark:border-gray-200 text-gray-800 dark:text-gray-200'} bg-transparent`}>
                          {source.tag}
                        </span>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{source.description}</p>
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
              Select the sources you want to include in your answers. <span className="text-amber-600 dark:text-amber-400">Coming Soon</span> features will be available in future updates.
            </p>
          </section>

          {/* Answer Format */}
          <section className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Answer Format</h3>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Format Style</label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {answerFormats.map((format) => {
                  const isSelected = formData.preferred_answer_format === format.id
                  return (
                    <div
                      key={format.id}
                      className={`relative rounded-lg border-2 ${isSelected ? 'border-black dark:border-white' : 'border-gray-200 dark:border-gray-700'} p-4 cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors`}
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          preferred_answer_format: format.id
                        }))
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{format.name}</h4>
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full border border-gray-800 dark:border-gray-200 text-gray-800 dark:text-gray-200 bg-transparent">
                            {format.tag}
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
                <label htmlFor="preferred_answer_depth" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Answer Depth
                </label>
                <select
                  id="preferred_answer_depth"
                  name="preferred_answer_depth"
                  value={formData.preferred_answer_depth}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      preferred_answer_depth: e.target.value as AnswerDepth
                    }));
                  }}
                  className="mt-1 block w-auto rounded-md border-gray-300 dark:border-gray-700 focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-900 dark:text-white sm:text-sm shadow-sm pl-3 pr-8 py-2"
                >
                  <option value="brief">Brief</option>
                  <option value="standard">Standard</option>
                  <option value="comprehensive">Comprehensive</option>
                </select>
              </div>
            </div>
          </section>

          {/* Custom Instructions */}
          <section className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Custom Instructions</h3>
            <div className="mb-6">
              <label htmlFor="custom_formatting_instructions" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Additional Formatting Instructions
              </label>
              <textarea
                id="custom_formatting_instructions"
                name="custom_formatting_instructions"
                rows={3}
                value={formData.custom_formatting_instructions || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-2 border-gray-300 dark:border-gray-700 focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-900 dark:text-white sm:text-sm shadow-sm px-4 py-3"
                placeholder="e.g., Start with a summary. Use bold for key terms."
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Add any specific instructions for how you'd like answers to be formatted or structured.
              </p>
            </div>
          </section>
          {renderSaveChangesButton()}
        </div>
      </div>

      {/* Right Panel - Answer Preview (40%) */}
      <div className="w-2/5 bg-gradient-to-br from-gray-50 to-white dark:from-black/90 dark:to-black rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Answer Preview</h3>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 mb-6 overflow-auto max-h-[500px]">
          <div className="prose dark:prose-invert prose-sm max-w-none">
            {/* Markdown Preview */}
            {formData.preferred_answer_format === 'markdown' && (
              <div>
                <h4>Binary Search Tree Implementation</h4>
                <p>A Binary Search Tree (BST) is a data structure where each node has at most two children:</p>
                <ul>
                  <li>Left child contains value less than the node</li>
                  <li>Right child contains value greater than the node</li>
                </ul>
                <p>Here's a basic implementation in JavaScript:</p>
                {formData.include_code_snippets && (
                  <pre className="bg-gray-100 dark:bg-gray-900 p-2 rounded">
                    <code className="text-xs">{`class Node {\n  constructor(value) {\n    this.value = value;\n    this.left = null;\n    this.right = null;\n  }\n}`}</code>
                  </pre>
                )}
                {formData.include_latex_formulas && (
                  <p>{`Example LaTeX: $$\sum_{i=1}^n i = \frac{n(n+1)}{2}$$`}</p>
                )}
              </div>
            )}
            {/* Bullet Points Preview */}
            {formData.preferred_answer_format === 'bullet_points' && (
              <div>
                <p><strong>Binary Search Tree Implementation:</strong></p>
                <ul>
                  <li>BST is a tree data structure with specific ordering properties</li>
                  <li>Each node has at most two children (left and right)</li>
                  <li>Left subtree contains values less than the node's value</li>
                  <li>Right subtree contains values greater than the node's value</li>
                  {formData.include_code_snippets && <li>Implementation requires a Node class</li>}
                  <li>Common operations: insert, search, delete, traverse</li>
                  {formData.include_latex_formulas && <li>{`LaTeX Example: $E=mc^2$`}</li>}
                </ul>
              </div>
            )}
            {/* Paragraph Preview */}
            {formData.preferred_answer_format === 'paragraph' && (
              <div>
                <p>{`A Binary Search Tree (BST) is a fundamental data structure... ${formData.include_code_snippets ? 'It can be implemented with a Node class.' : ''} ${formData.include_latex_formulas ? 'Mathematical principles like $O(\log n)$ are relevant.' : ''}`}</p>
              </div>
            )}
            {/* Table Preview */}
            {formData.preferred_answer_format === 'table' && (
              <div>
                <p><strong>Binary Search Tree Operations</strong></p>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-800">
                        <th className="border border-gray-300 dark:border-gray-700 px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Operation</th>
                        <th className="border border-gray-300 dark:border-gray-700 px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Complexity</th>
                        {formData.include_code_snippets && <th className="border border-gray-300 dark:border-gray-700 px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Code Hint</th>}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 dark:border-gray-700 px-3 py-2">Insert</td>
                        <td className="border border-gray-300 dark:border-gray-700 px-3 py-2">O(log n)</td>
                        {formData.include_code_snippets && <td className="border border-gray-300 dark:border-gray-700 px-3 py-2">Node creation</td>}
                      </tr>
                       {formData.include_latex_formulas && (
                        <tr>
                            <td colSpan={formData.include_code_snippets ? 3 : 2} className="border border-gray-300 dark:border-gray-700 px-3 py-2 text-center">{`Formula: $T(n) = 2T(n/2) + O(1)$`}</td>
                        </tr>
                       )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-auto">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Settings</h4>
          <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
            <p><span className="font-medium">Format:</span> {formData.preferred_answer_format.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
            <p><span className="font-medium">Depth:</span> {formData.preferred_answer_depth.charAt(0).toUpperCase() + formData.preferred_answer_depth.slice(1)}</p>
            <p><span className="font-medium">Add-ons:</span>
              {[formData.include_code_snippets ? 'Code Snippets' : null,
                formData.include_latex_formulas ? 'LaTeX Formulas' : null]
                .filter(Boolean)
                .join(', ') || 'None'}
            </p>
            <p><span className="font-medium">Sources:</span> {(Object.keys(formData) as Array<ContentSourceKey>)
                .filter(key => contentSources.some(cs => cs.id === key) && formData[key] === true)
                .map(key => contentSources.find(cs => cs.id === key)?.name || key.replace('use_','').replace('_sources','').replace('_', ' '))
                .join(', ') || 'None selected'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 