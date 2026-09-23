import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { configurePurchases } from '@/services/purchases';

export default function RootLayout() {
  useEffect(() => {
    configurePurchases();
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#FFF6F0' },
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: '#FFF6F0' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'The Boob App' }} />
        <Stack.Screen
          name="paywall"
          options={{ title: 'Subscribe', presentation: 'modal' }}
        />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      </Stack>
    </>
  );
}
