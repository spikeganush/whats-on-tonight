import { useMutation, useQuery } from 'convex/react';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { getMovieDetails } from '../../services/tmdb/config';
import { clearActiveRoom } from '../../utils/session';
import ProviderAttribution from '../ProviderAttribution';

export default function Results({ roomId }: { roomId: Id<"rooms"> }) {
    const matches = useQuery(api.rooms.getMatches, { roomId });
    const room = useQuery(api.rooms.get, { roomId });
    const [movies, setMovies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function fetchDetails() {
            if (!matches) return;
            const details = await Promise.all(matches.map(m => getMovieDetails(m.movieId)));
            setMovies(details);
            setLoading(false);
        }
        if (matches) {
             fetchDetails();
        }
    }, [matches]);

    const leaveRoom = useMutation(api.rooms.leave);
    const [sessionId, setSessionId] = useState<string | null>(null);

    useEffect(() => {
        import('../../utils/session').then(mod => mod.getSessionId().then(setSessionId));
    }, []);

    const handleLeave = async () => {
        if (!sessionId) return;
        try {
            await leaveRoom({ roomId, sessionId });
        } catch (e) {
            console.error("Failed to clean up:", e);
        } finally {
            await clearActiveRoom();
            router.replace('/');
        }
    };

    if (!matches || loading) {
        return (
             <View className="flex-1 bg-slate-900 items-center justify-center p-6">
                <Text className="text-white text-2xl font-bold mb-4">Finding Matches...</Text>
                 <ActivityIndicator size="large" color="#ffffff" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-slate-900">
            <Text className="text-green-400 text-3xl font-bold text-center mb-2">What's on tonight?</Text>
            <Text className="text-slate-400 text-center mb-6">Here is {movies.length > 0 ? "your watchlist" : "what we found"}:</Text>
            
            <ScrollView contentContainerStyle={{ padding: 16 }}>
                {movies.map((movie, index) => (
                     <View key={movie.id} className="bg-slate-800 rounded-xl p-4 mb-4 flex-row gap-4 border border-slate-700">
                         <Image 
                            source={{ uri: `https://image.tmdb.org/t/p/w200${movie.poster_path}` }}
                            style={{ width: 80, height: 120, borderRadius: 8 }}
                            contentFit="cover"
                        />
                        <View className="flex-1 justify-center">
                            <View>
                                <Text className="text-white text-lg font-bold mb-1">{movie.title}</Text>
                                <Text className="text-slate-400 text-xs mb-2">{movie.release_date?.split('-')[0]}</Text>
                                <Text className="text-slate-300 text-sm" numberOfLines={3}>{movie.overview}</Text>
                            </View>
                            
                            {room && (
                                <ProviderAttribution 
                                    movieId={movie.id} 
                                    region={room.tmdbRegion || 'US'} 
                                    selectedProviderIds={room.providerIds}
                                    variant="inline"
                                />
                             )}
                        </View>
                    </View>
                ))}
                
                {movies.length === 0 && (
                     <View className="bg-slate-800 rounded-xl p-6 items-center">
                        <Text className="text-slate-400 text-lg mb-2">No matches found yet.</Text>
                        <Text className="text-slate-500 text-center">Keep swiping!</Text>
                    </View>
                )}

                <TouchableOpacity 
                    className="bg-indigo-600 p-4 rounded-xl items-center mt-8 mb-10"
                    onPress={handleLeave}
                >
                    <Text className="text-white font-bold text-lg">Back to Home</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}
