/**
 * Helper to get the correct Image URL.
 * If path starts with http, return it as is.
 * Otherwise, prepend TMDB base URL.
 */

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/';

export const getImageUrl = (
  path: string | null | undefined,
  size: string = 'w500',
): string => {
  if (!path) return ''; // Or a placeholder
  if (path.startsWith('http') || path.startsWith('https')) {
    return path;
  }
  return `${TMDB_IMAGE_BASE}${size}${path}`;
};
