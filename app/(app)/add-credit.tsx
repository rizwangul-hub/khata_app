import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import * as Crypto from 'expo-crypto';
import { Typography } from '@/src/components/Typography';
import { Card } from '@/src/components/Card';
import { Button } from '@/src/components/Button';
import { InputField } from '@/src/components/InputField';
import { DocumentPreviewModal } from '@/src/components/DocumentPreviewModal';
import { useLedgerStore } from '@/src/state/ledgerStore';
import { useAuthStore } from '@/src/state/authStore';
import { getCustomerByIdLocal } from '@/src/services/customerRepository';
import { PDFService } from '@/src/services/pdfService';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon, X, ArrowUpRight, Share2 } from 'lucide-react-native';

export default function AddCreditScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { customerId } = useLocalSearchParams<{ customerId: string }>();

  const shop = useAuthStore((state) => state.shop);
  const addCredit = useLedgerStore((state) => state.addCredit);

  const [itemName, setItemName] = useState('');
  const [amount, setAmount] = useState('');
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState('kg');
  const [notes, setNotes] = useState('');
  const [billUri, setBillUri] = useState<string | null>(null);

  const [itemError, setItemError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Post-save document preview modal
  const [previewModal, setPreviewModal] = useState<{
    visible: boolean;
    html: string;
    pdfUri: string;
    fileName: string;
  }>({ visible: false, html: '', pdfUri: '', fileName: '' });

  const handlePickBillImage = async (mode: 'camera' | 'gallery') => {
    try {
      let result;
      if (mode === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Needed', 'Camera permission is required to take a bill photo.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Needed', 'Gallery permission is required to select a bill photo.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
      }

      if (!result.canceled && result.assets && result.assets[0]) {
        setBillUri(result.assets[0].uri);
      }
    } catch (e) {
      console.error('Bill image picker error', e);
    }
  };

  const handleSave = async () => {
    setItemError(null);
    setAmountError(null);

    if (!itemName || !itemName.trim()) {
      setItemError(t('ledger.itemNameRequired'));
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setAmountError(t('ledger.amountRequired'));
      return;
    }

    if (!customerId) return;

    setIsLoading(true);

    const customer = await getCustomerByIdLocal(customerId);
    const success = await addCredit({
      customerId,
      itemName: itemName.trim(),
      amount: numAmount,
      weight: weight ? parseFloat(weight) : undefined,
      weightUnit: weight ? weightUnit : undefined,
      notes: notes.trim(),
      billLocalUri: billUri || undefined,
    });

    setIsLoading(false);

    if (success && customer) {
      const isUrdu = i18n.language === 'ur';
      const createdTx = {
        id: Crypto.randomUUID(),
        type: 'credit' as const,
        itemName: itemName.trim(),
        amount: numAmount,
        weight: weight ? parseFloat(weight) : undefined,
        weightUnit: weight ? weightUnit : undefined,
        notes: notes.trim(),
        transactionDate: new Date().toISOString(),
      };

      const doc = await PDFService.generateCreditBill(
        shop || { shopName: 'Universal Store' },
        customer,
        createdTx,
        customer.balance || 0,
        isUrdu
      );

      setPreviewModal({
        visible: true,
        html: doc.html,
        pdfUri: doc.uri,
        fileName: doc.fileName,
      });
    } else {
      Alert.alert(t('common.error'), 'Unable to record credit entry. Please try again.');
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="p-6 mb-6">
        <View className="flex-row items-center justify-center mb-6">
          <View className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-full items-center justify-center mr-2">
            <ArrowUpRight size={24} color="#ef4444" />
          </View>
          <Typography variant="h2" className="text-red-600 dark:text-red-400">
            {t('ledger.addCredit')}
          </Typography>
        </View>

        <InputField
          label={`${t('ledger.itemName')} *`}
          value={itemName}
          onChangeText={(val) => {
            setItemName(val);
            if (itemError) setItemError(null);
          }}
          placeholder="e.g. Rice, Sugar, Oil"
          error={itemError || undefined}
        />

        <InputField
          label={`${t('ledger.price')} * (Rs.)`}
          value={amount}
          onChangeText={(val) => {
            setAmount(val);
            if (amountError) setAmountError(null);
          }}
          placeholder="1000"
          keyboardType="decimal-pad"
          error={amountError || undefined}
        />

        <View className="flex-row gap-3 mb-2">
          <View className="flex-1">
            <InputField
              label={t('ledger.weight')}
              value={weight}
              onChangeText={setWeight}
              placeholder="e.g. 10, 2.5"
              keyboardType="decimal-pad"
            />
          </View>
          <View className="w-1/3">
            <InputField
              label="Unit"
              value={weightUnit}
              onChangeText={setWeightUnit}
              placeholder="kg / g / L"
            />
          </View>
        </View>

        <InputField
          label={t('ledger.notes')}
          value={notes}
          onChangeText={setNotes}
          placeholder="Notes or details"
          multiline
          numberOfLines={3}
          style={{ textAlignVertical: 'top' }}
        />

        <Typography variant="caption" className="mb-2 uppercase font-medium">
          {t('ledger.billPicture')}
        </Typography>

        {billUri ? (
          <View className="relative mb-6 items-center">
            <Image source={{ uri: billUri }} className="w-full h-48 rounded-xl bg-gray-200" resizeMode="cover" />
            <TouchableOpacity
              className="absolute top-2 right-2 bg-red-500 rounded-full p-2"
              onPress={() => setBillUri(null)}
            >
              <X size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-row gap-3 mb-6">
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center bg-gray-100 dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700"
              onPress={() => handlePickBillImage('camera')}
            >
              <Camera size={20} color="#2563eb" className="mr-2" />
              <Typography variant="body" className="font-medium text-gray-700 dark:text-gray-300">
                {t('ledger.takeBillPhoto')}
              </Typography>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center bg-gray-100 dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700"
              onPress={() => handlePickBillImage('gallery')}
            >
              <ImageIcon size={20} color="#6b7280" className="mr-2" />
              <Typography variant="body" className="font-medium text-gray-700 dark:text-gray-300">
                Gallery
              </Typography>
            </TouchableOpacity>
          </View>
        )}

        <Button
          title={t('ledger.addCredit')}
          onPress={handleSave}
          isLoading={isLoading}
          className="mt-2 mb-3 bg-red-600 active:bg-red-700"
        />

        <Button
          title={t('customer.cancel')}
          variant="secondary"
          onPress={() => router.back()}
        />
      </Card>

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        visible={previewModal.visible}
        htmlContent={previewModal.html}
        pdfUri={previewModal.pdfUri}
        fileName={previewModal.fileName}
        title="Credit Bill Generated"
        onClose={() => {
          setPreviewModal({ visible: false, html: '', pdfUri: '', fileName: '' });
          router.back();
        }}
      />
    </ScrollView>
  );
}
