import React, { useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { Typography } from '@/src/components/Typography';
import { Card } from '@/src/components/Card';
import { InputField } from '@/src/components/InputField';
import { Button } from '@/src/components/Button';
import { apiClient } from '@/src/api/apiClient';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Lock, ShieldCheck } from 'lucide-react-native';

export default function ChangePasswordScreen() {
  const { i18n } = useTranslation();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isUrdu = i18n.language === 'ur';

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert(isUrdu ? 'انتباہ' : 'Warning', isUrdu ? 'تمام خانے پر کریں۔' : 'Please fill in all fields.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(isUrdu ? 'انتباہ' : 'Warning', isUrdu ? 'نیا پاس ورڈ کم از کم 6 ہندسوں کا ہونا چاہیے۔' : 'New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(isUrdu ? 'انتباہ' : 'Warning', isUrdu ? 'نیا پاس ورڈ اور تصدیقی پاس ورڈ مختلف ہیں۔' : 'New password and confirm password do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiClient.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      if (res.data?.success) {
        Alert.alert(
          isUrdu ? 'کامیابی' : 'Success',
          isUrdu ? 'پاس ورڈ کامیابی سے تبدیل ہو گیا ہے۔' : 'Password changed successfully.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('Error', res.data?.message || 'Failed to change password.');
      }
    } catch (e: any) {
      console.error('[ChangePassword] Error', e);
      Alert.alert('Error', e?.response?.data?.message || 'Could not change password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900 p-4">
      <View className="items-center my-6">
        <View className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full items-center justify-center mb-3">
          <Lock size={36} color="#2563eb" />
        </View>
        <Typography variant="h2" className="text-center">
          {isUrdu ? 'پاس ورڈ اور سیکیورٹی' : 'Password & Security'}
        </Typography>
      </View>

      <Card className="p-5 mb-6 bg-white dark:bg-gray-800">
        <Typography variant="h3" className="mb-4 text-blue-600 border-b border-gray-100 dark:border-gray-700 pb-2">
          {isUrdu ? 'پاس ورڈ تبدیل کریں' : 'Change Password'}
        </Typography>

        <InputField
          label={isUrdu ? 'موجودہ پاس ورڈ' : 'Current Password'}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          placeholder="••••••••"
        />

        <InputField
          label={isUrdu ? 'نیا پاس ورڈ' : 'New Password'}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          placeholder="••••••••"
        />

        <InputField
          label={isUrdu ? 'نیا پاس ورڈ دوبارہ درج کریں' : 'Confirm New Password'}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          placeholder="••••••••"
        />

        <Button
          title={isUrdu ? 'پاس ورڈ تبدیل کریں' : 'Update Password'}
          isLoading={isLoading}
          onPress={handleChangePassword}
          className="py-4 mt-4"
        />
      </Card>

      <Card className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex-row items-center">
        <ShieldCheck size={24} color="#2563eb" className="mr-3" />
        <Typography variant="caption" className="flex-1 text-blue-900 dark:text-blue-200 font-medium leading-5">
          {isUrdu
            ? 'پاس ورڈ تبدیل کرنے سے پرانی تمام ڈیوائسز کے سیشنز محفوظ طریقے سے اپ ڈیٹ ہو جائیں گے۔'
            : 'Changing your password securely updates authentication access across all active devices.'}
        </Typography>
      </Card>
    </ScrollView>
  );
}
