import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// Auto-detect PC IP address only during local dev (__DEV__) or use Live Vercel Backend in Release APK
const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Production Live Vercel Backend URL for Standalone Release APK Builds
  if (!__DEV__) {
    return 'https://khata-backend-lqos.vercel.app/api';
  }

  // Extract host IP address from Expo Metro packager during local dev (__DEV__)
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:5000/api`;
    }
  }

  // Default Production Live Vercel Backend URL
  return 'https://khata-backend-lqos.vercel.app/api';
};

export const API_BASE_URL = getBaseUrl();

console.log('[API Client] Connecting to backend at:', API_BASE_URL);

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error attaching auth token', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized session expiry
    }
    return Promise.reject(error);
  }
);
