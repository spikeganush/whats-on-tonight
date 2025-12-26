import { Ionicons } from '@expo/vector-icons';
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
import { Switch } from 'react-native-gesture-handler';
import CountrySelector from '../../components/CountrySelector';
import ProviderSelector from '../../components/ProviderSelector';
import {
  Country,
  getCountries,
  getWatchProviders,
} from '../../services/tmdb/config';
import { WatchProvider } from '../../types/tmdb_providers';
import {
  HOME_SERVER_PROVIDER_ID,
  JELLYFIN_LOGO,
  PLEX_LOGO,
} from '../../utils/constants';
import {
  getHomeServerConfig,
  getSavedCountry,
  getSavedPlatforms,
  getUserName,
  HomeServerConfig,
  saveCountry,
  saveHomeServerConfig,
  savePlatforms,
  saveUserName,
} from '../../utils/session';

export default function SettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedProviders, setSelectedProviders] = useState<number[]>([]);
  const [homeServer, setHomeServer] = useState<HomeServerConfig>({
    type: 'jellyfin',
    url: '',
    apiKey: '',
    enabled: false,
  });

  // Data
  const [countries, setCountries] = useState<Country[]>([]);
  const [providers, setProviders] = useState<WatchProvider[]>([]);
  const [showCountrySelector, setShowCountrySelector] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [
        savedName,
        savedCountryCode,
        savedPlatforms,
        savedHomeServer,
        countriesData,
      ] = await Promise.all([
        getUserName(),
        getSavedCountry(),
        getSavedPlatforms(),
        getHomeServerConfig(),
        getCountries(),
      ]);

      const sortedCountries = countriesData.sort((a, b) =>
        a.english_name.localeCompare(b.english_name),
      );
      setCountries(sortedCountries);

      setName(savedName);
      setSelectedProviders(savedPlatforms);
      if (savedHomeServer) {
        setHomeServer(savedHomeServer);
      }

      if (savedCountryCode) {
        const country = sortedCountries.find(
          (c) => c.iso_3166_1 === savedCountryCode,
        );
        if (country) setSelectedCountry(country);
      } else {
        // Default to US if nothing saved
        const us = sortedCountries.find((c) => c.iso_3166_1 === 'US');
        if (us) setSelectedCountry(us);
      }
    } catch (e) {
      console.error('Error loading settings:', e);
      Alert.alert('Error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  // Load providers whenever country changes or home server config changes
  useEffect(() => {
    if (selectedCountry) {
      loadProviders(selectedCountry.iso_3166_1);
    }
  }, [selectedCountry, homeServer.enabled, homeServer.type]);

  const loadProviders = async (countryCode: string) => {
    try {
      // By default load movie providers to show available services
      const providersData = await getWatchProviders(countryCode, 'movie');
      let finalProviders = providersData.slice(0, 30); // Top 30

      if (homeServer.enabled) {
        const homeProvider: WatchProvider = {
          provider_id: HOME_SERVER_PROVIDER_ID,
          provider_name: homeServer.type === 'jellyfin' ? 'Jellyfin' : 'Plex',
          logo_path: homeServer.type === 'jellyfin' ? JELLYFIN_LOGO : PLEX_LOGO,
          display_priority: -1,
        };
        finalProviders = [homeProvider, ...finalProviders];
      }

      setProviders(finalProviders);
    } catch (e) {
      console.error('Error loading providers:', e);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Please enter your name');
      return;
    }

    setSaving(true);
    try {
      await Promise.all([
        saveUserName(name),
        selectedCountry
          ? saveCountry(selectedCountry.iso_3166_1)
          : Promise.resolve(),
        savePlatforms(selectedProviders),
        saveHomeServerConfig(homeServer),
      ]);
      router.back();
    } catch (e) {
      console.error('Error saving settings:', e);
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleProvider = (id: number) => {
    if (selectedProviders.includes(id)) {
      setSelectedProviders(selectedProviders.filter((p) => p !== id));
    } else {
      setSelectedProviders([...selectedProviders, id]);
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
          headerTitle: 'Settings',
          headerStyle: { backgroundColor: '#0f172a' },
          headerTintColor: '#fff',
          headerRight: () => (
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-indigo-400 font-bold text-lg">Save</Text>
              )}
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView className="flex-1 p-4">
        {/* Name Section */}
        <View className="mb-8">
          <Text className="text-white text-xl font-bold mb-3">Your Name</Text>
          <TextInput
            className="bg-slate-800 text-white p-4 rounded-xl text-lg"
            placeholder="Enter your name"
            placeholderTextColor="#64748b"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Region Section */}
        <View className="mb-8">
          <Text className="text-white text-xl font-bold mb-3">Region</Text>
          <TouchableOpacity
            className="bg-slate-800 rounded-xl p-4 flex-row justify-between items-center"
            onPress={() => setShowCountrySelector(true)}
          >
            <Text className="text-white text-lg">
              {selectedCountry
                ? `${selectedCountry.english_name} (${selectedCountry.iso_3166_1})`
                : 'Select Region'}
            </Text>
            <Ionicons name="chevron-down" size={24} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Home Server Section */}
        <View className="mb-8">
          <Text className="text-white text-xl font-bold mb-3">
            Home Media Server
          </Text>
          <View className="bg-slate-800 rounded-xl p-4 space-y-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-white text-base">Enable Home Server</Text>
              <Switch
                value={homeServer.enabled}
                onValueChange={(value) =>
                  setHomeServer({ ...homeServer, enabled: value })
                }
                trackColor={{ false: '#475569', true: '#6366f1' }}
                thumbColor="#ffffff"
              />
            </View>

            {homeServer.enabled && (
              <>
                <View>
                  <Text className="text-slate-400 text-sm mb-1">
                    Server Type
                  </Text>
                  <View className="flex-row gap-2">
                    {['jellyfin', 'plex'].map((type) => (
                      <TouchableOpacity
                        key={type}
                        onPress={() =>
                          setHomeServer({ ...homeServer, type: type as any })
                        }
                        className={`flex-1 py-2 rounded-lg items-center ${homeServer.type === type ? 'bg-indigo-500' : 'bg-slate-700'}`}
                      >
                        <Text className="text-white capitalize">{type}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View>
                  <Text className="text-slate-400 text-sm mb-1">
                    Server URL
                  </Text>
                  <TextInput
                    className="bg-slate-900 text-white p-3 rounded-lg"
                    placeholder="http://192.168.1.5:8096"
                    placeholderTextColor="#64748b"
                    value={homeServer.url}
                    onChangeText={(text) =>
                      setHomeServer({ ...homeServer, url: text })
                    }
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View>
                  <Text className="text-slate-400 text-sm mb-1">
                    API Key / Token
                  </Text>
                  <TextInput
                    className="bg-slate-900 text-white p-3 rounded-lg"
                    placeholder="Enter your API key"
                    placeholderTextColor="#64748b"
                    value={homeServer.apiKey}
                    onChangeText={(text) =>
                      setHomeServer({ ...homeServer, apiKey: text })
                    }
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry
                  />
                </View>
              </>
            )}
          </View>
        </View>

        {/* Providers Section */}
        <ProviderSelector
          providers={providers}
          selectedProviders={selectedProviders}
          onToggle={toggleProvider}
        />
      </ScrollView>

      <CountrySelector
        visible={showCountrySelector}
        onClose={() => setShowCountrySelector(false)}
        onSelect={setSelectedCountry}
        countries={countries}
      />
    </View>
  );
}
