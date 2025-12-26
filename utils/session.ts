import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const SESSION_KEY = 'user_session_id';

export const getSessionId = async (): Promise<string> => {
  let sessionId = await AsyncStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = Crypto.randomUUID();
    await AsyncStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
};

const USER_NAME_KEY = 'user_name';

export const getUserName = async (): Promise<string> => {
  return (await AsyncStorage.getItem(USER_NAME_KEY)) || '';
};

export const saveUserName = async (name: string) => {
  await AsyncStorage.setItem(USER_NAME_KEY, name);
};

const ACTIVE_ROOM_KEY = 'active_room_id';

export const getActiveRoom = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(ACTIVE_ROOM_KEY);
};

export const saveActiveRoom = async (roomId: string) => {
  await AsyncStorage.setItem(ACTIVE_ROOM_KEY, roomId);
};

export const clearActiveRoom = async () => {
  await AsyncStorage.removeItem(ACTIVE_ROOM_KEY);
};
