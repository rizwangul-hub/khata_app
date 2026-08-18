import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Typography } from '@/src/components/Typography';
import { Card } from '@/src/components/Card';
import { Button } from '@/src/components/Button';
import { apiClient } from '@/src/api/apiClient';
import { useAuthStore } from '@/src/state/authStore';
import { useTranslation } from 'react-i18next';
import { Smartphone, LogOut, ShieldCheck } from 'lucide-react-native';

export default function DevicesScreen() {
  const { i18n } = useTranslation();
  const logout = useAuthStore((state) => state.logout);

  const [devices, setDevices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isUrdu = i18n.language === 'ur';

  const fetchDevices = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/auth/devices');
      if (res.data?.success && Array.isArray(res.data?.devices)) {
        setDevices(res.data.devices);
      }
    } catch (e) {
      console.error('[DevicesScreen] Error fetching devices', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleLogoutDevice = async (deviceId: string) => {
    try {
      await apiClient.post('/auth/devices/logout', { deviceId });
      Alert.alert(isUrdu ? 'کامیابی' : 'Success', isUrdu ? 'ڈیوائس لاگ آؤٹ ہو گئی ہے۔' : 'Device logged out.');
      fetchDevices();
    } catch (e) {
      Alert.alert('Error', 'Failed to log out device.');
    }
  };

  const handleLogoutAllDevices = async () => {
    Alert.alert(
      isUrdu ? 'تمام ڈیوائسز لاگ آؤٹ کریں؟' : 'Log out all devices?',
      isUrdu
        ? 'اس سے تمام ڈیوائسز کے سیشنز ختم ہو جائیں گے۔ آپ کو دوبارہ لاگ اِن کرنا پڑے گا۔'
        : 'This will sign out all active sessions using this license. Your cloud data remains 100% safe.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isUrdu ? 'لاگ آؤٹ کریں' : 'Log Out All',
          style: 'destructive',
          onPress: async () => {
            await apiClient.post('/auth/devices/logout', { deviceId: 'all' });
            logout();
          },
        },
      ]
    );
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900 p-4">
      <View className="items-center my-6">
        <View className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full items-center justify-center mb-3">
          <Smartphone size={36} color="#2563eb" />
        </View>
        <Typography variant="h2" className="text-center">
          {isUrdu ? 'لاگ اِن ڈیوائسز' : 'Logged-in Devices'}
        </Typography>
        <Typography variant="caption" className="text-gray-500 text-center mt-1">
          {isUrdu ? 'آپ کے اکاؤنٹ کے فعال سیشنز' : 'Manage active shop license sessions'}
        </Typography>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#2563eb" className="my-8" />
      ) : (
        <>
          {devices.map((device, index) => (
            <Card key={device.id || index} className="p-4 mb-3 bg-white dark:bg-gray-800 flex-row items-center justify-between">
              <View className="flex-row items-center flex-1 mr-3">
                <View className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl items-center justify-center mr-3">
                  <Smartphone size={22} color="#2563eb" />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center">
                    <Typography variant="body" className="font-bold text-gray-900 dark:text-gray-100">
                      {device.deviceName || 'Mobile Phone'}
                    </Typography>
                    {device.isCurrent && (
                      <View className="bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-md ml-2 border border-emerald-300">
                        <Typography variant="caption" className="text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px]">
                          THIS DEVICE
                        </Typography>
                      </View>
                    )}
                  </View>
                  <Typography variant="caption" className="text-gray-400 mt-0.5">
                    {device.platform} • Active: Today
                  </Typography>
                </View>
              </View>

              {!device.isCurrent && (
                <TouchableOpacity
                  className="bg-red-50 dark:bg-red-900/30 p-2 rounded-lg"
                  onPress={() => handleLogoutDevice(device.id)}
                >
                  <LogOut size={18} color="#ef4444" />
                </TouchableOpacity>
              )}
            </Card>
          ))}

          <Button
            title={isUrdu ? 'تمام ڈیوائسز لاگ آؤٹ کریں' : 'Log Out All Devices'}
            variant="outline"
            className="mt-4 border-red-500 text-red-500 py-3.5"
            onPress={handleLogoutAllDevices}
          />
        </>
      )}
    </ScrollView>
  );
}
