import React, { useEffect, useState } from 'react';
import { View, ScrollView, Alert, TouchableOpacity, Image } from 'react-native';
import { Typography } from '@/src/components/Typography';
import { Card } from '@/src/components/Card';
import { Button } from '@/src/components/Button';
import { StatusBadge } from '@/src/components/StatusBadge';
import { BillImageViewer } from '@/src/components/BillImageViewer';
import { DocumentPreviewModal } from '@/src/components/DocumentPreviewModal';
import { useLedgerStore, LedgerTransactionItem } from '@/src/state/ledgerStore';
import { useAuthStore } from '@/src/state/authStore';
import { getCustomerByIdLocal } from '@/src/services/customerRepository';
import { PDFService } from '@/src/services/pdfService';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowUpRight, ArrowDownLeft, Calendar, FileText, Trash2, Edit3, Image as ImageIcon, Share2 } from 'lucide-react-native';

export default function TransactionDetailsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const shop = useAuthStore((state) => state.shop);
  const customerTransactions = useLedgerStore(state => state.customerTransactions);
  const deleteTransaction = useLedgerStore(state => state.deleteTransaction);

  const [transaction, setTransaction] = useState<LedgerTransactionItem | null>(null);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);

  // Document Preview Modal
  const [previewModal, setPreviewModal] = useState<{
    visible: boolean;
    html: string;
    pdfUri: string;
    fileName: string;
  }>({ visible: false, html: '', pdfUri: '', fileName: '' });

  useEffect(() => {
    if (id) {
      const found = customerTransactions.find(tx => tx.id === id);
      if (found) {
        setTransaction(found);
      }
    }
  }, [id, customerTransactions]);

  if (!transaction) return null;

  const isCredit = transaction.type === 'credit';

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateStr;
    }
  };

  const handleGenerateReceipt = async () => {
    setIsGeneratingDoc(true);
    try {
      const customer = await getCustomerByIdLocal(transaction.customerId);
      if (!customer) return;

      const isUrdu = i18n.language === 'ur';
      let doc;

      if (isCredit) {
        doc = await PDFService.generateCreditBill(
          shop || { shopName: 'Universal Store' },
          customer,
          transaction,
          customer.balance || 0,
          isUrdu
        );
      } else {
        doc = await PDFService.generatePaymentReceipt(
          shop || { shopName: 'Universal Store' },
          customer,
          transaction,
          customer.balance || 0,
          isUrdu
        );
      }

      setPreviewModal({
        visible: true,
        html: doc.html,
        pdfUri: doc.uri,
        fileName: doc.fileName,
      });
    } catch (e) {
      Alert.alert('Error', 'Could not generate receipt document.');
    } finally {
      setIsGeneratingDoc(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      t('ledger.deleteTitle'),
      t('ledger.deleteConfirm'),
      [
        { text: t('customer.cancel'), style: 'cancel' },
        {
          text: t('customer.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteTransaction(transaction.id, transaction.customerId);
            router.back();
          },
        },
      ]
    );
  };

  const imageUri = transaction.billLocalUri || transaction.billRemoteUrl;

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900 p-4">
      {/* Header Card */}
      <Card className="p-6 mb-4 items-center">
        <View
          className={`w-16 h-16 rounded-full items-center justify-center mb-3 ${
            isCredit ? 'bg-red-100 dark:bg-red-900/40' : 'bg-green-100 dark:bg-green-900/40'
          }`}
        >
          {isCredit ? (
            <ArrowUpRight size={32} color="#ef4444" />
          ) : (
            <ArrowDownLeft size={32} color="#16a34a" />
          )}
        </View>

        <Typography variant="h3" className="uppercase font-bold text-gray-500 mb-1">
          {isCredit ? t('ledger.credit') : t('ledger.payment')}
        </Typography>

        <Typography
          variant="h1"
          className={`text-3xl font-extrabold ${isCredit ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}
        >
          Rs. {transaction.amount.toLocaleString()}
        </Typography>

        {transaction.syncStatus === 'pending' && (
          <View className="mt-2">
            <StatusBadge status="pending" label={t('customer.waitingToSync')} />
          </View>
        )}
      </Card>

      {/* View & Share PDF Button */}
      <Button
        title={`📄 ${isCredit ? 'View & Share Credit Bill' : 'View & Share Receipt'}`}
        className="mb-4 py-3 bg-blue-600 active:bg-blue-700"
        isLoading={isGeneratingDoc}
        onPress={handleGenerateReceipt}
      />

      {/* Details Card */}
      <Card className="p-4 mb-4">
        <Typography variant="h3" className="mb-4 text-blue-600 border-b border-gray-100 dark:border-gray-700 pb-2">
          Transaction Details
        </Typography>

        {isCredit && transaction.itemName ? (
          <View className="mb-4">
            <Typography variant="caption" className="text-gray-400 uppercase font-medium">
              {t('ledger.itemName')}
            </Typography>
            <Typography variant="body" className="font-bold text-lg text-gray-900 dark:text-gray-100">
              {transaction.itemName}
            </Typography>
          </View>
        ) : null}

        {isCredit && transaction.weight ? (
          <View className="mb-4">
            <Typography variant="caption" className="text-gray-400 uppercase font-medium">
              {t('ledger.weight')}
            </Typography>
            <Typography variant="body" className="font-semibold text-gray-800 dark:text-gray-200">
              {transaction.weight} {transaction.weightUnit || ''}
            </Typography>
          </View>
        ) : null}

        <View className="flex-row items-center mb-4">
          <Calendar size={18} color="#6b7280" className="mr-3" />
          <View className="flex-1">
            <Typography variant="caption" className="text-gray-400 uppercase font-medium">
              Date & Time
            </Typography>
            <Typography variant="body" className="font-semibold">
              {formatDate(transaction.transactionDate)}
            </Typography>
          </View>
        </View>

        {transaction.notes ? (
          <View className="flex-row items-start mb-2">
            <FileText size={18} color="#6b7280" className="mr-3 mt-1" />
            <View className="flex-1">
              <Typography variant="caption" className="text-gray-400 uppercase font-medium">
                {t('ledger.notes')}
              </Typography>
              <Typography variant="body" className="text-gray-700 dark:text-gray-300">
                {transaction.notes}
              </Typography>
            </View>
          </View>
        ) : null}
      </Card>

      {/* Bill Image Section */}
      {imageUri ? (
        <Card className="p-4 mb-4">
          <Typography variant="h3" className="mb-3 text-blue-600">
            {t('ledger.billPicture')}
          </Typography>
          <TouchableOpacity
            className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 items-center justify-center"
            onPress={() => setImageViewerVisible(true)}
            activeOpacity={0.8}
          >
            <Image source={{ uri: imageUri }} className="w-full h-56 rounded-xl" resizeMode="cover" />
            <View className="absolute bottom-2 right-2 bg-black/70 px-3 py-1.5 rounded-lg flex-row items-center">
              <ImageIcon size={14} color="#ffffff" className="mr-1" />
              <Typography variant="caption" className="text-white font-bold">
                Tap to View Fullscreen
              </Typography>
            </View>
          </TouchableOpacity>
        </Card>
      ) : null}

      {/* Actions */}
      <View className="flex-row gap-3 mb-8">
        <Button
          title={t('ledger.editTransaction')}
          variant="outline"
          className="flex-1 py-3"
          onPress={() => router.push({ pathname: '/(app)/edit-transaction', params: { id: transaction.id } } as any)}
        />
        <TouchableOpacity
          className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-5 py-3 rounded-xl justify-center items-center flex-row"
          onPress={handleDelete}
        >
          <Trash2 size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Full screen bill image viewer */}
      <BillImageViewer
        visible={imageViewerVisible}
        imageUri={imageUri || null}
        onClose={() => setImageViewerVisible(false)}
      />

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        visible={previewModal.visible}
        htmlContent={previewModal.html}
        pdfUri={previewModal.pdfUri}
        fileName={previewModal.fileName}
        title={isCredit ? 'Credit Bill' : 'Payment Receipt'}
        onClose={() => setPreviewModal({ visible: false, html: '', pdfUri: '', fileName: '' })}
      />
    </ScrollView>
  );
}
