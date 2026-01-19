"use client";

import { CardStack, CardStackItem } from "@/components/ui/card-stack";
import { useScrollAnimation } from "@/hooks/ui";

const items: CardStackItem[] = [
    {
        id: 1,
        title: "Domain Expertise",
        description: "Master your field with targeted preparation",
        imageSrc: "/images/domain.webp",
        imageSrcDark: "/images/domain_dark.webp",
    },
    {
        id: 2,
        title: "Transcripts",
        description: "Review and learn from past interviews",
        imageSrc: "/images/transcripts.webp",
        imageSrcDark: "/images/transcripts_dark.webp",
    },
    {
        id: 3,
        title: "Voice Interview",
        description: "Practice with realistic voice simulations",
        imageSrc: "/images/voice.webp",
        imageSrcDark: "/images/voice_dark.webp",
    },
    {
        id: 4,
        title: "Q&A Practice",
        description: "Sharpen your answers with instant feedback",
        imageSrc: "/images/qa.webp",
        imageSrcDark: "/images/qa_dark.webp",
    },
    {
        id: 5,
        title: "Bookmarks",
        description: "Save and revisit key questions",
        imageSrc: "/images/bookmark.webp",
        imageSrcDark: "/images/bookmark_dark.webp",
    },
];

type PreviewStackProps = {
    title?: React.ReactNode;
    subtitle?: string;
};

export default function PreviewStack({ title, subtitle }: PreviewStackProps) {
    const { ref, isVisible, mounted } = useScrollAnimation();
    const shouldAnimate = mounted && isVisible;

    return (
        <div
            ref={ref}
            className={`w-full transition-all duration-1000 ${shouldAnimate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
            <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
                {(title || subtitle) && (
                    <div className="text-center mb-8">
                        {title && (
                            <h2 className="text-4xl md:text-6xl font-editorial font-light leading-[110%] tracking-[-1.8px]">
                                {title}
                            </h2>
                        )}
                        {subtitle && (
                            <p className="mt-4 text-lg text-muted-foreground">
                                {subtitle}
                            </p>
                        )}
                    </div>
                )}
                <CardStack
                    items={items}
                    initialIndex={0}
                    autoAdvance
                    intervalMs={2500}
                    pauseOnHover
                    showDots
                />
            </div>
        </div>
    );
}
