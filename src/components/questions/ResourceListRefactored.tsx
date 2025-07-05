'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, LayoutGroup, useReducedMotion, type Variants } from 'framer-motion';
import { InlineLoadingSpinner } from '@/components/ui';
import { TabNav } from '@/components/ui/tab-nav';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useIsMobile, useIsTabletOrSmaller } from '@/hooks/ui';

import { ResourcePreview } from './ResourcePreview';
import { ResourceCard } from './ResourceCard';

// Import custom hooks
import { useResources, useResourceTabs } from '@/hooks/data';
import { useAuth, useUserPreferences } from '@/hooks/auth';

import { Resource } from './ResourceUtils';

interface ResourceListProps {
  questionId: number | null;
  domain?: string | null;
  topicId?: number | null;
  categoryId?: number | null;
  subcategoryId?: number | null;
  isResourcesVisible?: boolean;
  onResourcesVisibilityChange?: (visible: boolean) => void;
}

export function ResourceList({ 
  questionId, 
  domain, 
  topicId, 
  categoryId, 
  subcategoryId, 
  isResourcesVisible = true 
}: ResourceListProps) {
  // UI state for scroll navigation
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const isTabletOrSmaller = useIsTabletOrSmaller();

  // Scroll functions
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -280, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 280, behavior: 'smooth' });
    }
  };

  // Check scroll position to show/hide arrows
  const checkScrollPosition = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  // Custom hooks for data management
  const { resources, loading: loadingData, error } = useResources({
    questionId,
    domain: domain || null,
    topicId: topicId || null,
    categoryId: categoryId || null,
    subcategoryId: subcategoryId || null
  });

  const { isLoggedIn, user } = useAuth();
  
  const { preferences, loading: loadingPrefs } = useUserPreferences({
    isLoggedIn,
    userId: user?.id || null
  });

  const { tabs, activeTab, activeTabType, setActiveTabType, featuredResource, setFeaturedResource } = useResourceTabs({
    resources,
    preferences
  });

  // Initialize scroll position check
  useEffect(() => {
    const timer = setTimeout(() => {
      checkScrollPosition();
    }, 100);
    return () => clearTimeout(timer);
  }, [activeTab]);

  // Loading states
  if (loadingData || loadingPrefs) {
    return (
      <div className="flex justify-center items-center h-64">
        <InlineLoadingSpinner />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        <p>Error loading resources: {error}</p>
      </div>
    );
  }

  // No resources state
  if (!resources || resources.length === 0) {
    return (
      <div className="text-gray-500 text-center p-4">
        <p>No resources available for this question.</p>
      </div>
    );
  }

  // No tabs available
  if (!tabs || tabs.length === 0) {
    return (
      <div className="text-gray-500 text-center p-4">
        <p>No resources match your preferences.</p>
      </div>
    );
  }

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.3,
      },
    },
  };

  return (
    <div className="w-full">
      {/* Tab Navigation - More compact on mobile */}
      <div className={isMobile ? 'mb-4' : 'mb-6'}>
        <TabNav
          items={tabs.map(tab => ({
            id: tab.type,
            label: tab.title,
            onClick: () => setActiveTabType(tab.type)
          }))}
          activeTab={activeTabType || ''}
          onTabChange={(tabId) => setActiveTabType(tabId)}
        />
      </div>

      {/* Resources Section - Conditionally Rendered */}
      {isResourcesVisible && (
        <>
          {/* Featured Resource Preview - Optimized for iPad */}
          {featuredResource && (
            <div className={isMobile ? 'mb-3 -mt-2' : 'mb-4 -mt-4'}>
              <ResourcePreview
                resource={featuredResource}
                onResourceClick={() => {
                  if (featuredResource.url) {
                    window.open(featuredResource.url, '_blank', 'noopener,noreferrer');
                  }
                }}
              />
            </div>
          )}

          {/* Resource Grid - Clean horizontal scrolling with navigation buttons */}
          {activeTab && (
            <div className="relative">
              {/* Left Navigation Button - now always visible if needed */}
              {showLeftArrow && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 shadow-md h-10 w-10"
                  onClick={scrollLeft}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              )}
              
              {/* Right Navigation Button - now always visible if needed */}
              {showRightArrow && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 shadow-md h-10 w-10"
                  onClick={scrollRight}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              )}
              
              <div 
                ref={scrollContainerRef}
                className="overflow-x-auto scrollbar-hide"
                onScroll={checkScrollPosition}
                onLoad={checkScrollPosition}
              >
                <LayoutGroup>
                  <motion.div
                    className={`flex gap-4 ${isMobile ? 'pb-1' : 'pb-2'}`}
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    style={{ minWidth: 'max-content' }}
                  >
                    {activeTab.resources.map((resource, index) => (
                      <motion.div
                        key={`${resource.id}-${index}`}
                        variants={itemVariants}
                        layout
                        className={`flex-shrink-0 ${isMobile ? 'w-56' : 'w-64'}`}
                      >
                        <ResourceCard
                          resource={resource}
                          index={index}
                          onResourceClick={() => setFeaturedResource(resource)}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                </LayoutGroup>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
