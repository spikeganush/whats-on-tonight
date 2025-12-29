import { useMutation } from 'convex/react';
import { Stack, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api } from '../../convex/_generated/api';
import { getSessionId, getUserName, saveUserName } from '../../utils/session';

export default function JoinRoom() {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const codeInputRef = useRef<TextInput>(null);

  useEffect(() => {
    getUserName().then(setName);
  }, []);

  const joinRoom = useMutation(api.rooms.join);

  const handleJoin = async () => {
    if (code.length !== 4) {
      Alert.alert('Invalid Code', 'Please enter a 4-digit room code.');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter your name.');
      return;
    }

    setLoading(true);
    try {
      const sessionId = await getSessionId();
      await saveUserName(name);
      const result = await joinRoom({ code, sessionId, name });
      router.replace(`/room/${result.roomId}`);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-900 p-6 items-center justify-center">
      <Stack.Screen
        options={{
          title: 'Join Room',
          headerStyle: { backgroundColor: '#0f172a' },
          headerTintColor: '#fff',
        }}
      />

      <Text className="text-white text-3xl font-bold mb-8">Enter Code</Text>

      <TextInput
        ref={codeInputRef}
        className="w-full bg-slate-800 text-white text-center text-3xl p-4 rounded-xl mb-4 font-bold tracking-widest"
        placeholder="0000"
        placeholderTextColor="#64748b"
        keyboardType="number-pad"
        maxLength={4}
        value={code}
        onChangeText={setCode}
        returnKeyType="done"
        onSubmitEditing={handleJoin}
      />

      <TextInput
        className="w-full bg-slate-800 text-white text-lg p-4 rounded-xl mb-8"
        placeholder="Your Name"
        placeholderTextColor="#64748b"
        value={name}
        onChangeText={setName}
        returnKeyType="next"
        onSubmitEditing={() => codeInputRef.current?.focus()}
      />

      <TouchableOpacity
        className={`w-full p-4 rounded-xl items-center ${loading ? 'bg-slate-600' : 'bg-green-600'}`}
        onPress={handleJoin}
        disabled={loading}
      >
        <Text className="text-white font-bold text-xl">
          {loading ? 'Joining...' : 'Join Room'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
