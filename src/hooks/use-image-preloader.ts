'use client'

import { useEffect } from 'react'

/**
 * Custom hook to preload images for better performance
 * @param imageUrls - Array of image URLs to preload
 * @param priority - Whether to add preload links to document head
 */
export function useImagePreloader(imageUrls: string[], priority = true) {
  useEffect(() => {
    const preloadedImages: HTMLImageElement[] = []
    const preloadLinks: HTMLLinkElement[] = []

    imageUrls.forEach((url) => {
      // Preload via Image constructor
      const img = new window.Image()
      img.src = url
      preloadedImages.push(img)

      // Add preload link for high priority images
      if (priority) {
        const link = document.createElement('link')
        link.rel = 'preload'
        link.as = 'image'
        link.href = url
        document.head.appendChild(link)
        preloadLinks.push(link)
      }
    })

    return () => {
      // Cleanup: remove preload links when component unmounts
      preloadLinks.forEach((link) => {
        if (document.head.contains(link)) {
          document.head.removeChild(link)
        }
      })
    }
  }, [imageUrls, priority])
}

/**
 * Preload a single image
 * @param imageUrl - Single image URL to preload
 * @param priority - Whether to add preload link to document head
 */
export function useImagePreload(imageUrl: string, priority = true) {
  return useImagePreloader([imageUrl], priority)
} 