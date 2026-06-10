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

export function DriverHome({ theme, period, onPeriodChange, summary, error }: Props) {
  const net = summary?.net ?? 0;
  const currency = summary?.currency ?? '₺';

  return (
    <>
      <View style={styles.hero}>
        <View style={styles.heroTopRow}>
          <Text style={styles.heroBadge}>ŞOFÖR ÖZETİ</Text>
        </View>
        <PeriodTabs value={period} onChange={onPeriodChange} onDark />
        <Text style={styles.heroLabel}>Net Kazanç</Text>
        <Text style={styles.heroValue}>
          {net.toLocaleString('tr-TR')} {currency}
        </Text>
        {summary ? (
          <View style={styles.chartWrap}>
            <FinanceBarChart income={summary.totalIncome} expense={summary.totalExpense} currency={currency} onDark />
          </View>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <HomeQuickTiles
        theme={theme}
        tiles={[
          { title: 'Hasılat Ekle', href: '/(tabs)/finance', icon: 'add-circle-outline' },
          { title: 'Boş Araçlar', href: '/(tabs)/vehicles', icon: 'search-outline' },
          { title: 'Unutulan Eşya', href: '/forgotten-items', icon: 'briefcase-outline' },
          { title: 'Puanlarım', href: '/ratings', icon: 'star-outline' },
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: radius.xxl, padding: spacing.xl, marginBottom: spacing.lg, backgroundColor: IteoColors.yellow, ...shadow.raised },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  heroBadge: { color: '#7A5C00', fontWeight: '900', fontSize: fontSize.xs, letterSpacing: 1 },
  heroLabel: { color: '#5C4600', fontWeight: '700', marginTop: spacing.sm },
  heroValue: { color: IteoColors.black, fontSize: fontSize.hero, fontWeight: '900', letterSpacing: -1.2 },
  chartWrap: { marginTop: spacing.md },
  error: { color: '#7F1D1D', fontSize: fontSize.sm, marginTop: spacing.sm, fontWeight: '600' },
});
