import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { IteoColors } from '@/constants/Colors';
import { FinanceBarChart, PeriodTabs } from '@/components/FinanceUi';
import type { FinancePeriod } from '@/lib/date-ranges';
import type { FinanceSummary } from './types';

interface Props {
  theme: { card: string; border: string; text: string; textSecondary: string };
  period: FinancePeriod;
  onPeriodChange: (p: FinancePeriod) => void;
  summary: FinanceSummary | undefined;
  error: string | null;
}

const shortcuts: Array<{ title: string; subtitle: string; href: Href; emoji: string }> = [
  { title: 'Plaka & Araç', subtitle: 'Filodaki plakalar', href: '/vehicles', emoji: '🏷️' },
  { title: 'Muhasebe', subtitle: 'Gelir / gider', href: '/(tabs)/finance', emoji: '📒' },
  { title: 'Aidat Öde', subtitle: 'Oda ödemeleri', href: '/payments', emoji: '💳' },
  { title: 'Raporlar', subtitle: 'Özet görünüm', href: '/(tabs)/finance', emoji: '📊' },
];

export function PlateOwnerHome({ theme, period, onPeriodChange, summary, error }: Props) {
  return (
    <>
      <View style={[styles.hero, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={styles.heroBadge}>Mal / Plaka Sahibi Paneli</Text>
        <PeriodTabs value={period} onChange={onPeriodChange} />
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Gelir</Text>
            <Text style={[styles.statValue, { color: '#16A34A' }]}>
              {summary ? `${summary.totalIncome.toLocaleString('tr-TR')} ₺` : '—'}
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Gider</Text>
            <Text style={[styles.statValue, { color: '#DC2626' }]}>
              {summary ? `${summary.totalExpense.toLocaleString('tr-TR')} ₺` : '—'}
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Net</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {summary ? `${summary.net.toLocaleString('tr-TR')} ₺` : '—'}
            </Text>
          </View>
        </View>
        {summary && (
          <FinanceBarChart income={summary.totalIncome} expense={summary.totalExpense} currency={summary.currency} />
        )}
        {error && <Text style={styles.error}>{error}</Text>}
      </View>

      <Text style={[styles.section, { color: theme.text }]}>Mal Sahibine Özel</Text>
      <View style={styles.list}>
        {shortcuts.map((item) => (
          <Link key={item.title} href={item.href} asChild>
            <Pressable style={[styles.rowCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={styles.emoji}>{item.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: theme.text }]}>{item.title}</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{item.subtitle}</Text>
              </View>
              <Text style={{ color: IteoColors.yellow }}>→</Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  hero: { borderWidth: 1, borderRadius: 16, padding: 20, marginBottom: 24 },
  heroBadge: { color: IteoColors.yellow, fontWeight: '700', fontSize: 12, marginBottom: 8 },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  statBox: { flex: 1 },
  statLabel: { fontSize: 11, fontWeight: '600' },
  statValue: { fontSize: 16, fontWeight: '800', marginTop: 4 },
  error: { color: '#B91C1C', fontSize: 12, marginTop: 8 },
  section: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  list: { gap: 10 },
  rowCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 14, gap: 12 },
  emoji: { fontSize: 22 },
  rowTitle: { fontWeight: '700', fontSize: 15 },
});
