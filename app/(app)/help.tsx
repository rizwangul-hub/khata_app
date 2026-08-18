import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Typography } from '@/src/components/Typography';
import { Card } from '@/src/components/Card';
import { WhatsAppSupport } from '@/src/components/WhatsAppSupport';
import { useTranslation } from 'react-i18next';
import { HelpCircle, ChevronDown, ChevronUp, BookOpen, ShieldAlert, PhoneCall } from 'lucide-react-native';

export default function HelpScreen() {
  const { i18n } = useTranslation();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const isUrdu = i18n.language === 'ur';

  const faqs = [
    {
      qEn: 'What happens if internet stops working?',
      qUr: 'اگر انٹرنیٹ بند ہو جائے تو کیا ہوگا؟',
      aEn: 'Universal Shop Khata works 100% offline. You can create customers, add credit/payments, and generate receipts without internet. Changes sync automatically when internet returns.',
      aUr: 'یونیورسل شاپ کھاتا 100% آف لائن کام کرتا ہے۔ آپ بغیر انٹرنیٹ کے گاہک شامل کر سکتے ہیں، کھاتا چلا سکتے ہیں اور بل بنا سکتے ہیں۔ انٹرنیٹ ملتے ہی ڈیٹا خود بخود سنکرونائز ہو جائے گا۔',
    },
    {
      qEn: 'How do I use my shop account on a new phone?',
      qUr: 'نئے فون پر کھاتا کیسے منتقل کریں؟',
      aEn: 'Install Universal Shop Khata on the new device, enter your License ID and Password. The app will automatically restore all your customers and transaction history.',
      aUr: 'نئے فون پر ایپ ڈاؤن لوڈ کریں، اپنی لائسنس آئی ڈی اور پاس ورڈ درج کریں۔ تمام گاہکوں اور ہسٹری کا بیک اپ خود بخود ڈاؤن لوڈ ہو جائے گا۔',
    },
    {
      qEn: 'What should I do if I lose my phone?',
      qUr: 'اگر موبائل گم ہو جائے تو کیا کریں؟',
      aEn: '1. Log into your account on a new phone.\n2. Change your password immediately.\n3. Open Logged-in Devices in Settings and log out the lost device.',
      aUr: '1. نئے فون پر لاگ اِن کریں۔\n2. فوری طور پر پاس ورڈ تبدیل کریں۔\n3. ترتیبات میں جا کر پرانی ڈیوائس کو لاگ آؤٹ کر دیں۔',
    },
    {
      qEn: 'What happens if my subscription plan expires?',
      qUr: 'اگر سبسکریپشن پلان ختم ہو جائے تو کیا ہوگا؟',
      aEn: 'Your business data remains 100% safe in cloud backup. Contact the administrator on WhatsApp to reactivate your plan.',
      aUr: 'آپ کا تمام ڈیٹا کلاؤڈ پر محفوظ رہے گا۔ دوبارہ فعال کروانے کے لیے واٹس ایپ پر ایڈمن سے رابطہ کریں۔',
    },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900 p-4">
      <View className="items-center my-6">
        <View className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full items-center justify-center mb-3">
          <HelpCircle size={36} color="#2563eb" />
        </View>
        <Typography variant="h2" className="text-center">
          {isUrdu ? 'مدد اور سپورٹ' : 'Help & Support'}
        </Typography>
      </View>

      {/* WhatsApp Support Direct Card */}
      <Card className="p-4 mb-6 bg-white dark:bg-gray-800">
        <Typography variant="h3" className="mb-2 text-blue-600">
          {isUrdu ? 'ایڈمن سپورٹ' : 'Admin Support Hotline'}
        </Typography>
        <Typography variant="body" className="text-gray-500 mb-4">
          {isUrdu ? 'کسی بھی مدد کے لیے 24/7 ایڈمن سے واٹس ایپ پر رابطہ کریں۔' : 'Contact SaaS Administrator directly on WhatsApp for immediate support.'}
        </Typography>
        <WhatsAppSupport message="Hello Admin, I need assistance with Universal Shop Khata." />
      </Card>

      {/* How to Use Tutorial Guide */}
      <Card className="p-4 mb-6 bg-white dark:bg-gray-800">
        <View className="flex-row items-center mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">
          <BookOpen size={20} color="#2563eb" className="mr-2" />
          <Typography variant="h3">{isUrdu ? 'ایپ کے استعمال کی ہدایت' : 'How to Use Guide'}</Typography>
        </View>

        <View className="space-y-2">
          <Typography variant="body" className="font-semibold text-gray-800 dark:text-gray-200">
            1. {isUrdu ? 'گاہک شامل کریں' : 'Add Customers'}: {isUrdu ? 'گاہکوں کا نام اور فون نمبر درج کریں۔' : 'Create new customer records.'}
          </Typography>
          <Typography variant="body" className="font-semibold text-gray-800 dark:text-gray-200">
            2. {isUrdu ? 'ادھار (کریڈٹ) یا وصولی (پیمنٹ)' : 'Record Credit & Payments'}: {isUrdu ? 'ایک کلک میں کھاتا اپ ڈیٹ کریں۔' : 'Add daily shop balance entries.'}
          </Typography>
          <Typography variant="body" className="font-semibold text-gray-800 dark:text-gray-200">
            3. {isUrdu ? 'واٹس ایپ پر بل بھیجیں' : 'Send WhatsApp Statements'}: {isUrdu ? 'گاہکوں کو یاد دہانی کا پیغام بھیجیں۔' : 'Share PDF statements with customers.'}
          </Typography>
        </View>
      </Card>

      {/* FAQs */}
      <Card className="p-4 mb-6 bg-white dark:bg-gray-800">
        <Typography variant="h3" className="mb-4 text-blue-600 border-b border-gray-100 dark:border-gray-700 pb-2">
          {isUrdu ? 'عام سوالات (FAQ)' : 'Frequently Asked Questions'}
        </Typography>

        {faqs.map((faq, index) => {
          const isOpen = openFaq === index;
          return (
            <View key={index} className="border-b border-gray-100 dark:border-gray-700 py-3">
              <TouchableOpacity
                className="flex-row items-center justify-between"
                onPress={() => setOpenFaq(isOpen ? null : index)}
              >
                <Typography variant="body" className="font-bold flex-1 mr-2 text-gray-900 dark:text-gray-100">
                  {isUrdu ? faq.qUr : faq.qEn}
                </Typography>
                {isOpen ? <ChevronUp size={20} color="#2563eb" /> : <ChevronDown size={20} color="#9ca3af" />}
              </TouchableOpacity>

              {isOpen && (
                <Typography variant="caption" className="text-gray-600 dark:text-gray-300 mt-2 leading-5">
                  {isUrdu ? faq.aUr : faq.aEn}
                </Typography>
              )}
            </View>
          );
        })}
      </Card>
    </ScrollView>
  );
}
