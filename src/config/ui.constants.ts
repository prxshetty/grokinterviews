/**
 * UI Constants
 * Shared constants for UI components across the application
 */

// Default avatar image used throughout the application
export const DEFAULT_AVATAR_URL = "https://shadcnblocks.com/images/block/avatar-1.webp"

// Avatar images for various UI components
export const AVATAR_URLS = {
  DEFAULT: "https://shadcnblocks.com/images/block/avatar-1.webp",
  AVATAR_2: "https://shadcnblocks.com/images/block/avatar-2.webp",
  AVATAR_3: "https://shadcnblocks.com/images/block/avatar-3.webp",
} as const

// Other UI constants can be added here as needed
export const UI_CONSTANTS = {
  AVATAR: {
    DEFAULT_URL: DEFAULT_AVATAR_URL,
    URLS: AVATAR_URLS,
  },
} as const 