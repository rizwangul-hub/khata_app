import React, { useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
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
import { ArrowDownLeft } from 'lucide-react-native';

export default function AddPaymentScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { customerId } = useLocalSearchParams<{ customerId: string }>();

  const shop = useAuthStore((state) => state.shop);
  const addPayment = useLedgerStore((state) => state.addPayment);

  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [amountError, setAmountError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Post-save document preview modal
  const [previewModal, setPreviewModal] = useState<{
    visible: boolean;
    html: string;
    pdfUri: string;
    fileName: string;
  }>({ visible: false, html: '', pdfUri: '', fileName: '' });

  const handleSave = async () => {
    setAmountError(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setAmountError(t('ledger.amountRequired'));
      return;
    }

    if (!customerId) return;

    setIsLoading(true);

    const customer = await getCustomerByIdLocal(customerId);
    const success = await addPayment({
      customerId,
      amount: numAmount,
      notes: notes.trim(),
    });

    setIsLoading(false);

    if (success && customer) {
      const isUrdu = i18n.language === 'ur';
      const createdTx = {
        id: Crypto.randomUUID(),
        type: 'payment' as const,
        amount: numAmount,
        notes: notes.trim(),
        transactionDate: new Date().toISOString(),
      };

      const doc = await PDFService.generatePaymentReceipt(
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
      Alert.alert(t('common.error'), 'Unable to record payment. Please try again.');
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="p-6 mb-6">
        <View className="flex-row items-center justify-center mb-6">
          <View className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-full items-center justify-center mr-2">
            <ArrowDownLeft size={24} color="#16a34a" />
          </View>
          <Typography variant="h2" className="text-green-600 dark:text-green-400">
            {t('ledger.addPayment')}
          </Typography>
        </View>

        <InputField
          label={`${t('ledger.amount')} * (Rs.)`}
          value={amount}
          onChangeText={(val) => {
            setAmount(val);
            if (amountError) setAmountError(null);
          }}
          placeholder="1000"
          keyboardType="decimal-pad"
          error={amountError || undefined}
        />

        <InputField
          label={t('ledger.notes')}
          value={notes}
          onChangeText={setNotes}
          placeholder="e.g. Cash received, JazzCash, EasyPaisa"
          multiline
          numberOfLines={3}
          style={{ textAlignVertical: 'top' }}
        />

        <Button
          title={t('ledger.addPayment')}
          onPress={handleSave}
          isLoading={isLoading}
          className="mt-4 mb-3 bg-green-600 active:bg-green-700"
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
        title="Payment Receipt Generated"
        onClose={() => {
          setPreviewModal({ visible: false, html: '', pdfUri: '', fileName: '' });
          router.back();
        }}
      />
    </ScrollView>
  );
}
