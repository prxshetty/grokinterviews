'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';
import { InlineLoadingSpinner, Tabs, TabsContent, TabsList, TabsTrigger, Card, CardContent, Button, Badge, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui';
import { ExternalLink, Video, FileText, Globe, BookOpen, Image as ImageIcon } from 'lucide-react';
import { type Database } from '@/types/database.types';

// Helper function to extract YouTube video ID from URL
function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && typeof match[2] === 'string' && match[2].length === 11) ? match[2] : null;
}

// Helper function to get YouTube thumbnail URL
function getYouTubeThumbnail(url: string): string | null {
  const videoId = getYouTubeVideoId(url);
  return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
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
  // content: string | null; // Removed, not in DB schema
  // description: string | null; // Removed, not in DB schema
  created_at: string; // Based on original definition
  relevance_score?: number | null; // From information_schema query
  previewUrl?: string; // Existing optional field
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
  paper: { Icon: FileText, title: 'Research Papers' },
  website: { Icon: Globe, title: 'Websites' },
  book: { Icon: BookOpen, title: 'Books' },
  image: { Icon: ImageIcon, title: 'Images' },
  other: { Icon: ExternalLink, title: 'Other Resources' },
};

export function ResourceList({ questionId, domain, topicId, categoryId, subcategoryId }: ResourceListProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [activeTabType, setActiveTabType] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let isMounted = true;

    if (!questionId) {
      setError('Question ID is required to fetch resources.');
      setLoading(false);
      return;
    }

    async function fetchDataAndResources() {
      if (!isMounted) {
        return;
      }
      setLoading(true);
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
        if (questionId) queryParams.append('questionId', questionId.toString());
        if (domain) queryParams.append('domain', domain);
        if (finalTopicId) queryParams.append('topicId', finalTopicId.toString());
        if (finalCategoryId) queryParams.append('categoryId', finalCategoryId.toString());
        if (finalSubcategoryId) queryParams.append('subcategoryId', finalSubcategoryId.toString());
        
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
          const { previewUrl: originalPreviewUrl, ...restOfResource } = resource;
          let calculatedPreviewUrl: string | undefined = originalPreviewUrl;

          if (resource.type === 'youtube' && resource.url) {
            const ytThumb = getYouTubeThumbnail(resource.url);
            calculatedPreviewUrl = ytThumb === null ? undefined : ytThumb;
          }

          if (typeof calculatedPreviewUrl === 'string') {
            return { ...restOfResource, previewUrl: calculatedPreviewUrl };
          }
          return { ...restOfResource }; // Omit previewUrl if it's not a string
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
          setLoading(false);
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
        if (preferencesLoaded) setPreferencesLoaded(false); 
      }
      // No longer directly fetching preferences here; main effect handles it based on isLoggedIn.
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [supabase, questionId, domain, topicId, categoryId, subcategoryId, isLoggedIn, userPreferences, preferencesLoaded]);

  const getResourcesByType = useCallback((typeValue: string) => resources
    .filter(r => r.type === typeValue)
    .sort((a, b) => (b.relevance_score ?? 0) - (a.relevance_score ?? 0)), [resources]);

  const displayableTabs = useMemo(() => {
    const tabs = TYPE_DISPLAY_ORDER
      .map(typeKey => {
        let isPreferred = true;
        if (preferencesLoaded && userPreferences) {
          switch (typeKey) {
            case 'video': isPreferred = userPreferences.use_youtube_sources ?? true; break;
            case 'pdf': isPreferred = userPreferences.use_pdf_sources ?? true; break;
            case 'paper': isPreferred = userPreferences.use_paper_sources ?? true; break;
            case 'website': isPreferred = userPreferences.use_website_sources ?? true; break;
            case 'book': isPreferred = userPreferences.use_book_sources ?? false; break;
            case 'image': 
              isPreferred = userPreferences.use_image_sources ?? false; 
              break;
            default: isPreferred = true; 
          }
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

    const videoTabIndex = tabs.findIndex(tab => tab.type === 'video');
    if (videoTabIndex > 0) {
      const videoTab = tabs.splice(videoTabIndex, 1)[0];
      if (videoTab) {
        tabs.unshift(videoTab);
      }
    }
    return tabs;
  }, [userPreferences, preferencesLoaded, getResourcesByType]);

  useEffect(() => {
    if (displayableTabs.length > 0 && !activeTabType) {
      setActiveTabType(displayableTabs[0]!.type);
    } else if (displayableTabs.length > 0 && activeTabType && !displayableTabs.find(tab => tab.type === activeTabType)) {
      setActiveTabType(displayableTabs[0]!.type);
    } else if (displayableTabs.length === 0) {
      setActiveTabType(null); 
    }
  }, [displayableTabs, activeTabType, userPreferences, preferencesLoaded]);

  if (loading && !preferencesLoaded) return <div className="flex justify-center items-center h-40"><InlineLoadingSpinner size="md" text="Loading resources and preferences..." /></div>;
  if (error) return <p className="text-red-500">Error: {error}</p>;
  
  if (displayableTabs.length === 0) {
    if (preferencesLoaded && totalCount > 0) {
      return <p>No resources match your current preferences. Adjust preferences to see more.</p>;
    }
    return <p>No resources found for this selection.</p>;
  }
  
  if (!activeTabType && displayableTabs.length > 0) { 
    return <div className="flex justify-center items-center h-40"><InlineLoadingSpinner size="md" text="Determining available resources..." /></div>;
  } else if (!activeTabType && displayableTabs.length === 0) {
    return <p>No resources available to display in tabs.</p>;
  }

  return (
    <Tabs value={activeTabType || ''} onValueChange={setActiveTabType} className="w-full space-y-1 pt-3">
      <TabsList className="flex flex-wrap w-full justify-start gap-2 mb-4">
        {displayableTabs.map(tab => (
          <TabsTrigger
            key={tab.type}
            value={tab.type}
            className="relative inline-flex items-center whitespace-nowrap px-3 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800/60 data-[state=active]:text-primary dark:data-[state=active]:text-sky-400 data-[state=active]:font-semibold rounded-t-md transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 data-[state=active]:after:absolute data-[state=active]:after:bottom-[-1px] data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-[2px] data-[state=active]:after:bg-primary dark:data-[state=active]:after:bg-sky-500"
          >
            {tab.title} ({tab.count})
          </TabsTrigger>
        ))}
      </TabsList>
      {displayableTabs.map(tab => (
        <TabsContent key={tab.type} value={tab.type} className="mt-0 pt-1 outline-none ring-0">
          <div className="flex overflow-x-auto space-x-4 py-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent scrollbar-thumb-rounded-full scrollbar-track-rounded-full" style={{ paddingBottom: '1rem'}}>
            {tab.resources.map(resource => (
              <Card 
                key={resource.id} 
                className="overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col bg-white dark:bg-slate-800 rounded-xl group min-w-[280px] sm:min-w-[300px] md:min-w-[320px] flex-shrink-0"
              >
                <div className="relative h-40 sm:h-44 w-full">
                  {resource.previewUrl ? (
                    <Image src={resource.previewUrl} alt={resource.title || 'Resource preview'} layout="fill" objectFit="cover" className="rounded-t-xl" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-200 dark:bg-slate-700 rounded-t-xl">
                      {(() => {
                        const Info = TYPE_DISPLAY_INFO[resource.type || 'other'];
                        return Info ? <Info.Icon className="w-12 h-12 sm:w-14 sm:h-14 text-slate-400 dark:text-slate-500" /> : <ExternalLink className="w-12 h-12 sm:w-14 sm:h-14 text-slate-400 dark:text-slate-500" />;
                      })()}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent rounded-t-xl"></div>
                  <div className="absolute bottom-0 left-0 p-3 sm:p-4 w-full">
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                           <h3 className="text-base sm:text-lg font-semibold text-white truncate group-hover:underline">{resource.title || 'Untitled Resource'}</h3>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" align="start">
                          <p>{resource.title || 'Untitled Resource'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <p className="text-xs text-slate-200 mt-0.5">{TYPE_DISPLAY_INFO[resource.type || 'other']?.title || 'Resource'}</p>
                  </div>
                  <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Button variant="secondary" size="sm" asChild className="bg-slate-800/80 text-white hover:bg-slate-700/90 backdrop-blur-sm !opacity-100 h-7 sm:h-8 px-2.5 sm:px-3 text-xs sm:text-sm">
                      <a href={resource.url || '#'} target="_blank" rel="noopener noreferrer">
                        View
                      </a>
                    </Button>
                  </div>
                </div>

                <CardContent className="p-3 sm:p-4 flex-grow flex flex-col justify-between">
                  <div>
                     {/* Description placeholder if you want to add it back later */}
                    {/* <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
                      {resource.description || 'No description available.'}
                    </p> */}
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-auto pt-2">
                    <div className="flex items-center">
                      {(() => {
                        const Info = TYPE_DISPLAY_INFO[resource.type || 'other'];
                        return Info ? <Info.Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 opacity-70" /> : <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 opacity-70" />;
                      })()}
                      <span className="text-xs sm:text-sm">{new Date(resource.created_at).toLocaleDateString()}</span>
                    </div>
                    {resource.relevance_score && (
                      <Badge variant="outline" className="font-medium text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 sm:py-1">
                        Score: {Number(resource.relevance_score).toFixed(2)}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}