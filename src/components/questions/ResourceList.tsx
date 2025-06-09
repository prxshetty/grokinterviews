'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';
import { InlineLoadingSpinner } from '@/components/ui/LoadingSpinner';

interface Resource {
  id: number;
  question_id: number;
  type: string;
  title: string;
  url: string;
  description: string | null;
  relevance_score: number;
  previewUrl?: string;
}

interface ResourceListProps {
  questionId: number;
}

export function ResourceList({ questionId }: ResourceListProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchAllData = async () => {
      if (!questionId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // --- Part 1: Fetch user preferences ---
        let currentPrefs = {
          use_youtube_sources: true,
          use_pdf_sources: true,
          use_paper_sources: true,
          use_website_sources: true,
          use_book_sources: false,
          use_image_sources: false,
        };

        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const { data: prefData, error: prefError } = await supabase
              .from('user_preferences')
              .select('use_youtube_sources, use_pdf_sources, use_paper_sources, use_website_sources, use_book_sources, use_image_sources')
              .eq('user_id', session.user.id)
              .maybeSingle();

            if (prefError) {
              console.error('Error fetching user preferences:', prefError);
            } else if (prefData) {
              currentPrefs = {
                use_youtube_sources: prefData.use_youtube_sources ?? true,
                use_pdf_sources: prefData.use_pdf_sources ?? true,
                use_paper_sources: prefData.use_paper_sources ?? true,
                use_website_sources: prefData.use_website_sources ?? true,
                use_book_sources: prefData.use_book_sources ?? false,
                use_image_sources: prefData.use_image_sources ?? false,
              };
            }
          }
        } catch (err) {
          console.error('Error in session/preference logic:', err);
        }

        // --- Part 2: Fetch resources based on preferences ---
        const typesToInclude = [
          currentPrefs.use_youtube_sources ? 'video' : null,
          currentPrefs.use_pdf_sources ? 'pdf' : null,
          currentPrefs.use_pdf_sources ? 'enhanced_pdf' : null,
          currentPrefs.use_paper_sources ? 'paper' : null,
          currentPrefs.use_website_sources ? 'website' : null,
          currentPrefs.use_book_sources ? 'book' : null,
          currentPrefs.use_image_sources ? 'image' : null,
        ].filter(Boolean) as string[];

        if (typesToInclude.length === 0) {
          setResources([]);
          setLoading(false);
          return;
        }

        const { data, error: resourceError } = await supabase
          .from('resources')
          .select('*')
          .eq('question_id', questionId)
          .in('type', typesToInclude)
          .order('relevance_score', { ascending: false });

        if (resourceError) {
          throw resourceError;
        }

        const processedData = data?.map(resource => {
          let previewUrl: string | undefined = undefined;
          if (resource.type === 'video' && resource.url) {
            try {
              const url = new URL(resource.url);
              let videoId: string | null = null;
              if (url.hostname === 'youtu.be') {
                videoId = url.pathname.substring(1);
              } else if (url.hostname === 'www.youtube.com' || url.hostname === 'youtube.com') {
                videoId = url.searchParams.get('v');
              }
              if (videoId) {
                previewUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
              }
            } catch (e) {
              console.error('Error parsing video URL:', e);
            }
          } else if (resource.type === 'website' && resource.url) {
            try {
                previewUrl = `https://www.google.com/s2/favicons?sz=32&domain_url=${encodeURIComponent(resource.url)}`;
            } catch (e) {
                console.error('Error processing website URL for favicon:', e);
            }
          }
          return { ...resource, previewUrl };
        }) || [];
        setResources(processedData);

      } catch (err) {
        console.error('Error fetching resources data:', err);
        setError('An unexpected error occurred. Please try again later.');
        setResources([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [questionId, supabase]);

  // Function to group resources by type
  const getResourcesByType = (type: string) => {
    return resources.filter(resource => resource.type === type).slice(0, 3);
  };

  // Improved logic for no resources
  if (loading) {
    return (
      <div className="flex justify-center items-center py-2">
        <InlineLoadingSpinner text="Loading resources..." />
      </div>
    );
  }

  if (error) {
     return <div className="text-red-600 dark:text-red-400 text-xs py-2">Error loading resources: {error}</div>;
  }

  // Explicitly check if resources array is empty *after* loading and no error
  if (resources.length === 0) {
    return null; // Keep it hidden if nothing found, as per original potential intent
  }

  // Get the available resource types from the resources
  const resourceTypes = Array.from(new Set(resources.map(resource => resource.type)));

  // Map the resource type to a human-readable label
  const getResourceTypeLabel = (type: string) => {
    switch (type) {
      case 'video': return 'Videos';
      case 'pdf': return 'PDFs';
      case 'enhanced_pdf': return 'Enhanced PDFs';
      case 'paper': return 'Research Papers';
      case 'website': return 'Websites';
      case 'book': return 'Books';
      case 'image': return 'Images';
      default: return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  // Get the icon for each resource type
  const getResourceTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'pdf':
      case 'enhanced_pdf':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case 'paper':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        );
      case 'website':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        );
      case 'book':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case 'image':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="mt-2 mb-4">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Additional Resources:</h3>
      {/* Use CSS Grid for dynamic columns */}
      <div className={`grid gap-x-6 gap-y-4`} style={{ gridTemplateColumns: `repeat(${resourceTypes.length}, minmax(0, 1fr))` }}>
        {resourceTypes.map(type => {
          const typeResources = getResourcesByType(type);
          if (typeResources.length === 0) return null;

          return (
            // Each type becomes a grid item
            <div key={type}>
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center mb-1.5">
                {getResourceTypeIcon(type)}
                <span className="ml-1.5">{getResourceTypeLabel(type)}</span>
              </h4>
              <ul className="mt-1 space-y-1">
                {typeResources.map(resource => (
                  <li key={resource.id} className="text-sm flex items-center space-x-2">
                    {resource.previewUrl && (
                      <Image
                        src={resource.previewUrl}
                        alt={`${resource.title} preview`}
                        width={resource.type === 'video' ? 64 : 16}
                        height={resource.type === 'video' ? 36 : 16}
                        className={`flex-shrink-0 rounded ${resource.type === 'website' ? '' : 'object-cover'}`}
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                        unoptimized={resource.type === 'website'}
                      />
                    )}
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline truncate flex-grow min-w-0"
                      title={resource.title}
                    >
                      {resource.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
} 