import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { IteoColors } from '@/constants/Colors';
import { QueryProvider } from '@/providers/QueryProvider';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'welcome',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  const stackScreens: Array<{ name: string; title: string }> = [
    { name: 'ohs', title: 'İSG' },
    { name: 'news', title: 'Haberler' },
    { name: 'notifications', title: 'Bildirimler' },
    { name: 'settings', title: 'Ayarlar' },
    { name: 'help', title: 'Yardım & Destek' },
    { name: 'forgotten-items', title: 'Unutulan Eşya' },
    { name: 'services', title: 'Oda Hizmetleri' },
    { name: 'address', title: 'Adres Bilgileri' },
  ];

  return (
    <QueryProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: IteoColors.black },
          headerTintColor: IteoColors.white,
          headerTitleStyle: { fontWeight: '800', fontSize: 18 },
          headerShadowVisible: false,
          headerBackTitle: '',
          contentStyle: { backgroundColor: IteoColors.gray100 },
        }}>
        <Stack.Screen name="welcome" />
        <Stack.Screen name="login" />
        <Stack.Screen name="admin-notice" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="role-selection" />
        <Stack.Screen name="kvkk" />
        <Stack.Screen name="(tabs)" />
        {stackScreens.map((screen) => (
          <Stack.Screen
            key={screen.name}
            name={screen.name}
            options={{ presentation: 'card', headerShown: true, title: screen.title }}
          />
        ))}
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style="light" />
    </QueryProvider>
  );
}
