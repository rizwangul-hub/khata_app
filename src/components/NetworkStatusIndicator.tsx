import React from 'react';
import { View } from 'react-native';
import { Typography } from './Typography';
import { useAppStore } from '../state/appStore';
import { useTranslation } from 'react-i18next';
import { WifiOff, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react-native';

export const NetworkStatusIndicator: React.FC = () => {
  const syncStatus = useAppStore(state => state.syncStatus);
  const { t } = useTranslation();

  if (syncStatus === 'online' || syncStatus === 'synced') return null; // Don't show anything normally if connected

  let bgColor = 'bg-red-500';
  let icon = <WifiOff size={14} color="#fff" />;
  let textKey = 'status.offline';

  if (syncStatus === 'syncing') {
    bgColor = 'bg-blue-500';
    icon = <RefreshCw size={14} color="#fff" />;
    textKey = 'status.syncing';
  } else if (syncStatus === 'syncFailed') {
    bgColor = 'bg-orange-500';
    icon = <AlertCircle size={14} color="#fff" />;
    textKey = 'status.syncFailed';
  }

  return (
    <View className={`w-full ${bgColor} py-1 px-4 flex-row items-center justify-center`}>
      {icon}
      <Typography variant="caption" className="text-white ml-2">
        {t(textKey)}
      </Typography>
    </View>
  );
};
