import React from 'react';
import { Text, View } from 'react-native';
import { ExtendedMovie } from '../../types/tmdb';

interface MovieInfoProps {
  movie: ExtendedMovie;
}

export default function MovieInfo({ movie }: MovieInfoProps) {
  return (
    <View className="mb-6">
      {/* Tagline */}
      {movie.tagline && (
        <Text className="text-slate-400 italic text-lg mb-4 leading-relaxed opacity-80">
          "{movie.tagline}"
        </Text>
      )}

      {/* Genres */}
      <View className="flex-row flex-wrap gap-2 mb-2">
        {movie.genres?.map((g) => (
          <View
            key={g.id}
            className="bg-slate-800 px-3 py-1 rounded-full border border-slate-700"
          >
            <Text className="text-slate-300 text-sm font-medium">{g.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
