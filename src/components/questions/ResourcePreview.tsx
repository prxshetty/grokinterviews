'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { useIsMobile, useIsTabletOrSmaller } from '@/hooks/ui';
import { Resource, TYPE_DISPLAY_INFO, getGradientForType, getWebsiteFavicon } from '@/types/resources.types';
import { PdfViewer } from '@/components/ui/PdfViewer';

interface ResourcePreviewProps {
  resource: Resource;
  onResourceClick: (resource: Resource) => void;
}

export function ResourcePreview({ resource, onResourceClick }: ResourcePreviewProps) {
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);
  const ResourceTypeIcon = TYPE_DISPLAY_INFO[resource.type || 'other']?.Icon || ExternalLink;
  const isMobile = useIsMobile();
  const isTabletOrSmaller = useIsTabletOrSmaller();

  // Use resource data - for image/website/pdf/paper/book resources, fallback to favicon
  const displayTitle = resource.title || 'Untitled Resource';
  const displayDescription = resource.description;
  const displayImage = resource.previewUrl || 
    ((resource.type === 'image' || resource.type === 'website' || resource.type === 'pdf' || resource.type === 'paper' || resource.type === 'book') && resource.url ? 
     getWebsiteFavicon(resource.url) : null);


  // Determine optimal sizing based on device
  const getAspectRatio = () => {
    if (isMobile) return 'aspect-[16/10] max-h-48';
    if (isTabletOrSmaller) return 'aspect-[16/9] max-h-64'; // Better for iPad
    return 'aspect-video max-h-98';
  };

  const getIconSize = () => {
    if (isMobile) return 'w-10 h-10';
    if (isTabletOrSmaller) return 'w-14 h-14'; // Larger for iPad
    return 'w-16 h-16';
  };

  const getTextSize = () => {
    if (isMobile) return 'text-xs';
    if (isTabletOrSmaller) return 'text-sm'; // Better readability on iPad
    return 'text-sm';
  };

  const getPadding = () => {
    if (isMobile) return 'p-2';
    if (isTabletOrSmaller) return 'p-3'; // More breathing room on iPad
    return 'p-2';
  };

  const getButtonSize = () => {
    if (isMobile) return 'sm';
    if (isTabletOrSmaller) return 'default'; // Larger button for iPad
    return 'sm';
  };

  return (
    <div className="w-full h-full">
      <div className="bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 h-full flex flex-col">
        {/* Thumbnail/Preview Area - Optimized aspect ratios */}
        <div className={`relative w-full bg-black flex-shrink-0 ${getAspectRatio()}`}>
          {(resource.type === 'video' || resource.type === 'youtube') && resource.videoId ? (
            <iframe
              src={`https://www.youtube.com/embed/${resource.videoId}?rel=0&showinfo=0`}
              title={resource.title || 'Video player'}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
              loading="lazy"
            />
          ) : displayImage ? (
            <div 
              className="relative w-full h-full cursor-pointer" 
              onClick={() => {
                if (resource.type === 'pdf') {
                  setIsPdfViewerOpen(true);
                } else {
                  onResourceClick(resource);
                }
              }}
            >
              <Image 
                src={displayImage}
                alt={displayTitle}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-contain"
                unoptimized={resource.type === 'image'} // Don't optimize external preview images
              />
              <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-200" />
            </div>
          ) : (
            <div 
              className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${getGradientForType(resource.type || 'other')} cursor-pointer`}
              onClick={() => {
                if (resource.type === 'pdf') {
                  setIsPdfViewerOpen(true);
                } else {
                  onResourceClick(resource);
                }
              }}
            >
              <ResourceTypeIcon className={`text-white/70 ${getIconSize()}`} />
            </div>
          )}
        </div>

        {/* Content Area - Responsive padding and text sizing */}
        <div className={`flex flex-col ${getPadding()}`}>
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1">
              <h3 className={`font-medium text-foreground line-clamp-2 leading-tight ${getTextSize()}`}>
                {displayTitle}
              </h3>
              {displayDescription && (
                <p className={`text-muted-foreground line-clamp-2 mt-1 leading-tight ${isMobile ? 'text-xs' : 'text-xs'}`}>
                  {displayDescription}
                </p>
              )}
            </div>
            <div className="flex items-center flex-shrink-0">
              <Button 
                variant="default"
                size={getButtonSize()}
                onClick={(e) => {
                  e.stopPropagation();
                  if (resource.url) {
                    window.open(resource.url, '_blank', 'noopener,noreferrer');
                  }
                }}
                className="flex-shrink-0"
              >
                Open <svg className={`ml-1 ${isMobile ? 'h-3 w-3' : 'h-3.5 w-3.5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7L13 7M17 7L17 11" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* PDF Viewer Modal */}
      {resource.type === 'pdf' && (
        <PdfViewer 
          resource={resource}
          isOpen={isPdfViewerOpen}
          onClose={() => setIsPdfViewerOpen(false)}
        />
      )}
    </div>
  );
}
