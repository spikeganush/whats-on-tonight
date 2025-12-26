import { Image } from 'expo-image';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { WatchProvider } from '../types/tmdb_providers';

interface ProviderSelectorProps {
  providers: WatchProvider[];
  selectedProviders: number[];
  onToggle: (id: number) => void;
}

export default function ProviderSelector({
  providers,
  selectedProviders,
  onToggle,
}: ProviderSelectorProps) {
  if (providers.length === 0) return null;

  return (
    <View className="mb-6">
      <Text className="text-white text-xl font-bold mb-3">Services</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 4, paddingRight: 20 }}
      >
        {providers.map((provider) => {
          const isSelected = selectedProviders.includes(provider.provider_id);
          return (
            <TouchableOpacity
              key={provider.provider_id}
              onPress={() => onToggle(provider.provider_id)}
              className={`items-center mr-4 ${isSelected ? 'opacity-100' : 'opacity-60'}`}
              activeOpacity={0.7}
            >
              <View
                className={`rounded-xl border-2 ${isSelected ? 'border-indigo-500' : 'border-transparent'}`}
              >
                <Image
                  source={
                    typeof provider.logo_path === 'number'
                      ? provider.logo_path
                      : {
                          uri: provider.logo_path?.startsWith('http')
                            ? provider.logo_path
                            : `https://image.tmdb.org/t/p/w200${provider.logo_path}`,
                        }
                  }
                  style={{ width: 56, height: 56, borderRadius: 10 }}
                  contentFit="cover"
                />
              </View>
              <Text
                className="text-gray-400 text-xs mt-1 text-center w-16"
                numberOfLines={1}
              >
                {provider.provider_name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
