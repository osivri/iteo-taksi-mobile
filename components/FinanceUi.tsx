import { Pressable, StyleSheet, Text, View } from 'react-native';
import { IteoColors } from '@/constants/Colors';
import { fontSize, radius, spacing } from '@/constants/theme';
import type { FinancePeriod } from '@/lib/date-ranges';
import { periodLabels } from '@/lib/date-ranges';

interface PeriodTabsProps {
  value: FinancePeriod;
  onChange: (period: FinancePeriod) => void;
  /** Koyu zemin (sarı hero) üstünde mi kullanılıyor? */
  onDark?: boolean;
}

const periods: FinancePeriod[] = ['week', 'month', 'all'];

export function PeriodTabs({ value, onChange, onDark = false }: PeriodTabsProps) {
  const trackBg = onDark ? 'rgba(10,10,10,0.12)' : IteoColors.gray100;
  return (
    <View style={[styles.row, { backgroundColor: trackBg }]}>
      {periods.map((p) => {
        const active = value === p;
        return (
          <Pressable
            key={p}
            onPress={() => onChange(p)}
            style={[styles.tab, active && styles.tabActive]}>
            <Text style={[styles.tabText, { color: active ? IteoColors.black : onDark ? '#3F3000' : IteoColors.gray500 }]}>
              {periodLabels[p]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

interface FinanceBarChartProps {
  income: number;
  expense: number;
  currency?: string;
  onDark?: boolean;
}

export function FinanceBarChart({ income, expense, currency = '₺', onDark = false }: FinanceBarChartProps) {
  const max = Math.max(income, expense, 1);
  const trackBg = onDark ? 'rgba(10,10,10,0.12)' : IteoColors.gray100;
  const labelColor = onDark ? IteoColors.black : IteoColors.gray500;

  return (
    <View style={styles.chart}>
      {(
        [
          { label: 'Gelir', value: income, color: IteoColors.success },
          { label: 'Gider', value: expense, color: IteoColors.error },
        ] as const
      ).map((bar) => (
        <View key={bar.label} style={styles.barRow}>
          <View style={styles.barHeader}>
            <Text style={[styles.barLabel, { color: labelColor }]}>{bar.label}</Text>
            <Text style={[styles.barValue, { color: onDark ? IteoColors.black : bar.color }]}>
              {bar.value.toLocaleString('tr-TR')} {currency}
            </Text>
          </View>
          <View style={[styles.barTrack, { backgroundColor: trackBg }]}>
            <View style={[styles.barFill, { width: `${(bar.value / max) * 100}%`, backgroundColor: bar.color }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

interface TrendPoint {
  date: string;
  income: number;
  expense: number;
  net: number;
}

export function FinanceLineChart({ points, currency = '₺' }: { points: TrendPoint[]; currency?: string }) {
  if (points.length === 0) return null;

  const maxVal = Math.max(...points.flatMap((p) => [p.income, p.expense, Math.abs(p.net)]), 1);
  const chartHeight = 80;
  const visible = points.slice(-14);

  return (
    <View style={styles.lineChart}>
      <Text style={styles.lineChartTitle}>Günlük Net Hareket</Text>
      <View style={[styles.lineChartArea, { height: chartHeight }]}>
        {visible.map((point) => {
          const netHeight = Math.max((Math.abs(point.net) / maxVal) * chartHeight, 4);
          const isPositive = point.net >= 0;
          return (
            <View key={point.date} style={styles.lineCol}>
              <View
                style={[
                  styles.lineBar,
                  {
                    height: netHeight,
                    backgroundColor: isPositive ? IteoColors.success : IteoColors.error,
                  },
                ]}
              />
              <Text style={styles.lineLabel}>{point.date.slice(5)}</Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.lineHint}>
        Son {visible.length} gün ({currency})
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', borderRadius: radius.md, padding: 4, marginBottom: spacing.lg },
  tab: { flex: 1, paddingVertical: 9, borderRadius: radius.sm, alignItems: 'center' },
  tabActive: { backgroundColor: IteoColors.white },
  tabText: { fontWeight: '800', fontSize: fontSize.sm },

  chart: { gap: spacing.md, marginTop: spacing.xs },
  barRow: { gap: spacing.sm },
  barHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  barLabel: { fontSize: fontSize.sm, fontWeight: '700' },
  barValue: { fontSize: fontSize.sm, fontWeight: '800' },
  barTrack: { height: 10, borderRadius: 5, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 5 },

  lineChart: { marginTop: spacing.lg, gap: spacing.sm },
  lineChartTitle: { color: IteoColors.black, fontSize: fontSize.sm, fontWeight: '800' },
  lineChartArea: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, paddingTop: 4 },
  lineCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  lineBar: { width: '64%', borderRadius: 3, minHeight: 4 },
  lineLabel: { fontSize: 8, color: IteoColors.gray500, marginTop: 4 },
  lineHint: { fontSize: fontSize.xs, color: IteoColors.gray500 },
});
