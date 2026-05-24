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

const shortcuts: Array<{ title: string; href: Href; emoji: string }> = [
  { title: 'Hasılat Ekle', href: '/(tabs)/finance', emoji: '💰' },
  { title: 'Plakam', href: '/vehicles', emoji: '🚕' },
  { title: 'Randevu', href: '/appointments', emoji: '📅' },
  { title: 'İSG Danışman', href: '/ohs', emoji: '🦺' },
];

export function DriverHome({ theme, period, onPeriodChange, summary, error }: Props) {
  return (
    <>
      <View style={[styles.hero, { backgroundColor: IteoColors.yellow }]}>
        <Text style={styles.heroBadge}>Şoför Paneli</Text>
        <PeriodTabs value={period} onChange={onPeriodChange} />
        <Text style={styles.heroLabel}>Net Kazanç</Text>
        <Text style={styles.heroValue}>
          {summary ? `${summary.net.toLocaleString('tr-TR')} ${summary.currency}` : '—'}
        </Text>
        {summary && (
          <FinanceBarChart income={summary.totalIncome} expense={summary.totalExpense} currency={summary.currency} />
        )}
        {error && <Text style={styles.error}>{error}</Text>}
      </View>

      <Text style={[styles.section, { color: theme.text }]}>Şoföre Özel İşlemler</Text>
      <View style={styles.grid}>
        {shortcuts.map((item) => (
          <Link key={item.title} href={item.href} asChild>
            <Pressable style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={styles.emoji}>{item.emoji}</Text>
              <Text style={[styles.cardTitle, { color: theme.text }]}>{item.title}</Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 16, padding: 20, marginBottom: 24 },
  heroBadge: { color: IteoColors.blackSoft, fontWeight: '700', fontSize: 12, marginBottom: 8 },
  heroLabel: { color: IteoColors.black, fontWeight: '600', marginTop: 4 },
  heroValue: { color: IteoColors.black, fontSize: 34, fontWeight: '800' },
  error: { color: '#B91C1C', fontSize: 12, marginTop: 8 },
  section: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '47%', borderWidth: 1, borderRadius: 14, padding: 16, minHeight: 96 },
  emoji: { fontSize: 24, marginBottom: 8 },
  cardTitle: { fontSize: 14, fontWeight: '700' },
});
