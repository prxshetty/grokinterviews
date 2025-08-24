"use client";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { useScrollAnimation } from "@/hooks/ui";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

function Feature() {
  const { ref, isVisible, mounted } = useScrollAnimation();
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);

  const features = useMemo(
    () => [
      {
        title: "66,361 Questions",
        description: "Interview Questions - Across comprehensive domains",
      },
      {
        title: "13000+ Hours",
        description: "Hours of Prep Content - Curated video tutorials and lectures",
      },
      {
        title: "3.6M+ Resources",
        description: "Learning Resources - YouTube videos, research papers, PDFs",
      },
      {
        title: "50000+ Questions",
        description: "Interview Questions - Across 5 comprehensive domains",
      },
      {
        title: "762000+ References",
        description: "Book References - Technical books and documentation",
      },
      {
        title: "508000+ Papers",
        description: "Research Papers - Academic papers and preprints",
      },
      {
        title: "0.6s Response",
        description: "Fastest Response Time - AI-powered answer generation",
      },
      {
        title: "307000 Keywords",
        description: "Unique Keywords & Tags",
      },
      {
        title: "535000+ Words",
        description: "Estimated Words in Questions",
      }
    ],
    []
  );

  // Gradient colors for each card
  const gradientColors = [
    'from-blue-500/10 via-cyan-500/5 to-teal-500/10', // Blue to teal
    'from-purple-500/10 via-pink-500/5 to-rose-500/10', // Purple to rose
    'from-emerald-500/10 via-green-500/5 to-lime-500/10', // Emerald to lime
    'from-orange-500/10 via-amber-500/5 to-yellow-500/10', // Orange to yellow
    'from-indigo-500/10 via-violet-500/5 to-purple-500/10', // Indigo to purple
    'from-red-500/10 via-pink-500/5 to-purple-500/10', // Red to purple
    'from-cyan-500/10 via-blue-500/5 to-indigo-500/10', // Cyan to indigo
    'from-teal-500/10 via-emerald-500/5 to-green-500/10', // Teal to green
    'from-amber-500/10 via-orange-500/5 to-red-500/10', // Amber to red
  ];

  const darkGradientColors = [
    'dark:from-blue-500/15 dark:via-cyan-500/8 dark:to-teal-500/15',
    'dark:from-purple-500/15 dark:via-pink-500/8 dark:to-rose-500/15',
    'dark:from-emerald-500/15 dark:via-green-500/8 dark:to-lime-500/15',
    'dark:from-orange-500/15 dark:via-amber-500/8 dark:to-yellow-500/15',
    'dark:from-indigo-500/15 dark:via-violet-500/8 dark:to-purple-500/15',
    'dark:from-red-500/15 dark:via-pink-500/8 dark:to-purple-500/15',
    'dark:from-cyan-500/15 dark:via-blue-500/8 dark:to-indigo-500/15',
    'dark:from-teal-500/15 dark:via-emerald-500/8 dark:to-green-500/15',
    'dark:from-amber-500/15 dark:via-orange-500/8 dark:to-red-500/15',
  ];

  const hoverGradientColors = [
    'hover:before:from-blue-400/8 hover:before:via-cyan-400/4 hover:before:to-teal-400/8',
    'hover:before:from-purple-400/8 hover:before:via-pink-400/4 hover:before:to-rose-400/8',
    'hover:before:from-emerald-400/8 hover:before:via-green-400/4 hover:before:to-lime-400/8',
    'hover:before:from-orange-400/8 hover:before:via-amber-400/4 hover:before:to-yellow-400/8',
    'hover:before:from-indigo-400/8 hover:before:via-violet-400/4 hover:before:to-purple-400/8',
    'hover:before:from-red-400/8 hover:before:via-pink-400/4 hover:before:to-purple-400/8',
    'hover:before:from-cyan-400/8 hover:before:via-blue-400/4 hover:before:to-indigo-400/8',
    'hover:before:from-teal-400/8 hover:before:via-emerald-400/4 hover:before:to-green-400/8',
    'hover:before:from-amber-400/8 hover:before:via-orange-400/4 hover:before:to-red-400/8',
  ];

  // Show 3 cards at a time in a grid
  const visibleFeatures = useMemo(() => {
    const visible = [];
    for (let i = 0; i < 3; i++) {
      const index = (currentFeatureIndex + i) % features.length;
      const colorIndex = index % gradientColors.length;
      visible.push({ 
        ...features[index], 
        displayIndex: i,
        gradientColor: gradientColors[colorIndex],
        darkGradientColor: darkGradientColors[colorIndex],
        hoverGradientColor: hoverGradientColors[colorIndex]
      });
    }
    return visible;
  }, [features, currentFeatureIndex, gradientColors, darkGradientColors, hoverGradientColors]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeatureIndex(prev => (prev + 1) % features.length);
    }, 4500); // Change every 1.5 seconds - faster switching
    
    return () => clearInterval(interval);
  }, [features.length]);

  if (!mounted) {
    return <div className="w-full py-20 lg:py-40 opacity-0" />;
  }

  return (
    <div
      ref={ref}
      className={`w-full px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-32 transition-all duration-1000 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center gap-8 lg:gap-12">
          <div className="flex flex-col gap-4 text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-editorial font-extralight leading-[110%] tracking-[-1.8px] px-4">
              Transform <span className="italic">Your Interview Game</span> with AI Precision
            </h2>
            <p className="mt-4 sm:mt-6 max-w-3xl mx-auto text-balance text-sm sm:text-base md:text-lg text-muted-foreground px-4">
              Master FAANG-level questions with 3.6M+ resources at your fingertips
            </p>
          </div>
          <div className="relative w-full pt-8 lg:pt-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {visibleFeatures.map((feature) => {
                return (
                  <div
                    key={`card-${feature.displayIndex}`}
                    className="flex justify-center"
                  >
                    <CardSpotlight
                      className={`group relative h-[460px] w-[340px] sm:h-[500px] sm:w-[380px] rounded-2xl bg-gradient-to-br ${feature.gradientColor} ${feature.darkGradientColor} backdrop-blur-2xl border border-white/[0.08] dark:border-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-700 hover:scale-[1.02] hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)] p-0 before:absolute before:inset-0 before:bg-gradient-to-br ${feature.hoverGradientColor} before:opacity-0 hover:before:opacity-100 before:transition-all before:duration-500 after:absolute after:inset-0 after:bg-white/[0.02] dark:after:bg-white/[0.05] after:backdrop-blur-sm after:rounded-2xl`}
                      radius={200}
                      color="#ffffff20"
                    >
                      {/* Content */}
                      <div className="relative z-20 h-full flex flex-col p-8 overflow-visible">
                        
                        {/* Header section */}
                        <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6 overflow-visible">
                          
                          {/* Main metric display */}
                          <div className="relative">
                            <div className="text-4xl sm:text-5xl font-light text-foreground leading-tight tracking-tight pt-6">
                              {(feature.title || '').split(' ').map((word, wordIndex) => {
                                const isNumber = /^[\d.,]+/.test(word);
                                if (isNumber) {
                                  return (
                                    <motion.div 
                                      key={`${feature.title}-${currentFeatureIndex}-${wordIndex}`}
                                      initial={{ scale: 0.6, opacity: 0, y: 20 }}
                                      animate={{ scale: 1, opacity: 1, y: 0 }}
                                      exit={{ scale: 0.6, opacity: 0, y: -20 }}
                                      transition={{ 
                                        duration: 0.6,
                                        delay: wordIndex * 0.1,
                                        ease: "backOut",
                                        type: "spring",
                                        stiffness: 200,
                                        damping: 20
                                      }}
                                      className="font-editorial font-extralight bg-gradient-to-br from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent"
                                    >
                                      {word.replace(/[^\d.,]/g, '')}
                                    </motion.div>
                                  );
                                } else {
                                  return (
                                    <motion.div 
                                      key={`${feature.title}-${currentFeatureIndex}-${wordIndex}`}
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -10 }}
                                      transition={{ 
                                        duration: 0.4,
                                        delay: wordIndex * 0.15 + 0.2,
                                        ease: "easeOut"
                                      }}
                                      className="text-sm font-medium text-muted-foreground/90 tracking-wider uppercase mt-2"
                                    >
                                      {word}
                                    </motion.div>
                                  );
                                }
                              })}
                            </div>
                            
                            {/* Subtle glow effect behind number */}
                            <motion.div 
                              key={`glow-${feature.title}-${currentFeatureIndex}`}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 0.2, scale: 1 }}
                              transition={{ 
                                duration: 0.8,
                                delay: 0.1,
                                ease: "easeOut"
                              }}
                              className="absolute inset-0 text-4xl sm:text-5xl font-editorial font-extralight blur-lg bg-gradient-to-br from-blue-500 to-purple-500 bg-clip-text text-transparent -z-10 pt-6"
                            >
                              {(feature.title || '').split(' ')[0]}
                            </motion.div>
                          </div>
                          
                          {/* Decorative divider */}
                          <div className="w-16 h-px bg-gradient-to-r from-transparent via-muted-foreground/30 to-transparent" />
                          
                        </div>
                        
                        {/* Description section */}
                        <div className="flex-shrink-0 pt-4">
                          <motion.p 
                            key={`${feature.description}-${currentFeatureIndex}`}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ 
                              duration: 0.5,
                              delay: 0.4,
                              ease: "easeOut"
                            }}
                            className="text-sm text-muted-foreground/80 font-medium leading-relaxed text-center max-w-[240px] mx-auto"
                          >
                            {feature.description}
                          </motion.p>
                        </div>
                        
                        {/* Bottom accent line */}
                        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent opacity-0 group-hover/spotlight:opacity-100 transition-opacity duration-500" />
                      </div>
                    </CardSpotlight>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Feature };