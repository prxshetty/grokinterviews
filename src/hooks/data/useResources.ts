import { useState, useEffect, useCallback } from 'react';
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

  const fetchResources = useCallback(async () => {
    if (!questionId) {
      setError('Question ID is required.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const r2Url = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

      if (!r2Url) {
        // Fallback or error if R2 URL is not configured
        console.warn('NEXT_PUBLIC_R2_PUBLIC_URL is not set.');
        // For now, we return empty or could fallback to Supabase if imported
        // But for migration, we want to enforce R2 usage.
        throw new Error('Storage configuration missing');
      }

      // Fetch from R2 Static JSON
      const response = await fetch(`${r2Url}/resources/q-${questionId}.json`);

      if (!response.ok) {
        if (response.status === 404) {
          // No resources found for this question
          setResources([]);
          setTotalCount(0);
          return;
        }
        throw new Error(`Failed to fetch resources: ${response.statusText}`);
      }

      const allResources: Resource[] = await response.json();

      // Client-side Filtering
      let filtered = allResources;

      if (subcategoryId) {
        filtered = filtered.filter(r => r.subcategory_id === subcategoryId);
      } else if (categoryId) {
        filtered = filtered.filter(r => r.category_id === categoryId);
      } else if (topicId) {
        filtered = filtered.filter(r => r.topic_id === topicId);
      }

      if (domain) {
        filtered = filtered.filter(r => r.domain === domain);
      }

      // Sort by relevance score (descending)
      filtered.sort((a: any, b: any) => (b.relevance_score || 0) - (a.relevance_score || 0));

      // Process resources with additional metadata
      const processedResources = filtered.map((resource: any) => ({
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
      setTotalCount(filtered.length);
    } catch (err: any) {
      console.error('Error fetching resources:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [questionId, domain, topicId, categoryId, subcategoryId]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  return {
    resources,
    loading,
    error,
    totalCount,
    refetch: fetchResources
  };
}
