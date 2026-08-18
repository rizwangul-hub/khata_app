import React from 'react';
import { View, ScrollView } from 'react-native';
import { Typography } from '@/src/components/Typography';
import { Card } from '@/src/components/Card';
import { useTranslation } from 'react-i18next';
import { Info, ShieldCheck, Award } from 'lucide-react-native';

export default function AboutScreen() {
  const { i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900 p-4">
      <View className="items-center my-6">
        <View className="w-20 h-20 bg-blue-100 dark:bg-blue-900/40 rounded-full items-center justify-center mb-3">
          <Info size={40} color="#2563eb" />
        </View>
        <Typography variant="h2" className="text-center">
          Universal Shop Khata
        </Typography>
        <Typography variant="caption" className="text-blue-600 font-bold text-center mt-1">
          Version 1.0.0 (Production Release)
        </Typography>
      </View>

      <Card className="p-4 mb-4 bg-white dark:bg-gray-800 space-y-3">
        <Typography variant="h3" className="text-blue-600 border-b border-gray-100 dark:border-gray-700 pb-2">
          {isUrdu ? 'ایپ کے بارے میں' : 'About Application'}
        </Typography>

        <Typography variant="caption" className="text-gray-600 dark:text-gray-300 leading-5">
          {isUrdu
            ? 'یونیورسل شاپ کھاتا پاکستان کے تمام دکانداروں کے لیے ایک جدید، محفوظ اور آف لائن پر مبنی کھاتا مینجمنٹ سافٹ ویئر ہے۔'
            : 'Universal Shop Khata is a high-performance, offline-first digital ledger SaaS built for shopkeepers.'}
        </Typography>
      </Card>

      <Card className="p-4 mb-6 bg-white dark:bg-gray-800 space-y-3">
        <View className="flex-row items-center mb-2">
          <ShieldCheck size={20} color="#16a34a" className="mr-2" />
          <Typography variant="h3">{isUrdu ? 'پرائیویسی اور سیکیورٹی' : 'Privacy & Security Policy'}</Typography>
        </View>

        <Typography variant="caption" className="text-gray-500 leading-5">
          Your shop financial data is encrypted and isolated per shop license. Passwords and sensitive financial logs are never shared or stored in plain text.
        </Typography>
      </Card>

      <View className="items-center my-4">
        <Typography variant="caption" className="text-gray-400">
          © 2026 Universal Shop Khata SaaS. All rights reserved.
        </Typography>
      </View>
    </ScrollView>
  );
}
