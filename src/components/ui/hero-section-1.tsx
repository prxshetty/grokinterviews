'use client';
import React, { useEffect, useState } from 'react'
import { useCentralizedIntersection } from '@/hooks/ui'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button';
import { Button1 } from '@/components/ui/button-1';

import dynamic from 'next/dynamic'

// Dynamically load the heavy WovenCanvas to keep the initial JS bundle lean
import type { ComponentType } from 'react'

const WovenCanvas = dynamic(
  () => import('@/components/ui/woven-canvas').then(mod => ({ default: mod.WovenCanvas })),
  {
    ssr: false,
    loading: () => null,
  }
) as ComponentType<any>


export function HeroSection() {
    // Observe visibility with optimized settings for scroll performance
    const { ref: sectionRef, isVisible, mounted } = useCentralizedIntersection({ 
        threshold: 0.1, 
        rootMargin: '100px',
        once: false
    })
    const [showCanvas, setShowCanvas] = useState(false)

    // Defer heavy canvas initialization until browser is idle or after short delay
    useEffect(() => {
        const start = () => setShowCanvas(true)
        if (typeof window !== 'undefined') {
            // Use requestIdleCallback if available to avoid blocking render
            // Fallback to timeout for browsers that don\'t support it
            // @ts-ignore
            const ric = window.requestIdleCallback as typeof window.requestIdleCallback | undefined
            if (ric) ric(start, { timeout: 1000 })
            else setTimeout(start, 500)
        }
    }, [])
    const isReady = mounted;    
    return (
        <>
            <div ref={sectionRef} className="relative w-full overflow-hidden h-[calc(100svh-4rem)]">
                {/* Woven Canvas Background - loaded together with content */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute right-2 top-0 w-2/3 h-full overflow-hidden opacity-60">
                        {showCanvas && isVisible && (
                                <WovenCanvas
                                    className="absolute inset-0 scale-105"
                                    particleCount={5000}
                                    opacity={0.6}
                                    rotationSpeed={0.01}
                                />
                            )}
                    </div>
                </div>
                {/* Consistent padding that matches navigation exactly */}
                <div className="relative z-10 mx-auto max-w-7xl px-3 sm:px-4 md:px-6 w-full h-full flex items-end">
                    <div className="text-left max-w-4xl w-full pb-6 sm:pb-8 md:pb-10 ml-0 sm:ml-4 md:ml-8 lg:ml-12">
                        {/* Badge Section */}
                        <div className={`w-full flex justify-start transition-all duration-500 ${isReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                            <Link
                                href="/topics"
                                className="hover:bg-background dark:hover:border-t-border bg-muted group flex w-fit items-center gap-2 sm:gap-3 rounded-full border p-1 pl-3 sm:pl-4 shadow-md shadow-black/5 transition-all duration-300 dark:border-t-white/5 dark:shadow-zinc-950 max-w-[calc(100vw-3rem)] sm:max-w-none">
                                <span className="text-foreground text-xs sm:text-sm truncate">AI-Powered with 3.6M+ Resources</span>
                                <span className="dark:border-background block h-3 sm:h-4 w-0.5 border-l bg-white dark:bg-zinc-700 flex-shrink-0"></span>
                                <div className="bg-background group-hover:bg-muted size-5 sm:size-6 overflow-hidden rounded-full duration-500 flex-shrink-0">
                                    <div className="flex w-10 sm:w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                                        <span className="flex size-5 sm:size-6">
                                            <ArrowRight className="m-auto size-2.5 sm:size-3" />
                                        </span>
                                        <span className="flex size-5 sm:size-6">
                                            <ArrowRight className="m-auto size-2.5 sm:size-3" />
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        </div>
                
                        {/* Main Heading */}
                        <h1 className={`mt-6 sm:mt-8 text-balance text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-editorial font-light leading-[110%] tracking-[-1.8px] w-full transition-all duration-500 ${isReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '100ms' }}>
                            Your <span className="italic font-extralight">Complete</span> Platform for Interviews
                        </h1>
                        
                        {/* Description */}
                        <div className={`w-full transition-all duration-500 ${isReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '200ms' }}>
                            <p className="mt-4 sm:mt-6 max-w-2xl text-balance text-sm sm:text-base md:text-lg text-muted-foreground w-full">
                                Master interview questions across AI, Web Development, System Design, and more. Get AI-powered explanations and track your progress in real-time.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className={`mt-8 sm:mt-10 flex flex-row items-center justify-start gap-3 sm:gap-4 w-full transition-all duration-500 ${isReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '300ms' }}>
                            <Button1 href="/topics" aria-label="Start Learning" className="w-full rounded-xl h-10 sm:h-11 px-4 sm:px-8 text-sm sm:text-base font-medium">
                                Start Learning
                            </Button1>
                            <Button
                                asChild
                                size="lg"
                                variant="ghost"
                                className="flex-1 sm:flex-none rounded-xl h-10 sm:h-11 px-4 sm:px-8 text-sm sm:text-base font-medium">
                                <Link href="/topics">
                                    <span className="text-nowrap">View Interviews</span>
                                </Link>
                            </Button>
                        </div>

                    </div>
                </div>
                

            </div>
        </>
    )
}