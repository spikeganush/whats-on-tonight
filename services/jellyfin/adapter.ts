import { Movie } from '../../types/tmdb';
import { JellyfinItem } from './types';

interface JellyfinServerConfig {
  baseUrl: string;
  apiKey: string;
}

/**
 * Transforms a Jellyfin Item into a TMDB-compatible Movie object.
 *
 * Note: This adapter assumes the Jellyfin item has a Tmdb ProviderId.
 * If not, it falls back to a hash-based numeric ID (which might collide or conflict with real TMDB IDs).
 *
 * Images: Returns absolute URLs. Frontend must be updated to handle them.
 */
export const adaptJellyfinItemToMovie = (
  item: JellyfinItem,
  config: JellyfinServerConfig,
): Movie => {
  // 1. Resolve ID (Prefer TMDB ID, fallback to hash)
  let id = 0;
  if (item.ProviderIds?.Tmdb) {
    id = parseInt(item.ProviderIds.Tmdb, 10);
  } else {
    // Fallback: Simple hash from GUID (Not ideal for collision, but keeps type safety)
    // This uses the last 8 chars of the GUID -> integer
    const shortHash = item.Id.slice(-8);
    id = parseInt(shortHash, 16);
  }

  // 2. Resolve Images
  // Handle both 'url' and 'baseUrl' property names
  const baseUrl = (config as any).url || config.baseUrl;

  let poster_path = '';
  if (item.ImageTags?.Primary) {
    poster_path = `${baseUrl}/Items/${item.Id}/Images/Primary?tag=${item.ImageTags.Primary}&api_key=${config.apiKey}`;
  }

  let backdrop_path = '';
  if (item.BackdropImageTags && item.BackdropImageTags.length > 0) {
    const tag = item.BackdropImageTags[0];
    backdrop_path = `${baseUrl}/Items/${item.Id}/Images/Backdrop/0?tag=${tag}&api_key=${config.apiKey}`;
  }

  // 3. Resolve Date
  const release_date = item.PremiereDate ? item.PremiereDate.split('T')[0] : '';

  // 4. Resolve Genres
  const genres =
    item.GenreItems?.map((g) => ({
      id: parseInt(g.Id.slice(-8), 16), // Mock ID from Hash
      name: g.Name,
    })) || [];

  return {
    id,
    title: item.Name,
    poster_path, // ABSOLUTE URL
    backdrop_path, // ABSOLUTE URL
    overview: item.Overview || '',
    release_date,
    vote_average: item.CommunityRating || 0,
    genres, // Extra field (ExtendedMovie compatibility)
  } as Movie;
};
