import React, { useState, useEffect } from 'react';
import { Modal, View, FlatList, TextInput, TouchableOpacity, SafeAreaView } from 'react-native';
import { Typography } from './Typography';
import { CustomerAvatar } from './CustomerAvatar';
import { useCustomerStore, CustomerItem } from '../state/customerStore';
import { useTranslation } from 'react-i18next';
import { X, Search, ChevronRight } from 'lucide-react-native';

interface CustomerSelectorModalProps {
  visible: boolean;
  title: string;
  onSelectCustomer: (customerId: string) => void;
  onClose: () => void;
}

export const CustomerSelectorModal: React.FC<CustomerSelectorModalProps> = ({
  visible,
  title,
  onSelectCustomer,
  onClose,
}) => {
  const { t } = useTranslation();
  const { customers, fetchCustomers } = useCustomerStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (visible) {
      fetchCustomers();
    }
  }, [visible]);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search))
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <Typography variant="h3">{title}</Typography>
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 items-center justify-center"
            onPress={onClose}
          >
            <X size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View className="p-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
          <View className="flex-row items-center bg-gray-100 dark:bg-gray-700 rounded-xl px-3 py-2">
            <Search size={20} color="#9ca3af" className="mr-2" />
            <TextInput
              className="flex-1 text-gray-900 dark:text-gray-100 text-base"
              placeholder={t('customer.searchCustomers')}
              placeholderTextColor="#9ca3af"
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
          </View>
        </View>

        {/* Customer List */}
        <FlatList
          data={filteredCustomers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="flex-row items-center p-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 active:bg-gray-50 dark:active:bg-gray-700"
              onPress={() => {
                onClose();
                onSelectCustomer(item.id);
              }}
            >
              <CustomerAvatar name={item.name} imageUri={item.imageLocalUri} size={44} />
              <View className="flex-1 ml-3">
                <Typography variant="body" className="font-bold">
                  {item.name}
                </Typography>
                {item.phone ? (
                  <Typography variant="caption" className="text-gray-500">
                    {item.phone}
                  </Typography>
                ) : null}
              </View>
              <ChevronRight size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View className="p-8 items-center">
              <Typography variant="body" className="text-gray-400">
                No customer found.
              </Typography>
            </View>
          }
        />
      </SafeAreaView>
    </Modal>
  );
};
