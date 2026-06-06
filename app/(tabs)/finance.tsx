import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { IteoColors } from '@/constants/Colors';
import { fontSize, radius, SCREEN_BOTTOM_INSET, shadow, spacing } from '@/constants/theme';
import { FinanceListHeader } from '@/components/finance/FinanceListHeader';
import { useProfile } from '@/hooks/useProfile';
import { useFinanceRecords, useFinanceSummary, useFinanceTrends } from '@/hooks/queries/finance';
import { useVehiclesList } from '@/hooks/queries/vehicles';
import { api, ApiResponse } from '@/lib/api';
import { appendImageToFormData, pickAndPrepareFromLibrary } from '@/lib/image-upload';
import { FinancePeriod } from '@/lib/date-ranges';
import { Badge, Button, EmptyState, Field, Loader, useTheme } from '@/components/ui';

interface UserProfile {
  role: string;
}

interface ReceiptScanResult {
  amount: number | null;
  recordDate: string | null;
  merchant: string | null;
  category: string | null;
  rawText: string;
  confidence: number;
  provider: string;
}

interface UploadResult {
  url: string;
}

export default function FinanceScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const profileQuery = useProfile<UserProfile>();
  const role = profileQuery.data?.role ?? null;
  const requiresPlate = role === 'DRIVER' || role === 'PLATE_OWNER';
  const vehiclesQuery = useVehiclesList(requiresPlate);

  const [vehicleId, setVehicleId] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [period, setPeriod] = useState<FinancePeriod>('month');
  const [scanModal, setScanModal] = useState(false);
  const [scanResult, setScanResult] = useState<ReceiptScanResult | null>(null);
  const [scanImageUrl, setScanImageUrl] = useState<string | null>(null);
  const [scanCategory, setScanCategory] = useState('');
  const [scanAmount, setScanAmount] = useState('');

  const vehicles = useMemo(
    () => (requiresPlate ? (vehiclesQuery.data ?? []).map((v) => ({ id: v.id, plateNumber: v.plateNumber })) : []),
    [requiresPlate, vehiclesQuery.data],
  );
  const canEnterData = !requiresPlate || Boolean(vehicleId);
  const financeEnabled = !requiresPlate || Boolean(vehicleId);
  const plateById = useMemo(() => Object.fromEntries(vehicles.map((v) => [v.id, v.plateNumber])), [vehicles]);

  useEffect(() => {
    if (!requiresPlate || vehicles.length === 0) return;
    setVehicleId((current) => (vehicles.some((v) => v.id === current) ? current : vehicles[0]?.id ?? ''));
  }, [requiresPlate, vehicles]);

  const recordsQuery = useFinanceRecords(period, vehicleId, financeEnabled);
  const summaryQuery = useFinanceSummary(period, vehicleId, financeEnabled);
  const trendsQuery = useFinanceTrends(period, vehicleId, financeEnabled);

  const records = recordsQuery.data ?? [];
  const summary = summaryQuery.data ?? null;
  const trends = trendsQuery.data ?? [];
  const loading = financeEnabled && recordsQuery.isLoading && records.length === 0;
  const queryError =
    recordsQuery.error?.message ?? summaryQuery.error?.message ?? trendsQuery.error?.message ?? null;

  const invalidateFinance = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['finance'] });
  }, [queryClient]);

  async function addRecord(type: 'INCOME' | 'EXPENSE') {
    if (!amount || !category) return;
    if (requiresPlate && !vehicleId) {
      setActionError('Kayıt oluşturmak için plaka seçmelisiniz.');
      return;
    }
    setSaving(true);
    setActionError(null);
    try {
      await api.post('/finance/records', {
        type,
        amount: parseFloat(amount),
        category,
        recordDate: new Date().toISOString(),
        vehicleId: vehicleId || undefined,
      });
      setAmount('');
      setCategory('');
      await invalidateFinance();
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function scanReceipt() {
    if (requiresPlate && !vehicleId) {
      Alert.alert('Plaka gerekli', 'Fiş yüklemeden önce plaka seçmelisiniz.');
      return;
    }
    const prepared = await pickAndPrepareFromLibrary();
    if (!prepared) {
      Alert.alert('İzin gerekli', 'Fiş taramak için galeri izni verin.');
      return;
    }

    setSaving(true);
    setActionError(null);
    try {
      const formData = new FormData();
      appendImageToFormData(formData, prepared, 'file');
      const upload = await api.upload<ApiResponse<UploadResult>>('/storage/receipts', formData);
      const url = upload.data?.url;
      if (!url) throw new Error('Dosya yüklenemedi');

      const scan = await api.post<ApiResponse<ReceiptScanResult>>('/finance/receipts/scan', { imageUrl: url });
      const ocr = scan.data;
      if (!ocr) throw new Error('Fiş okunamadı. Tutarı manuel girebilirsiniz.');

      setScanImageUrl(url);
      setScanResult(ocr);
      setScanCategory(ocr.category ?? 'Diğer');
      setScanAmount(ocr.amount != null ? String(ocr.amount) : '');
      setScanModal(true);
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function saveFromScan() {
    if (!scanImageUrl || !scanAmount || (requiresPlate && !vehicleId)) return;
    setSaving(true);
    try {
      await api.post('/finance/records/from-receipt', {
        imageUrl: scanImageUrl,
        type: 'EXPENSE',
        category: scanCategory,
        amount: parseFloat(scanAmount),
        saveOcrData: true,
        vehicleId: vehicleId || undefined,
      });
      setScanModal(false);
      setScanResult(null);
      setScanImageUrl(null);
      await invalidateFinance();
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function attachReceipt(recordId: string) {
    const prepared = await pickAndPrepareFromLibrary();
    if (!prepared) {
      Alert.alert('İzin gerekli', 'Fiş yüklemek için galeri izni verin.');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      appendImageToFormData(formData, prepared, 'file');
      const upload = await api.upload<ApiResponse<UploadResult>>('/storage/receipts', formData);
      const url = upload.data?.url;
      if (!url) throw new Error('Dosya yüklenemedi');
      await api.post(`/finance/records/${recordId}/receipt`, { receiptImageUrl: url, runOcr: true });
      await invalidateFinance();
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const header = useMemo(
    () => (
      <FinanceListHeader
        theme={theme}
        requiresPlate={requiresPlate}
        vehicles={vehicles}
        vehicleId={vehicleId}
        onVehicleChange={setVehicleId}
        period={period}
        onPeriodChange={setPeriod}
        summary={summary}
        trends={trends}
        canEnterData={canEnterData}
        saving={saving}
        amount={amount}
        category={category}
        onAmountChange={setAmount}
        onCategoryChange={setCategory}
        onScanReceipt={scanReceipt}
        onAddIncome={() => addRecord('INCOME')}
        onAddExpense={() => addRecord('EXPENSE')}
        error={actionError ?? queryError}
      />
    ),
    [
      theme,
      requiresPlate,
      vehicles,
      vehicleId,
      period,
      summary,
      trends,
      canEnterData,
      saving,
      amount,
      category,
      actionError,
      queryError,
    ],
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.backgroundSecondary }]} edges={['top']}>
      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={header}
        ListEmptyComponent={loading ? <Loader /> : <EmptyState icon="receipt-outline" title="Kayıt yok" message="Henüz gelir/gider kaydı eklenmemiş." />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/finance/${item.id}`)}
            style={({ pressed }) => [
              styles.record,
              { backgroundColor: theme.card, borderColor: theme.border },
              theme.scheme === 'light' ? shadow.card : null,
              pressed ? styles.pressed : null,
            ]}>
            <View style={[styles.recordIcon, { backgroundColor: item.type === 'INCOME' ? '#DCFCE7' : '#FEE2E2' }]}>
              <Ionicons
                name={item.type === 'INCOME' ? 'arrow-up' : 'arrow-down'}
                size={18}
                color={item.type === 'INCOME' ? IteoColors.success : IteoColors.error}
              />
            </View>
            <View style={styles.flex}>
              <Text style={[styles.recordCategory, { color: theme.text }]}>{item.category}</Text>
              <Text style={{ color: theme.textSecondary, fontSize: fontSize.sm, marginTop: 2 }}>
                {new Date(item.recordDate).toLocaleDateString('tr-TR')}
                {item.vehicleId && plateById[item.vehicleId] ? ` · ${plateById[item.vehicleId]}` : ''}
              </Text>
              {item.receiptImageUrl ? (
                <View style={{ marginTop: spacing.sm }}>
                  <Badge label={`Fiş yüklü${item.receiptOcrData?.amount ? ` · ${item.receiptOcrData.amount} ₺` : ''}`} tone="success" />
                </View>
              ) : (
                <Pressable onPress={() => attachReceipt(item.id)} disabled={saving} hitSlop={8}>
                  <Text style={styles.attach}>+ Fiş yükle</Text>
                </Pressable>
              )}
            </View>
            <Text style={[styles.recordAmount, { color: item.type === 'INCOME' ? IteoColors.success : IteoColors.error }]}>
              {item.type === 'INCOME' ? '+' : '-'}
              {item.amount.toLocaleString('tr-TR')} ₺
            </Text>
          </Pressable>
        )}
        ItemSeparatorComponent={ItemSeparator}
      />

      <Modal visible={scanModal} animationType="slide" transparent onRequestClose={() => setScanModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.card }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: theme.text }]}>Fiş Okuma Sonucu</Text>
            {scanResult ? (
              <Text style={{ color: theme.textSecondary, fontSize: fontSize.sm, marginBottom: spacing.sm }}>
                Okuma güveni: %{Math.round(scanResult.confidence * 100)}
                {scanResult.merchant ? ` · ${scanResult.merchant}` : ''}
              </Text>
            ) : null}
            <Field label="Kategori" value={scanCategory} onChangeText={setScanCategory} placeholder="Kategori" />
            <Field label="Tutar" value={scanAmount} onChangeText={setScanAmount} placeholder="Tutar" keyboardType="decimal-pad" />
            <View style={styles.btnRow}>
              <Button title="Kaydet" onPress={saveFromScan} loading={saving} disabled={!scanAmount} style={styles.flex} />
              <Button title="İptal" variant="outline" onPress={() => setScanModal(false)} style={styles.flex} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ItemSeparator() {
  return <View style={{ height: spacing.sm }} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: SCREEN_BOTTOM_INSET },
  record: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg },
  recordIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  recordCategory: { fontSize: fontSize.lg, fontWeight: '800' },
  recordAmount: { fontSize: fontSize.lg, fontWeight: '900' },
  attach: { color: IteoColors.yellowDark, fontSize: fontSize.sm, marginTop: spacing.sm, fontWeight: '800' },
  pressed: { opacity: 0.9, transform: [{ scale: 0.995 }] },
  btnRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, padding: spacing.xl, paddingBottom: spacing.xxxl },
  modalHandle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: '#D4D4D4', marginBottom: spacing.lg },
  modalTitle: { fontSize: fontSize.xl, fontWeight: '900', marginBottom: spacing.xs },
});
