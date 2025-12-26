import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { getMovieWatchProviders } from '../services/tmdb/config';

interface ProviderAttributionProps {
    movieId: number;
    region: string;
    selectedProviderIds?: number[];
    variant?: 'overlay' | 'inline';
    showAll?: boolean;
}

export default function ProviderAttribution({ movieId, region, selectedProviderIds, variant = 'overlay', showAll = false }: ProviderAttributionProps) {
    const [logos, setLogos] = useState<string[]>([]);
    
    useEffect(() => {
        let mounted = true;

        async function fetch() {
            try {
                // If filtering is requested but no IDs provided, and not showing all, return.
                if ((!selectedProviderIds || selectedProviderIds.length === 0) && !showAll) return;

                const results = await getMovieWatchProviders(movieId);
                if (!mounted) return;

                const regionData = results[region];
                
                if (regionData && regionData.flatrate) {
                    let finalProviders = regionData.flatrate;

                    if (!showAll && selectedProviderIds) {
                        finalProviders = finalProviders.filter((p: any) => selectedProviderIds.includes(p.provider_id));
                    }
                    
                    setLogos(finalProviders.map((p: any) => p.logo_path));
                }
            } catch (e) {
                // Silent fail
            }
        }
        fetch();

        return () => { mounted = false; };
    }, [movieId, region, selectedProviderIds, showAll]);

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
