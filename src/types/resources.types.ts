/**
 * Resource-related type definitions and utilities
 * Centralized location for all resource types, configurations, and helper functions
 */

import { ExternalLink, Video, FileText, Globe, BookOpen, Image as ImageIcon } from 'lucide-react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** Resource entity interface */
export interface Resource {
  id: number;
  question_id: number | null;
  type: string | null;
  title: string | null;
  url: string | null;
  description: string | null;
  created_at: string;
  relevance_score?: number | null;
  previewUrl?: string | null;
  duration?: string | null;
  videoId?: string | null;
}

/** User preferences for resource types */
export interface UserPreferences {
  use_youtube_sources?: boolean;
  use_pdf_sources?: boolean;
  use_paper_sources?: boolean;
  use_website_sources?: boolean;
  use_book_sources?: boolean;
  use_image_sources?: boolean;
}

// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================

/** Order in which resource types should be displayed */
export const TYPE_DISPLAY_ORDER: readonly string[] = [
  'video', 'pdf', 'paper', 'website', 'book', 'image', 'other'
] as const;

/** Display information for each resource type */
export const TYPE_DISPLAY_INFO: Record<string, { Icon: React.ElementType; title: string }> = {
  video: { Icon: Video, title: 'Videos' },
  youtube: { Icon: Video, title: 'Videos' },
  pdf: { Icon: FileText, title: 'PDFs' },
  paper: { Icon: FileText, title: 'Papers' },
  website: { Icon: Globe, title: 'Websites' },
  book: { Icon: BookOpen, title: 'Books' },
  image: { Icon: ImageIcon, title: 'Illustrations' },
  other: { Icon: ExternalLink, title: 'Other' },
} as const;

/** Default user preferences */
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  use_youtube_sources: true,
  use_pdf_sources: true,
  use_paper_sources: true,
  use_website_sources: true,
  use_book_sources: true,
  use_image_sources: true,
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Extracts YouTube video ID from various YouTube URL formats
 * @param url - YouTube URL
 * @returns Video ID or null if not found
 */
export function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  
  return (match && typeof match[2] === 'string' && match[2].length === 11) 
    ? match[2] 
    : null;
}

/**
 * Extracts domain from URL for favicon generation
 * @param url - Full URL
 * @returns Domain hostname or null if invalid
 */
export function getDomainFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
}

/**
 * Generates favicon URL for a website
 * @param url - Website URL
 * @returns Favicon URL or null if domain cannot be extracted
 */
export function getWebsiteFavicon(url: string): string | null {
  const domain = getDomainFromUrl(url);
  return domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null;
}

/**
 * Returns consistent gradient background for resource types
 * @param _type - Resource type (currently unused for consistency)
 * @returns Tailwind CSS gradient classes
 */
export function getGradientForType(_type: string): string {
  // Using a standard gradient for all types to maintain consistency
  return 'from-gray-600 to-slate-600';
}
