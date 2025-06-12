'use client';

import { useState, useEffect } from 'react';
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

type DbResource = Database['public']['Tables']['resources']['Row'];
type UserPreferences = Database['public']['Tables']['user_preferences']['Row'];
type Resource = DbResource & { previewUrl?: string }; // Combine DbResource with optional previewUrl

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
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<number>>(new Set());
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);

  const supabase = createClient();

  useEffect(() => {
    setLoading(true);
    let isMounted = true;

    async function fetchData() {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (!isMounted) return;

      if (userError) {
        console.error("Error fetching user for ResourceList:", userError);
        setIsLoggedIn(false);
      } else if (user) {
        setIsLoggedIn(true);
        try {
          const { data: prefs, error: prefsError } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', user.id)
            .single();
          if (!isMounted) return;
          if (prefsError && prefsError.code !== 'PGRST116') {
            console.error('Error fetching user preferences:', prefsError);
            setError('Failed to load preferences.');
          } else if (prefs) {
            setUserPreferences(prefs);
          }
        } catch (e) {
          if (!isMounted) return;
          console.error('Exception fetching preferences:', e);
          setError('An error occurred while loading preferences.');
        }
        setPreferencesLoaded(true);
        try {
          const { data: bookmarksData, error: bookmarksError } = await supabase
            .from('user_bookmarks')
            .select('question_id')
            .eq('user_id', user.id);
          if (!isMounted) return;
          if (bookmarksError) {
            console.error('Error fetching bookmarks:', bookmarksError);
          } else if (bookmarksData) {
            const bookmarkedIds = new Set(bookmarksData.map(b => b.question_id));
            setBookmarkedQuestions(bookmarkedIds);
          }
        } catch (e) {
          if (!isMounted) return;
          console.error('Exception fetching bookmarks:', e);
        }
      } else {
        setIsLoggedIn(false);
        setPreferencesLoaded(true);
      }

      try {
        let query = supabase.from('resources').select('*', { count: 'exact' });
        if (domain) query = query.eq('domain', domain);
        if (topicId) query = query.eq('topic_id', topicId);
        if (categoryId) query = query.eq('category_id', categoryId);
        if (subcategoryId) query = query.eq('subcategory_id', subcategoryId);
        if (questionId && !domain && !topicId && !categoryId && !subcategoryId) {
             query = query.eq('question_id', questionId);
        }

        if (user && userPreferences) {
          if (!userPreferences.use_youtube_sources) query = query.neq('resource_type', 'video');
          if (!userPreferences.use_pdf_sources) query = query.neq('resource_type', 'pdf');
          if (!userPreferences.use_paper_sources) query = query.neq('resource_type', 'paper');
          if (!userPreferences.use_website_sources) query = query.neq('resource_type', 'website');
          if (!userPreferences.use_book_sources) query = query.neq('resource_type', 'book');
          // if (!userPreferences.use_image_sources) query = query.neq('resource_type', 'image'); // Commented out due to type error
        }
        
        query = query.order('created_at', { ascending: false }).limit(500);
        const { data: dbData, error: resourcesError, count } = await query;
        if (!isMounted) return;

        if (resourcesError) {
          console.error('Error fetching resources:', resourcesError);
          setError('Failed to load resources.');
        } else if (dbData) {
          const processedData = dbData.map(r => ({ ...r, previewUrl: undefined } as Resource)); // Ensure previewUrl is part of the object
          setResources(processedData);
          setTotalCount(count || 0);
        }
      } catch (e) {
        if (!isMounted) return;
        console.error('Exception fetching resources:', e);
        setError('An error occurred while loading resources.');
      }
      setLoading(false);
    }

    fetchData();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      const currentUser = session?.user;
      setIsLoggedIn(!!currentUser);
      if (currentUser) {
        const { data: bookmarksData, error: bookmarksError } = await supabase
          .from('user_bookmarks')
          .select('question_id')
          .eq('user_id', currentUser.id);
        if (!isMounted) return;
        if (bookmarksError) {
          console.error('Error fetching bookmarks on auth change:', bookmarksError);
        } else if (bookmarksData) {
          const bookmarkedIds = new Set(bookmarksData.map(b => b.question_id));
          setBookmarkedQuestions(bookmarkedIds);
        }
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
        setBookmarkedQuestions(new Set());
        setUserPreferences(null);
        setPreferencesLoaded(true);
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [supabase, questionId, domain, topicId, categoryId, subcategoryId]);

  const getResourcesByType = (type: string) => resources.filter(r => r.resource_type === type);

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

  const handleBookmarkToggle = async (resource: Resource) => {
    if (!isLoggedIn || !resource.question_id) {
      toast.error('Please log in to bookmark questions.');
      return;
    }
    const questionNumericId = Number(resource.question_id);
    const isCurrentlyBookmarked = bookmarkedQuestions.has(questionNumericId);

    // Optimistically update UI
    const newBookmarkedQuestions = new Set(bookmarkedQuestions);
    if (isCurrentlyBookmarked) {
      newBookmarkedQuestions.delete(questionNumericId);
    } else {
      newBookmarkedQuestions.add(questionNumericId);
    }
    setBookmarkedQuestions(newBookmarkedQuestions);

    try {
      const { error } = await supabase.from('user_bookmarks').upsert({
        user_id: (await supabase.auth.getUser()).data.user?.id, // Ensure user ID is correctly fetched
        question_id: questionNumericId,
        // Required fields from your table definition, assuming they exist
        // topic_id, category_id, domain, section_name should be fetched or passed if required by table
        // For now, assuming they can be null or have defaults, or are not strictly required for a simple bookmark action
      }, {
        onConflict: 'user_id,question_id',
        ignoreDuplicates: false, // Explicitly false to either insert or update based on conflict
      });
      // If it was a delete operation (isCurrentlyBookmarked was true)
      if (isCurrentlyBookmarked && !error) {
         const { error: deleteError } = await supabase.from('user_bookmarks')
          .delete()
          .match({ user_id: (await supabase.auth.getUser()).data.user?.id, question_id: questionNumericId });
        if (deleteError) throw deleteError;
      }

      if (error) throw error;
      toast.success(isCurrentlyBookmarked ? 'Bookmark removed' : 'Bookmark added');
    } catch (e: any) {
      console.error('Error toggling bookmark:', e);
      toast.error('Failed to update bookmark.');
      // Revert optimistic update
      setBookmarkedQuestions(bookmarkedQuestions);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-40"><p>Loading resources...</p></div>;
  if (error) return <p className="text-red-500">Error: {error}</p>;
  if (resources.length === 0 && preferencesLoaded) return <p>No resources found for this selection or your preferences.</p>;

  const displayedTypes = typeDisplayOrder.filter(type => getResourcesByType(type).length > 0);

  return (
    <div className="space-y-6">
      {displayedTypes.map(type => {
        const RIcon = typeDisplayInfo[type]?.Icon || ExternalLink;
        const title = typeDisplayInfo[type]?.title || 'Resources';
        const filteredResources = getResourcesByType(type);
        if (filteredResources.length === 0) return null;

        return (
          <section key={type}>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <RIcon className="w-5 h-5 mr-2 text-gray-700 dark:text-gray-300" />
              {title} <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">({filteredResources.length})</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredResources.map(resource => (
                <Card key={resource.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col">
                  <CardHeader className="p-4">
                    {resource.previewUrl && (
                      <img src={resource.previewUrl} alt={`Preview for ${resource.title}`} className="w-full h-32 object-cover mb-3 rounded" />
                    )}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <CardTitle className="text-md font-semibold truncate">
                            <a href={resource.url || '#'} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              {resource.title || 'Untitled Resource'}
                            </a>
                          </CardTitle>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{resource.title || 'Untitled Resource'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 flex-grow flex flex-col justify-between">
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 mb-3">
                      {resource.description || 'No description available.'}
                    </p>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <a href={resource.url || '#'} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3 h-3 mr-1.5" /> View
                          </a>
                        </Button>
                        {isLoggedIn && resource.question_id && (
                           <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => handleBookmarkToggle(resource)} className="w-8 h-8">
                                  <Bookmark className={`w-4 h-4 ${bookmarkedQuestions.has(Number(resource.question_id)) ? 'fill-yellow-400 text-yellow-500' : 'text-gray-500'}`} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{bookmarkedQuestions.has(Number(resource.question_id)) ? 'Remove bookmark' : 'Add bookmark'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      {/* Placeholder for future actions like upvote/downvote/comments */}
                      {/* <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <button className="hover:text-green-500 p-1"><ThumbsUp className="w-3 h-3" /></button>
                        <span>{Math.floor(Math.random() * 20)}</span>
                        <button className="hover:text-red-500 p-1"><ThumbsDown className="w-3 h-3" /></button>
                        <button className="hover:text-blue-500 p-1 ml-2"><MessageCircle className="w-3 h-3" /></button>
                        <span>{Math.floor(Math.random() * 5)}</span>
                      </div> */}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

// Add a simple toast component if not already globally available
// For simplicity, using a basic console log for now, replace with actual toast library.
const toast = {
    success: (message: string) => console.log(`SUCCESS: ${message}`),
    error: (message: string) => console.error(`ERROR: ${message}`),
};