import { ActivityIndicator, View } from 'react-native';
import { Typography } from '@/src/components/Typography';
import { useAppStore } from '@/src/state/appStore';
import { useAuthStore } from '@/src/state/authStore';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function Splash() {
  const initLanguage = useAppStore((state) => state.initLanguage);
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    initLanguage();
  }, [initLanguage]);

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/(app)' as any);
      } else {
        router.replace('/(auth)/login' as any);
      }
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <View className="flex-1 justify-center items-center bg-gray-900">
      <Typography variant="h1" className="text-blue-500 mb-4 font-bold">
        Khata
      </Typography>
      <ActivityIndicator size="large" color="#3b82f6" />
    </View>
  );
}
