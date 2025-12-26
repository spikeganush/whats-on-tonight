import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { getMovieWatchProviders } from '../services/tmdb/config';

interface ProviderAttributionProps {
    movieId: number;
    region: string;
    selectedProviderIds?: number[];
    variant?: 'overlay' | 'inline';
}

export default function ProviderAttribution({ movieId, region, selectedProviderIds, variant = 'overlay' }: ProviderAttributionProps) {
    const [logos, setLogos] = useState<string[]>([]);
    
    useEffect(() => {
        async function fetch() {
            try {
                if (!selectedProviderIds || selectedProviderIds.length === 0) return;

                const results = await getMovieWatchProviders(movieId);
                const regionData = results[region];
                
                if (regionData && regionData.flatrate) {
                    const matching = regionData.flatrate
                        .filter((p: any) => selectedProviderIds.includes(p.provider_id))
                        .map((p: any) => p.logo_path);
                    
                    setLogos(matching);
                }
            } catch (e) {
                // Silent fail
            }
        }
        fetch();
    }, [movieId, region]);

    if (logos.length === 0) return null;

    const containerData = variant === 'overlay' 
        ? { className: "flex-row gap-2 absolute top-2 right-2 z-50 bg-black/40 p-1.5 rounded-lg backdrop-blur-md" }
        : { className: "flex-row gap-3 mt-3 items-center" };

    return (
        <View {...containerData}>
            {variant === 'inline' && <Text className="text-slate-400 text-xs">Available on:</Text>}
            {logos.map((logo, i) => (
                <Image 
                    key={i}
                    source={{ uri: `https://image.tmdb.org/t/p/original${logo}` }}
                    style={{ width: 30, height: 30, borderRadius: 8 }}
                    contentFit="cover"
                />
            ))}
        </View>
    );
}
