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

const USER_COUNTRY_KEY = 'user_country';

export const getSavedCountry = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(USER_COUNTRY_KEY);
};

export const saveCountry = async (countryCode: string) => {
  await AsyncStorage.setItem(USER_COUNTRY_KEY, countryCode);
};

const USER_PLATFORMS_KEY = 'user_platforms';

export const getSavedPlatforms = async (): Promise<number[]> => {
  const json = await AsyncStorage.getItem(USER_PLATFORMS_KEY);
  return json ? JSON.parse(json) : [];
};

export const savePlatforms = async (platformIds: number[]) => {
  await AsyncStorage.setItem(USER_PLATFORMS_KEY, JSON.stringify(platformIds));
};

export interface HomeServerConfig {
  type: 'jellyfin' | 'plex';
  url: string;
  apiKey: string;
  enabled: boolean;
}

const HOME_SERVER_KEY = 'home_server_config';

export const getHomeServerConfig =
  async (): Promise<HomeServerConfig | null> => {
    const json = await AsyncStorage.getItem(HOME_SERVER_KEY);
    return json ? JSON.parse(json) : null;
  };

export const saveHomeServerConfig = async (config: HomeServerConfig) => {
  await AsyncStorage.setItem(HOME_SERVER_KEY, JSON.stringify(config));
};
