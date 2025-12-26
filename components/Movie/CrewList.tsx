import React from 'react';
import { Text, View } from 'react-native';
import { ExtendedMovie } from '../../types/tmdb';

interface CrewListProps {
  crew: NonNullable<ExtendedMovie['credits']>['crew'];
}

export default function CrewList({ crew }: CrewListProps) {
  const director = crew?.find((c) => c.job === 'Director');

  if (!director) return null;

  return (
    <View className="mb-6">
      <Text className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">
        Director
      </Text>
      <Text className="text-white text-lg font-semibold">{director.name}</Text>
    </View>
  );
}
