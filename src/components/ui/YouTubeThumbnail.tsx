'use client';

import { useState, useMemo } from 'react';
import Image, { type ImageProps } from 'next/image';

interface YouTubeThumbnailWithFallbackProps extends Omit<ImageProps, 'src' | 'alt'> {
  videoId: string;
  alt: string;
  className?: string;
}

export function YouTubeThumbnailWithFallback({
  videoId,
  alt,
  className,
  ...props
}: YouTubeThumbnailWithFallbackProps) {
  const qualities = useMemo(() => ['maxresdefault', 'sddefault', 'hqdefault', 'mqdefault'], []);
  const [currentQualityIndex, setCurrentQualityIndex] = useState(0);

  const handleImageError = () => {
    if (currentQualityIndex < qualities.length - 1) {
      setCurrentQualityIndex(prev => prev + 1);
    }
  };

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/${qualities[currentQualityIndex]}.jpg`;

  return (
    <Image
      src={thumbnailUrl}
      alt={alt}
      onError={handleImageError}
      className={className}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      unoptimized={true}
      {...props}
    />
  );
}
