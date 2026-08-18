import { ActivityIndicator, View } from 'react-native';
import { Typography } from '@/src/components/Typography';
import { useAppStore } from '@/src/state/appStore';
import { useEffect } from 'react';

export default function Splash() {
  const initLanguage = useAppStore(state => state.initLanguage);

  useEffect(() => {
    initLanguage();
  }, [initLanguage]);

  return (
    <View className="flex-1 justify-center items-center bg-white dark:bg-gray-900">
      <Typography variant="h1" className="text-blue-600 mb-4">
        Khata
      </Typography>
      <ActivityIndicator size="large" color="#2563eb" />
    </View>
  );
}
