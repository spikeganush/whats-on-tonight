import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Country } from '../services/tmdb/config';

interface CountrySelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (country: Country) => void;
  countries: Country[];
}

export default function CountrySelector({
  visible,
  onClose,
  onSelect,
  countries,
}: CountrySelectorProps) {
  const [search, setSearch] = useState('');

  const filteredCountries = useMemo(() => {
    if (!search) return countries;
    const lowerSearch = search.toLowerCase();
    return countries.filter(
      (c) =>
        c.english_name.toLowerCase().includes(lowerSearch) ||
        c.iso_3166_1.toLowerCase().includes(lowerSearch),
    );
  }, [countries, search]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-slate-900 p-4">
        <View className="flex-row items-center justify-between mb-4 mt-2">
          <Text className="text-white text-xl font-bold">Select Region</Text>
          <TouchableOpacity onPress={onClose} className="p-2">
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View className="bg-slate-800 rounded-xl flex-row items-center px-4 py-3 mb-4">
          <Ionicons name="search" size={20} color="#94a3b8" />
          <TextInput
            className="flex-1 ml-3 text-white text-lg"
            placeholder="Search country..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
        </View>

        <FlatList
          data={filteredCountries}
          keyExtractor={(item) => item.iso_3166_1}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="p-4 border-b border-slate-800 flex-row justify-between items-center active:bg-slate-800"
              onPress={() => {
                onSelect(item);
                onClose();
                setSearch('');
              }}
            >
              <Text className="text-white text-lg">{item.english_name}</Text>
              <Text className="text-slate-400">{item.iso_3166_1}</Text>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => (
            <View className="h-[1px] bg-slate-800" />
          )}
        />
      </View>
    </Modal>
  );
}
