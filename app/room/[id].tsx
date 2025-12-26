import { useMutation, useQuery } from 'convex/react';
import { Stack, useLocalSearchParams } from 'expo-router';
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
import { getSessionId } from '../../utils/session';

export default function RoomSwipeScreen() {
  const { id } = useLocalSearchParams();
  const roomId = id as Id<"rooms">;
  
  const room = useQuery(api.rooms.get, { roomId });
  const users = useQuery(api.rooms.listUsers, { roomId });
  const startGame = useMutation(api.rooms.startGame);
  const submitSwipe = useMutation(api.swipes.submit);

  const [sessionId, setSessionId] = useState<string | null>(null);
  useEffect(() => { getSessionId().then(setSessionId); }, []);

  // Persistence: Fetch user's previous swipes
  const userSwipes = useQuery(api.rooms.getUserSwipes, 
    sessionId ? { roomId, sessionId } : "skip"
  );

  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [finishedStack, setFinishedStack] = useState(false);
  const [swipesCount, setSwipesCount] = useState(0);

  // Fetch movies logic
  useEffect(() => {
    async function fetchMovies() {
      if (!room || !room.tmdbGenreIds || userSwipes === undefined) return;
      if (room.limit && swipesCount >= room.limit) {
          setFinishedStack(true);
          return;
      }

      try {
        setLoading(true);
        const genresString = room.tmdbGenreIds ? room.tmdbGenreIds.join(',') : undefined;
        const providersString = room.providerIds ? room.providerIds.join('|') : undefined;
        const region = room.tmdbRegion || 'US'; 
        
        let currentMovies: Movie[] = [];
        let currentPage = page;
        
        // Keep fetching pages until we have enough unseen movies or hit a limit
        while (currentMovies.length < 5 && currentPage < 10) {
            const results = await discoverMovies(currentPage, genresString, region, providersString);
            
            // Filter out seen movies
            const unseen = results.filter(m => !userSwipes.includes(m.id));
            currentMovies = [...currentMovies, ...unseen];
            
            if (currentMovies.length < 5) {
                currentPage++;
            } else {
                break;
            }
        }
        
        // If we advanced pages, update state for next time
        if (currentPage > page) setPage(currentPage + 1);

        if (currentMovies.length === 0) {
            setFinishedStack(true);
        } else {
            setMovies(currentMovies);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    // Only fetch if we have room, swipes loaded, and empty local stack (and haven't finished)
    if (room && userSwipes && movies.length === 0 && !finishedStack) {
        fetchMovies();
    }
  }, [room, userSwipes, movies.length, finishedStack]);

  const handleStartGame = async () => {
    await startGame({ roomId });
  };

  const handleSwipe = async (movie: Movie, direction: "left" | "right" | "super") => {
    console.log(`${direction.toUpperCase()}:`, movie.title);
    if (!sessionId) return;
    
    // Submit to backend
    submitSwipe({ roomId, movieId: movie.id, direction, sessionId });
    
    // Update local state
    setMovies((prev) => prev.slice(1));
    setSwipesCount((prev) => prev + 1);
    
    // Check limit immediately
    if (room?.limit && (swipesCount + 1) >= room.limit) {
        setFinishedStack(true);
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
  if (room.status === "waiting") {
    const isCreator = room.creatorId === sessionId;
    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <WaitingRoom 
                room={room} 
                users={users} 
                isCreator={isCreator} 
                onStartGame={handleStartGame} 
            />
        </>
    )
  }

  // Matched State (First Match Mode)
  if (room.status === "matched") {
     return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <MatchFound roomId={roomId} />
        </>
     )
  }

  // Finished / Results State
  if (finishedStack) {
      return (
          <>
            <Stack.Screen options={{ headerShown: false }} />
            <Results roomId={roomId} />
          </>
      )
  }

  // Active (Swiping)
  return (
    <View className="flex-1 bg-slate-900">
      <Stack.Screen options={{ headerShown: false }} />
      <CardStack 
        movies={movies} 
        onSwipeRight={(m) => handleSwipe(m, "right")} 
        onSwipeLeft={(m) => handleSwipe(m, "left")} 
        onSwipeSuper={(m) => handleSwipe(m, "super")}
      />
    </View>
  );
}
