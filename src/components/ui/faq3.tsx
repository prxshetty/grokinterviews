'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Faq3Props } from "@/types/faq";
import { DEFAULT_FAQ_PROPS } from "@/data/faq";

/**
 * FAQ3 Component
 * A collapsible FAQ section with optional support section
 * 
 * @example
 * ```tsx
 * <Faq3 
 *   heading="Common Questions"
 *   description="Find answers to common questions"
 *   items={faqItems}
 * />
 * ```
 */
const Faq3 = ({
  heading = DEFAULT_FAQ_PROPS.heading,
  description = DEFAULT_FAQ_PROPS.description,
  items = DEFAULT_FAQ_PROPS.items,
}: Faq3Props) => {
  return (
    <section className="py-32">
      <div className="container space-y-16">
        <div className="mx-auto flex max-w-3xl flex-col text-left md:text-center">
          <h2 className="mb-6 text-3xl md:text-4xl font-editorial font-extralight text-black dark:text-white">
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
              <AccordionTrigger className="transition-opacity duration-200 hover:no-underline hover:opacity-60 text-left">
                <div className="font-normal text-black dark:text-white py-2 sm:py-1 lg:py-2 lg:text-lg pr-4 leading-relaxed break-words">
                  {item.question}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 sm:mb-1 lg:mb-2">
                <div className="text-muted-foreground lg:text-lg leading-relaxed">
                  {item.answer}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        {/* Support section has been removed */}
      </div>
    </section>
  );
};

export { Faq3 };