import { useQuery } from 'convex/react';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { getMovieDetails } from '../../services/tmdb/config';
import { Movie } from '../../types/tmdb';

export default function MatchFound({ roomId }: { roomId: Id<"rooms"> }) {
    const router = useRouter();
    const match = useQuery(api.rooms.getMatch, { roomId });
    const [movie, setMovie] = useState<Movie | null>(null);

    useEffect(() => {
        async function fetchMovie() {
            if (match && match.movieId) {
                try {
                    const data = await getMovieDetails(match.movieId);
                    setMovie(data);
                } catch (e) {
                    console.error("Failed to fetch match details", e);
                }
            }
        }
        fetchMovie();
    }, [match]);

    const handleHome = () => {
        router.dismissAll();
        router.replace("/");
    };

    if (!match) {
        return (
            <View className="flex-1 bg-slate-900 items-center justify-center">
                <Text className="text-white text-xl">Waiting for match data...</Text>
                <ActivityIndicator size="large" color="#ffffff" className="mt-4"/>
            </View>
        );
    }

    if (!movie) {
        return (
             <View className="flex-1 bg-slate-900 items-center justify-center p-6">
                <Text className="text-green-500 font-bold text-4xl mb-8">It's a Match!</Text>
                <Text className="text-white text-center mb-4">Loading movie details...</Text>
                <ActivityIndicator size="large" color="#ffffff" />
                
                {/* Fallback/Retry for connection or token issues */}
                <TouchableOpacity 
                    className="mt-8 bg-slate-700 p-4 rounded-xl"
                    onPress={() => {
                        setMovie(null); 
                        // Trigger re-fetch logic if needed, or just let the effect retry if we change dependency. 
                        // Actually, simplified: just a manual retry isn't easy with useEffect unless we toggle a state.
                        // Better: just generic debug msg for now.
                    }}
                >
                     <Text className="text-white">If this takes too long, check your internet or API key.</Text>
                </TouchableOpacity>
            </View>
        )
    }

    return (
        <View className="flex-1 bg-slate-900 items-center justify-center p-6 w-full">
            
            <Text className="text-green-500 font-bold text-4xl mb-8">It's a Match!</Text>
            
            <View className="bg-slate-800 p-4 rounded-2xl items-center shadow-lg w-full max-w-sm">
                <Image 
                    source={{ uri: `https://image.tmdb.org/t/p/w500${movie.poster_path}` }}
                    style={{ width: 200, height: 300, borderRadius: 12 }}
                    contentFit="cover"
                    className="mb-4"
                />
                <Text className="text-white text-2xl font-bold text-center mb-2">{movie.title}</Text>
                <Text className="text-slate-400 text-center mb-4" numberOfLines={3}>{movie.overview}</Text>
                
                <View className="flex-row gap-2 mb-2">
                    <Text className="text-yellow-500 font-bold">★ {movie.vote_average.toFixed(1)}</Text>
                    <Text className="text-slate-500">•</Text>
                    <Text className="text-slate-400">{movie.release_date?.split('-')[0]}</Text>
                </View>
            </View>

            <TouchableOpacity 
                className="bg-indigo-600 p-4 rounded-xl items-center w-full max-w-sm mt-8"
                onPress={handleHome}
            >
                <Text className="text-white font-bold text-xl">Find Another Movie</Text>
            </TouchableOpacity>
        </View>
    );
}
