import { Stack, router } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';

export default function Home() {
  const handleCreateRoom = () => {
    // Navigate to config
    router.push("/room/config");
  };

  const handleJoinRoom = () => {
    router.push("/room/join");
  };

  return (
    <View className="flex-1 bg-slate-900 items-center justify-center p-6">
      <Stack.Screen options={{ headerShown: false }} />
      
      <View className="mb-12">
        <Text className="text-4xl font-bold text-white text-center">
          What's on tonight
        </Text>
        <Text className="text-slate-400 text-center mt-2 text-lg">
          Find the perfect movie together
        </Text>
      </View>

      <View className="w-full max-w-sm gap-4">
        <TouchableOpacity 
          className="bg-indigo-600 p-4 rounded-xl items-center active:bg-indigo-700"
          onPress={handleCreateRoom}
        >
          <Text className="text-white font-semibold text-xl">Create Room</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="bg-slate-700 p-4 rounded-xl items-center active:bg-slate-800"
          onPress={handleJoinRoom}
        >
          <Text className="text-white font-semibold text-xl">Join Room</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
