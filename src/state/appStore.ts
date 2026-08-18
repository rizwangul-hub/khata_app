import { create } from 'zustand';
import i18n, { setupRTL } from '../i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppState {
  language: 'en' | 'ur';
  isOffline: boolean;
  syncStatus: 'online' | 'offline' | 'syncing' | 'synced' | 'syncFailed';
  setLanguage: (lang: 'en' | 'ur') => void;
  setOfflineStatus: (isOffline: boolean) => void;
  setSyncStatus: (status: AppState['syncStatus']) => void;
  initLanguage: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  language: (i18n.language as 'en' | 'ur') || 'en',
  isOffline: false,
  syncStatus: 'online',
  setLanguage: async (lang) => {
    i18n.changeLanguage(lang);
    setupRTL(lang);
    await AsyncStorage.setItem('app_language', lang);
    set({ language: lang });
  },
  setOfflineStatus: (isOffline) => set({ 
    isOffline, 
    syncStatus: isOffline ? 'offline' : 'online' 
  }),
  setSyncStatus: (syncStatus) => set({ syncStatus }),
  initLanguage: async () => {
    const savedLang = await AsyncStorage.getItem('app_language');
    if (savedLang === 'en' || savedLang === 'ur') {
      i18n.changeLanguage(savedLang);
      setupRTL(savedLang);
      set({ language: savedLang });
    }
  }
}));
