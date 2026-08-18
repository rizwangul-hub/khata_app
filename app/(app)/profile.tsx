import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Typography } from '@/src/components/Typography';
import { Card } from '@/src/components/Card';
import { InputField } from '@/src/components/InputField';
import { Button } from '@/src/components/Button';
import { useAuthStore } from '@/src/state/authStore';
import { apiClient } from '@/src/api/apiClient';
import { saveShopLocal } from '@/src/database/db';
import { useTranslation } from 'react-i18next';
import * as Clipboard from 'expo-clipboard';
import { Copy, Check, Store, User, Phone, MapPin, Key, Hash, Edit3 } from 'lucide-react-native';

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const shop = useAuthStore((state) => state.shop);
  const updateShopInfo = useAuthStore((state) => state.updateShopInfo);
  const subscription = useAuthStore((state) => state.subscription);

  const [isEditing, setIsEditing] = useState(false);
  const [shopName, setShopName] = useState(shop?.shopName || '');
  const [ownerName, setOwnerName] = useState(shop?.ownerName || '');
  const [phone, setPhone] = useState(shop?.phone || '');
  const [address, setAddress] = useState(shop?.address || '');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const isUrdu = i18n.language === 'ur';

  const copyToClipboard = async (text: string, fieldName: string) => {
    await Clipboard.setStringAsync(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveProfile = async () => {
    if (!shopName.trim()) {
      Alert.alert('Validation Error', 'Shop Name is required.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Send update to backend
      const res = await apiClient.put('/auth/profile', {
        shopName: shopName.trim(),
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
      });

      if (res.data?.success && res.data?.shop) {
        const updatedShop = res.data.shop;

        // 2. Save locally
        if (shop && subscription) {
          await saveShopLocal({
            shopId: shop.id,
            shopName: updatedShop.shopName,
            ownerName: updatedShop.ownerName,
            phone: updatedShop.phone,
            address: updatedShop.address,
            image: updatedShop.image,
            licenseId: shop.licenseId,
            shopCode: shop.shopCode,
            subscriptionPlan: subscription.planType,
            subscriptionStartDate: subscription.startDate,
            subscriptionExpiryDate: subscription.expiryDate,
            accountStatus: subscription.status,
          });

          // 3. Update Store
          updateShopInfo(updatedShop);
        }

        setIsEditing(false);
        Alert.alert(isUrdu ? 'کامیابی' : 'Success', isUrdu ? 'پروفائل تبدیل ہو گئی ہے۔' : 'Shop profile updated successfully.');
      } else {
        Alert.alert('Error', 'Failed to update profile.');
      }
    } catch (e: any) {
      console.error('[ProfileScreen] Error updating profile', e);
      Alert.alert('Error', e?.response?.data?.message || 'Could not update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!shop) return null;

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900 p-4">
      <View className="items-center my-6">
        <View className="w-20 h-20 bg-blue-100 dark:bg-blue-900/40 rounded-full items-center justify-center mb-3">
          <Store size={40} color="#2563eb" />
        </View>
        <Typography variant="h2" className="text-center">
          {shop.shopName}
        </Typography>
        <Typography variant="caption" className="text-gray-500 text-center">
          {t('profile.shopProfile')}
        </Typography>
      </View>

      {isEditing ? (
        <Card className="mb-6 p-4">
          <Typography variant="h3" className="mb-4 text-blue-600 border-b border-gray-100 dark:border-gray-700 pb-2">
            {isUrdu ? 'پروفائل کی ترامیم' : 'Edit Shop Profile'}
          </Typography>

          <InputField
            label={isUrdu ? 'دکان کا نام *' : 'Shop Name *'}
            value={shopName}
            onChangeText={setShopName}
            placeholder="e.g. ABC Super Store"
          />

          <InputField
            label={isUrdu ? 'مالک کا نام' : 'Owner Name'}
            value={ownerName}
            onChangeText={setOwnerName}
            placeholder="e.g. Muhammad Ali"
          />

          <InputField
            label={isUrdu ? 'فون نمبر' : 'Phone Number'}
            value={phone}
            onChangeText={setPhone}
            placeholder="03001234567"
            keyboardType="phone-pad"
          />

          <InputField
            label={isUrdu ? 'پتہ' : 'Shop Address'}
            value={address}
            onChangeText={setAddress}
            placeholder="Main Bazar, City"
            multiline
            numberOfLines={2}
          />

          <View className="flex-row gap-3 mt-4">
            <Button
              title={t('customer.cancel')}
              variant="outline"
              className="flex-1"
              onPress={() => setIsEditing(false)}
            />
            <Button
              title={isUrdu ? 'محفوظ کریں' : 'Save Changes'}
              className="flex-1"
              isLoading={isLoading}
              onPress={handleSaveProfile}
            />
          </View>
        </Card>
      ) : (
        <Card className="mb-4 p-4">
          <View className="flex-row items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
            <Typography variant="h3" className="text-blue-600">
              {t('profile.shopProfile')}
            </Typography>
            <TouchableOpacity
              className="flex-row items-center bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg"
              onPress={() => setIsEditing(true)}
            >
              <Edit3 size={16} color="#2563eb" className="mr-1.5" />
              <Typography variant="caption" className="text-blue-600 font-bold">
                {isUrdu ? 'پروفائل تبدیل کریں' : 'Edit Profile'}
              </Typography>
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center mb-4">
            <User size={20} color="#6b7280" className="mr-3" />
            <View className="flex-1">
              <Typography variant="caption" className="text-gray-400 uppercase font-medium">
                {t('profile.ownerName')}
              </Typography>
              <Typography variant="body" className="font-semibold">
                {shop.ownerName || 'N/A'}
              </Typography>
            </View>
          </View>

          <View className="flex-row items-center mb-4">
            <Phone size={20} color="#6b7280" className="mr-3" />
            <View className="flex-1">
              <Typography variant="caption" className="text-gray-400 uppercase font-medium">
                {t('profile.phone')}
              </Typography>
              <Typography variant="body" className="font-semibold">
                {shop.phone || 'N/A'}
              </Typography>
            </View>
          </View>

          <View className="flex-row items-center mb-2">
            <MapPin size={20} color="#6b7280" className="mr-3" />
            <View className="flex-1">
              <Typography variant="caption" className="text-gray-400 uppercase font-medium">
                {t('profile.address')}
              </Typography>
              <Typography variant="body" className="font-semibold">
                {shop.address || 'N/A'}
              </Typography>
            </View>
          </View>
        </Card>
      )}

      {/* Account Credentials */}
      <Card className="mb-6 p-4">
        <Typography variant="h3" className="mb-4 text-blue-600 border-b border-gray-100 dark:border-gray-700 pb-2">
          Account Credentials
        </Typography>

        <View className="mb-4 bg-gray-50 dark:bg-gray-800/60 p-3 rounded-xl flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 mr-2">
            <Key size={20} color="#2563eb" className="mr-3" />
            <View>
              <Typography variant="caption" className="text-gray-400 uppercase font-medium">
                {t('profile.licenseId')}
              </Typography>
              <Typography variant="body" className="font-bold text-gray-900 dark:text-gray-100">
                {shop.licenseId}
              </Typography>
            </View>
          </View>
          <TouchableOpacity
            className="bg-blue-50 dark:bg-blue-900/30 px-3 py-2 rounded-lg flex-row items-center"
            onPress={() => copyToClipboard(shop.licenseId, 'licenseId')}
          >
            {copiedField === 'licenseId' ? (
              <>
                <Check size={16} color="#16a34a" />
                <Typography variant="caption" className="text-green-600 font-bold ml-1">
                  {t('common.copied')}
                </Typography>
              </>
            ) : (
              <>
                <Copy size={16} color="#2563eb" />
                <Typography variant="caption" className="text-blue-600 font-bold ml-1">
                  {t('common.copy')}
                </Typography>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View className="bg-gray-50 dark:bg-gray-800/60 p-3 rounded-xl flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 mr-2">
            <Hash size={20} color="#2563eb" className="mr-3" />
            <View>
              <Typography variant="caption" className="text-gray-400 uppercase font-medium">
                {t('profile.shopCode')}
              </Typography>
              <Typography variant="body" className="font-bold text-gray-900 dark:text-gray-100">
                {shop.shopCode}
              </Typography>
            </View>
          </View>
          <TouchableOpacity
            className="bg-blue-50 dark:bg-blue-900/30 px-3 py-2 rounded-lg flex-row items-center"
            onPress={() => copyToClipboard(shop.shopCode, 'shopCode')}
          >
            {copiedField === 'shopCode' ? (
              <>
                <Check size={16} color="#16a34a" />
                <Typography variant="caption" className="text-green-600 font-bold ml-1">
                  {t('common.copied')}
                </Typography>
              </>
            ) : (
              <>
                <Copy size={16} color="#2563eb" />
                <Typography variant="caption" className="text-blue-600 font-bold ml-1">
                  {t('common.copy')}
                </Typography>
              </>
            )}
          </TouchableOpacity>
        </View>
      </Card>
    </ScrollView>
  );
}
