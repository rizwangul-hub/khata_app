import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Typography } from './Typography';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Lock, RefreshCw } from 'lucide-react-native';
import { useAuthStore } from '../state/authStore';

export const SubscriptionExpiredBanner: React.FC = () => {
  const { t, i18n } = useTranslation();
  const subscription = useAuthStore((state) => state.subscription);
  const refreshSubscription = useAuthStore((state) => state.refreshSubscription);

  if (!subscription || subscription.status === 'active') {
    return null;
  }

  const isUrdu = i18n.language === 'ur';

  return (
    <View className="m-4 p-4 bg-amber-50 dark:bg-amber-950/60 border-2 border-amber-300 dark:border-amber-700 rounded-2xl shadow-sm space-y-2">
      <View className="flex-row items-center">
        <View className="w-9 h-9 bg-amber-500 rounded-xl items-center justify-center mr-3">
          <Lock size={20} color="#ffffff" />
        </View>
        <View className="flex-1">
          <Typography variant="h3" className="text-amber-900 dark:text-amber-200">
            {isUrdu ? 'پلان کی مدت ختم ہو گئی ہے' : 'Subscription Expired'}
          </Typography>
          <Typography variant="caption" className="text-amber-700 dark:text-amber-300 font-medium">
            {isUrdu
              ? 'آپ کا پلان ختم ہو گیا ہے۔ براہ کرم پلان کی تجدید کے لیے ایڈمن سے رابطہ کریں۔'
              : 'Your subscription has expired. Contact administrator to renew your plan.'}
          </Typography>
        </View>
      </View>

      <TouchableOpacity
        className="mt-2 py-2 bg-amber-600 active:bg-amber-700 rounded-xl items-center justify-center flex-row"
        onPress={() => refreshSubscription()}
      >
        <RefreshCw size={16} color="#ffffff" className="mr-2" />
        <Typography variant="caption" className="text-white font-bold">
          {isUrdu ? 'سٹیٹس کی تصدیق کریں' : 'Check Status Online'}
        </Typography>
      </TouchableOpacity>
    </View>
  );
};
