import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '../global.css';
import '../src/i18n';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(app)',
};

import { Slot, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/src/state/authStore';
import { NetworkStatusIndicator } from '@/src/components/NetworkStatusIndicator';
import { useNetworkStatus } from '@/src/hooks/useNetworkStatus';
import { initDB } from '@/src/database/db';

export default function RootLayout() {
  const { isAuthenticated, checkAuth, isLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const [isReady, setIsReady] = useState(false);

  // Initialize network status hook
  useNetworkStatus();

  useEffect(() => {
    // Init DB and check auth on mount
    const initApp = async () => {
      try {
        await initDB();
        await checkAuth();
      } catch (e) {
        console.error('Error initializing app root', e);
      } finally {
        setIsReady(true);
      }
    };
    initApp();
  }, []);

  useEffect(() => {
    // CRITICAL: Ensure navigation tree is mounted before triggering navigation redirects!
    if (!navigationState?.key || !isReady || isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login' as any);
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(app)' as any);
    }
  }, [isAuthenticated, segments, navigationState?.key, isReady, isLoading]);

  return (
    <>
      <NetworkStatusIndicator />
      <Slot />
    </>
  );
}
