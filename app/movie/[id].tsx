import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import CastList from '../../components/Movie/CastList';
import CrewList from '../../components/Movie/CrewList';
import MovieHeader from '../../components/Movie/MovieHeader';
import MovieInfo from '../../components/Movie/MovieInfo';
import ProviderAttribution from '../../components/ProviderAttribution';
import { getMovieWithVideos } from '../../services/tmdb/config';
import { ExtendedMovie } from '../../types/tmdb';

export default function MovieDetailScreen() {
  const params = useLocalSearchParams();
  const { id } = params;
  const router = useRouter();
  const movieId = Number(id);

  const [movie, setMovie] = useState<ExtendedMovie | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!movieId) return;

    async function fetchDetails() {
      try {
        const data = await getMovieWithVideos(movieId);
        setMovie(data);
      } catch (error) {
        console.error('Failed to fetch movie details:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDetails();
  }, [movieId]);

  if (loading || !movie) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center">
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  const trailer = movie.videos?.results?.find(
    (v: any) =>
      v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
  );

  const handleOpenTrailer = () => {
    if (trailer) {
      Linking.openURL(`https://www.youtube.com/watch?v=${trailer.key}`);
    }
  };

  return (
    <View className="flex-1 bg-slate-900">
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <MovieHeader movie={movie} />

        {/* Content */}
        <View className="px-6 pt-6">
          <MovieInfo movie={movie} />

          {/* Actions */}
          <View className="flex-row gap-4 mb-8">
            {trailer && (
              <TouchableOpacity
                onPress={handleOpenTrailer}
                className="flex-1 bg-red-600 flex-row items-center justify-center py-4 rounded-xl active:bg-red-700 shadow-lg shadow-red-900/20"
              >
                <Ionicons
                  name="play"
                  size={20}
                  color="white"
                  style={{ marginRight: 8 }}
                />
                <Text className="text-white font-bold text-lg">
                  Watch Trailer
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {movie.credits?.crew && <CrewList crew={movie.credits.crew} />}

          {movie.credits?.cast && <CastList cast={movie.credits.cast} />}

          {/* Providers */}
          <View className="mb-8">
            <ProviderAttribution
              movieId={movieId}
              region={(params.region as string) || 'US'}
              selectedProviderIds={
                params.providerIds
                  ? JSON.parse(params.providerIds as string)
                  : undefined
              }
              variant="inline"
              showAll={true}
            />
          </View>

          {/* Overview */}
          <Text className="text-white text-xl font-bold mb-3">Overview</Text>
          <Text className="text-slate-300 text-lg leading-relaxed mb-8">
            {movie.overview}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
