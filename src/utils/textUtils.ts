/**
 * Text processing utilities
 */

/**
 * Clean HTML tags and decode common HTML entities from text content
 */
export function cleanHtmlTags(text: string): string {
  if (!text) return text;
  
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Clean and format title text
 */
export function cleanTitle(title: string): string {
  return title
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\.(pdf|PDF)$/, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Clean and format description with optional length limit
 */
export function cleanDescription(description?: string, maxLength: number = 200): string | undefined {
  if (!description) return undefined;
  
  const cleaned = cleanHtmlTags(description);
  return cleaned.length > maxLength 
    ? cleaned.substring(0, maxLength) + '...'
    : cleaned;
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}