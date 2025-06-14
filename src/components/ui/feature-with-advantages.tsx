import { Check } from "lucide-react";

function Feature() {
  return (
    <div className="w-full py-20 lg:py-40">
      <div className="container mx-auto">
        <div className="flex gap-4 flex-col items-start">
          <div className="flex gap-2 flex-col">
            <h2 className="text-3xl md:text-5xl tracking-tighter lg:max-w-xl font-light">
              Your Ultimate AI-Powered Interview Coach
            </h2>
            <p className="text-lg max-w-xl lg:max-w-xl leading-relaxed tracking-tight text-muted-foreground">
            Why GrokInterviews?
            </p>
          </div>
          <div className="flex gap-10 pt-12 flex-col w-full">
            <div className="grid grid-cols-2 items-start lg:grid-cols-3 gap-10">
              <div className="flex flex-row gap-6 w-full items-start">
                <Check className="w-4 h-4 mt-2 text-primary" />
                <div className="flex flex-col gap-1">
                  <p>Extensive Content Library</p>
                  <p className="text-muted-foreground text-sm">
                    Access over 3.6 million resources and 81,000+ technical questions.
                  </p>
                </div>
              </div>
              <div className="flex flex-row gap-6 items-start">
                <Check className="w-4 h-4 mt-2 text-primary" />
                <div className="flex flex-col gap-1">
                  <p>Comprehensive Resource Collection</p>
                  <p className="text-muted-foreground text-sm">
                    Curated from PDFs, websites, books, YouTube videos, research papers, articles, and blogs.
                  </p>
                </div>
              </div>
              <div className="flex flex-row gap-6 items-start">
                <Check className="w-4 h-4 mt-2 text-primary" />
                <div className="flex flex-col gap-1">
                  <p>Upcoming Features</p>
                  <p className="text-muted-foreground text-sm">
                    Voice interview prep & course recommendations.
                  </p>
                </div>
              </div>
              <div className="flex flex-row gap-6 w-full items-start">
                <Check className="w-4 h-4 mt-2 text-primary" />
                <div className="flex flex-col gap-1">
                  <p>FAANG-Level Questions</p>
                  <p className="text-muted-foreground text-sm">
                    Prepare with questions designed to simulate real FAANG interviews.
                  </p>
                </div>
              </div>
              <div className="flex flex-row gap-6 items-start">
                <Check className="w-4 h-4 mt-2 text-primary" />
                <div className="flex flex-col gap-1">
                  <p>Advanced Progress Tracking</p>
                  <p className="text-muted-foreground text-sm">
                    Visually track your progress through topics and stay motivated.
                  </p>
                </div>
              </div>
              <div className="flex flex-row gap-6 items-start">
                <Check className="w-4 h-4 mt-2 text-primary" />
                <div className="flex flex-col gap-1">
                  <p>Completely Free</p>
                  <p className="text-muted-foreground text-sm">
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