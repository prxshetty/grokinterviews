// Utility to check if code is running in browser or server
export const isBrowser = typeof window !== 'undefined';
export const isServer = !isBrowser;
