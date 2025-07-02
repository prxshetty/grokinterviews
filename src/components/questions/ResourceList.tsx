'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, LayoutGroup, useReducedMotion, type Variants } from 'framer-motion';
import { supabase } from '@/utils/supabase/client';
import Image, { type ImageProps } from 'next/image';
import { InlineLoadingSpinner, Card, Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui';
import { TabNav } from '@/components/ui/tab-nav';
import { ExternalLink, Video, FileText, Globe, BookOpen, Image as ImageIcon, ArrowUpRight, X } from 'lucide-react';
import { type Database } from '@/types/database.types';

// Helper function to extract YouTube video ID from URL
function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && typeof match[2] === 'string' && match[2].length === 11) ? match[2] : null;
}

// Helper function to extract domain from URL for website favicons
function getDomainFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
}

// Helper function to get website favicon
function getWebsiteFavicon(url: string): string | null {
  const domain = getDomainFromUrl(url);
  return domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null;
}

// Helper function to create gradient backgrounds based on resource type
function getGradientForType(_type: string): string {
  // Using a standard gradient for all types to maintain consistency
  return 'from-gray-600 to-slate-600';
}

interface YouTubeThumbnailWithFallbackProps extends Omit<ImageProps, 'src' | 'alt'> {
  videoId: string;
  alt: string;
  className?: string;
}

function YouTubeThumbnailWithFallback({ videoId, alt, className, ...props }: YouTubeThumbnailWithFallbackProps) {
  const qualities = useMemo(() => ['maxresdefault', 'sddefault', 'hqdefault', 'mqdefault'], []);
  const [currentQualityIndex, setCurrentQualityIndex] = useState(0);
  const [imgSrc, setImgSrc] = useState(`https://img.youtube.com/vi/${videoId}/${qualities[0]}.jpg`);

  useEffect(() => {
    // Reset when videoId changes
    setCurrentQualityIndex(0);
    setImgSrc(`https://img.youtube.com/vi/${videoId}/${qualities[0]}.jpg`);
  }, [videoId, qualities]);

  const handleError = () => {
    if (currentQualityIndex < qualities.length - 1) {
      setCurrentQualityIndex(prevIndex => prevIndex + 1);
      setImgSrc(`https://img.youtube.com/vi/${videoId}/${qualities[currentQualityIndex + 1]}.jpg`);
    } else {
      // All fallbacks failed, set to a known placeholder or leave as last attempted if preferred
      // For now, it will just show the broken image icon for the last attempt.
      // Or, we can set imgSrc to a placeholder image URL or null to render the placeholder div below.
      setImgSrc(''); // Indicate failure to load any valid thumbnail
    }
  };

  if (!imgSrc) { // If imgSrc is empty string, all fallbacks failed
    return (
      <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${getGradientForType('video')} rounded-t-3xl relative overflow-hidden ${className || ''}`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]"></div>
        </div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 sm:p-4 mb-2 shadow-lg">
            <Video className="w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow-lg" />
          </div>
          <span className="text-white/95 text-xs sm:text-sm font-medium uppercase tracking-wider">
            Preview Unavailable
          </span>
        </div>
      </div>
    );
  }

  return (
    <Image
      src={imgSrc}
      alt={alt}
      onError={handleError}
      className={className} // Pass down className
      {...props} // Pass down other ImageProps like layout, objectFit, priority
    />
  );
}

// Remove old DbResource and redefine Resource to match actual DB schema
// type DbResource = Database['public']['Tables']['resources']['Row'];
type UserPreferences = Database['public']['Tables']['user_preferences']['Row'];
// type Resource = DbResource & { previewUrl?: string };

interface Resource {
  id: number; // Assuming id is number based on typical DB primary keys
  question_id: number | null; // From existing usage, assuming number
  type: string | null; // Correct field from DB schema
  title: string | null;
  url: string | null;
  description: string | null; // Added back for metadata descriptions
  created_at: string; // Based on original definition
  relevance_score?: number | null; // From information_schema query
  previewUrl?: string | null; // Can be null now
  duration?: string | null; // Optional field for video duration (e.g., "10 min", "1:23:45")
  videoId?: string | null; // Added videoId
  // Add other fields from your 'resources' table if they are used by the component
}

interface ResourceListProps {
  questionId: number | null;
  domain?: string | null;
  topicId?: number | null;
  categoryId?: number | null;
  subcategoryId?: number | null;
}

// Define constants outside the component
const TYPE_DISPLAY_ORDER: string[] = ['video', 'pdf', 'paper', 'website', 'book', 'image', 'other'];

const TYPE_DISPLAY_INFO: { [key: string]: { Icon: React.ElementType, title: string } } = {
  video: { Icon: Video, title: 'Videos' },
  pdf: { Icon: FileText, title: 'PDFs' },
  paper: { Icon: FileText, title: 'Papers' },
  website: { Icon: Globe, title: 'Websites' },
  book: { Icon: BookOpen, title: 'Books' },
  image: { Icon: ImageIcon, title: 'Illustrations' },
  other: { Icon: ExternalLink, title: 'Other Resources' },
};

// Define default preferences
const DEFAULT_USER_PREFERENCES: Partial<UserPreferences> = {
  use_youtube_sources: true,
  use_pdf_sources: true,
  use_paper_sources: true,
  use_website_sources: true,
  use_book_sources: false,
  use_image_sources: false,
};

export function ResourceList({ questionId, domain, topicId, categoryId, subcategoryId }: ResourceListProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loadingData, setLoadingData] = useState(true); // For resource data
  const [loadingPrefs, setLoadingPrefs] = useState(true); // For preferences
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [activeTabType, setActiveTabType] = useState<string | null>(null);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const shouldReduceMotion = useReducedMotion();

  // Effect for fetching main resource data
  useEffect(() => {
    let isMounted = true;
    async function fetchDataAndResources() {
      if (!isMounted || !questionId) {
        if (questionId === null && isMounted) setError('Question ID is required.');
        setLoadingData(false);
        return;
      }
      setLoadingData(true);
      setError(null);

      try {
        let finalTopicId = topicId;
        let finalCategoryId = categoryId;
        const finalSubcategoryId = subcategoryId;

        // Attempt to derive missing IDs if possible
        if ((!finalTopicId || !finalCategoryId) && questionId) {
          try {
            const questionDetailsResponse = await supabase
              .from('questions')
              .select(`
                category_id,
                categories (
                  topic_id
                )
              `)
              .eq('id', questionId)
              .single();

            if (questionDetailsResponse.error) {
              throw new Error(`Failed to fetch question details: ${questionDetailsResponse.error.message}`);
            }

            if (questionDetailsResponse.data) {
              finalCategoryId = finalCategoryId || questionDetailsResponse.data.category_id;
              if (questionDetailsResponse.data.categories && questionDetailsResponse.data.categories.length > 0) {
                // Access topic_id from the first element of the categories array
                finalTopicId = finalTopicId || questionDetailsResponse.data.categories[0]?.topic_id;
              }
            }
          } catch {
          }
        }
        
        const queryParams = new URLSearchParams();
        if (typeof questionId === 'number') {
            queryParams.append('questionId', questionId.toString());
        }
        if (typeof domain === 'string' && domain) {
            queryParams.append('domain', domain);
        }
        if (typeof finalTopicId === 'number') {
            queryParams.append('topicId', finalTopicId.toString());
        }
        if (typeof finalCategoryId === 'number') {
            queryParams.append('categoryId', finalCategoryId.toString());
        }
        if (typeof finalSubcategoryId === 'number') {
            queryParams.append('subcategoryId', finalSubcategoryId.toString());
        }
        
        const response = await fetch(`/api/resources?${queryParams.toString()}`);
        
        if (!isMounted) {
          return;
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch resources: ${response.status} ${errorText}`);
        }

        const data: Resource[] = await response.json();
        
        // Enhance with preview URLs if necessary (client-side specific logic)
        const enhancedData = data.map(resource => {
          const { previewUrl: originalPreviewUrl, description: originalDescription, ...restOfResource } = resource;
          let calculatedPreviewUrl: string | undefined = originalPreviewUrl === null ? undefined : originalPreviewUrl;
          let videoId: string | null = null;

          if (resource.url) {
            if ((resource.type === 'youtube' || resource.type === 'video')) {
              videoId = getYouTubeVideoId(resource.url);
              calculatedPreviewUrl = undefined; // For YouTube, new component handles URL, so no direct previewUrl here
            }
            
            if (resource.type === 'website' && resource.url && !videoId) {
              const favicon = getWebsiteFavicon(resource.url);
              calculatedPreviewUrl = favicon === null ? undefined : favicon;
            }
          }

          const description = originalDescription || null; 

          return { 
            ...restOfResource, 
            description, 
            previewUrl: calculatedPreviewUrl === undefined ? null : calculatedPreviewUrl, // Ensure type matches Resource interface
            videoId 
          };
        });

        setResources(enhancedData);
        setTotalCount(enhancedData.length);

      } catch (fetchError: unknown) {
        if (isMounted) {
          if (fetchError instanceof Error) {
            setError(fetchError.message);
          } else {
            setError('An unknown error occurred while fetching resources.');
          }
        }
      } finally {
        if (isMounted) {
          setLoadingData(false);
        } else {
        }
      }
    }

    fetchDataAndResources();

    // Auth listener primarily manages isLoggedIn state.
    // It also clears preferences if user logs out, to ensure fresh fetch on next login.
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) {
        return;
      }
      const currentUser = session?.user;
      const newIsLoggedIn = !!currentUser;

      if (isLoggedIn !== newIsLoggedIn) {
        setIsLoggedIn(newIsLoggedIn);
      }

      if (!newIsLoggedIn) {
        // User logged out or session ended
        if (userPreferences !== null) setUserPreferences(null);
        // Reset preferencesLoaded so that if user logs back in, preferences are re-evaluated
        if (loadingPrefs) setLoadingPrefs(true); 
      }
      // No longer directly fetching preferences here; main effect handles it based on isLoggedIn.
    });

    // Check initial auth state
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (isMounted) {
        setIsLoggedIn(!!user);
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [questionId, domain, topicId, categoryId, subcategoryId, isLoggedIn, userPreferences, loadingPrefs]);

  // Effect for Fetching User Preferences when isLoggedIn status changes
  useEffect(() => {
    let isMounted = true;
    async function loadUserPreferences() {
      if (!isMounted) return;

      if (isLoggedIn) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setLoadingPrefs(true);
          try {
            const { data: preferencesData, error } = await supabase
              .from('user_preferences')
              .select('*')
              .eq('user_id', user.id) // Ensure this column name matches your DB
              .single();

            if (!isMounted) return;

            if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is fine
              // Error fetching preferences, fallback to defaults by setting null
              setUserPreferences(null);
            } else if (preferencesData) {
              setUserPreferences(preferencesData as UserPreferences);
            } else {
              setUserPreferences(null); // No preferences record found for this user
            }
          } catch (e: any) {
            if (!isMounted) return;
            console.error('Exception fetching user preferences:', e.message);
            setUserPreferences(null);
          } finally {
            if (isMounted) setLoadingPrefs(false);
          }
        } else { // Should not happen if isLoggedIn, but defensive
          if (isMounted) {
            setUserPreferences(null);
            setLoadingPrefs(false);
          }
        }
      } else { // Not logged in
        if (isMounted) {
          setUserPreferences(null); // No user, so no specific preferences
          setLoadingPrefs(false); // Preferences "loaded" as none
        }
      }
    }
    loadUserPreferences();
    return () => { isMounted = false; };
  }, [isLoggedIn]);

  const getResourcesByType = useCallback((typeValue: string) => resources
    .filter(r => r.type === typeValue)
    .sort((a, b) => (b.relevance_score ?? 0) - (a.relevance_score ?? 0)), [resources]);

  const displayableTabs = useMemo(() => {
    // Determine the preferences to use: user's if available and loaded, otherwise defaults.
    // This calculation should only run meaningfully once preferences are no longer loading.
    const effectivePrefs = !loadingPrefs 
                           ? (userPreferences || DEFAULT_USER_PREFERENCES) 
                           : DEFAULT_USER_PREFERENCES; // Fallback to defaults even during initial brief load, main spinner handles UI.

    const tabs = TYPE_DISPLAY_ORDER
      .map(typeKey => {
        let isPreferred: boolean;

        // If still loading preferences, it might be too early to accurately filter.
        // However, the main loading spinner (`loadingData || loadingPrefs`) should cover this.
        // So, we can proceed to calculate based on `effectivePrefs`.
        // If `loadingPrefs` is true, `effectivePrefs` defaults to `DEFAULT_USER_PREFERENCES`.
        switch (typeKey) {
          case 'video':   isPreferred = effectivePrefs.use_youtube_sources ?? DEFAULT_USER_PREFERENCES.use_youtube_sources!; break;
          case 'pdf':     isPreferred = effectivePrefs.use_pdf_sources ?? DEFAULT_USER_PREFERENCES.use_pdf_sources!; break;
          case 'paper':   isPreferred = effectivePrefs.use_paper_sources ?? DEFAULT_USER_PREFERENCES.use_paper_sources!; break;
          case 'website': isPreferred = effectivePrefs.use_website_sources ?? DEFAULT_USER_PREFERENCES.use_website_sources!; break;
          case 'book':    isPreferred = effectivePrefs.use_book_sources ?? DEFAULT_USER_PREFERENCES.use_book_sources!; break;
          case 'image':   isPreferred = effectivePrefs.use_image_sources ?? DEFAULT_USER_PREFERENCES.use_image_sources!; break;
          default:        isPreferred = true; // 'other' type resources always shown if they exist
        }
        
        const currentResources = getResourcesByType(typeKey);
        if (currentResources.length > 0 && isPreferred) {
          return {
            type: typeKey,
            title: TYPE_DISPLAY_INFO[typeKey]?.title || 'Resources',
            Icon: TYPE_DISPLAY_INFO[typeKey]?.Icon || ExternalLink,
            count: currentResources.length,
            resources: currentResources, 
          };
        }
        return null;
      })
      .filter(tab => tab !== null) as { type: string; title: string; Icon: React.ElementType; count: number, resources: Resource[] }[];

    // Re-order to ensure 'video' is first if present (existing logic)
    const videoTabIndex = tabs.findIndex(tab => tab.type === 'video');
    if (videoTabIndex > 0) {
      const videoTab = tabs.splice(videoTabIndex, 1)[0];
      if (videoTab) {
        tabs.unshift(videoTab);
      }
    }
    return tabs;
  }, [userPreferences, loadingPrefs, getResourcesByType]); // Dependencies are correct

  useEffect(() => {
    if (displayableTabs.length > 0 && !activeTabType) {
      setActiveTabType(displayableTabs[0]!.type);
    } else if (displayableTabs.length > 0 && activeTabType && !displayableTabs.find(tab => tab.type === activeTabType)) {
      setActiveTabType(displayableTabs[0]!.type);
    } else if (displayableTabs.length === 0) {
      setActiveTabType(null); 
    }
  }, [displayableTabs, activeTabType]); // Removed userPreferences, loadingPrefs as displayableTabs covers them

  if (loadingData || loadingPrefs) return <div className="flex justify-center items-center h-40"><InlineLoadingSpinner size="md" text="Loading resources and preferences..." /></div>;
  if (error) return <p className="text-red-500">Error: {error}</p>;
  
  if (displayableTabs.length === 0) {
    if (loadingPrefs && totalCount > 0) {
      return <p>No resources match your current preferences. Adjust preferences to see more.</p>;
    }
    return <p>No resources found for this selection.</p>;
  }
  
  if (!activeTabType && displayableTabs.length > 0) { 
    return <div className="flex justify-center items-center h-40"><InlineLoadingSpinner size="md" text="Determining available resources..." /></div>;
  } else if (!activeTabType && displayableTabs.length === 0) {
    return <p>No resources available to display in tabs.</p>;
  }

  const tabNavItems = displayableTabs.map(tab => ({
    id: tab.type,
    label: tab.title,
  }));

  const activeTab = displayableTabs.find(tab => tab.type === activeTabType);

  const cardVariants: Variants = {
    hidden: { 
      opacity: 0, 
      y: 30,
      scale: 0.9,
      filter: "blur(6px)",
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: { 
        stiffness: 300, 
        damping: 28,
        mass: 0.8,
      }
    }
  };

  return (
    <LayoutGroup>
      <div className="w-full space-y-1 pt-3">
        <TabNav 
          items={tabNavItems}
          activeTab={activeTabType || ''}
          onTabChange={setActiveTabType}
          className="mb-4"
        />
        
        {activeTab && (
          <motion.div 
            className="mt-0 pt-1 relative"
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.1 } }
            }}
          >
            <div className="resource-scroll-container flex items-start overflow-x-auto space-x-4 py-4 scrollbar-none" style={{ paddingBottom: '1rem'}}>
              {activeTab.resources.map((resource, index) => (
                <motion.div
                  key={resource.id}
                  layoutId={`resource-card-${resource.id}`}
                  variants={cardVariants}
                  whileHover={!shouldReduceMotion ? { 
                    y: -4,
                    scale: 1.01,
                    transition: { type: "spring", stiffness: 400, damping: 25 }
                  } : {}}
                  onClick={() => setSelectedResource(resource)}
                  className="overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col bg-white dark:bg-gray-900 rounded-3xl group w-[132px] sm:w-[156px] md:w-[168px] flex-shrink-0 border-0 cursor-pointer"
                >
                  {/* Image Section - Fixed height */}
                  <motion.div layoutId={`resource-image-${resource.id}`} className="relative h-20 sm:h-24 w-full bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                    {(resource.type === 'video' || resource.type === 'youtube') && resource.videoId ? (
                      <YouTubeThumbnailWithFallback
                        videoId={resource.videoId}
                        alt={resource.title || 'YouTube video preview'}
                        layout="fill"
                        objectFit="cover"
                        className="rounded-t-3xl"
                        priority={index < 3} // Prioritize loading for first few images
                      />
                    ) : resource.previewUrl ? (
                      <div className="relative h-full w-full"> {/* Wrapper for layout fill */}
                        <Image 
                          src={resource.previewUrl} 
                          alt={resource.title || 'Resource preview'} 
                          layout="fill" 
                          objectFit="cover" 
                          className="rounded-t-3xl" 
                        />
                        {/* Special handling for website favicons if previewUrl is a favicon */}
                        {resource.type === 'website' && resource.previewUrl.includes('google.com/s2/favicons') && (
                          <div className={`absolute inset-0 bg-gradient-to-br ${getGradientForType(resource.type)} rounded-t-3xl flex items-center justify-center`}>
                            <div className="bg-white/95 dark:bg-gray-800/95 rounded-full p-6 shadow-lg">
                              <Image 
                                src={resource.previewUrl} 
                                alt="Website favicon" 
                                width={48} 
                                height={48} 
                                className="rounded-lg"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${getGradientForType(resource.type || 'other')} rounded-t-3xl relative overflow-hidden`}>
                        <div className="absolute inset-0 opacity-10">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]"></div>
                        </div>
                        <div className="relative z-10 flex flex-col items-center">
                          {(() => {
                            const Info = TYPE_DISPLAY_INFO[resource.type || 'other'];
                            return Info ? (
                              <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 sm:p-4 mb-2 shadow-lg">
                                <Info.Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow-lg" />
                              </div>
                            ) : (
                              <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 sm:p-4 mb-2 shadow-lg">
                                <ExternalLink className="w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow-lg" />
                              </div>
                            );
                          })()}
                          <span className="text-white/95 text-xs sm:text-sm font-medium uppercase tracking-wider">
                            {TYPE_DISPLAY_INFO[resource.type || 'other']?.title || 'Resource'}
                          </span>
                        </div>
                      </div>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="absolute bottom-1 right-1 bg-black/50 hover:bg-black/75 backdrop-blur-sm text-white rounded-full w-5 h-5 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (resource.url) {
                          window.open(resource.url, '_blank', 'noopener,noreferrer');
                        }
                      }}
                      aria-label="Open Resource"
                    >
                      <ArrowUpRight className="h-2.5 w-2.5" strokeWidth={2.5} />
                    </Button>
                  </motion.div>

                  {/* Content Section */}
                  <motion.div layoutId={`resource-content-${resource.id}`} className="p-2 sm:p-3 flex flex-col flex-grow">
                    <motion.h3 layoutId={`resource-title-${resource.id}`} className="text-xs sm:text-sm font-semibold tracking-tight text-gray-900 dark:text-white line-clamp-2 leading-tight group-hover:text-primary-500 transition-colors">
                      {resource.title || 'Untitled Resource'}
                    </motion.h3>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {selectedResource && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
              onClick={() => setSelectedResource(null)}
            />
            
            <motion.div
              layoutId={`resource-card-${selectedResource.id}`}
              className="relative w-[90vw] max-w-4xl max-h-[90vh] bg-card border border-border rounded-xl overflow-hidden flex flex-col"
            >
              <motion.button
                className="absolute top-4 right-4 w-8 h-8 bg-background/80 hover:bg-background rounded-full flex items-center justify-center z-20"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                onClick={() => setSelectedResource(null)}
              >
                <X className="w-4 h-4" />
              </motion.button>

              <motion.div
                layoutId={`resource-image-${selectedResource.id}`}
                className="relative w-full aspect-video bg-black flex-shrink-0 z-10"
              >
                {(selectedResource.type === 'video' || selectedResource.type === 'youtube') && selectedResource.videoId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${selectedResource.videoId}?autoplay=1&rel=0&showinfo=0`}
                    title={selectedResource.title || 'YouTube video player'}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full"
                  ></iframe>
                ) : selectedResource.previewUrl ? (
                  <Image 
                    src={selectedResource.previewUrl} 
                    alt={selectedResource.title || 'Resource preview'} 
                    layout="fill" 
                    objectFit="cover" 
                  />
                ) : (
                  <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${getGradientForType(selectedResource.type || 'other')}`}>
                    {(() => {
                        const Info = TYPE_DISPLAY_INFO[selectedResource.type || 'other'];
                        return Info ? <Info.Icon className="w-24 h-24 text-white/50" /> : <ExternalLink className="w-24 h-24 text-white/50" />;
                    })()}
                  </div>
                )}
              </motion.div>
              
{/* Title section for videos */}
              {(selectedResource.type === 'video' || selectedResource.type === 'youtube') && (
                <div className="px-4 md:px-6 pt-4 pb-2">
                  <motion.h1 
                    layoutId={`resource-title-${selectedResource.id}`} 
                    className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {selectedResource.title}
                  </motion.h1>
                </div>
              )}

              {!(selectedResource.type === 'video' || selectedResource.type === 'youtube') && (
                <div className="overflow-y-auto">
                  <motion.div layoutId={`resource-content-${selectedResource.id}`} className="p-4 md:p-6">
                    <motion.h1 layoutId={`resource-title-${selectedResource.id}`} className="text-xl md:text-2xl font-bold mb-3">
                      {selectedResource.title}
                    </motion.h1>
                    
                    <motion.div 
                      className="prose dark:prose-invert max-w-none text-muted-foreground"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <p className="text-sm">{selectedResource.description || "No description available for this resource."}</p>
                    </motion.div>
                  </motion.div>
                </div>
              )}

              <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-6 bg-card mt-auto">
                   <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        {(() => {
                          const Info = TYPE_DISPLAY_INFO[selectedResource.type || 'other'];
                          return Info ? (
                            <Info.Icon className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                          ) : (
                            <ExternalLink className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                          );
                        })()}
                        <span className="font-medium text-gray-700 dark:text-gray-300 text-xs">
                          {TYPE_DISPLAY_INFO[selectedResource.type || 'other']?.title || 'Resource'}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium text-gray-700 dark:text-gray-300 text-xs">
                          {selectedResource.relevance_score ? Math.round(selectedResource.relevance_score * 100) : 95}%
                        </span>
                      </div>
                      
                      {selectedResource.type === 'video' && selectedResource.duration && (
                        <div className="flex items-center space-x-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium text-gray-700 dark:text-gray-300 text-xs">
                            {selectedResource.duration}
                          </span>
                        </div>
                      )}
                    </div>

                    <Button 
                      variant="default"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (selectedResource.url) {
                          window.open(selectedResource.url, '_blank', 'noopener,noreferrer');
                        }
                      }}
                      aria-label="Open Resource in New Tab"
                    >
                      Open Original <ArrowUpRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </LayoutGroup>
  );
}