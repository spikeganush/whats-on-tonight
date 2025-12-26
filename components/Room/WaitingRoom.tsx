import React from 'react';
import { FlatList, Share, Text, TouchableOpacity, View } from 'react-native';
import { Doc } from '../../convex/_generated/dataModel';

interface WaitingRoomProps {
  room: Doc<'rooms'>;
  users: Doc<'users'>[];
  isCreator: boolean;
  onStartGame: () => void;
  onLeave: () => void;
}

export default function WaitingRoom({
  room,
  users,
  isCreator,
  onStartGame,
  onLeave,
}: WaitingRoomProps) {
  const handleShare = async () => {
    await Share.share({
      message: `Join my movie night! Room Code: ${room.code}`,
    });
  };

  return (
    <View className="flex-1 bg-slate-900 p-6 w-full">
      <View className="mt-12 mb-8 items-center">
        <Text className="text-white text-4xl font-bold mb-2">{room.code}</Text>
        <Text className="text-slate-400">Room Code</Text>
      </View>

      <Text className="text-white text-xl font-semibold mb-4">
        Users Joined ({users.length})
      </Text>
      <FlatList
        data={users}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View className="bg-slate-800 p-4 rounded-xl mb-2 flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-indigo-500 items-center justify-center mr-3">
              <Text className="text-white font-bold">
                {item.name[0]?.toUpperCase()}
              </Text>
            </View>
            <Text className="text-white text-lg">{item.name}</Text>
            {item.sessionId === room.creatorId && (
              <Text className="text-xs text-yellow-500 ml-2 border border-yellow-500 px-2 rounded">
                HOST
              </Text>
            )}
          </View>
        )}
      />

      <View className="gap-4 mt-4">
        <TouchableOpacity
          className="bg-slate-700 p-4 rounded-xl items-center"
          onPress={handleShare}
        >
          <Text className="text-white font-semibold">Share Code</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-red-500/20 p-4 rounded-xl items-center border border-red-500/50"
          onPress={onLeave}
        >
          <Text className="text-red-400 font-semibold">Leave Room</Text>
        </TouchableOpacity>

        {isCreator && (
          <TouchableOpacity
            className="bg-green-600 p-4 rounded-xl items-center"
            onPress={onStartGame}
          >
            <Text className="text-white font-bold text-xl">Start Voting</Text>
          </TouchableOpacity>
        )}
        {!isCreator && (
          <Text className="text-slate-400 text-center p-4">
            Waiting for host to start...
          </Text>
        )}
      </View>
    </View>
  );
}
