import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Typography } from '@/src/components/Typography';
import { Card } from '@/src/components/Card';
import { Button } from '@/src/components/Button';
import { SyncService } from '@/src/services/syncService';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { CloudDownload, CheckCircle2, AlertCircle } from 'lucide-react-native';

export default function RestoreScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const startRestore = async () => {
    setStatus('loading');
    setErrorMessage('');
    try {
      const success = await SyncService.bootstrapNewDevice();
      if (success) {
        setStatus('success');
        setTimeout(() => {
          router.replace('/(app)' as any);
        }, 1500);
      } else {
        setStatus('error');
        setErrorMessage('Failed to restore shop data from server.');
      }
    } catch (e: any) {
      setStatus('error');
      setErrorMessage(e?.message || 'Network error during restore.');
    }
  };

  useEffect(() => {
    startRestore();
  }, []);

  return (
    <View className="flex-1 justify-center items-center p-6 bg-slate-50 dark:bg-slate-900">
      <Card className="p-6 items-center w-full max-w-sm">
        {status === 'loading' && (
          <>
            <View className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full items-center justify-center mb-4">
              <CloudDownload size={36} color="#2563eb" />
            </View>
            <Typography variant="h2" className="text-center mb-2">
              {t('sync.settingUpShop')}
            </Typography>
            <Typography variant="body" className="text-gray-500 text-center mb-6">
              {t('sync.downloadingData')}
            </Typography>
            <ActivityIndicator size="large" color="#2563eb" className="my-2" />
          </>
        )}

        {status === 'success' && (
          <>
            <View className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full items-center justify-center mb-4">
              <CheckCircle2 size={36} color="#16a34a" />
            </View>
            <Typography variant="h2" className="text-green-600 text-center mb-2">
              {t('sync.shopIsReady')}
            </Typography>
            <Typography variant="body" className="text-gray-500 text-center">
              All your shop data has been restored successfully.
            </Typography>
          </>
        )}

        {status === 'error' && (
          <>
            <View className="w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-full items-center justify-center mb-4">
              <AlertCircle size={36} color="#ef4444" />
            </View>
            <Typography variant="h2" className="text-red-600 text-center mb-2">
              Restore Failed
            </Typography>
            <Typography variant="body" className="text-gray-500 text-center mb-6">
              {errorMessage}
            </Typography>
            <Button
              title="Try Again"
              onPress={startRestore}
              className="w-full"
            />
          </>
        )}
      </Card>
    </View>
  );
}
