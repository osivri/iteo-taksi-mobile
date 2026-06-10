import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { IteoColors } from '@/constants/Colors';
import { fontSize, radius, spacing } from '@/constants/theme';
import { FinanceBarChart, FinanceLineChart, PeriodTabs } from '@/components/FinanceUi';
import type { FinancePeriod } from '@/lib/date-ranges';
import type { FinanceSummary, FinanceTrendPoint } from '@/hooks/queries/finance';
import { MemberSubpageToolbar } from '@/components/MemberSubpageToolbar';
import { ModulePageHero } from '@/components/ModulePageHero';
import { Button, Card, ErrorText, Field, SectionTitle, useTheme } from '@/components/ui';

type AppTheme = ReturnType<typeof useTheme>;

interface VehicleChip {
  id: string;
  plateNumber: string;
}

interface FinanceListHeaderProps {
  theme: AppTheme;
  requiresPlate: boolean;
  vehicles: VehicleChip[];
  vehicleId: string;
  onVehicleChange: (id: string) => void;
  period: FinancePeriod;
  onPeriodChange: (period: FinancePeriod) => void;
  summary: FinanceSummary | null;
  trends: FinanceTrendPoint[];
  canEnterData: boolean;
  saving: boolean;
  amount: string;
  category: string;
  onAmountChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onScanReceipt: () => void;
  onAddIncome: () => void;
  onAddExpense: () => void;
  error: string | null;
}

function FinanceListHeaderComponent({
  theme,
  requiresPlate,
  vehicles,
  vehicleId,
  onVehicleChange,
  period,
  onPeriodChange,
  summary,
  trends,
  canEnterData,
  saving,
  amount,
  category,
  onAmountChange,
  onCategoryChange,
  onScanReceipt,
  onAddIncome,
  onAddExpense,
  error,
}: FinanceListHeaderProps) {
  return (
    <View style={{ gap: spacing.lg }}>
      <MemberSubpageToolbar showBack={false} />
      <ModulePageHero
        badge="Muhasebe"
        title="Gelir & Gider"
        description="Plaka bazlı hasılat ve giderlerinizi takip edin, fiş tarayın ve dönemsel raporlarınızı görün."
        icon="wallet"
      />

      {requiresPlate ? (
        <Card>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Plaka Seçimi</Text>
          <Text style={[styles.cardHint, { color: theme.textSecondary }]}>İşlem yapmadan önce ilgili plakayı seçin.</Text>
          {vehicles.length === 0 ? (
            <Pressable onPress={() => router.push('/(tabs)/vehicles')} style={styles.addPlateLink}>
              <Ionicons name="add-circle-outline" size={18} color={IteoColors.yellowDark} />
              <Text style={styles.addPlateText}>Kayıtlı plaka yok — plaka ekle</Text>
            </Pressable>
          ) : (
            <View style={styles.plateRow}>
              {vehicles.map((v) => {
                const active = vehicleId === v.id;
                return (
                  <Pressable
                    key={v.id}
                    onPress={() => onVehicleChange(v.id)}
                    style={[
                      styles.plateChip,
                      {
                        backgroundColor: active ? IteoColors.yellow : theme.backgroundSecondary,
                        borderColor: active ? IteoColors.yellow : theme.border,
                      },
                    ]}>
                    <Text style={{ color: active ? IteoColors.black : theme.text, fontWeight: '800', fontSize: fontSize.sm }}>
                      {v.plateNumber}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </Card>
      ) : null}

      <Card>
        <PeriodTabs value={period} onChange={onPeriodChange} />
        {summary ? (
          <>
            <View style={styles.netRow}>
              <Text style={[styles.netLabel, { color: theme.textSecondary }]}>Net</Text>
              <Text style={[styles.netValue, { color: summary.net >= 0 ? IteoColors.success : IteoColors.error }]}>
                {summary.net >= 0 ? '+' : ''}
                {summary.net.toLocaleString('tr-TR')} {summary.currency}
              </Text>
            </View>
            <FinanceBarChart income={summary.totalIncome} expense={summary.totalExpense} currency={summary.currency} />
            <FinanceLineChart points={trends} currency={summary.currency} />
          </>
        ) : (
          <Text style={{ color: theme.textSecondary, textAlign: 'center', paddingVertical: spacing.md }}>
            Bu dönem için özet bulunmuyor.
          </Text>
        )}
      </Card>

      <Card>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Kayıt Ekle</Text>
        <Button
          title={saving ? 'Okunuyor...' : 'Fişi Akıllı Oku'}
          icon="camera-outline"
          onPress={onScanReceipt}
          disabled={saving || !canEnterData}
          style={{ marginBottom: spacing.md }}
        />
        {!canEnterData && requiresPlate ? (
          <Text style={[styles.cardHint, { color: theme.textSecondary, textAlign: 'center' }]}>Veri girmek için plaka seçin.</Text>
        ) : null}
        <Field label="Kategori" placeholder="ör. Yakıt" value={category} onChangeText={onCategoryChange} editable={canEnterData} icon="pricetag-outline" />
        <Field label="Tutar" placeholder="0" keyboardType="decimal-pad" value={amount} onChangeText={onAmountChange} editable={canEnterData} icon="cash-outline" />
        <View style={styles.btnRow}>
          <Button title="Gelir" icon="arrow-up" variant="success" onPress={onAddIncome} disabled={saving || !canEnterData} style={styles.flex} />
          <Button title="Gider" icon="arrow-down" variant="danger" onPress={onAddExpense} disabled={saving || !canEnterData} style={styles.flex} />
        </View>
      </Card>

      {error ? <ErrorText>{error}</ErrorText> : null}
      <SectionTitle>Son Kayıtlar</SectionTitle>
    </View>
  );
}

export const FinanceListHeader = memo(FinanceListHeaderComponent);

const styles = StyleSheet.create({
  flex: { flex: 1 },
  cardTitle: { fontSize: fontSize.lg, fontWeight: '900', marginBottom: spacing.sm },
  cardHint: { fontSize: fontSize.sm, marginBottom: spacing.md, lineHeight: 18 },
  addPlateLink: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  addPlateText: { color: IteoColors.yellowDark, fontWeight: '800' },
  plateRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  plateChip: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 9 },
  netRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  netLabel: { fontSize: fontSize.sm, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  netValue: { fontSize: fontSize.xxl, fontWeight: '900', letterSpacing: -0.5 },
  btnRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
});
