import {
  HOME_SERVER_PROVIDER_ID,
  JELLYFIN_LOGO,
  PLEX_LOGO,
} from '@/utils/constants';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from 'convex/react';
import { getLocales } from 'expo-localization';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import CountrySelector from '../../components/CountrySelector';
import ProviderSelector from '../../components/ProviderSelector';
import { api } from '../../convex/_generated/api';
import {
  Country,
  Genre,
  getCountries,
  getMovieGenres,
  getTVGenres,
  getWatchProviders,
} from '../../services/tmdb/config';
import { WatchProvider } from '../../types/tmdb_providers';
import { encryptServerConfig } from '../../utils/crypto';
import {
  getHomeServerConfig,
  getSavedCountry,
  getSavedPlatforms,
  getSessionId,
  getUserName,
  saveCountry,
  savePlatforms,
  saveUserName,
} from '../../utils/session';

export default function RoomConfig() {
  const router = useRouter(); // Use correct hook
  const [loading, setLoading] = useState(true);
  const [countries, setCountries] = useState<Country[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [providers, setProviders] = useState<WatchProvider[]>([]);

  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [showCountrySelector, setShowCountrySelector] = useState(false);

  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<number[]>([]);
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('movie');
  const [limit, setLimit] = useState(20);
  const [mode, setMode] = useState<'first' | 'all'>('first');

  const createRoom = useMutation(api.rooms.create);
  const updateRoomConfig = useMutation(api.rooms.updateConfig);
  const [userName, setUserName] = useState('');

  // Initial Load
  useEffect(() => {
    async function init() {
      try {
        console.log('[RoomConfig] Loading initial data...');
        const [
          countriesData,
          genresData,
          savedName,
          savedCountry,
          savedPlatforms,
        ] = await Promise.all([
          getCountries(),
          mediaType === 'movie' ? getMovieGenres() : getTVGenres(),
          getUserName(),
          getSavedCountry(),
          getSavedPlatforms(),
        ]);

        const sortedCountries = countriesData.sort((a, b) =>
          a.english_name.localeCompare(b.english_name),
        );
        setCountries(sortedCountries);
        setGenres(genresData);
        if (savedName) setUserName(savedName);
        if (savedPlatforms) setSelectedProviders(savedPlatforms);

        if (savedCountry) {
          const found = sortedCountries.find(
            (c) => c.iso_3166_1 === savedCountry,
          );
          if (found) setSelectedCountry(found);
        } else {
          // Auto-detect country if no saved preference
          const deviceLocale = getLocales()[0]?.regionCode; // e.g., "US", "FR"
          if (deviceLocale) {
            const detected = sortedCountries.find(
              (c) => c.iso_3166_1 === deviceLocale,
            );
            if (detected) {
              console.log(
                '[RoomConfig] Detected country:',
                detected.iso_3166_1,
              );
              setSelectedCountry(detected);
            }
          } else {
            // Fallback to US if no locale found
            const us = sortedCountries.find((c) => c.iso_3166_1 === 'US');
            if (us) setSelectedCountry(us);
          }
        }
      } catch (e) {
        console.error('[RoomConfig] Error loading initial data:', e);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [mediaType]);

  // ... (imports remain)

  // Load Providers when Country/Type changes
  useEffect(() => {
    async function loadProviders() {
      if (!selectedCountry) return;
      try {
        console.log(
          '[RoomConfig] Loading providers for:',
          selectedCountry.iso_3166_1,
          mediaType,
        );
        const providersData = await getWatchProviders(
          selectedCountry.iso_3166_1,
          mediaType,
        );
        // Filter out flatrate/rent/buy if needed, but TMDB returns all.
        // We'll just show top 24 prioritized
        let finalProviders = providersData.slice(0, 24);

        // Inject Home Server if enabled
        const homeConfig = await getHomeServerConfig();
        if (homeConfig && homeConfig.enabled) {
          const homeProvider: WatchProvider = {
            provider_id: HOME_SERVER_PROVIDER_ID,
            provider_name: homeConfig.type === 'jellyfin' ? 'Jellyfin' : 'Plex',
            logo_path:
              homeConfig.type === 'jellyfin' ? JELLYFIN_LOGO : PLEX_LOGO,
            display_priority: -1,
          };
          finalProviders = [homeProvider, ...finalProviders];
        }

        setProviders(finalProviders);
      } catch (e) {
        console.error('[RoomConfig] Error loading providers:', e);
      }
    }
    loadProviders();
  }, [selectedCountry, mediaType]);

  const toggleGenre = (id: number) => {
    if (selectedGenres.includes(id)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== id));
    } else {
      setSelectedGenres([...selectedGenres, id]);
    }
  };

  const toggleProvider = (id: number) => {
    console.log('[RoomConfig] Toggling provider:', id);
    if (selectedProviders.includes(id)) {
      setSelectedProviders(selectedProviders.filter((p) => p !== id));
    } else {
      setSelectedProviders([...selectedProviders, id]);
    }
  };

  const handleStartRoom = async () => {
    console.log('[RoomConfig] Starting room...');
    if (!userName.trim()) {
      Alert.alert('Name Required', 'Please enter your name');
      return;
    }
    setLoading(true);
    try {
      const sessionId = await getSessionId();
      await Promise.all([
        saveUserName(userName),
        selectedCountry
          ? saveCountry(selectedCountry.iso_3166_1)
          : Promise.resolve(),
        savePlatforms(selectedProviders),
      ]);
      const result = await createRoom({
        sessionId,
        name: userName,
        mediaType,
        tmdbGenreIds: selectedGenres,
        tmdbRegion: selectedCountry?.iso_3166_1,
        providerIds: selectedProviders,
        limit,
        mode,
      });

      // Encrypt and save Home Server config if enabled
      const homeConfig = await getHomeServerConfig();
      if (homeConfig && homeConfig.enabled) {
        console.log('[RoomConfig] Encrypting Home Server config...');
        const encryptedConfig = encryptServerConfig(homeConfig, result.code);
        await updateRoomConfig({
          roomId: result.roomId,
          serverConfig: encryptedConfig,
        });
        console.log('[RoomConfig] Home Server config saved securely.');
      }

      console.log('[RoomConfig] Room created:', result.roomId);
      router.replace(`/room/${result.roomId}`);
    } catch (e) {
      console.error('[RoomConfig] Error creating room:', e);
      Alert.alert('Error', 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-900">
      <Stack.Screen
        options={{
          title: 'Configure Room',
          headerStyle: { backgroundColor: '#0f172a' },
          headerTintColor: '#fff',
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        className="p-4"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* User Name */}
        <Text className="text-white text-xl font-bold mb-3">Your Name</Text>
        <TextInput
          className="bg-slate-800 text-white p-4 rounded-xl mb-6 text-lg"
          placeholder="Enter your name"
          placeholderTextColor="#64748b"
          value={userName}
          onChangeText={setUserName}
        />

        {/* Game Mode & Limit */}
        <Text className="text-white text-xl font-bold mb-3">Game Settings</Text>
        <View className="bg-slate-800 rounded-xl p-4 mb-6">
          <Text className="text-slate-400 mb-3">Deck Size: {limit} movies</Text>
          <View className="flex-row gap-2 mb-6">
            {[10, 20, 50].map((val) => (
              <TouchableOpacity
                key={val}
                onPress={() => setLimit(val)}
                className={`flex-1 p-2 rounded-lg items-center border ${limit === val ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-700 border-slate-600'}`}
              >
                <Text className="text-white font-bold">{val}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-slate-400 mb-3">Game Mode</Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setMode('first')}
              className={`flex-1 p-3 rounded-lg items-center border ${mode === 'first' ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-700 border-slate-600'}`}
            >
              <Text className="text-white font-bold mb-1">First Match</Text>
              <Text className="text-slate-400 text-xs text-center">
                Stop at first match
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMode('all')}
              className={`flex-1 p-3 rounded-lg items-center border ${mode === 'all' ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-700 border-slate-600'}`}
            >
              <Text className="text-white font-bold mb-1">Full Deck</Text>
              <Text className="text-slate-400 text-xs text-center">
                Swipe all, see results
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Media Type Selection */}
        <Text className="text-white text-xl font-bold mb-3">
          What are we watching?
        </Text>
        <View className="flex-row gap-4 mb-6">
          <TouchableOpacity
            onPress={() => setMediaType('movie')}
            className={`flex-1 p-4 rounded-xl items-center border-2 ${mediaType === 'movie' ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-800 border-slate-700'}`}
          >
            <Text className="text-white font-semibold">Movies</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMediaType('tv')}
            className={`flex-1 p-4 rounded-xl items-center border-2 ${mediaType === 'tv' ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-800 border-slate-700'}`}
          >
            <Text className="text-white font-semibold">TV Shows</Text>
          </TouchableOpacity>
        </View>

        {/* Region Selection */}
        <Text className="text-white text-xl font-bold mb-3">Region</Text>
        <TouchableOpacity
          className="bg-slate-800 rounded-xl p-4 mb-6 flex-row justify-between items-center"
          onPress={() => setShowCountrySelector(true)}
        >
          <Text className="text-white text-lg">
            {selectedCountry
              ? `${selectedCountry.english_name} (${selectedCountry.iso_3166_1})`
              : 'Select Region'}
          </Text>
          <Ionicons name="chevron-down" size={24} color="#94a3b8" />
        </TouchableOpacity>

        {/* Watch Providers */}
        {providers.length > 0 && (
          <ProviderSelector
            providers={providers}
            selectedProviders={selectedProviders}
            onToggle={toggleProvider}
          />
        )}

        {/* Genre Selection */}
        <Text className="text-white text-xl font-bold mb-3">Genres</Text>
        <View className="flex-row flex-wrap gap-2">
          {genres.map((genre) => (
            <TouchableOpacity
              key={genre.id}
              onPress={() => toggleGenre(genre.id)}
              className={`px-4 py-2 rounded-full border ${selectedGenres.includes(genre.id) ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-800 border-slate-700'}`}
            >
              <Text className="text-white">{genre.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <View className="absolute bottom-6 left-4 right-4">
        <TouchableOpacity
          className="bg-green-600 p-4 rounded-xl items-center shadow-lg"
          onPress={handleStartRoom}
        >
          <Text className="text-white font-bold text-xl">Start Matching</Text>
        </TouchableOpacity>
      </View>

      <CountrySelector
        visible={showCountrySelector}
        onClose={() => setShowCountrySelector(false)}
        onSelect={setSelectedCountry}
        countries={countries}
      />
    </View>
  );
}
