import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import ProviderAttribution from '../../components/ProviderAttribution';
import { getMovieWithVideos } from '../../services/tmdb/config';
import { Movie } from '../../types/tmdb';

export default function MovieDetailScreen() {
    const params = useLocalSearchParams();
    const { id } = params;
    const router = useRouter();
    const movieId = Number(id);

    // Extended movie type
    type ExtendedMovie = Movie & { 
        videos?: { results: any[] }; 
        tagline?: string; 
        genres?: { id: number; name: string }[] 
    };

    const [movie, setMovie] = useState<ExtendedMovie | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!movieId) return;
        
        async function fetchDetails() {
            try {
                const data = await getMovieWithVideos(movieId);
                setMovie(data);
            } catch (error) {
                console.error("Failed to fetch movie details:", error);
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
        (v: any) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")
    );

    const handleOpenTrailer = () => {
        if (trailer) {
            Linking.openURL(`https://www.youtube.com/watch?v=${trailer.key}`);
        }
    };

    return (
        <View className="flex-1 bg-slate-900">
            <Stack.Screen options={{ headerShown: false }} />
            
            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Header Image */}
                <View className="relative w-full h-96">
                    <Image
                        source={{ uri: `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                        transition={500}
                    />
                     <View className="absolute inset-0 bg-black/40" />
                     
                     {/* Close Button */}
                     <TouchableOpacity 
                        onPress={() => router.back()} 
                        className="absolute top-12 right-4 bg-black/50 p-2 rounded-full"
                    >
                        <Ionicons name="close" size={24} color="white" />
                     </TouchableOpacity>
                     
                     {/* Title & Poster Overlay */}
                     <View className="absolute bottom-0 w-full p-6 bg-gradient-to-t from-slate-900 to-transparent pt-20">
                         <View className="flex-row items-end gap-4">
                            <Image
                                source={{ uri: `https://image.tmdb.org/t/p/w500${movie.poster_path}` }}
                                style={{ width: 100, height: 150, borderRadius: 12 }}
                                contentFit="cover"
                            />
                            <View className="flex-1 pb-2">
                                <Text className="text-white text-3xl font-bold leading-tight shadow-sm">
                                    {movie.title}
                                </Text>
                                <Text className="text-slate-300 font-medium text-lg mt-1">
                                    {movie.release_date?.split('-')[0]} • ⭐ {movie.vote_average?.toFixed(1)}
                                </Text>
                            </View>
                         </View>
                     </View>
                </View>

                {/* Content */}
                <View className="px-6 pt-6">
                    {/* Tagline */}
                    {movie.tagline && (
                        <Text className="text-slate-400 italic text-lg mb-4 leading-relaxed opacity-80">
                            "{movie.tagline}"
                        </Text>
                    )}

                    {/* Genres */}
                    <View className="flex-row flex-wrap gap-2 mb-6">
                        {movie.genres?.map((g) => (
                            <View key={g.id} className="bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                                <Text className="text-slate-300 text-sm font-medium">{g.name}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Actions */}
                    <View className="flex-row gap-4 mb-8">
                        {trailer && (
                            <TouchableOpacity 
                                onPress={handleOpenTrailer}
                                className="flex-1 bg-red-600 flex-row items-center justify-center py-4 rounded-xl active:bg-red-700"
                            >
                                <Ionicons name="play" size={20} color="white" style={{ marginRight: 8 }} />
                                <Text className="text-white font-bold text-lg">Watch Trailer</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    
                    {/* Providers */}
                    <View className="mb-8">
                         <ProviderAttribution 
                            movieId={movieId} 
                            region={(params.region as string) || 'US'} 
                            selectedProviderIds={params.providerIds ? JSON.parse(params.providerIds as string) : undefined}
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
