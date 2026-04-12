import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Unified storage utility for both Web (localStorage) and Mobile (SecureStore)
 */
const isWeb = Platform.OS === 'web' || typeof window !== 'undefined';

export const storage = {
  getItem: async (key: string) => {
    if (isWeb) return localStorage.getItem(key);
    try {
      return await SecureStore.getItemAsync(key);
    } catch (e) {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    if (isWeb) {
      localStorage.setItem(key, value);
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (e) {
      console.warn('SecureStore error:', e);
    }
  },
  deleteItem: async (key: string) => {
    if (isWeb) {
      localStorage.removeItem(key);
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      // ignore
    }
  },
};
