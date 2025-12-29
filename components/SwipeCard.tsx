import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Movie } from '../types/tmdb';
import { getImageUrl } from '../utils/image';

import ProviderAttribution from './ProviderAttribution';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

interface SwipeCardProps {
  movie: Movie;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  index: number;
  providerIds?: number[];
  region?: string;
}

export default function SwipeCard({
  movie,
  onSwipeRight,
  onSwipeLeft,
  onSwipeSuper,
  index,
  providerIds,
  region,
}: SwipeCardProps & { onSwipeSuper: () => void }) {
  const router = useRouter();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Only top card is interactive
  const isTopCard = index === 0;

  const handleInfoPress = () => {
    router.push({
      pathname: '/movie/[id]',
      params: {
        id: movie.id,
        region: region,
        providerIds: providerIds ? JSON.stringify(providerIds) : undefined,
      },
    });
  };

  const panGesture = Gesture.Pan()
    .enabled(isTopCard)
    .runOnJS(false) // Explicitly keep on UI thread until runOnJS
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      const isVerticalSwipe =
        Math.abs(event.translationY) > Math.abs(event.translationX);

      if (isVerticalSwipe && event.translationY < -SWIPE_THRESHOLD) {
        // Super Like (Up)
        translateY.value = withSpring(-SCREEN_HEIGHT);
        runOnJS(onSwipeSuper)();
      } else if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        // Left/Right
        const direction = event.translationX > 0 ? 'right' : 'left';

        translateX.value = withSpring(
          direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5,
        );

        if (direction === 'right') {
          runOnJS(onSwipeRight)();
        } else {
          runOnJS(onSwipeLeft)();
        }
      } else {
        // Reset
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-10, 0, 10],
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
        { scale: withSpring(index === 0 ? 1 : 0.95) },
      ],
      zIndex: -index,
      opacity: interpolate(index, [0, 1, 2], [1, 0.8, 0]),
    };
  });

  const overlayLikeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, 100], [0, 1]),
  }));

  const overlayNopeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, -100], [0, 1]),
  }));

  const overlaySuperStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [0, -100], [0, 1]),
  }));

  // Inside component ...
  const imageUrl = getImageUrl(movie.poster_path, 'w500');

  if (index > 2) return null;

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[styles.card, animatedStyle]}
        className="absolute bg-slate-800 rounded-3xl overflow-hidden shadow-xl border border-slate-700"
      >
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />

        <View className="absolute bottom-0 w-full bg-black/60 p-6 pt-12">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-white text-3xl font-bold flex-1 mr-2">
              {movie.title}
            </Text>
            <TouchableOpacity onPress={handleInfoPress} hitSlop={10}>
              <Ionicons
                name="information-circle-outline"
                size={32}
                color="white"
              />
            </TouchableOpacity>
          </View>
          <Text className="text-slate-300 text-lg line-clamp-3">
            {movie.overview}
          </Text>
        </View>

        <ProviderAttribution
          movieId={movie.id}
          region={region || 'US'}
          selectedProviderIds={providerIds}
          movie={movie}
        />

        {index === 0 && (
          <>
            <Animated.View
              style={[
                styles.overlay,
                { left: 40, transform: [{ rotate: '-30deg' }] },
                overlayLikeStyle,
              ]}
            >
              <Text className="text-green-500 border-4 border-green-500 font-bold text-4xl px-2 rounded-lg">
                LIKE
              </Text>
            </Animated.View>
            <Animated.View
              style={[
                styles.overlay,
                { right: 40, transform: [{ rotate: '30deg' }] },
                overlayNopeStyle,
              ]}
            >
              <Text className="text-red-500 border-4 border-red-500 font-bold text-4xl px-2 rounded-lg">
                NOPE
              </Text>
            </Animated.View>
            <Animated.View
              style={[
                styles.overlay,
                { alignSelf: 'center', top: '40%' },
                overlaySuperStyle,
              ]}
            >
              <Text className="text-blue-500 border-4 border-blue-500 font-bold text-4xl px-2 rounded-lg -rotate-12">
                SUPER
              </Text>
            </Animated.View>
          </>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_WIDTH * 1.4,
    alignSelf: 'center',
    top: 20,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 50,
    zIndex: 100,
  },
});
