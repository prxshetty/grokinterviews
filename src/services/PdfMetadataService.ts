/**
 * PDF Metadata Extraction Service
 * Handles metadata extraction for PDF resources, primarily from Wikimedia Commons
 */

import { cleanTitle, cleanDescription } from '@/utils/textUtils';

export interface PdfMetadata {
  title: string;
  description?: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  fileSize?: string;
  pageCount?: number;
  author?: string;
  uploadDate?: string;
  directPdfUrl?: string;
}

export interface WikimediaFileInfo {
  title: string;
  description?: string;
  url: string;
  thumburl?: string;
  size?: number;
  pagecount?: number;
  user?: string;
  timestamp?: string;
  metadata?: Array<{ name: string; value: string }>;
  extmetadata?: {
    ObjectName?: { value: string };
    ImageDescription?: { value: string };
    Artist?: { value: string };
    DateTimeOriginal?: { value: string };
  };
}

class PdfMetadataService {
  private static readonly WIKIMEDIA_API_BASE = 'https://commons.wikimedia.org/w/api.php';
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly MAX_CACHE_SIZE = 1000;
  private cache = new Map<string, { data: PdfMetadata; timestamp: number }>();
  private pendingRequests = new Map<string, Promise<PdfMetadata | null>>();

  /**
   * Extract PDF metadata from various sources
   */
  async extractMetadata(url: string): Promise<PdfMetadata | null> {
    try {
      // Check cache first
      const cached = this.getCachedMetadata(url);
      if (cached) {
        return cached;
      }

      // Check if request is already pending to avoid duplicates
      const pendingRequest = this.pendingRequests.get(url);
      if (pendingRequest) {
        return pendingRequest;
      }

      // Create new request and store it
      const requestPromise = this.performExtraction(url);
      this.pendingRequests.set(url, requestPromise);

      try {
        const metadata = await requestPromise;
        
        // Cache the result
        if (metadata) {
          this.setCachedMetadata(url, metadata);
        }

        return metadata;
      } finally {
        // Clean up pending request
        this.pendingRequests.delete(url);
      }
    } catch (error) {
      console.error('PdfMetadataService: Error extracting PDF metadata:', error);
      return this.extractBasicMetadata(url);
    }
  }

  private async performExtraction(url: string): Promise<PdfMetadata | null> {
    if (this.isWikimediaUrl(url)) {
      return await this.extractWikimediaMetadata(url);
    } else {
      return this.extractBasicMetadata(url);
    }
  }

  /**
   * Check if URL is from Wikimedia Commons
   */
  private isWikimediaUrl(url: string): boolean {
    return url.includes('commons.wikimedia.org');
  }

  /**
   * Extract metadata from Wikimedia Commons (single file)
   */
  private async extractWikimediaMetadata(url: string): Promise<PdfMetadata | null> {
    const results = await this.extractWikimediaMetadataBatch([url]);
    return results.get(url) || null;
  }

  /**
   * Extract metadata from Wikimedia Commons (batch processing)
   */
  async extractWikimediaMetadataBatch(urls: string[]): Promise<Map<string, PdfMetadata | null>> {
    const results = new Map<string, PdfMetadata | null>();
    
    try {
      // Extract filenames for all URLs
      const urlFilenameMap = new Map<string, string>();
      const validFilenames: string[] = [];
      
      for (const url of urls) {
        const filename = this.extractWikimediaFilename(url);
        if (filename) {
          urlFilenameMap.set(filename, url);
          validFilenames.push(filename);
        } else {
          results.set(url, null);
        }
      }

      if (validFilenames.length === 0) {
        return results;
      }

      // Batch API call for all valid filenames
      const apiUrl = new URL(PdfMetadataService.WIKIMEDIA_API_BASE);
      apiUrl.searchParams.set('action', 'query');
      apiUrl.searchParams.set('format', 'json');
      apiUrl.searchParams.set('prop', 'imageinfo|extracts');
      apiUrl.searchParams.set('iiprop', 'url|size|metadata|extmetadata|user|timestamp');
      apiUrl.searchParams.set('iiurlwidth', '300');
      apiUrl.searchParams.set('titles', validFilenames.join('|'));
      apiUrl.searchParams.set('origin', '*');

      console.log('🔗 Making API call to:', apiUrl.toString());
      const response = await fetch(apiUrl.toString());
      
      if (!response.ok) {
        console.error('❌ API response not OK:', response.status, response.statusText);
        return results;
      }
      
      const data = await response.json();
      console.log('📡 Raw API response:', JSON.stringify(data, null, 2));

      // Handle normalized titles (WikiCommons converts underscores to spaces)
      if (data.query?.normalized) {
        data.query.normalized.forEach((norm: any) => {
          const originalUrl = urlFilenameMap.get(norm.from);
          if (originalUrl) {
            urlFilenameMap.set(norm.to, originalUrl);
          }
        });
      }

      const pages = data.query?.pages;
      if (!pages) {
        // Mark all as null if no pages returned
        for (const url of urls) {
          if (!results.has(url)) {
            results.set(url, null);
          }
        }
        return results;
      }

      // Process each page
      for (const [pageId, page] of Object.entries(pages)) {
        if (pageId === '-1' || !page || typeof page !== 'object') continue;
        
        const pageData = page as any;
        const filename = pageData.title;
        console.log('🔍 Processing page:', { pageId, filename });
        
        // Find the original URL for this filename
        const originalUrl = urlFilenameMap.get(filename);
        console.log('🔗 URL mapping:', { filename, originalUrl, allMappings: Object.fromEntries(urlFilenameMap) });
        
        if (!originalUrl) {
          console.warn('⚠️ No URL found for filename:', filename);
          continue;
        }

        if (pageData.imageinfo?.[0]) {
          const imageInfo = pageData.imageinfo[0];
          console.log('📊 Image info found for:', filename, imageInfo);
          const metadata = this.parseWikimediaResponse(imageInfo, filename);
          results.set(originalUrl, metadata);
        } else {
          console.warn('❌ No imageinfo for:', filename);
          results.set(originalUrl, null);
        }
      }

      // Ensure all URLs have a result
      for (const url of urls) {
        if (!results.has(url)) {
          results.set(url, null);
        }
      }

      return results;
    } catch (error) {
      console.error('PdfMetadataService: Error fetching Wikimedia metadata batch:', error);
      
      // Set all URLs to null on error
      for (const url of urls) {
        results.set(url, null);
      }
      
      return results;
    }
  }

  /**
   * Extract filename from Wikimedia Commons URL
   */
  private extractWikimediaFilename(url: string): string | null {
    try {
      const match = url.match(/File:([^#?]+)/);
      if (match && match[1]) {
        return `File:${decodeURIComponent(match[1])}`;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Parse Wikimedia API response into PdfMetadata
   */
  private parseWikimediaResponse(imageInfo: WikimediaFileInfo, filename: string): PdfMetadata {
    // Parse metadata array into a key-value object for easier access
    const metadataMap: Record<string, string> = {};
    if (imageInfo.metadata && Array.isArray(imageInfo.metadata)) {
      imageInfo.metadata.forEach((item: any) => {
        if (item.name && item.value) {
          metadataMap[item.name] = item.value;
        }
      });
    }
    
    // We only need thumburl and description - titles come from your database
    // For Internet Archive PDFs, use Keywords field as description (contains archive.org link)
    // Otherwise try ImageDescription from extmetadata
    const extmetadata = imageInfo.extmetadata || {};
    const description = metadataMap.Keywords && metadataMap.Keywords.includes('archive.org') 
                       ? `Internet Archive: ${metadataMap.Keywords}`
                       : cleanDescription(extmetadata.ImageDescription?.value);
    
    // Use filename as fallback title but we mainly care about thumburl and description
    const metadata: PdfMetadata = {
      title: filename.replace('File:', '').replace('.pdf', ''),
      directPdfUrl: imageInfo.url,
    };

    // Only add what we actually need
    if (description) metadata.description = description;
    if (imageInfo.thumburl) metadata.previewUrl = imageInfo.thumburl;
    if (imageInfo.thumburl) metadata.thumbnailUrl = imageInfo.thumburl;

    console.log('📋 Parsed Wikimedia metadata:', {
      filename,
      title: metadata.title,
      description: metadata.description,
      previewUrl: metadata.previewUrl,
      thumbnailUrl: metadata.thumbnailUrl,
      directPdfUrl: metadata.directPdfUrl,
      originalMetadata: metadataMap
    });

    return metadata;
  }

  /**
   * Extract basic metadata for non-Wikimedia URLs
   */
  private extractBasicMetadata(url: string): PdfMetadata {
    const filename = this.extractFilenameFromUrl(url);
    return {
      title: cleanTitle(filename || 'PDF Document'),
      directPdfUrl: url,
    };
  }

  /**
   * Extract filename from URL
   */
  private extractFilenameFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.split('/').pop();
      return filename ? decodeURIComponent(filename) : null;
    } catch {
      return null;
    }
  }


  /**
   * Get cached metadata
   */
  private getCachedMetadata(url: string): PdfMetadata | null {
    this.cleanExpiredCache();
    const cached = this.cache.get(url);
    if (cached && Date.now() - cached.timestamp < PdfMetadataService.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  /**
   * Set cached metadata
   */
  private setCachedMetadata(url: string, metadata: PdfMetadata): void {
    // Enforce cache size limit
    if (this.cache.size >= PdfMetadataService.MAX_CACHE_SIZE) {
      this.evictOldestCacheEntry();
    }
    
    this.cache.set(url, {
      data: metadata,
      timestamp: Date.now(),
    });
  }

  /**
   * Remove expired cache entries
   */
  private cleanExpiredCache(): void {
    const now = Date.now();
    for (const [url, cached] of this.cache.entries()) {
      if (now - cached.timestamp >= PdfMetadataService.CACHE_DURATION) {
        this.cache.delete(url);
      }
    }
  }

  /**
   * Remove oldest cache entry when cache is full
   */
  private evictOldestCacheEntry(): void {
    let oldestUrl: string | null = null;
    let oldestTimestamp = Date.now();
    
    for (const [url, cached] of this.cache.entries()) {
      if (cached.timestamp < oldestTimestamp) {
        oldestTimestamp = cached.timestamp;
        oldestUrl = url;
      }
    }
    
    if (oldestUrl) {
      this.cache.delete(oldestUrl);
    }
  }

  /**
   * Get cached metadata for a URL (public method)
   */
  getCached(url: string): PdfMetadata | null {
    return this.getCachedMetadata(url);
  }

  /**
   * Clear the metadata cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const pdfMetadataService = new PdfMetadataService();
export default pdfMetadataService;