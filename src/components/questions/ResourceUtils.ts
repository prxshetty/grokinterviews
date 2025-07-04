import { ExternalLink, Video, FileText, Globe, BookOpen, Image as ImageIcon } from 'lucide-react';

// Helper function to extract YouTube video ID from URL
export function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && typeof match[2] === 'string' && match[2].length === 11) ? match[2] : null;
}

// Helper function to extract domain from URL for website favicons
export function getDomainFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
}

// Helper function to get website favicon
export function getWebsiteFavicon(url: string): string | null {
  const domain = getDomainFromUrl(url);
  return domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null;
}

// Helper function to create gradient backgrounds based on resource type
export function getGradientForType(_type: string): string {
  // Using a standard gradient for all types to maintain consistency
  return 'from-gray-600 to-slate-600';
}

// Define constants
export const TYPE_DISPLAY_ORDER: string[] = ['video', 'pdf', 'paper', 'website', 'book', 'image', 'other'];

export const TYPE_DISPLAY_INFO: { [key: string]: { Icon: React.ElementType, title: string } } = {
  video: { Icon: Video, title: 'Videos' },
  youtube: { Icon: Video, title: 'Videos' },
  pdf: { Icon: FileText, title: 'PDFs' },
  paper: { Icon: FileText, title: 'Papers' },
  website: { Icon: Globe, title: 'Websites' },
  book: { Icon: BookOpen, title: 'Books' },
  image: { Icon: ImageIcon, title: 'Images' },
  other: { Icon: ExternalLink, title: 'Other' },
};

export const DEFAULT_USER_PREFERENCES = {
  use_youtube_sources: true,
  use_pdf_sources: true,
  use_paper_sources: true,
  use_website_sources: true,
  use_book_sources: true,
  use_image_sources: true,
};

// Resource type definitions
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

export interface UserPreferences {
  use_youtube_sources?: boolean;
  use_pdf_sources?: boolean;
  use_paper_sources?: boolean;
  use_website_sources?: boolean;
  use_book_sources?: boolean;
  use_image_sources?: boolean;
}
