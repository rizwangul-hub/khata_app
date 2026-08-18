import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Typography } from '@/src/components/Typography';
import { Card } from '@/src/components/Card';
import { StatusBadge } from '@/src/components/StatusBadge';
import { WhatsAppSupport } from '@/src/components/WhatsAppSupport';
import { useAuthStore } from '@/src/state/authStore';
import { useTranslation } from 'react-i18next';
import * as Clipboard from 'expo-clipboard';
import { Calendar, ShieldAlert, Award, Clock, Key, Copy, Check, Lock } from 'lucide-react-native';

export default function SubscriptionScreen() {
  const { t, i18n } = useTranslation();
  const subscription = useAuthStore((state) => state.subscription);
  const shop = useAuthStore((state) => state.shop);

  const [copiedLicense, setCopiedLicense] = useState(false);
  const isUrdu = i18n.language === 'ur';

  if (!subscription || !shop) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return dateStr;
    }
  };

  const copyLicense = async () => {
    await Clipboard.setStringAsync(shop.licenseId);
    setCopiedLicense(true);
    setTimeout(() => setCopiedLicense(false), 2000);
  };

  const isWarningVisible = subscription.daysRemaining <= 7 && subscription.status === 'active';

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900 p-4">
      <View className="items-center my-6">
        <View className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full items-center justify-center mb-3">
          <Award size={36} color="#16a34a" />
        </View>
        <Typography variant="h2" className="text-center">
          {isUrdu ? 'میرا پلان اور لائسنس' : 'My Plan & License'}
        </Typography>
      </View>

      {/* License Card */}
      <Card className="mb-4 p-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
        <Typography variant="caption" className="text-blue-200 uppercase font-bold tracking-widest mb-1">
          {isUrdu ? 'لائسنس آئی ڈی' : 'License Identification'}
        </Typography>

        <View className="flex-row items-center justify-between mt-1 mb-2">
          <Typography variant="h1" className="text-white text-2xl font-black tracking-wider">
            {shop.licenseId}
          </Typography>

          <TouchableOpacity
            className="bg-white/20 px-3 py-1.5 rounded-lg flex-row items-center"
            onPress={copyLicense}
          >
            {copiedLicense ? (
              <>
                <Check size={16} color="#4ade80" />
                <Typography variant="caption" className="text-green-300 font-bold ml-1">
                  {t('common.copied')}
                </Typography>
              </>
            ) : (
              <>
                <Copy size={16} color="#ffffff" />
                <Typography variant="caption" className="text-white font-bold ml-1">
                  {t('common.copy')}
                </Typography>
              </>
            )}
          </TouchableOpacity>
        </View>
      </Card>

      {/* License Security Warning */}
      <Card className="mb-4 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800">
        <View className="flex-row items-start">
          <Lock size={20} color="#d97706" className="mr-2.5 mt-0.5" />
          <View className="flex-1">
            <Typography variant="body" className="font-extrabold text-amber-900 dark:text-amber-300 mb-1">
              {isUrdu ? 'سیکیورٹی کی ہدایت' : 'Security Notice'}
            </Typography>
            <Typography variant="caption" className="text-amber-800 dark:text-amber-400 font-medium leading-5">
              {isUrdu
                ? 'اپنی لائسنس آئی ڈی اور پاس ورڈ کسی کے ساتھ شیئر نہ کریں۔ اگر کوئی آپ کی معلومات حاصل کر لے تو وہ آپ کے گاہکوں اور حساب تک رسائی حاصل کر سکتا ہے۔'
                : 'Do not share your License ID and Password with anyone. Keep your shop credentials protected at all times.'}
            </Typography>
          </View>
        </View>
      </Card>

      {isWarningVisible && (
        <Card className="mb-4 bg-orange-50 border border-orange-200 dark:bg-orange-900/20 dark:border-orange-800">
          <View className="flex-row items-center">
            <ShieldAlert size={24} color="#f97316" className="mr-3" />
            <View className="flex-1">
              <Typography variant="h3" className="text-orange-800 dark:text-orange-300">
                Subscription Warning
              </Typography>
              <Typography variant="body" className="text-orange-700 dark:text-orange-400 mt-1">
                {t('subscription.expiryWarning', { count: subscription.daysRemaining })}
              </Typography>
            </View>
          </View>
        </Card>
      )}

      <Card className="mb-4 p-4">
        <Typography variant="h3" className="mb-4 text-blue-600 border-b border-gray-100 dark:border-gray-700 pb-2">
          {t('subscription.currentPlan')}
        </Typography>

        <View className="flex-row items-center justify-between mb-4">
          <Typography variant="body" className="text-gray-500">
            {t('subscription.status')}
          </Typography>
          <StatusBadge status={subscription.status} label={subscription.status.toUpperCase()} />
        </View>

        <View className="flex-row items-center justify-between mb-4">
          <Typography variant="body" className="text-gray-500">
            {t('subscription.currentPlan')}
          </Typography>
          <Typography variant="body" className="font-bold capitalize text-blue-600">
            {subscription.planType} Plan
          </Typography>
        </View>

        <View className="flex-row items-center justify-between mb-4">
          <Typography variant="body" className="text-gray-500">
            {t('subscription.daysRemaining')}
          </Typography>
          <View className="flex-row items-center">
            <Clock size={16} color="#2563eb" className="mr-1" />
            <Typography variant="body" className="font-bold text-green-600">
              {subscription.status === 'expired'
                ? t('subscription.expired')
                : t('subscription.daysRemaining', { count: subscription.daysRemaining })}
            </Typography>
          </View>
        </View>
      </Card>

      <Card className="mb-6 p-4">
        <Typography variant="h3" className="mb-4 text-blue-600 border-b border-gray-100 dark:border-gray-700 pb-2">
          Timeline
        </Typography>

        <View className="flex-row items-center mb-4">
          <Calendar size={20} color="#6b7280" className="mr-3" />
          <View className="flex-1">
            <Typography variant="caption" className="text-gray-400 uppercase font-medium">
              {t('subscription.startDate')}
            </Typography>
            <Typography variant="body" className="font-semibold">
              {formatDate(subscription.startDate)}
            </Typography>
          </View>
        </View>

        <View className="flex-row items-center mb-2">
          <Calendar size={20} color="#ef4444" className="mr-3" />
          <View className="flex-1">
            <Typography variant="caption" className="text-gray-400 uppercase font-medium">
              {t('subscription.expiryDate')}
            </Typography>
            <Typography variant="body" className="font-semibold text-red-600">
              {formatDate(subscription.expiryDate)}
            </Typography>
          </View>
        </View>
      </Card>

      <Card className="mb-8 p-4">
        <Typography variant="h3" className="mb-2">Need Plan Renewal?</Typography>
        <Typography variant="body" className="text-gray-500 mb-4">
          Contact administrator on WhatsApp to extend or upgrade your SaaS plan.
        </Typography>
        <WhatsAppSupport message={`Hello Admin, I need assistance/renewal for my shop plan (License: ${shop.licenseId}).`} />
      </Card>
    </ScrollView>
  );
}
