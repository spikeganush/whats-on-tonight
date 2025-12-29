import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { getMovieWatchProviders } from '../services/tmdb/config';
import { Movie } from '../types/tmdb';
import { JELLYFIN_LOGO } from '../utils/constants';
import { getProviderLogoSource } from '../utils/providerLogo';

interface ProviderAttributionProps {
  movieId: number;
  region: string;
  selectedProviderIds?: number[];
  variant?: 'overlay' | 'inline';
  showAll?: boolean;
  movie?: Movie;
}

export default function ProviderAttribution({
  movieId,
  region,
  selectedProviderIds,
  variant = 'overlay',
  showAll = false,
  movie,
}: ProviderAttributionProps) {
  const [logos, setLogos] = useState<string[]>([]);
  const [isFromJellyfin, setIsFromJellyfin] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Check if movie is from Jellyfin (poster_path is absolute URL)
    if (movie?.poster_path) {
      const isAbsoluteUrl =
        movie.poster_path.startsWith('http://') ||
        movie.poster_path.startsWith('https://');
      setIsFromJellyfin(isAbsoluteUrl);
    }

    async function fetch() {
      try {
        // If filtering is requested but no IDs provided, and not showing all, return.
        if (
          (!selectedProviderIds || selectedProviderIds.length === 0) &&
          !showAll
        )
          return;

        const results = await getMovieWatchProviders(movieId);
        if (!mounted) return;

        const regionData = results[region];

        if (regionData && regionData.flatrate) {
          let finalProviders = regionData.flatrate;

          if (!showAll && selectedProviderIds) {
            finalProviders = finalProviders.filter((p: any) =>
              selectedProviderIds.includes(p.provider_id),
            );
          }

          setLogos(finalProviders.map((p: any) => p.logo_path));
        }
      } catch (e) {
        // Silent fail
      }
    }
    fetch();

    return () => {
      mounted = false;
    };
  }, [movieId, region, selectedProviderIds, showAll, movie]);

  if (logos.length === 0 && !isFromJellyfin) return null;

  const containerData =
    variant === 'overlay'
      ? {
          className:
            'flex-row gap-2 absolute top-2 right-2 z-50 bg-black/40 p-1.5 rounded-lg backdrop-blur-md',
        }
      : { className: 'flex-row gap-3 mt-3 items-center' };

  return (
    <View {...containerData}>
      {variant === 'inline' && (
        <Text className="text-slate-400 text-xs">Available on:</Text>
      )}
      {isFromJellyfin && (
        <Image
          source={getProviderLogoSource(JELLYFIN_LOGO)}
          style={{ width: 30, height: 30, borderRadius: 8 }}
          contentFit="cover"
        />
      )}
      {logos.map((logo, i) => (
        <Image
          key={i}
          source={getProviderLogoSource(logo)}
          style={{ width: 30, height: 30, borderRadius: 8 }}
          contentFit="cover"
        />
      ))}
    </View>
  );
}
