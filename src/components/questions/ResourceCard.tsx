'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { YouTubeThumbnailWithFallback } from '@/components/ui/YouTubeThumbnail';

import { Resource, TYPE_DISPLAY_INFO, getGradientForType } from '@/types/resources.types';

interface ResourceCardProps {
  resource: Resource;
  index: number;
  onResourceClick: (resource: Resource) => void;
  shouldReduceMotion?: boolean;
}

export function ResourceCard({ 
  resource, 
  index, 
  onResourceClick, 
  shouldReduceMotion = false 
}: ResourceCardProps) {
  return (
    <motion.div
      key={resource.id}
      layoutId={`resource-card-${resource.id}`}
      whileHover={!shouldReduceMotion ? { 
        y: -4,
        scale: 1.01,
        transition: { type: "spring", stiffness: 400, damping: 25 }
      } : {}}
      onClick={() => onResourceClick(resource)}
      className="overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col bg-white dark:bg-gray-900 rounded-lg group w-full h-full border border-gray-200 dark:border-gray-700 cursor-pointer"
    >
      {/* Image Section - Larger height for better thumbnail visibility */}
      <motion.div 
        layoutId={`resource-image-${resource.id}`} 
        className="relative h-20 w-full bg-gray-100 dark:bg-gray-800 flex-shrink-0"
      >
        {(resource.type === 'video' || resource.type === 'youtube') && resource.videoId ? (
          <YouTubeThumbnailWithFallback
            videoId={resource.videoId}
            alt={resource.title || 'YouTube video preview'}
            layout="fill"
            objectFit="cover"
            className="rounded-t-lg"
            priority={index < 3} // Prioritize loading for first few images
          />
        ) : resource.previewUrl ? (
          <div className="relative h-full w-full">
            <Image 
              src={resource.previewUrl} 
              alt={resource.title || 'Resource preview'} 
              layout="fill" 
              objectFit="cover" 
              className="rounded-t-lg" 
            />
            {/* Special handling for website favicons if previewUrl is a favicon */}
            {resource.type === 'website' && resource.previewUrl.includes('google.com/s2/favicons') && (
              <div className={`absolute inset-0 bg-gradient-to-br ${getGradientForType(resource.type)} rounded-t-lg flex items-center justify-center`}>
                <div className="bg-white/95 dark:bg-gray-800/95 rounded-full p-6 shadow-lg">
                  <Image 
                    src={resource.previewUrl} 
                    alt="Website favicon" 
                    width={48} 
                    height={48} 
                    className="rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${getGradientForType(resource.type || 'other')} rounded-t-lg relative overflow-hidden`}>
            {(() => {
              const Info = TYPE_DISPLAY_INFO[resource.type || 'other'];
              return Info ? <Info.Icon className="w-8 h-8 text-white/70" /> : (
                <svg className="w-8 h-8 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7L13 7M17 7L17 11" />
                </svg>
              );
            })()}
          </div>
        )}
      </motion.div>

      {/* Content Section */}
      <div className="px-2 pb-2 flex flex-col flex-grow">
        {/* Type Badge */}
        <div className="flex items-center pt-1.5 mb-1.5">
          <div 
            className="text-xs font-medium px-1.5 py-0.5 rounded-full flex items-center"
            style={{
              background: getGradientForType(resource.type || 'other'),
              color: 'white',
            }}
          >
            {resource.type && TYPE_DISPLAY_INFO[resource.type]?.Icon && (() => {
              const IconComponent = TYPE_DISPLAY_INFO[resource.type]?.Icon;
              return IconComponent ? <IconComponent className="h-3 w-3 mr-1.5" /> : null;
            })()}
            <span className="text-xs">{resource.type ? TYPE_DISPLAY_INFO[resource.type]?.title || resource.type : 'Other'}</span>
          </div>
        </div>
        
        {/* Title - Allow more lines for better readability */}
        <h3 className="text-xs font-semibold tracking-tight text-gray-900 dark:text-white line-clamp-2 leading-tight group-hover:text-primary transition-colors">
          {resource.title || 'Untitled Resource'}
        </h3>
      </div>
    </motion.div>
  );
}
