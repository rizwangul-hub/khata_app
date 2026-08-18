import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Users, BookOpen, BarChart3, Settings } from 'lucide-react-native';

export default function AppLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const bottomInset = insets.bottom > 0 ? insets.bottom : 12;

  return (
    <Tabs
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          color: '#0f172a',
        },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0',
          borderTopWidth: 1,
          height: 56 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      {/* 5 Main Bottom Nav Tabs */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Khata',
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color }) => <Home size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: t('common.customers'),
          tabBarLabel: t('common.customers'),
          tabBarIcon: ({ color }) => <Users size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="khata"
        options={{
          title: t('common.khata'),
          tabBarLabel: t('common.khata'),
          tabBarIcon: ({ color }) => <BookOpen size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarLabel: 'Reports',
          tabBarIcon: ({ color }) => <BarChart3 size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('common.settings'),
          tabBarLabel: t('common.settings'),
          tabBarIcon: ({ color }) => <Settings size={22} color={color} />,
        }}
      />

      {/* Hide Stack/Sub-screens from Bottom Tab Bar */}
      <Tabs.Screen name="add-customer" options={{ href: null, title: 'Add Customer' }} />
      <Tabs.Screen name="add-credit" options={{ href: null, title: 'Add Credit' }} />
      <Tabs.Screen name="add-payment" options={{ href: null, title: 'Add Payment' }} />
      <Tabs.Screen name="edit-customer" options={{ href: null, title: 'Edit Customer' }} />
      <Tabs.Screen name="edit-transaction" options={{ href: null, title: 'Edit Transaction' }} />
      <Tabs.Screen name="customer/[id]" options={{ href: null, title: 'Customer Details' }} />
      <Tabs.Screen name="transaction/[id]" options={{ href: null, title: 'Transaction Details' }} />
      <Tabs.Screen name="profile" options={{ href: null, title: 'Shop Profile' }} />
      <Tabs.Screen name="subscription" options={{ href: null, title: 'Subscription Plan' }} />
      <Tabs.Screen name="change-password" options={{ href: null, title: 'Change Password' }} />
      <Tabs.Screen name="devices" options={{ href: null, title: 'Logged-in Devices' }} />
      <Tabs.Screen name="notifications" options={{ href: null, title: 'Notifications' }} />
      <Tabs.Screen name="help" options={{ href: null, title: 'Help & Support' }} />
      <Tabs.Screen name="about" options={{ href: null, title: 'About App' }} />
      <Tabs.Screen name="sync-settings" options={{ href: null, title: 'Sync & Backup' }} />
      <Tabs.Screen name="debtors" options={{ href: null, title: 'Debtors Summary' }} />
      <Tabs.Screen name="restore" options={{ href: null, title: 'Device Restore' }} />
    </Tabs>
  );
}
