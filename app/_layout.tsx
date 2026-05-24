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

  return (
    <QueryProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="welcome" />
        <Stack.Screen name="login" />
        <Stack.Screen name="admin-notice" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="role-selection" options={{ headerShown: false }} />
        <Stack.Screen name="kvkk" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="payments"
          options={{
            presentation: 'card',
            headerShown: true,
            title: 'Ödemeler',
            headerStyle: { backgroundColor: IteoColors.black },
            headerTintColor: IteoColors.white,
          }}
        />
        <Stack.Screen
          name="appointments"
          options={{
            presentation: 'card',
            headerShown: true,
            title: 'Randevular',
            headerStyle: { backgroundColor: IteoColors.black },
            headerTintColor: IteoColors.white,
          }}
        />
        <Stack.Screen
          name="ohs"
          options={{
            presentation: 'card',
            headerShown: true,
            title: 'İSG',
            headerStyle: { backgroundColor: IteoColors.black },
            headerTintColor: IteoColors.white,
          }}
        />
        <Stack.Screen
          name="news"
          options={{
            presentation: 'card',
            headerShown: true,
            title: 'Haberler',
            headerStyle: { backgroundColor: IteoColors.black },
            headerTintColor: IteoColors.white,
          }}
        />
        <Stack.Screen
          name="notifications"
          options={{
            presentation: 'card',
            headerShown: true,
            title: 'Bildirimler',
            headerStyle: { backgroundColor: IteoColors.black },
            headerTintColor: IteoColors.white,
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            presentation: 'card',
            headerShown: true,
            title: 'Ayarlar',
            headerStyle: { backgroundColor: IteoColors.black },
            headerTintColor: IteoColors.white,
          }}
        />
        <Stack.Screen
          name="vehicles"
          options={{
            presentation: 'card',
            headerShown: true,
            title: 'Plaka / Araçlarım',
            headerStyle: { backgroundColor: IteoColors.black },
            headerTintColor: IteoColors.white,
          }}
        />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style="light" />
    </QueryProvider>
  );
}
