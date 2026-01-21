'use client';

import { Check } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/ui';

export default function WaveSection() {
    const { ref, isVisible, mounted } = useScrollAnimation();
    const shouldAnimate = mounted && isVisible;

    return (
        <div
            ref={ref}
            className={`w-full py-24 sm:py-32 transition-all duration-1000 ${shouldAnimate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-editorial font-light leading-[110%] tracking-[-1.8px] text-foreground sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl mb-6">
                        Ready to ace the <span className="italic font-extralight">Technical</span> Interview?
                    </h2>
                    <p className="mt-4 text-base sm:text-lg md:text-xl text-muted-foreground mx-auto max-w-xl">
                        An unfair advantage in a crowded market. Replace scattered prep with a single, intelligent ecosystem designed to turn interviews into offers.
                    </p>
                </div>
                <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
                    <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2">
                        <div className="flex flex-col">
                            <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-foreground">
                                <Check className="h-5 w-5 flex-none text-foreground" aria-hidden="true" />
                                Real-time Voice AI
                            </dt>
                            <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                                <p className="flex-auto">
                                    Practice authentic interviews with advanced voice simulations and instant feedback with report generation.
                                </p>
                            </dd>
                        </div>
                        <div className="flex flex-col">
                            <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-foreground">
                                <Check className="h-5 w-5 flex-none text-foreground" aria-hidden="true" />
                                Curated Resources
                            </dt>
                            <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                                <p className="flex-auto">
                                    Access 3.6M+ vetted videos, research papers, and guides hierarchically organized across 5 major technical domains.
                                </p>
                            </dd>
                        </div>
                        <div className="flex flex-col">
                            <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-foreground">
                                <Check className="h-5 w-5 flex-none text-foreground" aria-hidden="true" />
                                Smart Progress
                            </dt>
                            <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                                <p className="flex-auto">
                                    Track your growth with precision across 80,000+ technical questions and visualize your mastery with dynamic analytics.
                                </p>
                            </dd>
                        </div>
                        <div className="flex flex-col">
                            <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-foreground">
                                <Check className="h-5 w-5 flex-none text-foreground" aria-hidden="true" />
                                Personalized Learning
                            </dt>
                            <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                                <p className="flex-auto">
                                    Tailor your prep with intelligent bookmarking and adaptive learning paths that evolve as you master new topics.
                                </p>
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>
        </div>
    );
}
