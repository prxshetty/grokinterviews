/**
 * Custom hook for PDF metadata extraction and enhancement
 */

import { useReducer, useEffect, useCallback } from 'react';
import { pdfMetadataService, type PdfMetadata } from '@/services/PdfMetadataService';
import { Resource } from '@/types/resources.types';
import { cleanHtmlTags } from '@/utils/textUtils';

// Reducer types
type PdfMetadataState = {
  enhancedResources: Resource[];
  loading: boolean;
  error: string | null;
  progress: number;
  processedIds: Set<number>;
};

type PdfMetadataAction = 
  | { type: 'START_LOADING' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'UPDATE_PROGRESS'; payload: number }
  | { type: 'UPDATE_ENHANCED_RESOURCES'; payload: Resource[] }
  | { type: 'MARK_PROCESSED'; payload: number[] }
  | { type: 'RESET_PROCESSED' }
  | { type: 'COMPLETE_LOADING' }
  | { type: 'SET_ENHANCED_RESOURCES'; payload: Resource[] };

// Reducer function
function pdfMetadataReducer(state: PdfMetadataState, action: PdfMetadataAction): PdfMetadataState {
  switch (action.type) {
    case 'START_LOADING':
      return { ...state, loading: true, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'UPDATE_PROGRESS':
      return { ...state, progress: action.payload };
    case 'UPDATE_ENHANCED_RESOURCES':
      return { ...state, enhancedResources: action.payload };
    case 'MARK_PROCESSED':
      const newProcessedIds = new Set(state.processedIds);
      action.payload.forEach(id => newProcessedIds.add(id));
      return { ...state, processedIds: newProcessedIds };
    case 'RESET_PROCESSED':
      return { ...state, processedIds: new Set(), progress: 0 };
    case 'COMPLETE_LOADING':
      return { ...state, loading: false, progress: 100 };
    case 'SET_ENHANCED_RESOURCES':
      return { ...state, enhancedResources: action.payload };
    default:
      return state;
  }
}

/**
 * Enhance a resource with PDF metadata
 */
function enhanceResourceWithMetadata(resource: Resource, metadata: PdfMetadata | null): Resource {
  if (!metadata || resource.type !== 'pdf') {
    return resource;
  }

  return {
    ...resource,
    title: cleanHtmlTags(metadata.title || resource.title || ''),
    description: cleanHtmlTags(metadata.description || resource.description || ''),
    previewUrl: metadata.previewUrl || resource.previewUrl || null,
  };
}

interface UsePdfMetadataOptions {
  enabled?: boolean;
  batchSize?: number;
  delay?: number;
}

interface UsePdfMetadataReturn {
  enhancedResources: Resource[];
  loading: boolean;
  error: string | null;
  progress: number;
  enhanceResource: (resource: Resource) => Promise<Resource>;
  clearCache: () => void;
}

/**
 * Hook to enhance PDF resources with metadata
 */
export function usePdfMetadata(
  resources: Resource[],
  options: UsePdfMetadataOptions = {}
): UsePdfMetadataReturn {
  const { enabled = true, batchSize = 3, delay = 100 } = options;
  
  const [state, dispatch] = useReducer(pdfMetadataReducer, {
    enhancedResources: [],
    loading: false,
    error: null,
    progress: 0,
    processedIds: new Set(),
  });

  /**
   * Enhance a single resource with PDF metadata
   */
  const enhanceResource = useCallback(async (resource: Resource): Promise<Resource> => {
    if (!resource.url || resource.type !== 'pdf') {
      return resource;
    }

    try {
      const metadata = await pdfMetadataService.extractMetadata(resource.url);
      console.log('🔍 Raw metadata from service:', metadata);
      const enhanced = enhanceResourceWithMetadata(resource, metadata);
      console.log('🔧 Enhanced resource details:', {
        hasMetadata: !!metadata,
        metadataPreviewUrl: metadata?.previewUrl,
        metadataDescription: metadata?.description,
        enhancedPreviewUrl: enhanced.previewUrl,
        enhancedDescription: enhanced.description
      });
      return enhanced;
    } catch (err) {
      console.warn(`Failed to enhance PDF resource ${resource.id}:`, err);
      return resource;
    }
  }, []);

  /**
   * Process resources in batches to avoid overwhelming the API
   */
  const processResourcesBatch = useCallback(async (
    resourcesToProcess: Resource[]
  ) => {
    if (!enabled || resourcesToProcess.length === 0) {
      dispatch({ type: 'SET_ENHANCED_RESOURCES', payload: resources });
      return;
    }

    dispatch({ type: 'START_LOADING' });

    // Get current processed IDs at the time of processing
    const currentProcessedIds = state.processedIds;
    const pdfResources = resourcesToProcess.filter(r => 
      r.type === 'pdf' && r.url && !currentProcessedIds.has(r.id)
    );
    
    if (pdfResources.length === 0) {
      dispatch({ type: 'SET_ENHANCED_RESOURCES', payload: resources });
      dispatch({ type: 'COMPLETE_LOADING' });
      return;
    }

    try {
      const enhanced: Resource[] = [...resources];
      const totalPdfs = pdfResources.length;
      let processedCount = 0;

      // Process in batches
      for (let i = 0; i < pdfResources.length; i += batchSize) {
        const batch = pdfResources.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (resource) => {
          console.log('🚀 Processing PDF resource:', {
            id: resource.id,
            title: resource.title,
            url: resource.url
          });
          const enhancedResource = await enhanceResource(resource);
          console.log('✅ Enhanced resource result:', {
            id: enhancedResource.id,
            originalTitle: resource.title,
            enhancedTitle: enhancedResource.title,
            originalDescription: resource.description,
            enhancedDescription: enhancedResource.description,
            originalPreviewUrl: resource.previewUrl,
            enhancedPreviewUrl: enhancedResource.previewUrl
          });
          const originalIndex = resources.findIndex(r => r.id === resource.id);
          if (originalIndex !== -1) {
            enhanced[originalIndex] = enhancedResource;
          }
          return resource.id;
        });

        const completedIds = await Promise.all(batchPromises);
        
        // Update state
        dispatch({ type: 'MARK_PROCESSED', payload: completedIds });
        processedCount += batch.length;
        dispatch({ type: 'UPDATE_PROGRESS', payload: Math.round((processedCount / totalPdfs) * 100) });
        dispatch({ type: 'UPDATE_ENHANCED_RESOURCES', payload: [...enhanced] });

        // Add delay between batches to be respectful to APIs
        if (i + batchSize < pdfResources.length && delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      dispatch({ type: 'COMPLETE_LOADING' });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to enhance PDF resources';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      console.error('Error processing PDF resources:', err);
    }
  }, [resources, enabled, batchSize, delay, enhanceResource]);

  /**
   * Clear the PDF metadata cache
   */
  const clearCache = useCallback(() => {
    pdfMetadataService.clearCache();
    dispatch({ type: 'RESET_PROCESSED' });
  }, []);

  /**
   * Apply cached metadata to resources
   */
  const applyCachedMetadata = useCallback((resources: Resource[]): Resource[] => {
    return resources.map(resource => {
      if (resource.type === 'pdf' && resource.url) {
        const cachedMetadata = pdfMetadataService.getCached(resource.url);
        if (cachedMetadata) {
          console.log('🔍 Applying cached metadata:', {
            url: resource.url,
            originalTitle: resource.title,
            cachedTitle: cachedMetadata.title,
            cachedDescription: cachedMetadata.description,
            cachedPreviewUrl: cachedMetadata.previewUrl
          });
          return enhanceResourceWithMetadata(resource, cachedMetadata);
        } else {
          console.log('❌ No cached metadata found for:', resource.url);
        }
      }
      return resource;
    });
  }, []);

  /**
   * Effect to process resources when they change
   */
  useEffect(() => {
    console.log('🔄 useEffect triggered with:', {
      enabled,
      resourceCount: resources.length,
      processedIds: Array.from(state.processedIds)
    });

    if (!enabled) {
      dispatch({ type: 'SET_ENHANCED_RESOURCES', payload: resources });
      return;
    }

    // Check for new PDFs that need processing
    const currentPdfIds = new Set(resources.filter(r => r.type === 'pdf').map(r => r.id));
    const hasNewPdfs = Array.from(currentPdfIds).some(id => !state.processedIds.has(id));
    
    console.log('📊 PDF Analysis:', {
      currentPdfIds: Array.from(currentPdfIds),
      processedIds: Array.from(state.processedIds),
      hasNewPdfs
    });
    
    if (hasNewPdfs) {
      console.log('🚀 Starting batch processing for new PDFs');
      processResourcesBatch(resources);
    } else {
      console.log('📋 Applying cached metadata to existing resources');
      // Apply cached metadata to existing resources
      const enhancedWithCache = applyCachedMetadata(resources);
      dispatch({ type: 'SET_ENHANCED_RESOURCES', payload: enhancedWithCache });
    }
  }, [resources, enabled]);

  return {
    enhancedResources: state.enhancedResources,
    loading: state.loading,
    error: state.error,
    progress: state.progress,
    enhanceResource,
    clearCache,
  };
}

/**
 * Lightweight hook for enhancing a single PDF resource
 */
export function useSinglePdfMetadata(resource: Resource | null) {
  const [state, dispatch] = useReducer(
    (state: { enhancedResource: Resource | null; loading: boolean; error: string | null }, action: any) => {
      switch (action.type) {
        case 'SET_RESOURCE':
          return { ...state, enhancedResource: action.payload };
        case 'SET_LOADING':
          return { ...state, loading: action.payload };
        case 'SET_ERROR':
          return { ...state, error: action.payload };
        default:
          return state;
      }
    },
    { enhancedResource: null, loading: false, error: null }
  );

  useEffect(() => {
    if (!resource || resource.type !== 'pdf' || !resource.url) {
      dispatch({ type: 'SET_RESOURCE', payload: resource });
      return;
    }

    let isCancelled = false;
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    pdfMetadataService.extractMetadata(resource.url)
      .then(metadata => {
        if (isCancelled) return;
        
        const enhancedResource = enhanceResourceWithMetadata(resource, metadata);
        dispatch({ type: 'SET_RESOURCE', payload: enhancedResource });
      })
      .catch(err => {
        if (isCancelled) return;
        const errorMessage = err instanceof Error ? err.message : 'Failed to enhance PDF';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        dispatch({ type: 'SET_RESOURCE', payload: resource });
      })
      .finally(() => {
        if (!isCancelled) {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [resource]);

  return {
    enhancedResource: state.enhancedResource,
    loading: state.loading,
    error: state.error,
  };
}