import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Typography } from '@/src/components/Typography';
import { Card } from '@/src/components/Card';
import { Button } from '@/src/components/Button';
import { InputField } from '@/src/components/InputField';
import { CustomerAvatar } from '@/src/components/CustomerAvatar';
import { useCustomerStore } from '@/src/state/customerStore';
import { checkDuplicateCustomer } from '@/src/services/customerRepository';
import { useAuthStore } from '@/src/state/authStore';
import { useTranslation } from 'react-i18next';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon, X } from 'lucide-react-native';

export default function AddCustomerScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ prefillName?: string }>();
  const shopId = useAuthStore((state) => state.shopId);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const addCustomer = useCustomerStore((state) => state.addCustomer);

  useEffect(() => {
    if (params.prefillName) {
      setName(params.prefillName);
    }
  }, [params.prefillName]);

  const handlePickImage = async (mode: 'camera' | 'gallery') => {
    try {
      let result;
      if (mode === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Needed', 'Camera permission is required to take a picture, but you can still save the customer without a picture.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Needed', 'Gallery permission is required to choose a picture, but you can still save the customer without a picture.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        });
      }

      if (!result.canceled && result.assets && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (e) {
      console.error('Image picker error', e);
    }
  };

  const executeSave = async () => {
    setIsLoading(true);
    try {
      const created = await addCustomer({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        imageLocalUri: imageUri || undefined,
      });
      setIsLoading(false);

      if (created) {
        Alert.alert(t('common.success'), t('customer.customerAddedSuccess'), [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert(t('common.error'), 'Unable to save customer. Please try again.');
      }
    } catch (err) {
      console.error('Save customer error', err);
      setIsLoading(false);
      Alert.alert(t('common.error'), 'Unable to save customer. Please try again.');
    }
  };

  const handleSave = async () => {
    setNameError(null);

    if (!name || !name.trim()) {
      setNameError(t('customer.nameRequired'));
      return;
    }

    const activeShopId = shopId || 'local_shop';
    try {
      const dupCheck = await checkDuplicateCustomer(activeShopId, name, phone);
      if (dupCheck.duplicateName || dupCheck.duplicatePhone) {
        let msg = 'A customer with this name or phone already exists in your shop khata. Do you want to continue anyway?';
        if (dupCheck.duplicatePhone) {
          msg = `Phone number ${phone} is already linked to ${dupCheck.existingCustomer?.name || 'another customer'}. Continue creating customer anyway?`;
        }

        Alert.alert('Duplicate Customer Warning', msg, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue Anyway', onPress: () => executeSave() },
        ]);
        return;
      }
    } catch (err) {
      console.error('Duplicate check error', err);
    }

    executeSave();
  };

  const handleCancel = () => {
    if (name.trim() || phone.trim() || address.trim() || imageUri) {
      Alert.alert(
        t('customer.discardTitle'),
        t('customer.discardMessage'),
        [
          { text: t('customer.cancel'), style: 'cancel' },
          { text: t('customer.discard'), style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="p-6 mb-6">
        <Typography variant="h2" className="mb-6 text-center text-blue-600">
          {t('customer.addCustomer')}
        </Typography>

        {/* Picture Selection */}
        <View className="items-center mb-6">
          <View className="relative mb-3">
            <CustomerAvatar name={name || 'New Customer'} imageUri={imageUri} size={90} />
            {imageUri && (
              <TouchableOpacity
                className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1 border-2 border-white dark:border-gray-800"
                onPress={() => setImageUri(null)}
              >
                <X size={14} color="#ffffff" />
              </TouchableOpacity>
            )}
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-row items-center bg-blue-50 dark:bg-blue-900/30 px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-800"
              onPress={() => handlePickImage('camera')}
            >
              <Camera size={18} color="#2563eb" className="mr-1" />
              <Typography variant="caption" className="text-blue-600 font-bold">
                {t('customer.takePhoto')}
              </Typography>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700"
              onPress={() => handlePickImage('gallery')}
            >
              <ImageIcon size={18} color="#6b7280" className="mr-1" />
              <Typography variant="caption" className="text-gray-700 dark:text-gray-300 font-medium">
                {t('customer.chooseGallery')}
              </Typography>
            </TouchableOpacity>
          </View>
        </View>

        {/* Inputs */}
        <InputField
          label={`${t('customer.customerName')} *`}
          value={name}
          onChangeText={(val) => {
            setName(val);
            if (nameError) setNameError(null);
          }}
          placeholder="e.g. Muhammad Ali"
          error={nameError || undefined}
        />

        <InputField
          label={t('customer.mobileNumber')}
          value={phone}
          onChangeText={setPhone}
          placeholder="03001234567"
          keyboardType="phone-pad"
        />

        <InputField
          label={t('customer.address')}
          value={address}
          onChangeText={setAddress}
          placeholder="City / Area / Shop address"
          multiline
          numberOfLines={3}
          style={{ textAlignVertical: 'top' }}
        />

        <Button
          title={t('customer.saveCustomer')}
          onPress={handleSave}
          isLoading={isLoading}
          className="mt-4 mb-2"
        />

        <Button
          title={t('customer.cancel')}
          variant="secondary"
          onPress={handleCancel}
        />
      </Card>
    </ScrollView>
  );
}
