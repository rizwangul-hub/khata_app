import React from 'react';
import { View, ScrollView } from 'react-native';
import { Typography } from '@/src/components/Typography';
import { Card } from '@/src/components/Card';
import { useTranslation } from 'react-i18next';

export default function HowItWorksScreen() {
  const { t, i18n } = useTranslation();

  const isUrdu = i18n.language === 'ur';

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900 p-4">
      <Typography variant="h2" className="mb-6 text-center text-blue-600">
        {t('common.howItWorks')}
      </Typography>

      <Card className="mb-4">
        <Typography variant="h3">1. Create Customers</Typography>
        <Typography variant="body" className="text-gray-600 dark:text-gray-400">
          Easily add new customers with their name and phone number.
        </Typography>
      </Card>

      <Card className="mb-4">
        <Typography variant="h3">2. Add Credit</Typography>
        <Typography variant="body" className="text-gray-600 dark:text-gray-400">
          Record when a customer takes items on credit.
        </Typography>
      </Card>

      <Card className="mb-4">
        <Typography variant="h3">3. Record Payments</Typography>
        <Typography variant="body" className="text-gray-600 dark:text-gray-400">
          Log when a customer pays off their debt.
        </Typography>
      </Card>

      <Card className="mb-4">
        <Typography variant="h3">4. Work Offline</Typography>
        <Typography variant="body" className="text-gray-600 dark:text-gray-400">
          No internet? No problem. Use the app fully offline and sync later.
        </Typography>
      </Card>

      <View className="mt-6 mb-8 p-4 bg-orange-50 border border-orange-200 dark:bg-orange-900/20 dark:border-orange-800 rounded-xl">
        <Typography variant="caption" className="text-orange-800 dark:text-orange-300 font-bold mb-2">
          SECURITY WARNING
        </Typography>
        <Typography variant="body" className="text-orange-700 dark:text-orange-400">
          {isUrdu 
            ? "اپنی لائسنس آئی ڈی اور پاس ورڈ کسی کے ساتھ شیئر نہ کریں۔ آپ کی معلومات کے ذریعے آپ کے دکان کا ڈیٹا دیکھا جا سکتا ہے۔"
            : "Never share your License ID and Password with anyone. Your credentials provide access to your shop data."
          }
        </Typography>
      </View>
    </ScrollView>
  );
}
