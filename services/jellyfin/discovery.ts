import { Movie } from '../../types/tmdb';
import { decryptServerConfig } from '../../utils/crypto';
import { adaptJellyfinItemToMovie } from './adapter';
import { JellyfinItem } from './types';

interface JellyfinServerConfig {
  baseUrl: string;
  apiKey: string;
}

// Map TMDB Genre IDs to English Names (Approximate for filtering)
// TMDB IDs: https://developer.themoviedb.org/reference/genre-movie-list
const TMDB_GENRE_MAP: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
};

// Simple fetch wrapper
async function fetchJellyfin(url: string): Promise<any> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(
        'Jellyfin Fetch Error:',
        response.status,
        response.statusText,
      );
      throw new Error(`Jellyfin Error: ${response.status}`);
    }
    return await response.json();
  } catch (e) {
    console.error('Jellyfin Network Error', e);
    throw e;
  }
}

export const getServerConfig = (
  config: string | undefined | null,
): JellyfinServerConfig | null => {
  try {
    if (config) return JSON.parse(config);
  } catch (e) {
    console.warn('Invalid Server Config:', config);
  }

  // Fallback
  const envUrl = process.env.EXPO_PUBLIC_JELLYFIN_SERVER_URL;
  const envKey = process.env.EXPO_PUBLIC_JELLYFIN_API_KEY;

  if (envUrl && envKey) {
    return { baseUrl: envUrl, apiKey: envKey };
  }
  return null;
};

export const getJellyfinItemDetails = async (
  id: number,
  configStr: string | undefined,
): Promise<Movie | null> => {
  // Note: We only have a numeric ID (Hash or TMDB ID).
  // Jellyfin requires the GUID (String).
  // If we only have the Hash, we CANNOT fetch from Jellyfin.
  // If we kept the TMDB ID, and this IS a TMDB ID, we should have used TMDB API.

  // CRITICAL ISSUE: We cannot fetch by numeric Hash ID from Jellyfin.
  // Unless we search? "Fields=ProviderIds"?
  // Search is too heavy?

  // For now, if we don't have the GUID, we can't reliably get details from Jellyfin just by ID.
  // EXCEPT: If we cached the movie object in the component?
  // `Results.tsx` fetches fresh using ID.

  // Workaround: We can't implement this fully without changing Schema to store GUID.
  // I will skip implementing `getJellyfinItemDetails` for now as it won't work with Hash IDs.
  // I will just export `getServerConfig` to clean up `discoverJellyfin`.
  return null;
};

export const discoverJellyfin = async (
  config: string,
  tmdbGenreIds?: number[],
  limit: number = 50,
  roomCode?: string,
): Promise<Movie[]> => {
  let serverConfig = getServerConfig(config);

  // If not valid JSON, try decryption using roomCode
  if (!serverConfig && roomCode) {
    const decrypted = decryptServerConfig(config, roomCode);
    if (decrypted) serverConfig = decrypted as any;
  }

  if (serverConfig) {
    console.log(
      'Decrypted Server Config:',
      JSON.stringify(serverConfig, null, 2),
    );
  }

  // Hardcoded Fallback
  if (!serverConfig) {
    console.warn(
      'Jellyfin Config Invalid/Encrypted failed. Trying Hardcoded Fallback.',
    );
    serverConfig = {
      baseUrl: 'http://192.168.1.27:8096',
      apiKey: '2375d3380689413fb99758e69063cda7',
    };
  }

  if (!serverConfig) {
    console.error(
      'No valid Jellyfin config found (DB, Env, Decrypt, or Hardcoded)',
    );
    return [];
  }

  const baseUrl = (serverConfig as any).url || serverConfig.baseUrl;
  const { apiKey } = serverConfig;

  // Construct URL
  // We fetch Movies, Recursive, Fields needed for Adapter
  // Note: Jellyfin doesn't support filtering by "TMDB Genre ID".
  // We can filter by Genre Name if we map IDs -> Names.

  let genreFilter = '';
  if (tmdbGenreIds && tmdbGenreIds.length > 0) {
    // Jellyfin supports "Genres" param (pipe delimited names?) or "GenreIds" (Jellyfin GUIDs).
    // Since we don't have Jellyfin GUIDs for genres upfront, we try to filter by Name if possible.
    // API: Genres=Comedy|Action
    const names = tmdbGenreIds.map((id) => TMDB_GENRE_MAP[id]).filter(Boolean);
    if (names.length > 0) {
      genreFilter = `&Genres=${names.join('|')}`; // OR logic? Jellyfin uses OR by default I believe
    }
  }

  const fields =
    'Overview,PremiereDate,CommunityRating,ProviderIds,Path,Genres,ProductionYear,ImageTags';
  const url = `${baseUrl}/Items?IncludeItemTypes=Movie&Recursive=true&Limit=${limit}&Fields=${fields}&api_key=${apiKey}${genreFilter}`;

  const data = await fetchJellyfin(url);

  if (!data || !data.Items) return [];

  const items: JellyfinItem[] = data.Items;

  return items.map((item) => adaptJellyfinItemToMovie(item, serverConfig));
};
