import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Typography } from '@/src/components/Typography';
import { Card } from '@/src/components/Card';
import { NotificationService, NotificationItem } from '@/src/services/notificationService';
import { useAuthStore } from '@/src/state/authStore';
import { formatDateTime } from '@/src/utils/formatters';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Bell, CheckCheck, Award, RefreshCw, ShieldAlert, Clock } from 'lucide-react-native';

export default function NotificationsScreen() {
  const { i18n } = useTranslation();
  const router = useRouter();
  const shop = useAuthStore((state) => state.shop);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const isUrdu = i18n.language === 'ur';

  const loadNotifications = useCallback(async () => {
    if (!shop?.id) return;
    setRefreshing(true);
    try {
      const list = await NotificationService.getNotifications(shop.id);
      setNotifications(list);
    } catch (e) {
      console.error('[NotificationsScreen] Error loading notifications', e);
    } finally {
      setRefreshing(false);
    }
  }, [shop?.id]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAllRead = async () => {
    if (!shop?.id) return;
    await NotificationService.markAllAsRead(shop.id);
    loadNotifications();
  };

  const handleItemPress = async (item: NotificationItem) => {
    await NotificationService.markAsRead(item.id);
    if (item.navPath) {
      router.push(item.navPath as any);
    } else {
      loadNotifications();
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'subscription':
        return <Award size={20} color="#16a34a" />;
      case 'sync':
        return <RefreshCw size={20} color="#2563eb" />;
      case 'security':
        return <ShieldAlert size={20} color="#ef4444" />;
      default:
        return <Bell size={20} color="#6b7280" />;
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-gray-50 dark:bg-gray-900 p-4"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadNotifications} />}
    >
      <View className="flex-row items-center justify-between my-4">
        <View className="flex-row items-center">
          <Bell size={24} color="#2563eb" className="mr-2" />
          <Typography variant="h2">{isUrdu ? 'اطلاعات' : 'Notifications'}</Typography>
        </View>

        {notifications.some((n) => !n.isRead) && (
          <TouchableOpacity
            className="flex-row items-center bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg"
            onPress={handleMarkAllRead}
          >
            <CheckCheck size={16} color="#2563eb" className="mr-1" />
            <Typography variant="caption" className="text-blue-600 font-bold">
              {isUrdu ? 'تمام پڑھیں' : 'Mark All Read'}
            </Typography>
          </TouchableOpacity>
        )}
      </View>

      {notifications.length === 0 ? (
        <Card className="p-8 items-center my-8 bg-white dark:bg-gray-800">
          <Bell size={48} color="#9ca3af" className="mb-3 opacity-50" />
          <Typography variant="h3" className="text-gray-400 text-center">
            {isUrdu ? 'کوئی نئی اطلاع نہیں ہے' : 'No notifications yet'}
          </Typography>
        </Card>
      ) : (
        notifications.map((item) => (
          <TouchableOpacity key={item.id} onPress={() => handleItemPress(item)}>
            <Card
              className={`p-4 mb-3 flex-row items-start ${
                item.isRead ? 'bg-white dark:bg-gray-800 opacity-80' : 'bg-blue-50/70 dark:bg-blue-950/40 border-l-4 border-l-blue-600'
              }`}
            >
              <View className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl items-center justify-center mr-3 mt-0.5">
                {getIcon(item.type)}
              </View>

              <View className="flex-1">
                <Typography variant="body" className="font-bold text-gray-900 dark:text-gray-100">
                  {item.title}
                </Typography>
                <Typography variant="caption" className="text-gray-600 dark:text-gray-300 mt-1 leading-5">
                  {item.message}
                </Typography>
                <View className="flex-row items-center mt-2">
                  <Clock size={12} color="#9ca3af" className="mr-1" />
                  <Typography variant="caption" className="text-gray-400 text-[11px]">
                    {formatDateTime(item.createdAt, isUrdu).dateFormatted}
                  </Typography>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}
