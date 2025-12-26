import React from 'react';
import { Text, View } from 'react-native';
import { Movie } from '../../types/tmdb';
import SwipeCard from '../SwipeCard'; // Assuming relative path is correct from components/Room/ to components/SwipeCard (one level up)

interface CardStackProps {
    movies: Movie[];
    onSwipeRight: (movie: Movie) => void;
    onSwipeLeft: (movie: Movie) => void;
    onSwipeSuper: (movie: Movie) => void;
}

export default function CardStack({ movies, onSwipeRight, onSwipeLeft, onSwipeSuper }: CardStackProps) {
    return (
        <View className="flex-1 items-center justify-center relative w-full">
        {movies.length > 0 ? (
            movies.map((movie, index) => {
                if (index > 2) return null; 
                return (
                    <SwipeCard 
                        key={movie.id} 
                        movie={movie} 
                        index={index}
                        onSwipeRight={() => onSwipeRight(movie)}
                        onSwipeLeft={() => onSwipeLeft(movie)}
                        onSwipeSuper={() => onSwipeSuper(movie)}
                    />
                )
            }).reverse()
        ) : (
                <View className="items-center">
                    <Text className="text-white text-2xl">No more movies!</Text>
                    <Text className="text-slate-400">Waiting for others...</Text>
                </View>
        )} 
        </View>
    );
}
