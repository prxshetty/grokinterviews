'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Resource {
  id: number;
  question_id: number;
  type: string;
  title: string;
  url: string;
  description: string | null;
  relevance_score: number;
}

interface ResourceListProps {
  questionId: number;
}

export function ResourceList({ questionId }: ResourceListProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userPreferences, setUserPreferences] = useState<{
    use_youtube_sources: boolean;
    use_pdf_sources: boolean;
    use_paper_sources: boolean;
    use_website_sources: boolean;
    use_book_sources: boolean;
    use_expert_opinion_sources: boolean;
  }>({
    use_youtube_sources: true,
    use_pdf_sources: true,
    use_paper_sources: true,
    use_website_sources: true,
    use_book_sources: false,
    use_expert_opinion_sources: false,
  });

  const supabase = createClientComponentClient();

  // Fetch user preferences
  useEffect(() => {
    const fetchUserPreferences = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data, error } = await supabase
          .from('user_preferences')
          .select('use_youtube_sources, use_pdf_sources, use_paper_sources, use_website_sources, use_book_sources, use_expert_opinion_sources')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user preferences:', error);
          return;
        }

        if (data) {
          setUserPreferences({
            use_youtube_sources: data.use_youtube_sources ?? true,
            use_pdf_sources: data.use_pdf_sources ?? true,
            use_paper_sources: data.use_paper_sources ?? true,
            use_website_sources: data.use_website_sources ?? true,
            use_book_sources: data.use_book_sources ?? false,
            use_expert_opinion_sources: data.use_expert_opinion_sources ?? false,
          });
        }
      } catch (err) {
        console.error('Error in fetchUserPreferences:', err);
      }
    };

    fetchUserPreferences();
  }, [supabase]);

  // Fetch resources based on user preferences
  useEffect(() => {
    const fetchResources = async () => {
      if (!questionId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Create an array of types to include based on user preferences
        const typesToInclude = [
          userPreferences.use_youtube_sources ? 'video' : null,
          userPreferences.use_pdf_sources ? 'pdf' : null,
          userPreferences.use_pdf_sources ? 'enhanced_pdf' : null,
          userPreferences.use_paper_sources ? 'paper' : null,
          userPreferences.use_website_sources ? 'website' : null,
          userPreferences.use_book_sources ? 'book' : null,
          userPreferences.use_expert_opinion_sources ? 'expert' : null,
        ].filter(Boolean) as string[];

        if (typesToInclude.length === 0) {
          setResources([]);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('resources')
          .select('*')
          .eq('question_id', questionId)
          .in('type', typesToInclude)
          .order('relevance_score', { ascending: false });

        if (error) {
          console.error('Error fetching resources:', error);
          setError('Failed to load resources. Please try again later.');
          setResources([]);
        } else {
          setResources(data || []);
        }
      } catch (err) {
        console.error('Error in fetchResources:', err);
        setError('An unexpected error occurred. Please try again later.');
        setResources([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, [questionId, userPreferences, supabase]);

  // Function to group resources by type
  const getResourcesByType = (type: string) => {
    return resources.filter(resource => resource.type === type).slice(0, 3);
  };

  // Improved logic for no resources
  if (loading) {
    return (
      <div className="text-center py-2">
        <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-gray-500 border-r-2 border-gray-500 mr-2"></div>
        <span className="text-xs text-gray-500 dark:text-gray-400">Loading resources...</span>
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
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Additional Resources:</h3>
      <div className="space-y-4">
        {resourceTypes.map(type => {
          const typeResources = getResourcesByType(type);
          if (typeResources.length === 0) return null;

          return (
            <div key={type} className="mb-2">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
                {getResourceTypeIcon(type)}
                <span className="ml-1">{getResourceTypeLabel(type)}</span>
              </h4>
              <ul className="mt-1 space-y-1">
                {typeResources.map(resource => (
                  <li key={resource.id} className="text-sm">
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline truncate block"
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