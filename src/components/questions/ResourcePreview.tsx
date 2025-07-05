'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { Resource, TYPE_DISPLAY_INFO, getGradientForType } from '@/components/questions/ResourceUtils';

interface ResourcePreviewProps {
  resource: Resource;
  onResourceClick: (resource: Resource) => void;
}

export function ResourcePreview({ resource, onResourceClick }: ResourcePreviewProps) {
  const ResourceTypeIcon = TYPE_DISPLAY_INFO[resource.type || 'other']?.Icon || ExternalLink;

  return (
    <div className="w-full h-full">
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 h-full flex flex-col">
        {/* Thumbnail/Preview Area - Much larger featured video */}
        <div className="relative w-full aspect-video bg-black flex-shrink-0 max-h-98">
          {(resource.type === 'video' || resource.type === 'youtube') && resource.videoId ? (
            <iframe
              src={`https://www.youtube.com/embed/${resource.videoId}?rel=0&showinfo=0`}
              title={resource.title || 'Video player'}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
              loading="eager"
            />
          ) : resource.previewUrl ? (
            <div 
              className="relative w-full h-full cursor-pointer" 
              onClick={() => onResourceClick(resource)}
            >
              <Image 
                src={resource.previewUrl}
                alt={resource.title || 'Resource preview'}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-200" />
            </div>
          ) : (
            <div 
              className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${getGradientForType(resource.type || 'other')} cursor-pointer`}
              onClick={() => onResourceClick(resource)}
            >
              <ResourceTypeIcon className="w-16 h-16 text-white/70" />
            </div>
          )}
        </div>

        {/* Content Area - More compact */}
        <div className="p-2 flex flex-col">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-sm font-medium text-foreground line-clamp-1 flex-1">
              {resource.title || 'Untitled Resource'}
            </h3>
            <div className="flex items-center flex-shrink-0">
              <Button 
                variant="default"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  if (resource.url) {
                    window.open(resource.url, '_blank', 'noopener,noreferrer');
                  }
                }}
                className="flex-shrink-0"
              >
                Open <svg className="h-3.5 w-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7L13 7M17 7L17 11" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
