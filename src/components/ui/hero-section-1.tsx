'use client';
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button';
import { Button1 } from '@/components/ui/button-1';
import { WovenCanvas } from '@/components/ui/woven-canvas';


export function HeroSection() {
    const [isReady, setIsReady] = useState(false);
    
    useEffect(() => {
        // Delay to ensure all components are mounted and styled
        const timer = setTimeout(() => {
            setIsReady(true);
        }, 100);
        
        return () => clearTimeout(timer);
    }, []);
    
    return (
        <>
            <div className="relative w-full overflow-hidden h-[calc(100dvh-4rem)]">
                {/* Woven Canvas Background - positioned to the right and scaled up */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute right-2 top-0 w-2/3 h-full overflow-hidden opacity-30">
                        <WovenCanvas
                            className="absolute inset-0 scale-105"
                            particleCount={25000}
                            opacity={0.6}
                            rotationSpeed={0.01}
                        />
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
                        <h1 className={`mt-6 sm:mt-8 text-balance text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-editorial font-extralight leading-[110%] tracking-[-1.8px] w-full transition-all duration-500 ${isReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '100ms' }}>
                            Your <span className="italic">Complete</span> Platform for Interviews
                        </h1>
                        
                        {/* Description */}
                        <div className={`w-full transition-all duration-500 ${isReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '200ms' }}>
                            <p className="mt-4 sm:mt-6 max-w-2xl text-balance text-sm sm:text-base md:text-lg text-muted-foreground w-full">
                                Master interview questions across AI, Web Development, System Design, and more. Get AI-powered explanations and track your progress in real-time.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className={`mt-8 sm:mt-10 flex flex-row items-center justify-start gap-3 sm:gap-4 w-full transition-all duration-500 ${isReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '300ms' }}>
                            <Button1 href="/topics" className="w-full rounded-xl h-10 sm:h-11 px-4 sm:px-8 text-sm sm:text-base font-medium">
                                Start Learning
                            </Button1>
                            <Button
                                asChild
                                size="lg"
                                variant="ghost"
                                className="flex-1 sm:flex-none rounded-xl h-10 sm:h-11 px-4 sm:px-8 text-sm sm:text-base font-medium">
                                <Link href="/dashboard">
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