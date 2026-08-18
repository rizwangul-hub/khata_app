import React, { useState } from 'react';
import { Modal, View, TouchableOpacity, SafeAreaView } from 'react-native';
import { Typography } from './Typography';
import { Button } from './Button';
import { useTranslation } from 'react-i18next';
import { X, Calendar } from 'lucide-react-native';

export type StatementDateRange = 'all' | 'today' | 'week' | 'month';

interface StatementFilterModalProps {
  visible: boolean;
  onSelectRange: (range: StatementDateRange, label: string) => void;
  onClose: () => void;
}

export const StatementFilterModal: React.FC<StatementFilterModalProps> = ({
  visible,
  onSelectRange,
  onClose,
}) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<StatementDateRange>('all');

  if (!visible) return null;

  const ranges: { key: StatementDateRange; label: string }[] = [
    { key: 'all', label: 'All Time (پورا حساب)' },
    { key: 'today', label: "Today (آج کا حساب)" },
    { key: 'week', label: 'This Week (اس ہفتے کا حساب)' },
    { key: 'month', label: 'This Month (اس ماہ کا حساب)' },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-white dark:bg-gray-800 rounded-t-3xl p-6">
          <View className="flex-row items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-700 pb-3">
            <View className="flex-row items-center">
              <Calendar size={22} color="#2563eb" className="mr-2" />
              <Typography variant="h3">Select Statement Period</Typography>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <View className="space-y-3 mb-6">
            {ranges.map((r) => (
              <TouchableOpacity
                key={r.key}
                className={`p-4 rounded-xl border flex-row items-center justify-between ${
                  selected === r.key
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-600'
                    : 'bg-gray-50 dark:bg-gray-700/40 border-gray-200 dark:border-gray-600'
                }`}
                onPress={() => setSelected(r.key)}
              >
                <Typography
                  variant="body"
                  className={`font-bold ${selected === r.key ? 'text-blue-600 dark:text-blue-400' : ''}`}
                >
                  {r.label}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>

          <Button
            title="Generate Statement"
            onPress={() => {
              const selectedObj = ranges.find((r) => r.key === selected);
              onSelectRange(selected, selectedObj?.label || 'Statement');
            }}
          />
        </View>
      </View>
    </Modal>
  );
};
