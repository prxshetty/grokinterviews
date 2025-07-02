import { Check } from "lucide-react";
import { useScrollAnimation } from '@/hooks/use-scroll-animation';

function Feature() {
  const { ref, isVisible, mounted } = useScrollAnimation();

  if (!mounted) {
    return (
      <div className="w-full py-20 lg:py-40 opacity-0">
        {/* Skeleton content */}
      </div>
    );
  }

  return (
    <div 
      ref={ref}
      className={`w-full py-20 lg:py-40 transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
    >
      <div className="container mx-auto">
        <div className="flex gap-4 flex-col items-start">
          <div className="flex gap-2 flex-col">
            <h2 className="text-2xl sm:text-3xl md:text-5xl tracking-tighter lg:max-w-xl font-light">
              Your Ultimate AI-Powered Interview Coach
            </h2>
            <p className="text-base sm:text-lg max-w-xl lg:max-w-xl leading-relaxed tracking-tight text-muted-foreground">
            Why GrokInterviews?
            </p>
          </div>
          <div className="flex gap-10 pt-12 flex-col w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-10">
              <div className="flex flex-row gap-6 w-full items-start">
                <Check className="w-6 h-6 sm:w-5 sm:h-5 mt-2 sm:mt-3 text-primary flex-shrink-0" />
                <div className="flex flex-col gap-1">
                  <p>Extensive Content Library</p>
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    Access over 3.6 million resources and 81,000+ technical questions.
                  </p>
                </div>
              </div>
              <div className="flex flex-row gap-6 items-start">
                <Check className="w-5 h-5 sm:w-4 sm:h-4 mt-1 sm:mt-2 text-primary flex-shrink-0" />
                <div className="flex flex-col gap-1">
                  <p>Comprehensive Resource Collection</p>
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    Sourced from articles, videos, books, and research papers.
                  </p>
                </div>
              </div>
              <div className="flex flex-row gap-6 items-start">
                <Check className="w-5 h-5 sm:w-4 sm:h-4 mt-1 sm:mt-2 text-primary flex-shrink-0" />
                <div className="flex flex-col gap-1">
                  <p>Upcoming Features</p>
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    Voice interview prep & course recommendations.
                  </p>
                </div>
              </div>
              <div className="flex flex-row gap-6 w-full items-start">
                <Check className="w-5 h-5 sm:w-4 sm:h-4 mt-1 sm:mt-2 text-primary flex-shrink-0" />
                <div className="flex flex-col gap-1">
                  <p>FAANG-Level Questions</p>
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    Prepare with questions designed to simulate real FAANG interviews.
                  </p>
                </div>
              </div>
              <div className="flex flex-row gap-6 items-start">
                <Check className="w-5 h-5 sm:w-4 sm:h-4 mt-1 sm:mt-2 text-primary flex-shrink-0" />
                <div className="flex flex-col gap-1">
                  <p>Advanced Progress Tracking</p>
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    Visually track your progress through topics and stay motivated.
                  </p>
                </div>
              </div>
              <div className="flex flex-row gap-6 items-start">
                <Check className="w-5 h-5 sm:w-4 sm:h-4 mt-1 sm:mt-2 text-primary flex-shrink-0" />
                <div className="flex flex-col gap-1">
                  <p>Completely Free</p>
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    No subscriptions, no hidden fees. Just focused interview prep.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Feature }; 