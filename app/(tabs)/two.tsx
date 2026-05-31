import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { IteoColors } from '@/constants/Colors';
import { fontSize, radius, shadow, spacing } from '@/constants/theme';
import { ScreenHeader, Screen, useTheme } from '@/components/ui';
import { getQuickActionsForRole, quickActionLabel, roleDashboardTitles, toMemberRole, type UserRole } from '@/lib/dashboard';
import { api, ApiResponse } from '@/lib/api';

interface Profile {
  role: UserRole;
}

const menuIconByTitle: Record<string, keyof typeof Ionicons.glyphMap> = {
  Profilim: 'person-outline',
  Muhasebe: 'wallet-outline',
  Plakalarım: 'car-sport-outline',
  Duyurular: 'megaphone-outline',
  Haberler: 'newspaper-outline',
  Ödemeler: 'card-outline',
  Randevu: 'calendar-outline',
  'Unutulan Eşya': 'briefcase-outline',
  İSG: 'shield-checkmark-outline',
  Bildirimler: 'notifications-outline',
  Yardım: 'help-circle-outline',
};

export default function MenuScreen() {
  const theme = useTheme();

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get<ApiResponse<Profile>>('/users/me').then((r) => r.data!),
  });

  const role = toMemberRole(profileQuery.data?.role);
  const actions = getQuickActionsForRole(role);

  return (
    <Screen scroll withTabBar>
      <ScreenHeader eyebrow="İTEO Mobil" title="Menü" subtitle={`${roleDashboardTitles[role]} · tüm işlemler`} icon="grid" />

      <View style={styles.grid}>
        {actions.map((action) => (
          <Link key={action.title} href={action.href} asChild>
            <Pressable
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: theme.card, borderColor: theme.border },
                theme.scheme === 'light' ? shadow.card : null,
                pressed ? styles.pressed : null,
              ]}>
              <View style={styles.iconBubble}>
                <Ionicons name={menuIconByTitle[action.title] ?? 'apps-outline'} size={24} color={IteoColors.black} />
              </View>
              <Text style={[styles.cardTitle, { color: theme.text }]}>{quickActionLabel(action, role)}</Text>
              <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>{action.subtitle}</Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  card: { width: '47.5%', borderWidth: 1, borderRadius: radius.xl, padding: spacing.lg, minHeight: 140 },
  iconBubble: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: IteoColors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: { fontSize: fontSize.lg, fontWeight: '900' },
  cardSubtitle: { fontSize: fontSize.sm, marginTop: spacing.xs, lineHeight: 17 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});
