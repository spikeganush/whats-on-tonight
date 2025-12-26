import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ExtendedMovie } from '../../types/tmdb';
import { getImageUrl } from '../../utils/image';

interface MovieHeaderProps {
  movie: ExtendedMovie;
}

export default function MovieHeader({ movie }: MovieHeaderProps) {
  const router = useRouter();

  return (
    <View className="relative w-full h-96">
      <Image
        source={{
          uri: getImageUrl(movie.backdrop_path, 'w1280'),
        }}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        transition={500}
      />
      <View className="absolute inset-0 bg-black/40" />

      {/* Close Button */}
      <TouchableOpacity
        onPress={() => router.back()}
        className="absolute top-12 right-4 bg-black/50 p-2 rounded-full z-10"
      >
        <Ionicons name="close" size={24} color="white" />
      </TouchableOpacity>

      {/* Title & Poster Overlay */}
      <View className="absolute bottom-0 w-full p-6 bg-gradient-to-t from-slate-900 to-transparent pt-20">
        <View className="flex-row items-end gap-4">
          <Image
            source={{
              uri: getImageUrl(movie.poster_path, 'w500'),
            }}
            style={{ width: 100, height: 150, borderRadius: 12 }}
            contentFit="cover"
          />
          <View className="flex-1 pb-2">
            <Text className="text-white text-3xl font-bold leading-tight shadow-sm">
              {movie.title}
            </Text>
            <Text className="text-slate-300 font-medium text-lg mt-1">
              {movie.release_date?.split('-')[0]}
            </Text>
            <View className="flex-row items-center bg-yellow-500/20 px-2 py-1 rounded-lg self-start mt-1">
              <Text className="text-yellow-500 font-bold text-base mr-1">
                {Math.round((movie.vote_average || 0) * 10)}%
              </Text>
              <Text className="text-yellow-500/80 text-xs font-medium">
                User Score
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
