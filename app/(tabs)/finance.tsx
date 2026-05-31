import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { IteoColors } from '@/constants/Colors';
import { fontSize, radius, SCREEN_BOTTOM_INSET, shadow, spacing } from '@/constants/theme';
import { api, ApiResponse } from '@/lib/api';
import { FinanceBarChart, FinanceLineChart, PeriodTabs } from '@/components/FinanceUi';
import { FinancePeriod, getPeriodRange } from '@/lib/date-ranges';
import { Badge, Button, Card, EmptyState, ErrorText, Field, Loader, ScreenHeader, SectionTitle, useTheme } from '@/components/ui';

interface Vehicle {
  id: string;
  plateNumber: string;
}

interface UserProfile {
  role: string;
}

interface FinanceRecord {
  id: string;
  type: string;
  category: string;
  amount: number;
  recordDate: string;
  vehicleId: string | null;
  description: string | null;
  receiptImageUrl: string | null;
  receiptOcrData?: {
    amount: number | null;
    category: string | null;
    merchant: string | null;
    confidence: number;
  } | null;
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
  const [role, setRole] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState('');
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [period, setPeriod] = useState<FinancePeriod>('month');
  const [summary, setSummary] = useState<{ totalIncome: number; totalExpense: number; net: number; currency: string } | null>(null);
  const [trends, setTrends] = useState<Array<{ date: string; income: number; expense: number; net: number }>>([]);
  const [scanModal, setScanModal] = useState(false);
  const [scanResult, setScanResult] = useState<ReceiptScanResult | null>(null);
  const [scanImageUrl, setScanImageUrl] = useState<string | null>(null);
  const [scanCategory, setScanCategory] = useState('');
  const [scanAmount, setScanAmount] = useState('');

  const requiresPlate = role === 'DRIVER' || role === 'PLATE_OWNER';
  const canEnterData = !requiresPlate || Boolean(vehicleId);

  const plateById = useMemo(() => Object.fromEntries(vehicles.map((v) => [v.id, v.plateNumber])), [vehicles]);

  useEffect(() => {
    api
      .get<ApiResponse<UserProfile>>('/users/me')
      .then((res) => setRole(res.data?.role ?? null))
      .catch(() => setRole(null));
  }, []);

  useEffect(() => {
    if (!requiresPlate) return;
    api
      .get<ApiResponse<Vehicle[]>>('/vehicles')
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        setVehicles(list);
        setVehicleId((current) => (list.some((v) => v.id === current) ? current : list[0]?.id ?? ''));
      })
      .catch(() => setVehicles([]));
  }, [requiresPlate]);

  const load = useCallback(async () => {
    if (requiresPlate && !vehicleId) {
      setRecords([]);
      setSummary(null);
      setTrends([]);
      setLoading(false);
      return;
    }
    try {
      const range = getPeriodRange(period);
      const qs = new URLSearchParams({ limit: '20' });
      if (range.from) qs.set('from', range.from);
      if (range.to) qs.set('to', range.to);
      if (vehicleId) qs.set('vehicleId', vehicleId);

      const rangeQs = new URLSearchParams(range.from ? { from: range.from, to: range.to! } : {});
      if (vehicleId) rangeQs.set('vehicleId', vehicleId);
      const summarySuffix = rangeQs.toString() ? `?${rangeQs}` : vehicleId ? `?vehicleId=${vehicleId}` : '';

      const [recordsRes, summaryRes, trendsRes] = await Promise.all([
        api.get<ApiResponse<FinanceRecord> & { items: FinanceRecord[] }>(`/finance/records?${qs}`),
        api.get<ApiResponse<{ totalIncome: number; totalExpense: number; net: number; currency: string }>>(
          `/finance/summary${summarySuffix}`,
        ),
        api.get<ApiResponse<{ points: Array<{ date: string; income: number; expense: number; net: number }> }>>(
          `/finance/trends${summarySuffix}`,
        ),
      ]);

      setRecords(recordsRes.items ?? []);
      setSummary(summaryRes.data ?? null);
      setTrends(trendsRes.data?.points ?? []);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [period, vehicleId, requiresPlate]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function addRecord(type: 'INCOME' | 'EXPENSE') {
    if (!amount || !category) return;
    if (requiresPlate && !vehicleId) {
      setError('Kayıt oluşturmak için plaka seçmelisiniz.');
      return;
    }
    setSaving(true);
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
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function scanReceipt() {
    if (requiresPlate && !vehicleId) {
      Alert.alert('Plaka gerekli', 'Fiş yüklemeden önce plaka seçmelisiniz.');
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('İzin gerekli', 'Fiş taramak için galeri izni verin.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('bucket', 'receipts');
      formData.append('file', { uri: asset.uri, name: 'receipt.jpg', type: asset.mimeType ?? 'image/jpeg' } as unknown as Blob);

      const upload = await api.upload<ApiResponse<UploadResult>>('/storage/upload', formData);
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
      setError((e as Error).message);
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
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function attachReceipt(recordId: string) {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('İzin gerekli', 'Fiş yüklemek için galeri izni verin.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('bucket', 'receipts');
      formData.append('file', { uri: asset.uri, name: 'receipt.jpg', type: asset.mimeType ?? 'image/jpeg' } as unknown as Blob);
      const upload = await api.upload<ApiResponse<UploadResult>>('/storage/upload', formData);
      const url = upload.data?.url;
      if (!url) throw new Error('Dosya yüklenemedi');
      await api.post(`/finance/records/${recordId}/receipt`, { receiptImageUrl: url, runOcr: true });
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const header = (
    <View style={{ gap: spacing.lg }}>
      <ScreenHeader eyebrow="Gelir & Gider" title="Muhasebe" icon="wallet" />

      {requiresPlate ? (
        <Card>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Plaka Seçimi</Text>
          <Text style={[styles.cardHint, { color: theme.textSecondary }]}>
            İşlem yapmadan önce ilgili plakayı seçin.
          </Text>
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
                    onPress={() => { setVehicleId(v.id); setLoading(true); }}
                    style={[
                      styles.plateChip,
                      { backgroundColor: active ? IteoColors.yellow : theme.backgroundSecondary, borderColor: active ? IteoColors.yellow : theme.border },
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
        <PeriodTabs value={period} onChange={(p) => { setLoading(true); setPeriod(p); }} />
        {summary ? (
          <>
            <View style={styles.netRow}>
              <Text style={[styles.netLabel, { color: theme.textSecondary }]}>Net</Text>
              <Text style={[styles.netValue, { color: summary.net >= 0 ? IteoColors.success : IteoColors.error }]}>
                {summary.net >= 0 ? '+' : ''}{summary.net.toLocaleString('tr-TR')} {summary.currency}
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
        <Button title={saving ? 'Okunuyor...' : 'Fişi Akıllı Oku'} icon="camera-outline" onPress={scanReceipt} disabled={saving || !canEnterData} style={{ marginBottom: spacing.md }} />
        {!canEnterData && requiresPlate ? (
          <Text style={[styles.cardHint, { color: theme.textSecondary, textAlign: 'center' }]}>Veri girmek için plaka seçin.</Text>
        ) : null}
        <Field label="Kategori" placeholder="ör. Yakıt" value={category} onChangeText={setCategory} editable={canEnterData} icon="pricetag-outline" />
        <Field label="Tutar" placeholder="0" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} editable={canEnterData} icon="cash-outline" />
        <View style={styles.btnRow}>
          <Button title="Gelir" icon="arrow-up" variant="success" onPress={() => addRecord('INCOME')} disabled={saving || !canEnterData} style={styles.flex} />
          <Button title="Gider" icon="arrow-down" variant="danger" onPress={() => addRecord('EXPENSE')} disabled={saving || !canEnterData} style={styles.flex} />
        </View>
      </Card>

      {error ? <ErrorText>{error}</ErrorText> : null}
      <SectionTitle>Son Kayıtlar</SectionTitle>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.backgroundSecondary }]} edges={['top']}>
      <FlatList
        data={loading ? [] : records}
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
            <View
              style={[
                styles.recordIcon,
                { backgroundColor: item.type === 'INCOME' ? '#DCFCE7' : '#FEE2E2' },
              ]}>
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
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
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

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: SCREEN_BOTTOM_INSET },
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
  record: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg },
  recordIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  recordCategory: { fontSize: fontSize.lg, fontWeight: '800' },
  recordAmount: { fontSize: fontSize.lg, fontWeight: '900' },
  attach: { color: IteoColors.yellowDark, fontSize: fontSize.sm, marginTop: spacing.sm, fontWeight: '800' },
  pressed: { opacity: 0.9, transform: [{ scale: 0.995 }] },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, padding: spacing.xl, paddingBottom: spacing.xxxl },
  modalHandle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: '#D4D4D4', marginBottom: spacing.lg },
  modalTitle: { fontSize: fontSize.xl, fontWeight: '900', marginBottom: spacing.xs },
});
