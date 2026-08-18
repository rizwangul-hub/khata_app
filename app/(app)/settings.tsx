import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Typography } from '@/src/components/Typography';
import { Card } from '@/src/components/Card';
import { Button } from '@/src/components/Button';
import { StatusBadge } from '@/src/components/StatusBadge';
import { useAuthStore } from '@/src/state/authStore';
import { useAppStore } from '@/src/state/appStore';
import { SyncService } from '@/src/services/syncService';
import { SyncQueueService } from '@/src/services/syncQueueService';
import { NotificationService } from '@/src/services/notificationService';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import {
  User,
  Award,
  Globe,
  ChevronRight,
  HelpCircle,
  Cloud,
  Lock,
  Smartphone,
  Bell,
  Info,
  LogOut,
} from 'lucide-react-native';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const logout = useAuthStore((state) => state.logout);
  const shop = useAuthStore((state) => state.shop);
  const subscription = useAuthStore((state) => state.subscription);
  const { language, setLanguage, isOffline } = useAppStore();

  const [unreadCount, setUnreadCount] = useState(0);
  const isUrdu = i18n.language === 'ur';

  useEffect(() => {
    if (shop?.id) {
      NotificationService.getUnreadCount(shop.id).then(setUnreadCount);
    }
  }, [shop?.id]);

  const handleSafeLogout = async () => {
    const pendingCount = await SyncQueueService.getPendingCount();

    if (pendingCount > 0) {
      Alert.alert(
        isUrdu ? 'زیر التوا تبدیلیاں' : 'Unsynchronized Changes Pending',
        isUrdu
          ? `آپ کے پاس ${pendingCount} تبدیلیاں ہیں جو ابھی تک کلاؤڈ پر منتقل نہیں ہوئیں۔ لاگ آؤٹ کرنے سے پہلے سنکرونائز کریں۔`
          : `You have ${pendingCount} local changes waiting to sync with cloud backup.`,
        [
          { text: t('customer.cancel'), style: 'cancel' },
          {
            text: isUrdu ? 'لاگ آؤٹ کریں' : 'Logout Anyway',
            style: 'destructive',
            onPress: () => logout(),
          },
          {
            text: isUrdu ? 'ابھی سنکرونائز کریں' : 'Sync & Logout',
            onPress: async () => {
              await SyncService.fullSync();
              logout();
            },
          },
        ]
      );
    } else {
      logout();
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900 p-4">
      {/* Header Profile Card */}
      {shop && (
        <TouchableOpacity onPress={() => router.push('/(app)/profile' as any)}>
          <Card className="mb-4 flex-row items-center justify-between p-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
            <View className="flex-row items-center flex-1">
              <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center mr-3">
                <User size={24} color="#ffffff" />
              </View>
              <View className="flex-1">
                <Typography variant="h3" className="text-white font-extrabold">
                  {shop.shopName}
                </Typography>
                <Typography variant="caption" className="text-blue-200">
                  {shop.licenseId} • {shop.ownerName || 'Shopkeeper'}
                </Typography>
              </View>
            </View>
            <ChevronRight size={20} color="#ffffff" />
          </Card>
        </TouchableOpacity>
      )}

      {/* Subscription Card */}
      {subscription && (
        <TouchableOpacity onPress={() => router.push('/(app)/subscription' as any)}>
          <Card className="mb-4 flex-row items-center justify-between p-4">
            <View className="flex-row items-center flex-1">
              <View className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-xl items-center justify-center mr-3">
                <Award size={22} color="#16a34a" />
              </View>
              <View className="flex-1">
                <Typography variant="body" className="font-bold">
                  {isUrdu ? 'میرا پلان اور لائسنس' : 'My Plan & License'}
                </Typography>
                <Typography variant="caption" className="text-gray-500 capitalize">
                  {subscription.planType} Plan • {t('subscription.daysRemaining', { count: subscription.daysRemaining })}
                </Typography>
              </View>
            </View>
            <StatusBadge status={subscription.status} label={subscription.status.toUpperCase()} />
          </Card>
        </TouchableOpacity>
      )}

      {/* Main Settings Section Group */}
      <Card className="mb-4 p-2">
        <TouchableOpacity
          className="flex-row items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700"
          onPress={() => router.push('/(app)/profile' as any)}
        >
          <View className="flex-row items-center">
            <User size={20} color="#2563eb" className="mr-3" />
            <Typography variant="body" className="font-medium">
              {isUrdu ? 'دکان کا پروفائل' : 'Shop Profile'}
            </Typography>
          </View>
          <ChevronRight size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700"
          onPress={() => router.push('/(app)/notifications' as any)}
        >
          <View className="flex-row items-center">
            <Bell size={20} color="#2563eb" className="mr-3" />
            <Typography variant="body" className="font-medium">
              {isUrdu ? 'اطلاعات (نوٹیفکیشنز)' : 'Notifications'}
            </Typography>
          </View>
          {unreadCount > 0 ? (
            <View className="bg-red-500 px-2 py-0.5 rounded-full">
              <Typography variant="caption" className="text-white font-bold text-xs">
                {unreadCount}
              </Typography>
            </View>
          ) : (
            <ChevronRight size={20} color="#9ca3af" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700"
          onPress={() => router.push('/(app)/change-password' as any)}
        >
          <View className="flex-row items-center">
            <Lock size={20} color="#2563eb" className="mr-3" />
            <Typography variant="body" className="font-medium">
              {isUrdu ? 'پاس ورڈ اور سیکیورٹی' : 'Password & Security'}
            </Typography>
          </View>
          <ChevronRight size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700"
          onPress={() => router.push('/(app)/devices' as any)}
        >
          <View className="flex-row items-center">
            <Smartphone size={20} color="#2563eb" className="mr-3" />
            <Typography variant="body" className="font-medium">
              {isUrdu ? 'لاگ اِن ڈیوائسز' : 'Logged-in Devices'}
            </Typography>
          </View>
          <ChevronRight size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700"
          onPress={() => router.push('/(app)/sync-settings' as any)}
        >
          <View className="flex-row items-center">
            <Cloud size={20} color="#2563eb" className="mr-3" />
            <Typography variant="body" className="font-medium">
              {isUrdu ? 'سنکرونائزیشن اور بیک اپ' : 'Sync & Cloud Backup'}
            </Typography>
          </View>
          <ChevronRight size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700"
          onPress={() => setLanguage(language === 'en' ? 'ur' : 'en')}
        >
          <View className="flex-row items-center">
            <Globe size={20} color="#2563eb" className="mr-3" />
            <Typography variant="body" className="font-medium">
              Language ({language === 'en' ? 'English' : 'اردو'})
            </Typography>
          </View>
          <Typography variant="caption" className="text-blue-600 font-bold">
            {language === 'en' ? 'Switch to اردو' : 'Switch to English'}
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700"
          onPress={() => router.push('/(app)/help' as any)}
        >
          <View className="flex-row items-center">
            <HelpCircle size={20} color="#2563eb" className="mr-3" />
            <Typography variant="body" className="font-medium">
              {isUrdu ? 'مدد اور سپورٹ' : 'Help & Support'}
            </Typography>
          </View>
          <ChevronRight size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center justify-between p-3"
          onPress={() => router.push('/(app)/about' as any)}
        >
          <View className="flex-row items-center">
            <Info size={20} color="#2563eb" className="mr-3" />
            <Typography variant="body" className="font-medium">
              {isUrdu ? 'ایپ کے بارے میں' : 'About App'}
            </Typography>
          </View>
          <ChevronRight size={20} color="#9ca3af" />
        </TouchableOpacity>
      </Card>

      <Button
        title={t('common.logout')}
        variant="outline"
        className="mb-8 border-red-500 text-red-500 py-3.5"
        onPress={handleSafeLogout}
      />
    </ScrollView>
  );
}
