import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Typography } from '@/src/components/Typography';
import { Card } from '@/src/components/Card';
import { Button } from '@/src/components/Button';
import { DocumentPreviewModal } from '@/src/components/DocumentPreviewModal';
import { StatementFilterModal, StatementDateRange } from '@/src/components/StatementFilterModal';
import { ReportService, ShopSummaryReport, PeriodActivityReport, CustomerBalanceItem, DailyTrendItem } from '@/src/services/reportService';
import { useAuthStore } from '@/src/state/authStore';
import { PDFService } from '@/src/services/pdfService';
import { formatCurrency } from '@/src/utils/formatters';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import {
  BarChart3,
  Calendar,
  Users,
  ArrowUpRight,
  ArrowDownLeft,
  Share2,
  ChevronRight,
  Sparkles,
  DollarSign,
  UserCheck,
  RefreshCw,
} from 'lucide-react-native';

export default function ReportsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const shop = useAuthStore((state) => state.shop);

  const [dateRangeKey, setDateRangeKey] = useState<StatementDateRange>('month');
  const [periodLabel, setPeriodLabel] = useState('This Month (اس ماہ کا حساب)');
  const [refreshing, setRefreshing] = useState(false);
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Data states
  const [summary, setSummary] = useState<ShopSummaryReport>({
    totalCustomers: 0,
    totalCredit: 0,
    totalReceived: 0,
    totalOutstanding: 0,
    totalAdvance: 0,
    settledCustomersCount: 0,
  });

  const [activity, setActivity] = useState<PeriodActivityReport>({
    periodCredit: 0,
    periodReceived: 0,
    periodNewCustomers: 0,
    periodTransactionsCount: 0,
    creditCount: 0,
    paymentCount: 0,
  });

  const [topDebtors, setTopDebtors] = useState<CustomerBalanceItem[]>([]);
  const [topAdvance, setTopAdvance] = useState<CustomerBalanceItem[]>([]);
  const [trends, setTrends] = useState<DailyTrendItem[]>([]);

  // Document Preview Modal
  const [previewModal, setPreviewModal] = useState<{
    visible: boolean;
    html: string;
    pdfUri: string;
    fileName: string;
  }>({ visible: false, html: '', pdfUri: '', fileName: '' });

  const calculateDateBounds = (key: StatementDateRange) => {
    const now = new Date();
    let startDate: Date;
    let endDate = new Date();

    if (key === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (key === 'week') {
      startDate = new Date();
      startDate.setDate(now.getDate() - 7);
    } else if (key === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      startDate = new Date(2020, 0, 1);
    }

    return {
      startDateStr: startDate.toISOString(),
      endDateStr: endDate.toISOString(),
    };
  };

  const loadReportData = async () => {
    if (!shop?.id) return;
    setRefreshing(true);
    try {
      const shopId = shop.id;
      const { startDateStr, endDateStr } = calculateDateBounds(dateRangeKey);

      const [sumData, actData, debtorsData, advanceData, trendData] = await Promise.all([
        ReportService.getSummary(shopId),
        ReportService.getPeriodActivity(shopId, startDateStr, endDateStr),
        ReportService.getTopDebtors(shopId, 5),
        ReportService.getTopAdvanceCustomers(shopId, 5),
        ReportService.getDailyTrendData(shopId, startDateStr, endDateStr),
      ]);

      setSummary(sumData);
      setActivity(actData);
      setTopDebtors(debtorsData);
      setTopAdvance(advanceData);
      setTrends(trendData);
    } catch (e) {
      console.error('[ReportsScreen] Error loading reports', e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [shop?.id, dateRangeKey]);

  const handleExportPDF = async () => {
    if (!shop) return;
    setIsGeneratingDoc(true);
    try {
      const isUrdu = i18n.language === 'ur';
      const doc = await PDFService.generateSummaryReport(
        shop,
        periodLabel,
        summary,
        activity,
        topDebtors,
        isUrdu
      );

      setPreviewModal({
        visible: true,
        html: doc.html,
        pdfUri: doc.uri,
        fileName: doc.fileName,
      });
    } catch (e) {
      Alert.alert('Error', 'Failed to generate PDF report.');
    } finally {
      setIsGeneratingDoc(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-gray-50 dark:bg-gray-900 p-4"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadReportData} />}
    >
      {/* Top Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <View className="w-10 h-10 bg-blue-600 rounded-xl items-center justify-center mr-3 shadow-md shadow-blue-500/20">
            <BarChart3 size={22} color="#ffffff" />
          </View>
          <View>
            <Typography variant="h2">Shop Reports & Analytics</Typography>
            <Typography variant="caption" className="text-gray-400">
              Financial Summary & Performance
            </Typography>
          </View>
        </View>

        <TouchableOpacity
          className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 px-3 py-2 rounded-xl flex-row items-center"
          onPress={() => setFilterModalVisible(true)}
        >
          <Calendar size={16} color="#2563eb" className="mr-1" />
          <Typography variant="caption" className="font-bold text-blue-600 dark:text-blue-400">
            Filter
          </Typography>
        </TouchableOpacity>
      </View>

      {/* Selected Period Header Badge */}
      <View className="bg-blue-600 p-3.5 rounded-2xl mb-4 shadow-sm flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Sparkles size={18} color="#ffffff" className="mr-2" />
          <Typography variant="caption" className="text-white font-bold uppercase tracking-wider">
            Period: {periodLabel}
          </Typography>
        </View>
        <TouchableOpacity onPress={handleExportPDF} disabled={isGeneratingDoc}>
          <View className="bg-white/20 px-3 py-1 rounded-lg flex-row items-center">
            <Share2 size={14} color="#ffffff" className="mr-1" />
            <Typography variant="caption" className="text-white font-bold">
              Export PDF
            </Typography>
          </View>
        </TouchableOpacity>
      </View>

      {/* Summary Cards Grid (All-Time Totals) */}
      <Typography variant="caption" className="text-gray-400 uppercase font-bold mb-2">
        Financial Overview (Overall)
      </Typography>

      <View className="flex-row gap-3 mb-3">
        <Card className="flex-1 p-4 bg-white dark:bg-gray-800 border-l-4 border-l-blue-600">
          <Typography variant="caption" className="text-gray-400 font-bold uppercase">
            Total Customers
          </Typography>
          <Typography variant="h2" className="text-2xl font-black text-gray-900 dark:text-gray-100 mt-1">
            {summary.totalCustomers}
          </Typography>
          <Typography variant="caption" className="text-emerald-600 font-semibold mt-1">
            {summary.settledCustomersCount} Settled (0 Bal)
          </Typography>
        </Card>

        <Card className="flex-1 p-4 bg-white dark:bg-gray-800 border-l-4 border-l-red-500">
          <Typography variant="caption" className="text-gray-400 font-bold uppercase">
            Total Outstanding
          </Typography>
          <Typography variant="h2" className="text-xl font-black text-red-600 dark:text-red-400 mt-1">
            {formatCurrency(summary.totalOutstanding)}
          </Typography>
          <Typography variant="caption" className="text-red-400 font-semibold mt-1">
            Receivable Debt
          </Typography>
        </Card>
      </View>

      <View className="flex-row gap-3 mb-6">
        <Card className="flex-1 p-4 bg-white dark:bg-gray-800 border-l-4 border-l-emerald-500">
          <Typography variant="caption" className="text-gray-400 font-bold uppercase">
            Total Received
          </Typography>
          <Typography variant="h2" className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(summary.totalReceived)}
          </Typography>
        </Card>

        <Card className="flex-1 p-4 bg-white dark:bg-gray-800 border-l-4 border-l-indigo-500">
          <Typography variant="caption" className="text-gray-400 font-bold uppercase">
            Total Customer Advance
          </Typography>
          <Typography variant="h2" className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {formatCurrency(summary.totalAdvance)}
          </Typography>
        </Card>
      </View>

      {/* Selected Period Activity Card */}
      <Card className="p-5 mb-6 bg-white dark:bg-gray-800">
        <Typography variant="h3" className="mb-4 text-blue-600 border-b border-gray-100 dark:border-gray-700 pb-2">
          Period Activity Breakdown
        </Typography>

        <View className="grid grid-cols-2 gap-4">
          <View className="flex-row items-center mb-3">
            <View className="w-9 h-9 bg-red-100 dark:bg-red-900/40 rounded-xl items-center justify-center mr-3">
              <ArrowUpRight size={20} color="#ef4444" />
            </View>
            <View>
              <Typography variant="caption" className="text-gray-400 font-medium">
                Period Credit
              </Typography>
              <Typography variant="body" className="font-extrabold text-red-600 text-base">
                {formatCurrency(activity.periodCredit)}
              </Typography>
            </View>
          </View>

          <View className="flex-row items-center mb-3">
            <View className="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl items-center justify-center mr-3">
              <ArrowDownLeft size={20} color="#16a34a" />
            </View>
            <View>
              <Typography variant="caption" className="text-gray-400 font-medium">
                Period Received
              </Typography>
              <Typography variant="body" className="font-extrabold text-emerald-600 text-base">
                {formatCurrency(activity.periodReceived)}
              </Typography>
            </View>
          </View>
        </View>

        <View className="flex-row justify-between border-t border-gray-100 dark:border-gray-700 pt-3 mt-2">
          <View className="items-center">
            <Typography variant="caption" className="text-gray-400 font-medium">
              New Customers
            </Typography>
            <Typography variant="body" className="font-bold text-gray-900 dark:text-gray-100">
              +{activity.periodNewCustomers}
            </Typography>
          </View>

          <View className="w-px bg-gray-200 dark:bg-gray-700" />

          <View className="items-center">
            <Typography variant="caption" className="text-gray-400 font-medium">
              Total Transactions
            </Typography>
            <Typography variant="body" className="font-bold text-gray-900 dark:text-gray-100">
              {activity.periodTransactionsCount} ({activity.creditCount} Credit / {activity.paymentCount} Paid)
            </Typography>
          </View>
        </View>
      </Card>

      {/* Top Debtors List */}
      <View className="flex-row items-center justify-between mb-3">
        <Typography variant="h3">Top Outstanding Debtors</Typography>
        <TouchableOpacity onPress={() => router.push('/(app)/customers')}>
          <Typography variant="caption" className="text-blue-600 font-bold">
            View All
          </Typography>
        </TouchableOpacity>
      </View>

      <Card className="p-4 mb-6">
        {topDebtors.length === 0 ? (
          <Typography variant="caption" className="text-gray-400 text-center py-4">
            No active customer debts recorded.
          </Typography>
        ) : (
          topDebtors.map((d, index) => (
            <TouchableOpacity
              key={d.id}
              className={`flex-row items-center justify-between py-3 ${
                index < topDebtors.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
              }`}
              onPress={() => router.push(`/(app)/customer/${d.id}` as any)}
            >
              <View className="flex-row items-center flex-1 mr-2">
                <View className="w-7 h-7 bg-red-100 text-red-600 rounded-full items-center justify-center font-bold text-xs mr-3">
                  <Typography variant="caption" className="font-bold text-red-600">
                    {index + 1}
                  </Typography>
                </View>
                <View className="flex-1">
                  <Typography variant="body" className="font-bold text-gray-900 dark:text-gray-100" numberOfLines={1}>
                    {d.name}
                  </Typography>
                  {d.phone ? (
                    <Typography variant="caption" className="text-gray-400">
                      {d.phone}
                    </Typography>
                  ) : null}
                </View>
              </View>

              <View className="items-end flex-row items-center">
                <Typography variant="body" className="font-extrabold text-red-600 mr-2">
                  {formatCurrency(d.balance)}
                </Typography>
                <ChevronRight size={16} color="#9ca3af" />
              </View>
            </TouchableOpacity>
          ))
        )}
      </Card>

      {/* Top Advance Customers */}
      {topAdvance.length > 0 && (
        <>
          <Typography variant="h3" className="mb-3">
            Customers with Advance Balance
          </Typography>
          <Card className="p-4 mb-6">
            {topAdvance.map((a, index) => (
              <TouchableOpacity
                key={a.id}
                className={`flex-row items-center justify-between py-3 ${
                  index < topAdvance.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
                }`}
                onPress={() => router.push(`/(app)/customer/${a.id}` as any)}
              >
                <View className="flex-row items-center flex-1 mr-2">
                  <View className="w-7 h-7 bg-indigo-100 rounded-full items-center justify-center mr-3">
                    <Typography variant="caption" className="font-bold text-indigo-600">
                      {index + 1}
                    </Typography>
                  </View>
                  <Typography variant="body" className="font-bold text-gray-900 dark:text-gray-100 flex-1" numberOfLines={1}>
                    {a.name}
                  </Typography>
                </View>

                <Typography variant="body" className="font-extrabold text-indigo-600">
                  Advance: {formatCurrency(a.balance)}
                </Typography>
              </TouchableOpacity>
            ))}
          </Card>
        </>
      )}

      {/* Primary Action Button */}
      <Button
        title="📄 Export PDF Financial Report"
        className="mb-8 py-3.5 bg-blue-600 active:bg-blue-700"
        isLoading={isGeneratingDoc}
        onPress={handleExportPDF}
      />

      {/* Date Range Selector Modal */}
      <StatementFilterModal
        visible={filterModalVisible}
        onSelectRange={(range, label) => {
          setDateRangeKey(range);
          setPeriodLabel(label);
          setFilterModalVisible(false);
        }}
        onClose={() => setFilterModalVisible(false)}
      />

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        visible={previewModal.visible}
        htmlContent={previewModal.html}
        pdfUri={previewModal.pdfUri}
        fileName={previewModal.fileName}
        title="Financial Summary Report"
        onClose={() => setPreviewModal({ visible: false, html: '', pdfUri: '', fileName: '' })}
      />
    </ScrollView>
  );
}
