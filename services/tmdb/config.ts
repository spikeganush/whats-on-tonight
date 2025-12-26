import { tmdbFetch } from './client';

export interface Genre {
  id: number;
  name: string;
}

export interface Country {
  iso_3166_1: string;
  english_name: string;
  native_name: string;
}

export const getMovieGenres = async (): Promise<Genre[]> => {
  const data = await tmdbFetch('/genre/movie/list');
  return data.genres;
};

export const getTVGenres = async (): Promise<Genre[]> => {
  const data = await tmdbFetch('/genre/tv/list');
  return data.genres;
};

export const getCountries = async (): Promise<Country[]> => {
  const data = await tmdbFetch('/configuration/countries');
  return data;
};

import { WatchProvider } from '../../types/tmdb_providers';

const PRIORITY_PROVIDERS = [
  'Netflix',
  'Disney+',
  'Amazon Prime Video',
  'Apple TV Plus',
  'Apple TV+',
  'Hulu',
  'Peacock',
  'Max',
  'HBO Max',
];

export const getWatchProviders = async (
  region: string = 'US',
  mediaType: 'movie' | 'tv' = 'movie'
): Promise<WatchProvider[]> => {
  const data = await tmdbFetch(
    `/watch/providers/${mediaType}?watch_region=${region}&sort_by=display_priority.asc`
  );
  const allProviders: WatchProvider[] = data.results || [];

  const priority: WatchProvider[] = [];
  const others: WatchProvider[] = [];

  allProviders.forEach((p) => {
    if (PRIORITY_PROVIDERS.includes(p.provider_name)) {
      priority.push(p);
    } else {
      others.push(p);
    }
  });

  // Sort priority providers based on the index in PRIORITY_PROVIDERS
  priority.sort((a, b) => {
    return (
      PRIORITY_PROVIDERS.indexOf(a.provider_name) -
      PRIORITY_PROVIDERS.indexOf(b.provider_name)
    );
  });

  // others are already sorted by display_priority (popularity) from TMDB
  return [...priority, ...others];
};

export const discoverMovies = async (
  page: number = 1,
  withGenres?: string,
  withRegion?: string,
  withProviders?: string
): Promise<any[]> => {
  const params: Record<string, string> = {
    page: page.toString(),
    sort_by: 'popularity.desc',
    include_adult: 'false',
    include_video: 'true',
  };

  if (withGenres) params.with_genres = withGenres;
  if (withRegion) params.watch_region = withRegion;
  if (withProviders) {
    params.with_watch_providers = withProviders;
    params.watch_region = withRegion || 'US';
  }

  const data = await tmdbFetch('/discover/movie', params);
  return data.results;
};

export const discoverTV = async (
  page: number = 1,
  withGenres?: string
): Promise<any[]> => {
  const params: Record<string, string> = {
    page: page.toString(),
    sort_by: 'popularity.desc',
    include_adult: 'false',
  };

  if (withGenres) {
    params.with_genres = withGenres;
  }

  const data = await tmdbFetch('/discover/tv', params);
  return data.results;
};

export const getMovieDetails = async (id: number): Promise<any> => {
  const data = await tmdbFetch(`/movie/${id}`);
  return data;
};

export const getMovieWatchProviders = async (id: number): Promise<any> => {
  const data = await tmdbFetch(`/movie/${id}/watch/providers`);
  return data.results;
};

export const getMovieWithVideos = async (id: number): Promise<any> => {
  const data = await tmdbFetch(
    `/movie/${id}?append_to_response=videos,release_dates,credits`
  );
  return data;
};
