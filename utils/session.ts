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
