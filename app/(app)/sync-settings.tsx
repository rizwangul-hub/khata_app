import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Typography } from '@/src/components/Typography';
import { Card } from '@/src/components/Card';
import { Button } from '@/src/components/Button';
import { SyncService } from '@/src/services/syncService';
import { SyncQueueService } from '@/src/services/syncQueueService';
import { initDB } from '@/src/database/db';
import { useAuthStore } from '@/src/state/authStore';
import { formatDateTime } from '@/src/utils/formatters';
import { useTranslation } from 'react-i18next';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Database,
  ArrowUpRight,
  ShieldCheck,
  Smartphone,
} from 'lucide-react-native';

export default function SyncSettingsScreen() {
  const { t, i18n } = useTranslation();
  const shop = useAuthStore((state) => state.shop);

  const [pendingCount, setPendingCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [lastSyncText, setLastSyncText] = useState('Never');
  const [isSyncing, setIsSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isUrdu = i18n.language === 'ur';

  const loadSyncStatus = useCallback(async () => {
    setRefreshing(true);
    try {
      const db = await initDB();
      const pCount = await SyncQueueService.getPendingCount();
      const fCount = await SyncQueueService.getFailedCount();

      setPendingCount(pCount);
      setFailedCount(fCount);

      const meta = await db.getFirstAsync<any>(`SELECT lastSyncAt FROM sync_metadata LIMIT 1;`);
      if (meta?.lastSyncAt) {
        setLastSyncText(formatDateTime(meta.lastSyncAt, isUrdu).dateFormatted);
      }
    } catch (e) {
      console.error('[SyncSettings] Error loading sync status', e);
    } finally {
      setRefreshing(false);
    }
  }, [isUrdu]);

  useEffect(() => {
    loadSyncStatus();
  }, [loadSyncStatus]);

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      const ok = await SyncService.fullSync();
      await loadSyncStatus();
      if (ok) {
        Alert.alert(isUrdu ? 'کامیابی' : 'Success', isUrdu ? 'سنکرونائزیشن مکمل ہو گئی ہے۔' : 'Sync completed successfully.');
      } else {
        Alert.alert(isUrdu ? 'انتباہ' : 'Warning', isUrdu ? 'کچھ ڈیٹا سنکرونائز نہیں ہو سکا۔' : 'Some data could not be synchronized.');
      }
    } catch (e) {
      Alert.alert('Error', 'Sync process failed.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRetryFailed = async () => {
    await SyncQueueService.retryAllFailed();
    await handleSyncNow();
  };

  return (
    <ScrollView
      className="flex-1 bg-gray-50 dark:bg-gray-900 p-4"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadSyncStatus} />}
    >
      {/* Top Header Card */}
      <Card className="p-5 mb-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <View className="w-10 h-10 bg-white/20 rounded-xl items-center justify-center mr-3">
              <Cloud size={24} color="#ffffff" />
            </View>
            <View>
              <Typography variant="h2" className="text-white">
                {isUrdu ? 'سنکرونائزیشن اور بیک اپ' : 'Sync & Cloud Backup'}
              </Typography>
              <Typography variant="caption" className="text-blue-200">
                Universal Shop Khata Cloud Storage
              </Typography>
            </View>
          </View>
        </View>

        <Typography variant="caption" className="text-blue-100 font-medium leading-5">
          {isUrdu
            ? 'آپ کی دکان کا کھاتا آف لائن محفوظ رہتا ہے اور انٹرنیٹ کنیکشن ملتے ہی کلاؤڈ کے ساتھ سنکرونائز ہو جاتا ہے۔'
            : 'Your shop ledger works 100% offline. Local changes automatically sync with cloud MongoDB backup when connected.'}
        </Typography>
      </Card>

      {/* Sync Status Grid */}
      <View className="flex-row gap-3 mb-4">
        <Card className="flex-1 p-4 bg-white dark:bg-gray-800 border-l-4 border-l-amber-500">
          <Typography variant="caption" className="text-gray-400 font-bold uppercase">
            {isUrdu ? 'زیر التوا تبدیلیاں' : 'Pending Changes'}
          </Typography>
          <Typography variant="h2" className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {pendingCount}
          </Typography>
          <Typography variant="caption" className="text-gray-400 font-medium mt-1">
            {pendingCount > 0 ? (isUrdu ? 'سنکرونائزیشن کے انتظار میں' : 'Waiting to sync') : (isUrdu ? 'سائینسی ہو چکا' : 'All synced')}
          </Typography>
        </Card>

        <Card className="flex-1 p-4 bg-white dark:bg-gray-800 border-l-4 border-l-blue-600">
          <Typography variant="caption" className="text-gray-400 font-bold uppercase">
            {isUrdu ? 'آخری سنکرونائزیشن' : 'Last Sync'}
          </Typography>
          <Typography variant="body" className="text-sm font-extrabold text-gray-900 dark:text-gray-100 mt-2" numberOfLines={1}>
            {lastSyncText}
          </Typography>
        </Card>
      </View>

      {/* Connection & Error Status */}
      <Card className="p-4 mb-6 bg-white dark:bg-gray-800 space-y-3">
        <View className="flex-row items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
          <View className="flex-row items-center">
            <ShieldCheck size={20} color="#16a34a" className="mr-2.5" />
            <Typography variant="body" className="font-bold text-gray-900 dark:text-gray-100">
              {isUrdu ? 'کلاؤڈ سیکیورٹی اسٹیٹس' : 'Cloud Security & Tenant Isolation'}
            </Typography>
          </View>
          <Typography variant="caption" className="text-emerald-600 font-bold">
            Protected
          </Typography>
        </View>

        {failedCount > 0 && (
          <View className="flex-row items-center justify-between bg-red-50 dark:bg-red-950/40 p-3 rounded-xl border border-red-200 dark:border-red-800">
            <View className="flex-row items-center flex-1 mr-2">
              <AlertTriangle size={18} color="#ef4444" className="mr-2" />
              <Typography variant="caption" className="text-red-700 dark:text-red-300 font-bold">
                {failedCount} {isUrdu ? 'تبدیلیاں کلاؤڈ پر منتقل نہ ہو سکیں' : 'failed operations'}
              </Typography>
            </View>
            <TouchableOpacity className="bg-red-600 px-3 py-1 rounded-lg" onPress={handleRetryFailed}>
              <Typography variant="caption" className="text-white font-bold">
                Retry
              </Typography>
            </TouchableOpacity>
          </View>
        )}
      </Card>

      {/* Manual Sync Actions */}
      <Button
        title={`🔄 ${isUrdu ? 'ابھی سنکرونائز کریں' : 'Sync Now'}`}
        className="mb-3 py-4 bg-blue-600 active:bg-blue-700"
        isLoading={isSyncing}
        onPress={handleSyncNow}
      />

      {failedCount > 0 && (
        <Button
          title={`⚠️ ${isUrdu ? 'دوبارہ کوشش کریں' : 'Retry Failed Sync'}`}
          variant="secondary"
          className="mb-6 py-3"
          onPress={handleRetryFailed}
        />
      )}
    </ScrollView>
  );
}
