import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, Alert, TouchableOpacity, FlatList, TextInput, Linking } from 'react-native';
import { Typography } from '@/src/components/Typography';
import { Card } from '@/src/components/Card';
import { Button } from '@/src/components/Button';
import { CustomerAvatar } from '@/src/components/CustomerAvatar';
import { EmptyState } from '@/src/components/EmptyState';
import { DocumentPreviewModal } from '@/src/components/DocumentPreviewModal';
import { StatementFilterModal, StatementDateRange } from '@/src/components/StatementFilterModal';
import { getCustomerByIdLocal, archiveCustomerLocal, restoreCustomerLocal } from '@/src/services/customerRepository';
import { getLedgerByCustomerLocal, getCustomerBalanceSummaryLocal } from '@/src/services/ledgerRepository';
import { useCustomerStore, CustomerItem } from '@/src/state/customerStore';
import { useAuthStore } from '@/src/state/authStore';
import { PDFService } from '@/src/services/pdfService';
import { formatCurrency, formatDateTime } from '@/src/utils/formatters';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import {
  Phone,
  Trash2,
  Edit3,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  ImageIcon,
  BookOpen,
  Tag,
  Copy,
  MessageCircle,
  Archive,
  RefreshCw,
  Search,
  X,
  Calendar,
  CheckCircle,
} from 'lucide-react-native';

export default function CustomerDetailsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const shop = useAuthStore((state) => state.shop);
  const [customer, setCustomer] = useState<CustomerItem | null>(null);
  const deleteCustomer = useCustomerStore((state) => state.deleteCustomer);

  const [ledgerTransactions, setLedgerTransactions] = useState<any[]>([]);
  const [balanceSummary, setBalanceSummary] = useState({ totalCredit: 0, totalPaid: 0, balance: 0 });
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'credit' | 'payment'>('all');
  const [isCopied, setIsCopied] = useState(false);

  // Modals state
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
  const [previewModal, setPreviewModal] = useState<{
    visible: boolean;
    html: string;
    pdfUri: string;
    fileName: string;
  }>({ visible: false, html: '', pdfUri: '', fileName: '' });

  const isUrdu = i18n.language === 'ur';

  const loadData = useCallback(async () => {
    if (!id) return;
    const custData = await getCustomerByIdLocal(id);
    if (custData) {
      setCustomer(custData);
      const txs = await getLedgerByCustomerLocal(id, ledgerSearch, typeFilter);
      setLedgerTransactions(txs);
      const sum = await getCustomerBalanceSummaryLocal(id);
      setBalanceSummary(sum);
    }
  }, [id, ledgerSearch, typeFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCopyCode = async () => {
    if (customer?.customerCode) {
      await Clipboard.setStringAsync(customer.customerCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleCall = () => {
    if (customer?.phone) {
      Linking.openURL(`tel:${customer.phone.trim()}`);
    }
  };

  const handleWhatsApp = () => {
    if (customer?.phone) {
      const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
      Linking.openURL(`whatsapp://send?phone=${cleanPhone}`);
    }
  };

  const handleToggleArchive = () => {
    if (!customer) return;

    const isArchived = Boolean(customer.isArchived);
    Alert.alert(
      isArchived ? (isUrdu ? 'گاہک کو بحال کریں' : 'Restore Customer') : (isUrdu ? 'گاہک کو محفوظ کریں' : 'Archive Customer'),
      isArchived
        ? (isUrdu ? 'کیا آپ اس گاہک کو فعال گاہکوں کی فہرست میں بحال کرنا چاہتے ہیں؟' : 'Restore this customer to active list?')
        : (isUrdu ? 'محفوظ شدہ گاہک عام فہرست میں ظاہر نہیں ہوں گے لیکن ان کا کھاتا محفوظ رہے گا۔' : 'Archive this customer? Historical ledger will be preserved.'),
      [
        { text: t('customer.cancel'), style: 'cancel' },
        {
          text: isArchived ? 'Restore' : 'Archive',
          onPress: async () => {
            if (isArchived) {
              await restoreCustomerLocal(customer.id);
            } else {
              await archiveCustomerLocal(customer.id);
            }
            loadData();
          },
        },
      ]
    );
  };

  const handleDeleteCustomer = () => {
    if (!customer) return;

    Alert.alert(
      t('customer.deleteTitle'),
      t('customer.deleteConfirm'),
      [
        { text: t('customer.cancel'), style: 'cancel' },
        {
          text: t('customer.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteCustomer(customer.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleGenerateStatement = async (range: StatementDateRange, rangeLabel: string) => {
    setFilterModalVisible(false);
    if (!customer) return;

    setIsGeneratingDoc(true);
    try {
      let filteredTxs = [...ledgerTransactions];
      const now = new Date();

      if (range === 'today') {
        const todayStr = now.toISOString().split('T')[0];
        filteredTxs = filteredTxs.filter((tx) => (tx.transactionDate || '').startsWith(todayStr));
      } else if (range === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        filteredTxs = filteredTxs.filter((tx) => new Date(tx.transactionDate) >= weekAgo);
      } else if (range === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(now.getMonth() - 1);
        filteredTxs = filteredTxs.filter((tx) => new Date(tx.transactionDate) >= monthAgo);
      }

      let totalCredit = 0;
      let totalPaid = 0;
      filteredTxs.forEach((tx) => {
        if (tx.type === 'credit') totalCredit += tx.amount;
        else totalPaid += tx.amount;
      });

      const doc = await PDFService.generateCustomerStatement(
        shop || { shopName: 'Universal Store' },
        customer,
        filteredTxs,
        rangeLabel,
        {
          totalCredit,
          totalPaid,
          finalBalance: totalCredit - totalPaid,
        },
        isUrdu
      );

      setPreviewModal({
        visible: true,
        html: doc.html,
        pdfUri: doc.uri,
        fileName: doc.fileName,
      });
    } catch (e) {
      Alert.alert('Error', 'Failed to generate customer statement.');
    } finally {
      setIsGeneratingDoc(false);
    }
  };

  if (!customer) return null;

  const { balance, totalCredit, totalPaid } = balanceSummary;
  const createdDateStr = customer.createdAt ? formatDateTime(customer.createdAt, isUrdu).dateFormatted : 'N/A';
  const lastTxDateStr = ledgerTransactions.length > 0 && ledgerTransactions[0].transactionDate
    ? formatDateTime(ledgerTransactions[0].transactionDate, isUrdu).dateFormatted
    : 'No transactions yet';

  const renderTransactionItem = ({ item }: { item: any }) => {
    const isCredit = item.type === 'credit';
    const imagePresent = Boolean(item.billLocalUri || item.billRemoteUrl);
    const runningBal = item.runningBalance || 0;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push(`/(app)/transaction/${item.id}` as any)}
      >
        <Card className="mb-3 p-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-2">
              <View
                className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                  isCredit ? 'bg-red-100 dark:bg-red-900/40' : 'bg-green-100 dark:bg-green-900/40'
                }`}
              >
                {isCredit ? (
                  <ArrowUpRight size={20} color="#ef4444" />
                ) : (
                  <ArrowDownLeft size={20} color="#16a34a" />
                )}
              </View>

              <View className="flex-1">
                <View className="flex-row items-center">
                  <Typography variant="h3" className="text-base font-bold text-gray-900 dark:text-gray-100 mr-2" numberOfLines={1}>
                    {isCredit ? item.itemName || t('ledger.credit') : t('ledger.payment')}
                  </Typography>
                  {imagePresent && (
                    <View className="bg-blue-100 dark:bg-blue-900/50 p-1 rounded">
                      <ImageIcon size={12} color="#2563eb" />
                    </View>
                  )}
                </View>

                <Typography variant="caption" className="text-gray-400 mt-0.5">
                  {formatDateTime(item.transactionDate, isUrdu).dateFormatted}
                  {isCredit && item.weight ? ` • ${item.weight}${item.weightUnit || ''}` : ''}
                </Typography>
              </View>
            </View>

            <View className="items-end flex-row items-center">
              <View className="items-end mr-2">
                <Typography
                  variant="body"
                  className={`font-extrabold text-base ${isCredit ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}
                >
                  {isCredit ? '+' : '-'} Rs. {item.amount.toLocaleString()}
                </Typography>
                <Typography variant="caption" className="text-gray-400 font-semibold mt-0.5">
                  Bal: Rs. {runningBal.toLocaleString()}
                </Typography>
              </View>
              <ChevronRight size={18} color="#9ca3af" />
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900 p-4">
      {/* Customer Header Card */}
      <Card className="p-4 mb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 mr-2">
            <CustomerAvatar name={customer.name} imageUri={customer.imageLocalUri} size={60} />
            <View className="ml-3 flex-1">
              <Typography variant="h2" numberOfLines={1}>
                {customer.name}
              </Typography>

              {customer.customerCode ? (
                <TouchableOpacity
                  className="flex-row items-center bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-lg mt-1 align-self-start"
                  onPress={handleCopyCode}
                >
                  <Tag size={12} color="#2563eb" className="mr-1" />
                  <Typography variant="caption" className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 mr-1">
                    {customer.customerCode}
                  </Typography>
                  {isCopied ? <CheckCircle size={12} color="#16a34a" /> : <Copy size={12} color="#9ca3af" />}
                </TouchableOpacity>
              ) : null}

              {customer.phone ? (
                <View className="flex-row items-center mt-1">
                  <Phone size={13} color="#6b7280" className="mr-1" />
                  <Typography variant="caption" className="text-gray-600 dark:text-gray-400 font-medium">
                    {customer.phone}
                  </Typography>
                </View>
              ) : null}
            </View>
          </View>

          <View className="flex-row gap-2">
            <TouchableOpacity
              className="bg-gray-100 dark:bg-gray-800 p-2.5 rounded-xl"
              onPress={() => router.push({ pathname: '/(app)/edit-customer', params: { id: customer.id } } as any)}
            >
              <Edit3 size={18} color="#2563eb" />
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-amber-50 dark:bg-amber-900/30 p-2.5 rounded-xl"
              onPress={handleToggleArchive}
            >
              <Archive size={18} color="#d97706" />
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-red-50 dark:bg-red-900/30 p-2.5 rounded-xl"
              onPress={handleDeleteCustomer}
            >
              <Trash2 size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Call & WhatsApp Quick Buttons */}
        {customer.phone ? (
          <View className="flex-row gap-3 border-t border-gray-100 dark:border-gray-700 pt-3 mt-3">
            <TouchableOpacity
              className="flex-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 py-2 rounded-xl flex-row items-center justify-center"
              onPress={handleCall}
            >
              <Phone size={16} color="#16a34a" className="mr-1.5" />
              <Typography variant="caption" className="font-bold text-emerald-700 dark:text-emerald-300">
                Call Customer
              </Typography>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 py-2 rounded-xl flex-row items-center justify-center"
              onPress={handleWhatsApp}
            >
              <MessageCircle size={16} color="#15803d" className="mr-1.5" />
              <Typography variant="caption" className="font-bold text-green-700 dark:text-green-300">
                WhatsApp
              </Typography>
            </TouchableOpacity>
          </View>
        ) : null}
      </Card>

      {/* Prominent Balance Summary Section */}
      <Card className="p-5 mb-4 bg-white dark:bg-gray-800 border-2 border-blue-100 dark:border-blue-900/40">
        <Typography variant="caption" className="text-gray-400 uppercase font-bold text-center mb-1">
          {t('ledger.outstandingBalance')}
        </Typography>

        <Typography
          variant="h1"
          className={`text-4xl font-extrabold text-center my-1 ${
            balance > 0
              ? 'text-red-600 dark:text-red-400'
              : balance === 0
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-indigo-600 dark:text-indigo-400'
          }`}
        >
          {balance > 0
            ? `Rs. ${balance.toLocaleString()}`
            : balance === 0
            ? `Rs. 0 (${t('ledger.settled')})`
            : `Rs. ${Math.abs(balance).toLocaleString()} (${t('ledger.advance')})`}
        </Typography>

        <View className="flex-row justify-around border-t border-gray-100 dark:border-gray-700 pt-3 mt-3">
          <View className="items-center">
            <Typography variant="caption" className="text-gray-400 font-medium">
              {t('ledger.totalCredit')}
            </Typography>
            <Typography variant="body" className="font-bold text-red-500">
              Rs. {totalCredit.toLocaleString()}
            </Typography>
          </View>

          <View className="w-px bg-gray-200 dark:bg-gray-700" />

          <View className="items-center">
            <Typography variant="caption" className="text-gray-400 font-medium">
              {t('ledger.totalPaid')}
            </Typography>
            <Typography variant="body" className="font-bold text-emerald-600">
              Rs. {totalPaid.toLocaleString()}
            </Typography>
          </View>
        </View>

        <View className="flex-row justify-between border-t border-gray-100 dark:border-gray-700 pt-2 mt-2">
          <Typography variant="caption" className="text-gray-400">
            Customer Since: {createdDateStr}
          </Typography>
          <Typography variant="caption" className="text-gray-400">
            Last Tx: {lastTxDateStr}
          </Typography>
        </View>
      </Card>

      {/* Primary Action Buttons: Add Credit & Add Payment */}
      <View className="flex-row gap-3 mb-3">
        <Button
          title={`+ ${t('ledger.addCredit')}`}
          className="flex-1 py-4 bg-red-600 active:bg-red-700"
          onPress={() => router.push({ pathname: '/(app)/add-credit', params: { customerId: customer.id } } as any)}
        />
        <Button
          title={`+ ${t('ledger.addPayment')}`}
          className="flex-1 py-4 bg-emerald-600 active:bg-emerald-700"
          onPress={() => router.push({ pathname: '/(app)/add-payment', params: { customerId: customer.id } } as any)}
        />
      </View>

      {/* Customer Statement Generator Button */}
      <Button
        title="📄 Statement / حساب کی تفصیل"
        variant="secondary"
        className="mb-6 py-3"
        isLoading={isGeneratingDoc}
        onPress={() => setFilterModalVisible(true)}
      />

      {/* In-Ledger Search & Filter */}
      <View className="flex-row items-center justify-between mb-2">
        <Typography variant="h3">Khata Ledger History</Typography>
        <Typography variant="caption" className="text-gray-400 font-medium">
          {ledgerTransactions.length} entries
        </Typography>
      </View>

      {/* Ledger Search Input */}
      <View className="flex-row items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 mb-3">
        <Search size={18} color="#9ca3af" className="mr-2" />
        <TextInput
          className="flex-1 text-gray-900 dark:text-gray-100 text-sm"
          placeholder={isUrdu ? 'کھاتے میں تلاش کریں (آئٹم یا تفصیل)...' : 'Search ledger entries (item, notes)...'}
          placeholderTextColor="#9ca3af"
          value={ledgerSearch}
          onChangeText={setLedgerSearch}
        />
        {ledgerSearch ? (
          <TouchableOpacity onPress={() => setLedgerSearch('')}>
            <X size={16} color="#9ca3af" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Ledger Type Filter Tabs */}
      <View className="flex-row gap-2 mb-4">
        {(['all', 'credit', 'payment'] as const).map((tKey) => (
          <TouchableOpacity
            key={tKey}
            className={`px-3 py-1.5 rounded-lg border ${
              typeFilter === tKey
                ? 'bg-blue-600 border-blue-600'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
            }`}
            onPress={() => setTypeFilter(tKey)}
          >
            <Typography
              variant="caption"
              className={`font-bold capitalize ${typeFilter === tKey ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}
            >
              {tKey}
            </Typography>
          </TouchableOpacity>
        ))}
      </View>

      {ledgerTransactions.length === 0 ? (
        <Card className="p-6 mb-8">
          <EmptyState
            title={ledgerSearch ? 'No matching transactions' : t('ledger.noTransactionsYet')}
            description={ledgerSearch ? 'Try a different search keyword.' : t('ledger.noTransactionsSubtitle')}
            icon={<BookOpen size={48} color="#2563eb" />}
          />
        </Card>
      ) : (
        <FlatList
          data={ledgerTransactions}
          keyExtractor={(item) => item.id}
          renderItem={renderTransactionItem}
          scrollEnabled={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}

      {/* Statement Period Filter Modal */}
      <StatementFilterModal
        visible={filterModalVisible}
        onSelectRange={handleGenerateStatement}
        onClose={() => setFilterModalVisible(false)}
      />

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        visible={previewModal.visible}
        htmlContent={previewModal.html}
        pdfUri={previewModal.pdfUri}
        fileName={previewModal.fileName}
        title="Customer Statement"
        onClose={() => setPreviewModal({ visible: false, html: '', pdfUri: '', fileName: '' })}
      />
    </ScrollView>
  );
}
