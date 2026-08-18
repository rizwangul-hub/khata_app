import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { Typography } from '@/src/components/Typography';
import { InputField } from '@/src/components/InputField';
import { ErrorMessage } from '@/src/components/ErrorMessage';
import { WhatsAppSupport } from '@/src/components/WhatsAppSupport';
import { useAuthStore } from '@/src/state/authStore';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const [licenseId, setLicenseId] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const { loginApi, isLoading, error, clearError } = useAuthStore();

  const getLocalizedErrorMessage = (errorCode: string | null) => {
    if (validationError) return validationError;
    if (!errorCode) return null;

    switch (errorCode) {
      case 'INVALID_CREDENTIALS':
        return t('auth.invalidCredentials');
      case 'SUBSCRIPTION_EXPIRED':
        return t('auth.planExpired');
      case 'ACCOUNT_SUSPENDED':
        return t('auth.accountSuspended');
      case 'NETWORK_ERROR':
        return t('auth.networkUnavailable');
      default:
        return t('auth.serverUnavailable');
    }
  };

  const handleLogin = async () => {
    setValidationError(null);
    clearError();

    if (!licenseId.trim()) {
      setValidationError(t('auth.enterLicenseId'));
      return;
    }

    if (!password.trim()) {
      setValidationError(t('auth.enterPassword'));
      return;
    }

    const result = await loginApi(licenseId.trim(), password.trim());
    if (!result.success && result.message && !['INVALID_CREDENTIALS', 'SUBSCRIPTION_EXPIRED', 'ACCOUNT_SUSPENDED', 'NETWORK_ERROR'].includes(result.errorCode || '')) {
      setValidationError(result.message);
    }
  };

  const errorMessage = getLocalizedErrorMessage(error);

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-gray-50 dark:bg-gray-900">
      <View className="flex-1 justify-center px-6 py-12">
        <View className="items-center mb-8">
          <Typography variant="h1" className="text-blue-600">Khata</Typography>
          <Typography variant="body" className="text-gray-500 text-center">
            {t('auth.tagline')}
          </Typography>
        </View>

        <Card className="p-6 mb-6">
          <Typography variant="h3" className="mb-6 text-center">
            {t('common.login')}
          </Typography>

          {errorMessage && (
            <View className="mb-4">
              <ErrorMessage message={errorMessage} />
            </View>
          )}

          <InputField
            label={t('auth.licenseId')}
            value={licenseId}
            onChangeText={(val) => {
              setLicenseId(val);
              if (validationError) setValidationError(null);
              if (error) clearError();
            }}
            placeholder="e.g. KHATA-8F4K29"
            autoCapitalize="characters"
          />

          <InputField
            label={t('auth.password')}
            value={password}
            onChangeText={(val) => {
              setPassword(val);
              if (validationError) setValidationError(null);
              if (error) clearError();
            }}
            placeholder="********"
            isPassword
          />

          <Button
            title={t('common.login')}
            onPress={handleLogin}
            isLoading={isLoading}
            className="mt-2"
          />
        </Card>

        <Button
          title={t('common.howItWorks')}
          variant="outline"
          className="mb-4"
          onPress={() => router.push('/(auth)/how-it-works' as any)}
        />

        <WhatsAppSupport message="Hello Admin, I need help logging into my Universal Shop Khata account." />
      </View>
    </ScrollView>
  );
}
