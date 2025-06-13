'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';
import { InlineLoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Bookmark, Video, FileText, Globe, BookOpen, Image as ImageIcon, ThumbsUp, ThumbsDown, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { type Database } from '@/types/database.types';

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

export function ResourceList({ questionId, domain, topicId, categoryId, subcategoryId }: ResourceListProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [activeTabType, setActiveTabType] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    setLoading(true);
    let isMounted = true;
    console.log('[ResourceList useEffect] Hook triggered. Initializing fetchData...');

    async function fetchData() {
      console.log('[ResourceList FetchData] Starting...');
      try {
        console.log('[ResourceList FetchData] Attempting supabase.auth.getUser()...');
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        console.log('[ResourceList FetchData] supabase.auth.getUser() completed.', { user, userError });
        if (!isMounted) { console.log('[ResourceList FetchData] Unmounted after getUser.'); return; }

        if (userError) {
          console.error("[ResourceList FetchData] Error fetching user for ResourceList:", userError);
          setIsLoggedIn(false);
        } else if (user) {
          setIsLoggedIn(true);
          console.log('[ResourceList FetchData] User found. Fetching preferences...');
          try {
            const { data: prefs, error: prefsError } = await supabase
              .from('user_preferences')
              .select('*')
              .eq('user_id', user.id)
              .single();
            console.log('[ResourceList FetchData] User preferences fetched.', { prefs, prefsError });
            if (!isMounted) { console.log('[ResourceList FetchData] Unmounted after preferences fetch.'); return; }
            if (prefsError && prefsError.code !== 'PGRST116') { // PGRST116: no rows found, not an error
              console.error('[ResourceList FetchData] Error fetching user preferences:', prefsError);
              setError('Failed to load preferences.');
            } else if (prefs) {
              setUserPreferences(prefs);
            }
          } catch (e) {
            if (!isMounted) { console.log('[ResourceList FetchData] Unmounted during preferences exception.'); return; }
            console.error('[ResourceList FetchData] Exception fetching preferences:', e);
            setError('An error occurred while loading preferences.');
          }
          setPreferencesLoaded(true);
          console.log('[ResourceList FetchData] Preferences loaded. Fetching bookmarks...');
          // Bookmarks fetching logic removed
          /* try {
            const { data: bookmarksData, error: bookmarksError } = await supabase
              .from('user_bookmarks')
              .select('question_id')
              .eq('user_id', user.id);
            console.log('[ResourceList FetchData] User bookmarks fetched.', { bookmarksData, bookmarksError });
            if (!isMounted) { console.log('[ResourceList FetchData] Unmounted after bookmarks fetch.'); return; }
            if (bookmarksError) {
              console.error('[ResourceList FetchData] Error fetching bookmarks:', bookmarksError);
            } else if (bookmarksData) {
              const bookmarkedIds = new Set(bookmarksData.map(b => b.question_id));
              setBookmarkedQuestions(bookmarkedIds);
            }
          } catch (e) {
            if (!isMounted) { console.log('[ResourceList FetchData] Unmounted during bookmarks exception.'); return; }
            console.error('[ResourceList FetchData] Exception fetching bookmarks:', e);
          } */
        } else {
          console.log('[ResourceList FetchData] No user found.');
          setIsLoggedIn(false);
          setPreferencesLoaded(true); // Still set to true if no user, so resource fetching can proceed
        }

        console.log('[ResourceList FetchData] Attempting to fetch resources...');
        try {
          let query = supabase.from('resources').select('*', { count: 'exact' });
          if (domain) query = query.eq('domain', domain);
          if (topicId) query = query.eq('topic_id', topicId);
          if (categoryId) query = query.eq('category_id', categoryId);
          if (subcategoryId) query = query.eq('subcategory_id', subcategoryId);
          if (questionId && !domain && !topicId && !categoryId && !subcategoryId) {
               query = query.eq('question_id', questionId);
          }

          if (isLoggedIn && userPreferences) {
            console.log('[ResourceList FetchData] Applying user preference filters to resource query.');
            if (!userPreferences.use_youtube_sources) query = query.neq('type', 'video');
            if (!userPreferences.use_pdf_sources) query = query.neq('type', 'pdf');
            if (!userPreferences.use_paper_sources) query = query.neq('type', 'paper');
            if (!userPreferences.use_website_sources) query = query.neq('type', 'website');
            if (!userPreferences.use_book_sources) query = query.neq('type', 'book');
            // if (!userPreferences.use_image_sources) query = query.neq('type', 'image');
          } else {
            console.log('[ResourceList FetchData] Not applying preference filters (no user or preferences not loaded).');
          }
          
          query = query.order('created_at', { ascending: false }).limit(500);
          console.log('[ResourceList FetchData] Executing resource query...');
          const { data: dbData, error: resourcesError, count } = await query;
          console.log('[ResourceList FetchData] Resource query completed.', { dbData, resourcesError, count });
          if (!isMounted) { console.log('[ResourceList FetchData] Unmounted after resource query.'); return; }

          if (resourcesError) {
            console.error('[ResourceList FetchData] Error fetching resources:', resourcesError);
            setError('Failed to load resources.');
          } else if (dbData) {
            const processedData = dbData.map(r => ({ ...r, previewUrl: undefined } as Resource));
            setResources(processedData);
            setTotalCount(count || 0);
          }
        } catch (e) {
          if (!isMounted) { console.log('[ResourceList FetchData] Unmounted during resource fetching exception.'); return; }
          console.error('[ResourceList FetchData] Exception fetching resources:', e);
          setError('An error occurred while loading resources.');
        }
      } catch (e) {
        if (!isMounted) { console.log('[ResourceList FetchData] Unmounted during main fetchData exception.'); return; }
        console.error('[ResourceList FetchData] Main exception in fetchData:', e);
        setError('A critical error occurred while preparing to load resources.');
      } finally {
        if (isMounted) {
            console.log('[ResourceList FetchData] In finally block, setting loading to false.');
            setLoading(false);
        } else {
            console.log('[ResourceList FetchData] In finally block, but component unmounted. Not setting loading state.');
        }
      }
    }

    fetchData();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      const currentUser = session?.user;
      setIsLoggedIn(!!currentUser);
      if (currentUser) {
        // Bookmarks fetching logic on auth change removed
        /* const { data: bookmarksData, error: bookmarksError } = await supabase
          .from('user_bookmarks')
          .select('question_id')
          .eq('user_id', currentUser.id);
        if (!isMounted) return;
        if (bookmarksError) {
          console.error('Error fetching bookmarks on auth change:', bookmarksError);
        } else if (bookmarksData) {
          const bookmarkedIds = new Set(bookmarksData.map(b => b.question_id));
          setBookmarkedQuestions(bookmarkedIds);
        } */
        const { data: prefs, error: prefsError } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', currentUser.id)
            .single();
        if (!isMounted) return;
        if (prefsError && prefsError.code !== 'PGRST116') {
            console.error('Error fetching user preferences on auth change:', prefsError);
        } else if (prefs) {
            setUserPreferences(prefs);
        } else {
            setUserPreferences(null);
        }
        setPreferencesLoaded(true);
      } else {
        // Bookmarks fetching logic on auth change removed
        /* setBookmarkedQuestions(new Set()); */
        setUserPreferences(null);
        setPreferencesLoaded(true);
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [supabase, questionId, domain, topicId, categoryId, subcategoryId]);

  const getResourcesByType = (typeValue: string) => resources
    .filter(r => r.type === typeValue)
    .sort((a, b) => (b.relevance_score ?? 0) - (a.relevance_score ?? 0));

  const typeDisplayOrder: string[] = ['video', 'pdf', 'paper', 'website', 'book', 'image', 'other'];

  const typeDisplayInfo: { [key: string]: { Icon: React.ElementType, title: string } } = {
    video: { Icon: Video, title: 'Videos' },
    pdf: { Icon: FileText, title: 'PDFs' },
    paper: { Icon: FileText, title: 'Research Papers' }, // Could use specific icon if available
    website: { Icon: Globe, title: 'Websites' },
    book: { Icon: BookOpen, title: 'Books' },
    image: { Icon: ImageIcon, title: 'Images' },
    other: { Icon: ExternalLink, title: 'Other Resources' },
  };

  // Derived state for displayable tabs
  const displayableTabs = useMemo(() => {
    let tabs = typeDisplayOrder
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
              // Safely check for use_image_sources, works even if types are outdated
              isPreferred = typeof (userPreferences as any).use_image_sources === 'boolean' ? (userPreferences as any).use_image_sources : false; 
              break;
            default: isPreferred = true; 
          }
        }
        
        const currentResources = getResourcesByType(typeKey);
        if (currentResources.length > 0 && isPreferred) {
          return {
            type: typeKey,
            title: typeDisplayInfo[typeKey]?.title || 'Resources',
            Icon: typeDisplayInfo[typeKey]?.Icon || ExternalLink,
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
      tabs.unshift(videoTab);
    }
    return tabs;
  }, [resources, userPreferences, preferencesLoaded, typeDisplayOrder, typeDisplayInfo]);

  useEffect(() => {
    if (displayableTabs.length > 0 && !activeTabType) {
      setActiveTabType(displayableTabs[0].type);
    } else if (displayableTabs.length > 0 && activeTabType && !displayableTabs.find(tab => tab.type === activeTabType)) {
      setActiveTabType(displayableTabs[0].type);
    } else if (displayableTabs.length === 0) {
      setActiveTabType(null); 
    }
  }, [displayableTabs, activeTabType]);

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
      <TabsList className="flex flex-wrap sm:flex-nowrap overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent border-b border-gray-200 dark:border-gray-700">
        {displayableTabs.map(tab => (
          <TabsTrigger 
            key={tab.type} 
            value={tab.type} 
            className="relative inline-flex items-center whitespace-nowrap mx-1 px-3 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800/60 data-[state=active]:text-primary dark:data-[state=active]:text-sky-400 data-[state=active]:font-semibold rounded-t-md transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 data-[state=active]:after:absolute data-[state=active]:after:bottom-[-1px] data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-[2px] data-[state=active]:after:bg-primary dark:data-[state=active]:after:bg-sky-500"
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
                        const Info = typeDisplayInfo[resource.type || 'other'];
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
                    <p className="text-xs text-slate-200 mt-0.5">{typeDisplayInfo[resource.type || 'other']?.title || 'Resource'}</p>
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
                        const Info = typeDisplayInfo[resource.type || 'other'];
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

// Add a simple toast component if not already globally available
// For simplicity, using a basic console log for now, replace with actual toast library.
const toast = {
    success: (message: string) => console.log(`SUCCESS: ${message}`),
    error: (message: string) => console.error(`ERROR: ${message}`),
};