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
import { Camera, Image as ImageIcon, X, ArrowUpRight, Plus, Trash2, ShoppingBag } from 'lucide-react-native';

interface ItemRow {
  id: string;
  itemName: string;
  amount: string;
  weight: string;
  weightUnit: string;
}

export default function AddCreditScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { customerId } = useLocalSearchParams<{ customerId: string }>();

  const shop = useAuthStore((state) => state.shop);
  const addCredit = useLedgerStore((state) => state.addCredit);

  // Dynamic multi-item state
  const [items, setItems] = useState<ItemRow[]>([
    { id: Crypto.randomUUID(), itemName: '', amount: '', weight: '', weightUnit: 'kg' },
  ]);

  const [notes, setNotes] = useState('');
  const [billUri, setBillUri] = useState<string | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Post-save document preview modal
  const [previewModal, setPreviewModal] = useState<{
    visible: boolean;
    html: string;
    pdfUri: string;
    fileName: string;
  }>({ visible: false, html: '', pdfUri: '', fileName: '' });

  // Add a new empty item row
  const handleAddItemRow = () => {
    setItems((prev) => [
      ...prev,
      { id: Crypto.randomUUID(), itemName: '', amount: '', weight: '', weightUnit: 'kg' },
    ]);
  };

  // Remove an item row
  const handleRemoveItemRow = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Update specific field in item row
  const handleUpdateItemRow = (id: string, field: keyof ItemRow, value: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
    if (formError) setFormError(null);
  };

  // Calculate live Grand Total
  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const parsed = parseFloat(item.amount);
      return sum + (isNaN(parsed) ? 0 : parsed);
    }, 0);
  };

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
    setFormError(null);

    // Validate items
    const validItems = items.filter((item) => item.itemName.trim() !== '');
    if (validItems.length === 0) {
      setFormError('Please enter at least one item name.');
      return;
    }

    let hasInvalidAmount = false;
    validItems.forEach((item) => {
      const num = parseFloat(item.amount);
      if (isNaN(num) || num <= 0) {
        hasInvalidAmount = true;
      }
    });

    if (hasInvalidAmount) {
      setFormError('Please enter a valid price (> 0) for all items.');
      return;
    }

    const totalAmount = calculateTotal();
    if (totalAmount <= 0) {
      setFormError('Grand total price must be greater than 0.');
      return;
    }

    if (!customerId) return;

    setIsLoading(true);

    // Format item summary and detailed breakdown
    const primaryItemName = validItems.map((i) => i.itemName.trim()).join(', ');
    const firstWeight = validItems[0].weight ? parseFloat(validItems[0].weight) : undefined;
    const firstWeightUnit = validItems[0].weight ? validItems[0].weightUnit : undefined;

    // Create item breakdown string for notes / receipts
    const itemsBreakdown = validItems
      .map((i, idx) => {
        const weightStr = i.weight ? ` (${i.weight} ${i.weightUnit || 'kg'})` : '';
        return `${idx + 1}. ${i.itemName.trim()}${weightStr} - Rs. ${i.amount}`;
      })
      .join('\n');

    const combinedNotes = notes.trim()
      ? `${itemsBreakdown}\n\nNotes: ${notes.trim()}`
      : itemsBreakdown;

    const customer = await getCustomerByIdLocal(customerId);
    const success = await addCredit({
      customerId,
      itemName: primaryItemName,
      amount: totalAmount,
      weight: validItems.length === 1 ? firstWeight : undefined,
      weightUnit: validItems.length === 1 ? firstWeightUnit : undefined,
      notes: combinedNotes,
      billLocalUri: billUri || undefined,
    });

    setIsLoading(false);

    if (success && customer) {
      const isUrdu = i18n.language === 'ur';
      const createdTx = {
        id: Crypto.randomUUID(),
        type: 'credit' as const,
        itemName: primaryItemName,
        amount: totalAmount,
        weight: validItems.length === 1 ? firstWeight : undefined,
        weightUnit: validItems.length === 1 ? firstWeightUnit : undefined,
        notes: combinedNotes,
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

  const grandTotal = calculateTotal();

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

        {formError && (
          <View className="bg-red-50 dark:bg-red-900/30 p-3 rounded-xl border border-red-200 dark:border-red-800 mb-4">
            <Typography variant="caption" className="text-red-600 dark:text-red-400 font-semibold text-center">
              {formError}
            </Typography>
          </View>
        )}

        {/* Dynamic Item Rows */}
        <Typography variant="h3" className="font-bold mb-3 text-gray-800 dark:text-gray-200">
          Items List ({items.length})
        </Typography>

        {items.map((item, index) => (
          <View
            key={item.id}
            className="bg-gray-100 dark:bg-gray-800/60 p-4 rounded-xl border border-gray-200 dark:border-gray-700 mb-4"
          >
            <View className="flex-row justify-between items-center mb-2">
              <View className="flex-row items-center">
                <ShoppingBag size={16} color="#ef4444" className="mr-1.5" />
                <Typography variant="caption" className="font-bold uppercase text-red-600 dark:text-red-400">
                  Item #{index + 1}
                </Typography>
              </View>

              {items.length > 1 && (
                <TouchableOpacity
                  className="flex-row items-center bg-red-100 dark:bg-red-900/40 px-2.5 py-1 rounded-lg"
                  onPress={() => handleRemoveItemRow(item.id)}
                >
                  <Trash2 size={14} color="#ef4444" />
                  <Typography variant="caption" className="text-red-600 dark:text-red-400 ml-1 font-semibold">
                    Remove
                  </Typography>
                </TouchableOpacity>
              )}
            </View>

            <InputField
              label={`${t('ledger.itemName')} *`}
              value={item.itemName}
              onChangeText={(val) => handleUpdateItemRow(item.id, 'itemName', val)}
              placeholder="e.g. Rice, Sugar, Oil, Flour"
            />

            <View className="flex-row gap-2">
              <View className="flex-1">
                <InputField
                  label="Price * (Rs.)"
                  value={item.amount}
                  onChangeText={(val) => handleUpdateItemRow(item.id, 'amount', val)}
                  placeholder="500"
                  keyboardType="decimal-pad"
                />
              </View>
              <View className="flex-1">
                <InputField
                  label={t('ledger.weight')}
                  value={item.weight}
                  onChangeText={(val) => handleUpdateItemRow(item.id, 'weight', val)}
                  placeholder="5"
                  keyboardType="decimal-pad"
                />
              </View>
              <View className="w-20">
                <InputField
                  label="Unit"
                  value={item.weightUnit}
                  onChangeText={(val) => handleUpdateItemRow(item.id, 'weightUnit', val)}
                  placeholder="kg"
                />
              </View>
            </View>
          </View>
        ))}

        {/* Add Item Button */}
        <TouchableOpacity
          className="flex-row items-center justify-center bg-red-50 dark:bg-red-900/20 border border-dashed border-red-400 p-3.5 rounded-xl mb-6 active:bg-red-100"
          onPress={handleAddItemRow}
        >
          <Plus size={20} color="#ef4444" className="mr-2" />
          <Typography variant="body" className="font-bold text-red-600 dark:text-red-400">
            + Add Another Item
          </Typography>
        </TouchableOpacity>

        {/* Live Grand Total Card */}
        <View className="bg-red-50 dark:bg-red-900/30 p-4 rounded-xl border border-red-200 dark:border-red-800 mb-6 flex-row justify-between items-center">
          <View>
            <Typography variant="caption" className="text-gray-600 dark:text-gray-400 font-medium">
              Grand Total ({items.length} {items.length === 1 ? 'item' : 'items'})
            </Typography>
            <Typography variant="h2" className="text-red-600 dark:text-red-400 font-extrabold">
              Rs. {grandTotal.toLocaleString()}
            </Typography>
          </View>
        </View>

        <InputField
          label={t('ledger.notes')}
          value={notes}
          onChangeText={setNotes}
          placeholder="Additional notes or details"
          multiline
          numberOfLines={2}
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
          title={`${t('ledger.addCredit')} (Rs. ${grandTotal.toLocaleString()})`}
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
