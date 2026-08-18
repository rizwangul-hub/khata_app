import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useAppStore } from '../state/appStore';
import { SyncService } from '../services/syncService';

export const useNetworkStatus = () => {
  const setOfflineStatus = useAppStore(state => state.setOfflineStatus);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const isOffline = !(state.isConnected && state.isInternetReachable !== false);
      setOfflineStatus(isOffline);

      // Trigger automatic sync when transitioning to Online
      if (!isOffline) {
        SyncService.fullSync();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [setOfflineStatus]);
};
