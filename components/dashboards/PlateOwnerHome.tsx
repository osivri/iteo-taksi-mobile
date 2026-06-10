import { StyleSheet, Text, View } from 'react-native';
import { IteoColors } from '@/constants/Colors';
import { fontSize, radius, shadow, spacing } from '@/constants/theme';
import { FinanceBarChart, PeriodTabs } from '@/components/FinanceUi';
import type { FinancePeriod } from '@/lib/date-ranges';
import type { FinanceSummary } from './types';
import { HomeQuickTiles } from './HomeQuickTiles';

interface Props {
  theme: { card: string; border: string; text: string; textSecondary: string };
  period: FinancePeriod;
  onPeriodChange: (p: FinancePeriod) => void;
  summary: FinanceSummary | undefined;
  error: string | null;
}

export function PlateOwnerHome({ theme, period, onPeriodChange, summary, error }: Props) {
  const stats = [
    { label: 'Gelir', value: summary?.totalIncome, color: IteoColors.success },
    { label: 'Gider', value: summary?.totalExpense, color: IteoColors.error },
    { label: 'Net', value: summary?.net, color: theme.text },
  ];

  return (
    <>
      <View style={[styles.hero, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={styles.heroBadge}>ODA ÜYESİ ÖZETİ</Text>
      <PeriodTabs value={period} onChange={onPeriodChange} />
      <View style={styles.statsRow}>
        {stats.map((s) => (
          <View key={s.label} style={[styles.statBox, { borderColor: theme.border }]}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{s.label}</Text>
            <Text style={[styles.statValue, { color: s.color }]}>
              {s.value != null ? `${s.value.toLocaleString('tr-TR')} ₺` : '—'}
            </Text>
          </View>
        ))}
      </View>
      {summary ? (
        <FinanceBarChart income={summary.totalIncome} expense={summary.totalExpense} currency={summary.currency} />
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <HomeQuickTiles
        theme={theme}
        tiles={[
          { title: 'Plakalarım', href: '/(tabs)/vehicles', icon: 'car-sport-outline' },
          { title: 'Şoför Bul', href: '/find-driver', icon: 'people-outline' },
          { title: 'Unutulan Eşya', href: '/forgotten-items', icon: 'briefcase-outline' },
          { title: 'Ödemeler', href: '/(tabs)/payments', icon: 'card-outline' },
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  hero: { borderWidth: 1, borderRadius: radius.xxl, padding: spacing.xl, marginBottom: spacing.lg, ...shadow.card },
  heroBadge: { color: IteoColors.yellowDark, fontWeight: '900', fontSize: fontSize.xs, letterSpacing: 1, marginBottom: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statBox: { flex: 1, borderWidth: 1, borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.md },
  statLabel: { fontSize: fontSize.xs, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: fontSize.lg, fontWeight: '900', marginTop: spacing.xs },
  error: { color: IteoColors.error, fontSize: fontSize.sm, marginTop: spacing.sm, fontWeight: '600' },
});
