'use client';
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import CompanyList from '@/components/home/CompanyList'

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
            <div className="relative w-full overflow-hidden min-h-[100dvh]">
                {/* Consistent padding that matches navigation exactly */}
                <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 pt-24 sm:pt-28 md:pt-32 lg:pt-40 xl:pt-48 w-full">
                    <div className="text-center mx-auto max-w-4xl w-full">
                        {/* Badge Section */}
                        <div className={`w-full flex justify-center transition-all duration-500 ${isReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
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
                        <h1 className={`mt-6 sm:mt-8 text-balance text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight w-full transition-all duration-500 ${isReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '100ms' }}>
                            Your Complete Platform for Interviews
                        </h1>
                        
                        {/* Description */}
                        <div className={`w-full transition-all duration-500 ${isReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '200ms' }}>
                            <p className="mx-auto mt-4 sm:mt-6 max-w-2xl text-balance text-sm sm:text-base md:text-lg text-muted-foreground w-full">
                                Master interview questions across AI, Web Development, System Design, and more. Get AI-powered explanations and track your progress in real-time.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className={`mt-8 sm:mt-10 flex flex-row items-center justify-center gap-3 sm:gap-4 w-full transition-all duration-500 ${isReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '300ms' }}>
                            <div className="bg-foreground/10 rounded-[14px] border p-0.5 flex-1 sm:w-auto">
                                <Button
                                    asChild
                                    size="sm"
                                    className="w-full sm:w-auto rounded-xl h-8 sm:h-11 px-1 sm:px-6 text-xs sm:text-base">
                                    <Link href="/topics">
                                        <span className="text-nowrap">Start Learning</span>
                                    </Link>
                                </Button>
                            </div>
                            <Button
                                asChild
                                size="sm"
                                variant="ghost"
                                className="flex-1 sm:w-auto rounded-xl h-8 sm:h-11 px-1 sm:px-6 text-xs sm:text-base">
                                <Link href="/dashboard">
                                    <span className="text-nowrap">View Dashboard</span>
                                </Link>
                            </Button>
                        </div>

                    </div>
                </div>
                
                {/* Company List Integration - Outside constrained containers */}
                <div className={`mt-6 sm:mt-8 md:mt-10 lg:mt-12 w-full transition-all duration-500 ${isReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '400ms' }}>
                    <CompanyList />
                </div>
            </div>
        </>
    )
} 