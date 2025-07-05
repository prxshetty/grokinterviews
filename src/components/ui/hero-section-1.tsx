'use client';
import React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnimatedGroup } from '@/components/ui/animated-group'
import { AuroraBackground } from '@/components/ui/aurora-background'
import { Variants } from 'framer-motion'

const transitionVariants: { item: Variants } = {
    item: {
        hidden: {
            opacity: 0,
            filter: 'blur(12px)',
            y: 12,
        },
        visible: {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            transition: {
                type: 'spring',
                bounce: 0.3,
                duration: 1.5,
            },
        },
    },
}

export function HeroSection() {
    return (
        <>
            <AuroraBackground className="relative pt-0">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-24 md:pt-36">
                        <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
                            <AnimatedGroup variants={transitionVariants}>
                                <Link
                                    href="/topics"
                                    className="hover:bg-background dark:hover:border-t-border bg-muted group mx-auto flex w-fit items-center gap-2 sm:gap-4 rounded-full border p-1 pl-3 sm:pl-4 shadow-md shadow-black/5 transition-all duration-300 dark:border-t-white/5 dark:shadow-zinc-950 max-w-[90vw] sm:max-w-none">
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
                    
                                <h1
                                    className="mt-6 sm:mt-8 max-w-4xl mx-auto text-balance text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-[5.25rem] lg:mt-16 font-semibold leading-tight">
                                    Your Complete Platform for Interviews
                                </h1>
                                <p
                                    className="mx-auto mt-4 sm:mt-6 md:mt-8 max-w-2xl text-balance text-base sm:text-lg text-muted-foreground px-4 sm:px-0">
                                    Master interview questions across AI, Web Development, System Design, and more. Get AI-powered explanations and track your progress in real-time.
                                </p>
                            </AnimatedGroup>

                            <AnimatedGroup
                                variants={{
                                    container: {
                                        visible: {
                                            transition: {
                                                staggerChildren: 0.05,
                                                delayChildren: 0.75,
                                            },
                                        },
                                    },
                                    ...transitionVariants,
                                }}
                                className="mt-12 flex flex-col items-center justify-center gap-2 md:flex-row">
                                <div
                                    key={1}
                                    className="bg-foreground/10 rounded-[14px] border p-0.5">
                                    <Button
                                        asChild
                                        size="lg"
                                        className="rounded-xl px-5 text-base">
                                        <Link href="/topics">
                                            <span className="text-nowrap">Start Learning</span>
                                        </Link>
                                    </Button>
                                </div>
                                <Button
                                    key={2}
                                    asChild
                                    size="lg"
                                    variant="ghost"
                                    className="h-10.5 rounded-xl px-5">
                                    <Link href="/dashboard">
                                        <span className="text-nowrap">View Dashboard</span>
                                    </Link>
                                </Button>
                            </AnimatedGroup>
                        </div>
                    </div>
            </AuroraBackground>
        </>
    )
} 