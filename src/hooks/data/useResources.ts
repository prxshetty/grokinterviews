import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Resource, UseResourcesProps, UseResourcesReturn } from '@/types';
import { getWebsiteFavicon, getYouTubeVideoId } from '@/types/resources.types';

export function useResources({
  questionId,
  domain,
  topicId,
  categoryId,
  subcategoryId
}: UseResourcesProps): UseResourcesReturn {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);

  const fetchResources = async () => {
    if (!questionId) {
      setError('Question ID is required.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Build query based on available IDs
      let query = supabase
        .from('resources')
        .select('*')
        .eq('question_id', questionId);

      // Add filters based on available parameters
      if (subcategoryId) {
        query = query.eq('subcategory_id', subcategoryId);
      } else if (categoryId) {
        query = query.eq('category_id', categoryId);
      } else if (topicId) {
        query = query.eq('topic_id', topicId);
      }

      if (domain) {
        query = query.eq('domain', domain);
      }

      const { data, error: fetchError, count } = await query;

      if (fetchError) {
        console.error('Error fetching resources:', fetchError);
        setError('Failed to load resources');
        return;
      }

      // Process resources with additional metadata
      const processedResources = (data || []).map((resource: any) => ({
        ...resource,
        videoId: resource.type === 'youtube' || resource.type === 'video' 
          ? getYouTubeVideoId(resource.url) 
          : null,
        previewUrl: resource.type === 'website' 
          ? getWebsiteFavicon(resource.url) 
          : undefined,
        description: resource.description || undefined
      }));

      setResources(processedResources);
      setTotalCount(count || processedResources.length);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [questionId, domain, topicId, categoryId, subcategoryId]);

  return {
    resources,
    loading,
    error,
    totalCount,
    refetch: fetchResources
  };
}
