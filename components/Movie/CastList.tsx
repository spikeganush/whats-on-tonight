import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import React from 'react';
import { Text, View } from 'react-native';
import { ExtendedMovie } from '../../types/tmdb';

interface CastListProps {
  cast: NonNullable<ExtendedMovie['credits']>['cast'];
}

export default function CastList({ cast }: CastListProps) {
  if (!cast || cast.length === 0) return null;

  return (
    <View className="mb-8 min-h-[220px]">
      <Text className="text-white text-xl font-bold mb-4">Top Cast</Text>
      <FlashList
        data={cast.slice(0, 10)}
        horizontal
        showsHorizontalScrollIndicator={false}
        ItemSeparatorComponent={() => <View className="w-4 mr-4" />}
        renderItem={({ item }) => (
          <View className="w-32">
            <Image
              source={{
                uri: item.profile_path
                  ? `https://image.tmdb.org/t/p/w185${item.profile_path}`
                  : 'https://via.placeholder.com/185x278.png?text=No+Image',
              }}
              style={{ width: 128, height: 160, borderRadius: 12 }}
              contentFit="cover"
              className="bg-slate-800"
            />
            <Text
              className="text-white font-semibold mt-2 text-sm leading-tight"
              numberOfLines={2}
            >
              {item.name}
            </Text>
            <Text
              className="text-slate-400 text-xs mt-1 leading-tight"
              numberOfLines={2}
            >
              {item.character}
            </Text>
          </View>
        )}
      />
    </View>
  );
}
