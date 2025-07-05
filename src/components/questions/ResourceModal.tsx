'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { X, ArrowUpRight, ExternalLink } from 'lucide-react';
import { Resource, TYPE_DISPLAY_INFO, getGradientForType } from '@/components/questions/ResourceUtils';

interface ResourceModalProps {
  resource: Resource | null;
  onClose: () => void;
}

export function ResourceModal({ resource, onClose }: ResourceModalProps) {
  if (!resource) return null;

  return (
<AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div
          className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
          onClick={onClose}
        />
        
        <motion.div
          layoutId={`resource-card-${resource.id}`}
          className="relative w-[90vw] max-w-4xl max-h-[90vh] bg-card border border-border rounded-xl overflow-hidden flex flex-col"
        >
          <motion.button
            className="absolute top-4 right-4 w-8 h-8 bg-background/80 hover:bg-background rounded-full flex items-center justify-center z-20"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </motion.button>

          <motion.div
            layoutId={`resource-image-${resource.id}`}
            className="relative w-full aspect-video bg-black flex-shrink-0 z-10"
          >
            {(resource.type === 'video' || resource.type === 'youtube') && resource.videoId ? (
              <iframe
                src={`https://www.youtube.com/embed/${resource.videoId}?autoplay=1&rel=0&showinfo=0`}
                title={resource.title || 'YouTube video player'}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full rounded-lg"
                loading="eager"
              ></iframe>
            ) : resource.previewUrl ? (
              <Image 
                src={resource.previewUrl} 
                alt={resource.title || 'Resource preview'} 
                layout="fill" 
                objectFit="cover" 
              />
            ) : (
              <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${getGradientForType(resource.type || 'other')}`}>
                {(() => {
                    const Info = TYPE_DISPLAY_INFO[resource.type || 'other'];
                    return Info ? <Info.Icon className="w-24 h-24 text-white/50" /> : <ExternalLink className="w-24 h-24 text-white/50" />;
                })()}
              </div>
            )}
          </motion.div>
          
          {/* Title section for videos */}
          {(resource.type === 'video' || resource.type === 'youtube') && (
            <div className="px-4 md:px-6 pt-4 pb-2">
              <motion.h1 
                layoutId={`resource-title-${resource.id}`} 
                className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {resource.title}
              </motion.h1>
            </div>
          )}

          {!(resource.type === 'video' || resource.type === 'youtube') && (
            <div className="overflow-y-auto">
              <motion.div layoutId={`resource-content-${resource.id}`} className="p-4 md:p-6">
                <motion.h1 layoutId={`resource-title-${resource.id}`} className="text-xl md:text-2xl font-bold mb-3">
                  {resource.title}
                </motion.h1>
                
                <motion.div 
                  className="prose dark:prose-invert max-w-none text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <p className="text-sm">{resource.description || "No description available for this resource."}</p>
                </motion.div>
              </motion.div>
            </div>
          )}

          <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-6 bg-card mt-auto">
            <div className="flex justify-end">
              <Button 
                variant="default"
                onClick={(e) => {
                  e.stopPropagation();
                  if (resource.url) {
                    window.open(resource.url, '_blank', 'noopener,noreferrer');
                  }
                }}
                aria-label="Open Resource in New Tab"
              >
                Open Original <ArrowUpRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
