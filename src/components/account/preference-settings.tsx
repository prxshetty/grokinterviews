'use client'

import { useState, useEffect } from 'react'
import {
    getAnswerDepth,
    setAnswerDepth,
    getIncludeCode,
    setIncludeCode,
    type AnswerDepth,
} from '@/utils/ai-config-storage'

export function PreferenceSettings() {
    const [answerDepth, setAnswerDepthState] = useState<AnswerDepth>('standard')
    const [includeCode, setIncludeCodeState] = useState(true)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        setAnswerDepthState(getAnswerDepth())
        setIncludeCodeState(getIncludeCode())
    }, [])

    if (!mounted) {
        return (
            <div className="w-full animate-pulse space-y-4">
                <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded"></div>
                <div className="h-16 bg-gray-200 dark:bg-gray-800 rounded"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <section>
                <h3 className="text-base lg:text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">Answer Preferences</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    Customize how AI generates answers for you.
                </p>

                <div className="space-y-4">
                    {/* Answer Depth */}
                    <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">Answer Depth</label>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Control the level of detail in generated answers.
                                </p>
                            </div>

                            <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                {(['brief', 'standard', 'comprehensive'] as AnswerDepth[]).map((depth) => (
                                    <button
                                        key={depth}
                                        onClick={() => {
                                            setAnswerDepthState(depth)
                                            setAnswerDepth(depth)
                                        }}
                                        className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 capitalize ${answerDepth === depth
                                            ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                                            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                                            }`}
                                    >
                                        {depth}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Include Code Snippets */}
                    <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">Include Code Snippets</span>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Show code examples in answers when relevant.
                                </p>
                            </div>

                            <label className="relative inline-block w-11 h-6 align-middle select-none cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={includeCode}
                                    onChange={(e) => {
                                        const val = e.target.checked
                                        setIncludeCodeState(val)
                                        setIncludeCode(val)
                                    }}
                                    className="sr-only"
                                />
                                <div className={`block w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ${includeCode ? 'bg-black dark:bg-white' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                                <div className={`absolute left-0.5 top-0.5 w-5 h-5 rounded-full transition-transform duration-200 ease-in-out bg-white dark:bg-black transform ${includeCode ? 'translate-x-5' : 'translate-x-0'}`}></div>
                            </label>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
