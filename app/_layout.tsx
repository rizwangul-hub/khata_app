import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '../global.css';
import '../src/i18n';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Slot, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '@/src/state/authStore';
import { NetworkStatusIndicator } from '@/src/components/NetworkStatusIndicator';
import { useNetworkStatus } from '@/src/hooks/useNetworkStatus';
import { initDB } from '@/src/database/db';

export const unstable_settings = {
  anchor: '(app)',
};

// Keep splash screen visible until app is ready to prevent crash/white-screen flicker
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, checkAuth, isLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const [isReady, setIsReady] = useState(false);

  // Initialize network status hook
  useNetworkStatus();

  useEffect(() => {
    let isMounted = true;
    const initApp = async () => {
      try {
        await initDB();
        await checkAuth();
      } catch (e) {
        console.error('[RootLayout] Startup init error:', e);
      } finally {
        if (isMounted) {
          setIsReady(true);
          await SplashScreen.hideAsync().catch(() => {});
        }
      }
    };

    initApp();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    // Ensure navigation tree is ready before executing redirects
    if (!navigationState?.key || !isReady || isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAppGroup = segments[0] === '(app)';

    try {
      if (!isAuthenticated && !inAuthGroup) {
        router.replace('/(auth)/login' as any);
      } else if (isAuthenticated && !inAppGroup) {
        router.replace('/(app)' as any);
      }
    } catch (e) {
      console.error('[RootLayout] Redirect error:', e);
    }
  }, [isAuthenticated, segments, navigationState?.key, isReady, isLoading]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style="auto" />
      <NetworkStatusIndicator />
      <Slot />
    </ThemeProvider>
  );
}
