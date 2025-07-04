import { useState, useMemo, useCallback } from 'react';
import { Resource, UserPreferences, TYPE_DISPLAY_ORDER, TYPE_DISPLAY_INFO } from '@/components/questions/ResourceUtils';

interface UseResourceTabsProps {
  resources: Resource[];
  preferences: UserPreferences;
}

interface ResourceTab {
  type: string;
  title: string;
  Icon: React.ElementType | null;
  count: number;
  resources: Resource[];
}

interface UseResourceTabsReturn {
  tabs: ResourceTab[];
  activeTab: ResourceTab | null;
  activeTabType: string | null;
  setActiveTabType: (type: string | null) => void;
  featuredResource: Resource | null;
  setFeaturedResource: (resource: Resource | null) => void;
}

export function useResourceTabs({ 
  resources, 
  preferences 
}: UseResourceTabsProps): UseResourceTabsReturn {
  const [activeTabType, setActiveTabType] = useState<string | null>(null);
  const [featuredResource, setFeaturedResource] = useState<Resource | null>(null);

  // Group resources by type
  const getResourcesByType = useCallback((type: string): Resource[] => {
    return resources.filter(resource => resource.type === type);
  }, [resources]);

  // Create tabs based on available resources and user preferences
  const tabs = useMemo(() => {
    const availableTabs = TYPE_DISPLAY_ORDER
      .map(typeKey => {
        // Check if this resource type is enabled in user preferences
        let isPreferred = true; // Default to true if no preferences
        
        if (preferences) {
          switch (typeKey) {
            case 'video':
            case 'youtube':
              isPreferred = preferences.use_youtube_sources !== false;
              break;
            case 'pdf':
              isPreferred = preferences.use_pdf_sources !== false;
              break;
            case 'paper':
              isPreferred = preferences.use_paper_sources !== false;
              break;
            case 'website':
              isPreferred = preferences.use_website_sources !== false;
              break;
            case 'book':
              isPreferred = preferences.use_book_sources !== false;
              break;
            case 'image':
              isPreferred = preferences.use_image_sources !== false;
              break;
            default:
              isPreferred = true;
          }
        }
        
        const currentResources = getResourcesByType(typeKey);
        if (currentResources.length > 0 && isPreferred) {
          return {
            type: typeKey,
            title: TYPE_DISPLAY_INFO[typeKey]?.title || 'Resources',
            Icon: TYPE_DISPLAY_INFO[typeKey]?.Icon || null,
            count: currentResources.length,
            resources: currentResources, 
          };
        }
        return null;
      })
      .filter(tab => tab !== null) as ResourceTab[];

    return availableTabs;
  }, [preferences, getResourcesByType]);

  // Set initial active tab
  useMemo(() => {
    if (tabs.length > 0 && !activeTabType) {
      setActiveTabType(tabs[0]?.type || null);
    }
  }, [tabs, activeTabType]);

  // Initialize featured resource with highest relevance score from first tab if not set
  useMemo(() => {
    if (!featuredResource && tabs.length > 0 && tabs[0] && tabs[0].resources?.length > 0) {
      const sortedResources = [...tabs[0].resources].sort((a, b) => {
        const scoreA = a.relevance_score || 0;
        const scoreB = b.relevance_score || 0;
        return scoreB - scoreA; // Highest score first
      });
      const topResource = sortedResources[0];
      if (topResource) {
        setFeaturedResource(topResource);
      }
    }
  }, [tabs, featuredResource]);

  // Update featured resource when active tab changes to highest relevance score in that tab
  useMemo(() => {
    if (activeTabType && tabs.length > 0) {
      const currentTab = tabs.find(tab => tab.type === activeTabType);
      if (currentTab && currentTab.resources.length > 0) {
        const sortedResources = [...currentTab.resources].sort((a, b) => {
          const scoreA = a.relevance_score || 0;
          const scoreB = b.relevance_score || 0;
          return scoreB - scoreA; // Highest score first
        });
        const topResource = sortedResources[0];
        if (topResource && (!featuredResource || featuredResource.type !== activeTabType)) {
          setFeaturedResource(topResource);
        }
      }
    }
  }, [activeTabType, tabs, featuredResource]);

  // Filter out featured resource from tabs
  const filteredTabs = useMemo(() => {
    if (!featuredResource) return tabs;
    
    return tabs.map(tab => ({
      ...tab,
      resources: tab.resources.filter(resource => resource.id !== featuredResource.id),
      count: tab.resources.filter(resource => resource.id !== featuredResource.id).length
    }));
  }, [tabs, featuredResource]);

  // Get active tab from filtered tabs
  const activeTab = useMemo(() => {
    return filteredTabs.find(tab => tab.type === activeTabType) || null;
  }, [filteredTabs, activeTabType]);

  return {
    tabs: filteredTabs,
    activeTab,
    activeTabType,
    setActiveTabType,
    featuredResource,
    setFeaturedResource
  };
}
