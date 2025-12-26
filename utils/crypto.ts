import 'react-native-get-random-values';
import CryptoJS from 'crypto-js';
import { HomeServerConfig } from './session';

// In a real app, this should be in .env
// Defaults to a hardcoded string for development convenience if env is missing
const APP_SECRET =
  process.env.EXPO_PUBLIC_APP_SECRET || 'dev_secret_do_not_use_in_prod';

const deriveKey = (roomCode: string) => {
  return CryptoJS.SHA256(`${roomCode}-${APP_SECRET}`).toString();
};

export const encryptServerConfig = (
  config: HomeServerConfig,
  roomCode: string,
): string => {
  const key = deriveKey(roomCode);
  const json = JSON.stringify(config);
  return CryptoJS.AES.encrypt(json, key).toString();
};

export const decryptServerConfig = (
  ciphertext: string,
  roomCode: string,
): HomeServerConfig | null => {
  try {
    const key = deriveKey(roomCode);
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedData);
  } catch (e) {
    console.error('Failed to decrypt server config', e);
    return null;
  }
};
