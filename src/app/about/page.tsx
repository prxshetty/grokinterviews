import { Metadata } from 'next'

import { Faq3 } from '@/components/ui/faq3'
import { CodeBlock } from '../../components/utils/code-block'
import { BackgroundPathsOnly } from '@/components/home/background'

export const metadata: Metadata = {
  title: 'About GrokInterviews',
  description:
    'Learn more about GrokInterviews, an AI-powered platform for interview preparation, and how we help you ace your technical interviews.',
}

const grokInterviewFaqItems = [
  {
    id: 'faq-grok-1',
    question: 'What is GrokInterviews?',
    answer:
      'GrokInterviews is a comprehensive, AI-enhanced interview preparation platform with over 3.6 million curated resources and 81,000+ technical questions. Our mission is to provide the best tools and content to help software engineers and data scientists ace their interviews.',
  },
  {
    id: 'faq-grok-2',
    question: 'How does the AI answer generation work?',
    answer:
      'We utilize multiple cutting-edge Large Language Models (LLMs) via the Groq API to generate dynamic, high-quality answers to technical questions. Users can even select their preferred AI model based on their learning preferences.',
  },
  {
    id: 'faq-grok-3',
    question: 'What are resources?',
    answer:
      'Resources are collected using a custom-built web search meta search engine hosted locally, then preprocessed, filtered, and embedded to compute a relevance score for each question. These resources are stored in our database and linked to every question. While some may still be not fully relevant, we are continuously working to improve the quality and accuracy of our resource matching.',
  },
  {
    id: 'faq-grok-4',
    question: 'Can I track my progress?',
    answer:
      'Absolutely! We offer advanced progress tracking with real-time analytics, hierarchical progress calculation (from domain down to individual questions), visual activity grids, and an intelligent bookmarking system.',
  },
  {
    id: 'faq-grok-5',
    question: 'Is GrokInterviews free to use?',
    answer:
      'GrokInterviews offers a substantial amount of free content and features. Advanced AI-powered features and personalized learning paths may be part of a premium offering in the future. The platform is open source, and contributions are welcome!',
  },
  {
    id: 'faq-grok-6',
    question: 'What future features are planned?',
    answer:
      'We are exploring exciting updates such as voice interviews, Duolingo-style roadmaps for every domain, both typed and voice-based quizzes, streak tracking, and a dedicated section for coding questions with virtual machines for live testing. These features will be prioritized if the platform gains traction!',
  },
]

const faq3ComponentCode = `import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

interface Faq3Props {
  heading: string;
  description: string;
  items?: FaqItem[];
  supportHeading: string;
  supportDescription: string;
  supportButtonText: string;
  supportButtonUrl: string;
}

const faqItems = [
  // ... default items array as in the component file
];

const Faq3 = ({
  heading = "Frequently asked questions",
  description = "Find answers to common questions about our products. Can't find what you're looking for? Contact our support team.",
  items = faqItems,
  supportHeading = "Need more support?",
  supportDescription = "Our dedicated support team is here to help you with any questions or concerns. Get in touch with us for personalized assistance.",
  supportButtonText = "Contact Support",
  supportButtonUrl = "https://www.shadcnblocks.com",
}: Faq3Props) => {
  return (
    <section className="py-32">
      <div className="container space-y-16">
        <div className="mx-auto flex max-w-3xl flex-col text-left md:text-center">
          <h2 className="mb-3 text-3xl font-semibold md:mb-4 lg:mb-6 lg:text-4xl">
            {heading}
          </h2>
          <p className="text-muted-foreground lg:text-lg">{description}</p>
        </div>
        <Accordion
          type="single"
          collapsible
          className="mx-auto w-full lg:max-w-3xl"
        >
          {items.map((item) => (
            <AccordionItem key={item.id} value={item.id}>
              <AccordionTrigger className="transition-opacity duration-200 hover:no-underline hover:opacity-60">
                <div className="font-medium sm:py-1 lg:py-2 lg:text-lg">
                  {item.question}
                </div>
              </AccordionTrigger>
              <AccordionContent className="sm:mb-1 lg:mb-2">
                <div className="text-muted-foreground lg:text-lg">
                  {item.answer}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        {/* ... rest of the Faq3 JSX ... */}
      </div>
    </section>
  );
};

export { Faq3 };
`

const shadcnAccordionCode = `"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

const Accordion = AccordionPrimitive.Root

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-b", className)}
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn("pb-4 pt-0", className)}>{children}</div>
  </AccordionPrimitive.Content>
))

AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
`

const shadcnAvatarCode = `"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className,
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className,
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
`

const shadcnButtonCode = `import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
`

const tailwindConfigCode = `/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
}
`

const npmInstallCommand = `npm install lucide-react @radix-ui/react-accordion @radix-ui/react-avatar @radix-ui/react-slot class-variance-authority`

const avatarImagePlaceholderCode = `<AvatarImage src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fDE?w=50&h=50&fit=crop&crop=faces" />
<AvatarFallback>JD</AvatarFallback>`

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white w-full pt-4 relative font-sans">
      {/* Background Paths */}
      <div className="absolute inset-0 -z-10">
        <BackgroundPathsOnly />
      </div>
      
      <main className="container mx-auto px-8 md:px-12 py-16 sm:py-24 relative z-10">
        {/* Header Section - Styled like src/app/page.tsx */}
        <header className="mb-16 md:mb-24 text-left">
          <div className="max-w-3xl">
            <h2 className="text-2xl md:text-3xl text-gray-600 dark:text-gray-400 font-light tracking-wide">
              About Us
            </h2>
            <h1 className="text-5xl md:text-7xl mt-2 font-light tracking-tight leading-tight text-black dark:text-white">
              GrokInterviews
            </h1>
          </div>
        </header>

        {/* Our Mission Section - Styled like src/app/page.tsx */}
        <section className="mb-16 md:mb-24 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-normal text-black dark:text-white mb-6">
            Our Mission
          </h2>
          <div className="space-y-4 text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
            <p>
              At GrokInterviews, our mission is to empower software engineers and
              data scientists with the most comprehensive and intelligent tools
              for interview preparation. We aggregate, organize, and present a
              vast array of resources, enhanced by AI, to help you master
              technical concepts and excel in your interviews.
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="my-16 md:my-24">
          <Faq3
            heading="Frequently Asked Questions"
            description="Find answers to common questions about our platform and features."
            items={grokInterviewFaqItems}
            supportHeading="Still have questions or feedback?"
            supportDescription="We're here to help and always looking to improve. Let us know what's on your mind."
            supportButtonText="Email Us"
            supportButtonUrl="mailto:support@grokinterviews.com"
          />
        </section>
      </main>
    </div>
  )
} 