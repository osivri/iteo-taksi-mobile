import { useState } from 'react';
import { Image, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import Colors, { IteoColors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { api, ApiResponse } from '@/lib/api';
import { roleDashboardTitles, UserRole } from '@/lib/dashboard';
import { fontSize, radius, SCREEN_BOTTOM_INSET, spacing } from '@/constants/theme';
import { FinancePeriod, getPeriodRange } from '@/lib/date-ranges';
import { DriverHome } from '@/components/dashboards/DriverHome';
import { PlateOwnerHome } from '@/components/dashboards/PlateOwnerHome';
import { MemberHome } from '@/components/dashboards/MemberHome';
import type { FinanceSummary } from '@/components/dashboards/types';

interface Profile {
  firstName: string;
  lastName: string;
  role: UserRole;
}

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<FinancePeriod>('month');

  const range = getPeriodRange(period);
  const summaryQueryString = range.from
    ? `?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to!)}`
    : '';

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get<ApiResponse<Profile>>('/users/me').then((r) => r.data!),
  });

  const summaryQuery = useQuery({
    queryKey: ['finance-summary', period],
    queryFn: () =>
      api.get<ApiResponse<FinanceSummary>>(`/finance/summary${summaryQueryString}`).then((r) => r.data!),
    enabled: profileQuery.data?.role === 'DRIVER' || profileQuery.data?.role === 'PLATE_OWNER',
  });

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([profileQuery.refetch(), summaryQuery.refetch()]);
    setRefreshing(false);
  }

  const profile = profileQuery.data;
  const summary = summaryQuery.data;
  const role = profile?.role ?? 'USER';
  const error = profileQuery.error?.message ?? summaryQuery.error?.message ?? null;
  const initials = profile
    ? `${profile.firstName?.charAt(0) ?? ''}${profile.lastName?.charAt(0) ?? ''}`.toUpperCase()
    : 'İT';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.backgroundSecondary }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={IteoColors.yellow} />}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Image source={require('@/assets/images/iteo_logo.jpeg')} style={styles.logo} />
            <View style={styles.flex}>
              <Text style={styles.headerSubtitle}>İSTANBUL TAKSİCİLER ESNAF ODASI</Text>
              <Text style={styles.headerGreeting}>{profile ? `Merhaba, ${profile.firstName}` : 'İTEO Mobil'}</Text>
            </View>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
          <View style={styles.roleChip}>
            <Text style={styles.roleChipText}>{roleDashboardTitles[role]}</Text>
          </View>
        </View>

        {role === 'DRIVER' && (
          <DriverHome theme={theme} period={period} onPeriodChange={setPeriod} summary={summary} error={error} />
        )}
        {role === 'PLATE_OWNER' && (
          <PlateOwnerHome theme={theme} period={period} onPeriodChange={setPeriod} summary={summary} error={error} />
        )}
        {role === 'USER' && <MemberHome theme={theme} />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: SCREEN_BOTTOM_INSET },
  header: { backgroundColor: IteoColors.black, borderRadius: radius.xxl, padding: spacing.xl, marginBottom: spacing.lg },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  logo: { width: 48, height: 48, borderRadius: 14 },
  headerSubtitle: { color: IteoColors.yellow, fontSize: 10, fontWeight: '900', letterSpacing: 0.6 },
  headerGreeting: { color: IteoColors.white, fontSize: fontSize.xl, fontWeight: '900', marginTop: 3, letterSpacing: -0.3 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: IteoColors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: IteoColors.black, fontWeight: '900', fontSize: fontSize.lg },
  roleChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,199,0,0.16)',
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: spacing.lg,
  },
  roleChipText: { color: IteoColors.yellow, fontWeight: '800', fontSize: fontSize.sm },
});
