import { useMutation, useQuery } from 'convex/react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import CardStack from '../../components/Room/CardStack';
import MatchFound from '../../components/Room/MatchFound';
import Results from '../../components/Room/Results';
import WaitingRoom from '../../components/Room/WaitingRoom';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { discoverMovies } from '../../services/tmdb/config';
import { Movie } from '../../types/tmdb';
import { shuffleArray } from '../../utils/random';
import {
  clearActiveRoom,
  getSessionId,
  saveActiveRoom,
} from '../../utils/session';

export default function RoomSwipeScreen() {
  const { id } = useLocalSearchParams();
  const roomId = id as Id<'rooms'>;

  const room = useQuery(api.rooms.get, { roomId });
  const users = useQuery(api.rooms.listUsers, { roomId });
  const startGame = useMutation(api.rooms.startGame);
  const submitSwipe = useMutation(api.swipes.submit);
  const leaveRoom = useMutation(api.rooms.leave);
  const router = useRouter();

  const [sessionId, setSessionId] = useState<string | null>(null);
  useEffect(() => {
    getSessionId().then(setSessionId);
    if (roomId) saveActiveRoom(roomId);
  }, [roomId]);

  // Persistence: Fetch user's previous swipes
  const userSwipes = useQuery(
    api.rooms.getUserSwipes,
    sessionId ? { roomId, sessionId } : 'skip',
  );

  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [finishedStack, setFinishedStack] = useState(false);
  const [swipesCount, setSwipesCount] = useState(0);

  // Initialize swipes count from history
  useEffect(() => {
    if (userSwipes) {
      setSwipesCount(userSwipes.length);
    }
  }, [userSwipes]);

  // Deterministic Fetch Logic
  useEffect(() => {
    async function fetchDeterministicDeck() {
      // Wait for room, swipes, and check if we already have movies
      if (
        !room ||
        !room.tmdbGenreIds ||
        userSwipes === undefined ||
        finishedStack
      )
        return;
      if (movies.length > 0) return; // Don't re-fetch if we have a stack (unless empty)

      if (room.limit && userSwipes.length >= room.limit) {
        setFinishedStack(true);
        return;
      }

      try {
        setLoading(true);
        const genresString = room.tmdbGenreIds.join(',');
        const providersString = room.providerIds
          ? room.providerIds.join('|')
          : undefined;
        const region = room.tmdbRegion || 'US';

        // 1. Fetch a "Base Deck" of 3 pages (60 movies) efficiently
        // We fetch parallel to be fast
        const pagesToFetch = [1, 2, 3];
        const promises = pagesToFetch.map((p) =>
          discoverMovies(p, genresString, region, providersString),
        );

        const results = await Promise.all(promises);
        const allMovies = results.flat();

        // 2. Deterministic Shuffle
        // Use room.randomSeed (or createdAt as fallback) to seed the shuffle
        // randomSeed is 0..1, multiply to get an integer
        const seed = room.randomSeed
          ? Math.floor(room.randomSeed * 1000000)
          : room.createdAt;
        const shuffledDeck = shuffleArray(allMovies, seed);

        // 3. Filter out seen movies
        const unseenMovies = shuffledDeck.filter(
          (m) => !userSwipes.includes(m.id),
        );

        if (unseenMovies.length === 0) {
          setFinishedStack(true);
        } else {
          setMovies(unseenMovies);
        }
      } catch (error) {
        console.error('Failed to fetch deck:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDeterministicDeck();
  }, [room, userSwipes, finishedStack]); // Removed movies.length dependency to avoid infinite loops, added check inside

  const handleStartGame = async () => {
    await startGame({ roomId });
  };

  const handleSwipe = async (
    movie: Movie,
    direction: 'left' | 'right' | 'super',
  ) => {
    if (!sessionId) return;

    // Submit to backend
    submitSwipe({ roomId, movieId: movie.id, direction, sessionId });

    // Update local state
    setMovies((prev) => prev.slice(1));
    setSwipesCount((prev) => prev + 1);

    // Check limit immediately
    if (room?.limit && swipesCount + 1 >= room.limit) {
      setFinishedStack(true);
    }
  };

  const handleLeaveRoom = async () => {
    if (!sessionId) return;
    try {
      await leaveRoom({ roomId, sessionId });
      await clearActiveRoom();
      router.replace('/');
    } catch (e) {
      console.error('Failed to leave room:', e);
    }
  };

  if (!room || !users) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center">
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  // Waiting Room State
  if (room.status === 'waiting') {
    const isCreator = room.creatorId === sessionId;
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <WaitingRoom
          room={room}
          users={users}
          isCreator={isCreator}
          onStartGame={handleStartGame}
          onLeave={handleLeaveRoom}
        />
      </>
    );
  }

  // Matched State (First Match Mode)
  if (room.status === 'matched') {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <MatchFound roomId={roomId} />
      </>
    );
  }

  // Finished / Results State
  if (finishedStack) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <Results roomId={roomId} />
      </>
    );
  }

  // Active (Swiping)
  return (
    <View className="flex-1 bg-slate-900">
      <Stack.Screen options={{ headerShown: false }} />
      <CardStack
        movies={movies}
        onSwipeRight={(m) => handleSwipe(m, 'right')}
        onSwipeLeft={(m) => handleSwipe(m, 'left')}
        onSwipeSuper={(m) => handleSwipe(m, 'super')}
        providerIds={room.providerIds}
        region={room.tmdbRegion}
      />
    </View>
  );
}
