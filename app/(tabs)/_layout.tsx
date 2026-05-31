import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

import Colors, { IteoColors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useAuth } from '@/hooks/useAuth';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { api, ApiResponse } from '@/lib/api';
import { isOnboardingDone, needsAddressSetup, needsKvkkAcceptance, needsProfileSetup } from '@/lib/onboarding';
import { isTabVisible, RoleTabName, tabLabel, toMemberRole, type MemberRole } from '@/lib/dashboard';

interface Profile {
  firstName: string;
  lastName: string;
  status: string;
  role: string;
  kvkkAcceptedAt: string | null;
  city: string | null;
  district: string | null;
  addressLine: string | null;
}

const tabIcons: Record<RoleTabName, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  index: { active: 'home', inactive: 'home-outline' },
  finance: { active: 'wallet', inactive: 'wallet-outline' },
  vehicles: { active: 'car-sport', inactive: 'car-sport-outline' },
  announcements: { active: 'megaphone', inactive: 'megaphone-outline' },
  payments: { active: 'card', inactive: 'card-outline' },
  appointments: { active: 'calendar', inactive: 'calendar-outline' },
};

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const { loading, isAuthenticated } = useAuth();
  const [gateLoading, setGateLoading] = useState(true);
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const [profileOk, setProfileOk] = useState<boolean | null>(null);
  const [kvkkOk, setKvkkOk] = useState<boolean | null>(null);
  const [addressOk, setAddressOk] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState<MemberRole>('USER');

  usePushNotifications(isAuthenticated && kvkkOk === true);

  useEffect(() => {
    if (!isAuthenticated) {
      setGateLoading(false);
      return;
    }

    async function checkGate() {
      const done = await isOnboardingDone();
      setOnboardingDone(done);

      if (!done) {
        setGateLoading(false);
        return;
      }

      try {
        const res = await api.get<ApiResponse<Profile>>('/users/me');
        const profile = res.data ?? ({} as Profile);

        if (profile.role === 'ADMIN' || profile.role === 'SUPER_ADMIN') {
          setIsAdmin(true);
          setGateLoading(false);
          return;
        }

        setRole(toMemberRole(profile.role));
        setProfileOk(!needsProfileSetup(profile));
        setKvkkOk(!needsKvkkAcceptance(profile));
        setAddressOk(!needsAddressSetup(profile));
      } catch {
        setProfileOk(false);
        setKvkkOk(false);
        setAddressOk(false);
      } finally {
        setGateLoading(false);
      }
    }

    checkGate();
  }, [isAuthenticated]);

  if (loading || gateLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: IteoColors.black }}>
        <ActivityIndicator color={IteoColors.yellow} size="large" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/welcome" />;
  }

  if (isAdmin) {
    return <Redirect href="/admin-notice" />;
  }

  if (onboardingDone === false) {
    return <Redirect href="/onboarding" />;
  }

  if (profileOk === false) {
    return <Redirect href="/role-selection" />;
  }

  if (kvkkOk === false) {
    return <Redirect href="/kvkk" />;
  }

  if (addressOk === false) {
    return <Redirect href="/address" />;
  }

  const roleTab = (name: RoleTabName) => ({
    title: tabLabel(name, role),
    href: isTabVisible(name, role) ? undefined : (null as never),
    tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
      <Ionicons name={focused ? tabIcons[name].active : tabIcons[name].inactive} size={23} color={color} />
    ),
  });

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: IteoColors.yellow,
        tabBarInactiveTintColor: Colors[colorScheme].tabIconDefault,
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 14,
          height: 72,
          borderRadius: 24,
          borderTopWidth: 0,
          backgroundColor: colorScheme === 'dark' ? '#141414' : IteoColors.white,
          shadowColor: '#000',
          shadowOpacity: 0.16,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: 12,
          paddingTop: 10,
          paddingBottom: 12,
        },
        tabBarItemStyle: { borderRadius: 18 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '800', marginTop: 2 },
        headerShown: useClientOnlyValue(false, false),
      }}>
      {/* Sıralama alt çubuktaki görünümü belirler */}
      <Tabs.Screen name="index" options={roleTab('index')} />
      <Tabs.Screen name="finance" options={roleTab('finance')} />
      <Tabs.Screen name="vehicles" options={roleTab('vehicles')} />
      <Tabs.Screen name="announcements" options={roleTab('announcements')} />
      <Tabs.Screen name="payments" options={roleTab('payments')} />
      <Tabs.Screen name="appointments" options={roleTab('appointments')} />
      <Tabs.Screen
        name="two"
        options={{
          title: 'Menü',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="profile" options={{ href: null, title: 'Profil' }} />
    </Tabs>
  );
}
