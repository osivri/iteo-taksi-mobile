import { Pressable, StyleSheet, Text, View } from 'react-native';
import { IteoColors } from '@/constants/Colors';
import type { FinancePeriod } from '@/lib/date-ranges';
import { periodLabels } from '@/lib/date-ranges';

interface PeriodTabsProps {
  value: FinancePeriod;
  onChange: (period: FinancePeriod) => void;
}

const periods: FinancePeriod[] = ['week', 'month', 'all'];

export function PeriodTabs({ value, onChange }: PeriodTabsProps) {
  return (
    <View style={styles.row}>
      {periods.map((p) => (
        <Pressable
          key={p}
          onPress={() => onChange(p)}
          style={[styles.tab, value === p && styles.tabActive]}>
          <Text style={[styles.tabText, value === p && styles.tabTextActive]}>{periodLabels[p]}</Text>
        </Pressable>
      ))}
    </View>
  );
}

interface FinanceBarChartProps {
  income: number;
  expense: number;
  currency?: string;
}

export function FinanceBarChart({ income, expense, currency = '₺' }: FinanceBarChartProps) {
  const max = Math.max(income, expense, 1);

  return (
    <View style={styles.chart}>
      <View style={styles.barRow}>
        <Text style={styles.barLabel}>Gelir</Text>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, styles.incomeBar, { width: `${(income / max) * 100}%` }]} />
        </View>
        <Text style={styles.barValue}>
          {income.toLocaleString('tr-TR')} {currency}
        </Text>
      </View>
      <View style={styles.barRow}>
        <Text style={styles.barLabel}>Gider</Text>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, styles.expenseBar, { width: `${(expense / max) * 100}%` }]} />
        </View>
        <Text style={styles.barValue}>
          {expense.toLocaleString('tr-TR')} {currency}
        </Text>
      </View>
    </View>
  );
}

interface TrendPoint {
  date: string;
  income: number;
  expense: number;
  net: number;
}

interface FinanceLineChartProps {
  points: TrendPoint[];
  currency?: string;
}

export function FinanceLineChart({ points, currency = '₺' }: FinanceLineChartProps) {
  if (points.length === 0) return null;

  const maxVal = Math.max(...points.flatMap((p) => [p.income, p.expense, Math.abs(p.net)]), 1);
  const chartHeight = 72;

  return (
    <View style={styles.lineChart}>
      <Text style={styles.lineChartTitle}>Günlük Trend</Text>
      <View style={[styles.lineChartArea, { height: chartHeight }]}>
        {points.slice(-14).map((point) => {
          const netHeight = (Math.abs(point.net) / maxVal) * chartHeight;
          const isPositive = point.net >= 0;
          return (
            <View key={point.date} style={styles.lineCol}>
              <View
                style={[
                  styles.lineBar,
                  {
                    height: Math.max(netHeight, 4),
                    backgroundColor: isPositive ? '#16A34A' : '#DC2626',
                    alignSelf: isPositive ? 'flex-end' : 'flex-start',
                  },
                ]}
              />
              <Text style={styles.lineLabel}>{point.date.slice(5)}</Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.lineHint}>Net hareket ({currency}) — son {Math.min(points.length, 14)} gün</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: IteoColors.blackSoft,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: IteoColors.yellow },
  tabText: { color: IteoColors.white, fontWeight: '600', fontSize: 13 },
  tabTextActive: { color: IteoColors.black },
  chart: { gap: 12, marginTop: 8 },
  barRow: { gap: 6 },
  barLabel: { color: IteoColors.black, fontSize: 12, fontWeight: '600' },
  barTrack: {
    height: 10,
    backgroundColor: 'rgba(10,10,10,0.12)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 5 },
  incomeBar: { backgroundColor: '#16A34A' },
  expenseBar: { backgroundColor: '#DC2626' },
  barValue: { color: IteoColors.blackSoft, fontSize: 11 },
  lineChart: { marginTop: 12, gap: 6 },
  lineChartTitle: { color: IteoColors.black, fontSize: 12, fontWeight: '600' },
  lineChartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    paddingTop: 4,
  },
  lineCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  lineBar: { width: '70%', borderRadius: 3, minHeight: 4 },
  lineLabel: { fontSize: 8, color: IteoColors.gray500, marginTop: 4 },
  lineHint: { fontSize: 10, color: IteoColors.gray500 },
});
