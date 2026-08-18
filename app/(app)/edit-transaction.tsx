import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { Typography } from '@/src/components/Typography';
import { Card } from '@/src/components/Card';
import { Button } from '@/src/components/Button';
import { InputField } from '@/src/components/InputField';
import { useLedgerStore, LedgerTransactionItem } from '@/src/state/ledgerStore';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon, X } from 'lucide-react-native';

export default function EditTransactionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const customerTransactions = useLedgerStore(state => state.customerTransactions);
  const updateTransaction = useLedgerStore(state => state.updateTransaction);

  const [transaction, setTransaction] = useState<LedgerTransactionItem | null>(null);
  const [itemName, setItemName] = useState('');
  const [amount, setAmount] = useState('');
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState('kg');
  const [notes, setNotes] = useState('');
  const [billUri, setBillUri] = useState<string | null>(null);

  const [itemError, setItemError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (id) {
      const found = customerTransactions.find(tx => tx.id === id);
      if (found) {
        setTransaction(found);
        setItemName(found.itemName || '');
        setAmount(String(found.amount));
        setWeight(found.weight ? String(found.weight) : '');
        setWeightUnit(found.weightUnit || 'kg');
        setNotes(found.notes || '');
        setBillUri(found.billLocalUri || found.billRemoteUrl || null);
      }
    }
  }, [id, customerTransactions]);

  if (!transaction) return null;

  const isCredit = transaction.type === 'credit';

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

    if (isCredit && (!itemName || !itemName.trim())) {
      setItemError(t('ledger.itemNameRequired'));
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setAmountError(t('ledger.amountRequired'));
      return;
    }

    setIsLoading(true);
    const success = await updateTransaction(transaction.id, {
      customerId: transaction.customerId,
      itemName: isCredit ? itemName.trim() : undefined,
      amount: numAmount,
      weight: isCredit && weight ? parseFloat(weight) : undefined,
      weightUnit: isCredit && weight ? weightUnit : undefined,
      notes: notes.trim(),
      billLocalUri: billUri || '',
    });
    setIsLoading(false);

    if (success) {
      Alert.alert(t('common.success'), 'Transaction updated successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else {
      Alert.alert(t('common.error'), 'Unable to update transaction. Please try again.');
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="p-6 mb-6">
        <Typography variant="h2" className="mb-6 text-center text-blue-600">
          {t('ledger.editTransaction')} ({isCredit ? t('ledger.credit') : t('ledger.payment')})
        </Typography>

        {isCredit && (
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
        )}

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

        {isCredit && (
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
        )}

        <InputField
          label={t('ledger.notes')}
          value={notes}
          onChangeText={setNotes}
          placeholder="Notes or details"
          multiline
          numberOfLines={3}
          style={{ textAlignVertical: 'top' }}
        />

        {isCredit && (
          <>
            <Typography variant="caption" className="mb-2 uppercase font-medium">
              {t('ledger.billPicture')}
            </Typography>

            {billUri ? (
              <View className="relative mb-4 items-center">
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
          </>
        )}

        <Button
          title={t('common.success')}
          onPress={handleSave}
          isLoading={isLoading}
          className="mt-2 mb-3"
        />

        <Button
          title={t('customer.cancel')}
          variant="secondary"
          onPress={() => router.back()}
        />
      </Card>
    </ScrollView>
  );
}
