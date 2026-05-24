import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Colors, { IteoColors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { api, ApiResponse } from '@/lib/api';
import { FinanceBarChart, FinanceLineChart, PeriodTabs } from '@/components/FinanceUi';
import { FinancePeriod, getPeriodRange } from '@/lib/date-ranges';

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
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
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

  const plateById = useMemo(
    () => Object.fromEntries(vehicles.map((v) => [v.id, v.plateNumber])),
    [vehicles],
  );

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

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

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

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('bucket', 'receipts');
      formData.append('file', {
        uri: asset.uri,
        name: 'receipt.jpg',
        type: asset.mimeType ?? 'image/jpeg',
      } as unknown as Blob);

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

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('bucket', 'receipts');
      formData.append('file', {
        uri: asset.uri,
        name: 'receipt.jpg',
        type: asset.mimeType ?? 'image/jpeg',
      } as unknown as Blob);

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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
      <View style={[styles.header, { backgroundColor: IteoColors.black }]}>
        <Text style={styles.headerTitle}>Muhasebe</Text>
      </View>

      <View style={[styles.form, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {requiresPlate && (
          <View style={[styles.plateBox, { borderColor: IteoColors.yellow }]}>
            <Text style={[styles.plateLabel, { color: theme.text }]}>Plaka Seçin *</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 8 }}>
              Veri girmeden önce hangi plaka için işlem yaptığınızı seçin.
            </Text>
            {vehicles.length === 0 ? (
              <>
                <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Kayıtlı plaka bulunamadı.</Text>
                <Pressable onPress={() => router.push('/vehicles')} style={{ marginTop: 8 }}>
                  <Text style={{ color: IteoColors.yellow, fontWeight: '700' }}>Plaka / Araçlarım →</Text>
                </Pressable>
              </>
            ) : (
              <View style={styles.plateRow}>
                {vehicles.map((v) => {
                  const active = vehicleId === v.id;
                  return (
                    <Pressable
                      key={v.id}
                      onPress={() => {
                        setVehicleId(v.id);
                        setLoading(true);
                      }}
                      style={[
                        styles.plateChip,
                        {
                          backgroundColor: active ? IteoColors.yellow : theme.backgroundSecondary,
                          borderColor: active ? IteoColors.yellow : theme.border,
                        },
                      ]}>
                      <Text style={{ color: active ? IteoColors.black : theme.text, fontWeight: '700', fontSize: 13 }}>
                        {v.plateNumber}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        )}

        <PeriodTabs value={period} onChange={(p) => { setLoading(true); setPeriod(p); }} />
        {summary && (
          <>
            <FinanceBarChart income={summary.totalIncome} expense={summary.totalExpense} currency={summary.currency} />
            <FinanceLineChart points={trends} currency={summary.currency} />
          </>
        )}
        <Pressable style={styles.scanBtn} onPress={scanReceipt} disabled={saving || !canEnterData}>
          <Text style={styles.scanBtnText}>{saving ? 'Okunuyor...' : '📷 Fişi Akıllı Oku'}</Text>
        </Pressable>
        {!canEnterData && requiresPlate && (
          <Text style={{ color: theme.textSecondary, fontSize: 12, textAlign: 'center' }}>
            Veri girmek için plaka seçin.
          </Text>
        )}
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.border, opacity: canEnterData ? 1 : 0.5 }]}
          placeholder="Kategori (ör. Yakıt)"
          placeholderTextColor={theme.textSecondary}
          value={category}
          onChangeText={setCategory}
          editable={canEnterData}
        />
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.border, opacity: canEnterData ? 1 : 0.5 }]}
          placeholder="Tutar"
          placeholderTextColor={theme.textSecondary}
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
          editable={canEnterData}
        />
        <View style={styles.row}>
          <Pressable style={styles.incomeBtn} onPress={() => addRecord('INCOME')} disabled={saving || !canEnterData}>
            <Text style={styles.btnText}>+ Gelir</Text>
          </Pressable>
          <Pressable style={styles.expenseBtn} onPress={() => addRecord('EXPENSE')} disabled={saving || !canEnterData}>
            <Text style={styles.btnText}>- Gider</Text>
          </Pressable>
        </View>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
      {loading ? (
        <ActivityIndicator color={IteoColors.yellow} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          ListEmptyComponent={<Text style={{ color: theme.textSecondary, textAlign: 'center' }}>Kayıt yok</Text>}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/finance/${item.id}`)}
              style={[styles.record, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.recordCategory, { color: theme.text }]}>{item.category}</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                  {item.type === 'INCOME' ? 'Gelir' : 'Gider'} ·{' '}
                  {new Date(item.recordDate).toLocaleDateString('tr-TR')}
                  {item.vehicleId && plateById[item.vehicleId] ? ` · ${plateById[item.vehicleId]}` : ''}
                </Text>
                {item.receiptImageUrl ? (
                  <Text style={{ color: '#16A34A', fontSize: 11, marginTop: 4 }}>
                    Fiş yüklendi{item.receiptOcrData?.amount ? ` · Okunan: ${item.receiptOcrData.amount} ₺` : ''}
                  </Text>
                ) : (
                  <Pressable onPress={() => attachReceipt(item.id)} disabled={saving}>
                    <Text style={{ color: IteoColors.yellow, fontSize: 12, marginTop: 4, fontWeight: '600' }}>
                      Fiş yükle
                    </Text>
                  </Pressable>
                )}
              </View>
              <Text
                style={[
                  styles.recordAmount,
                  { color: item.type === 'INCOME' ? '#16A34A' : '#DC2626' },
                ]}>
                {item.type === 'INCOME' ? '+' : '-'}
                {item.amount.toLocaleString('tr-TR')} ₺
              </Text>
            </Pressable>
          )}
        />
      )}

      <Modal visible={scanModal} animationType="slide" transparent onRequestClose={() => setScanModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Fiş Okuma Sonucu</Text>
            {scanResult && (
              <>
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                  Okuma güveni: %{Math.round(scanResult.confidence * 100)}
                </Text>
                {scanResult.merchant && (
                  <Text style={{ color: theme.text, marginTop: 8 }}>{scanResult.merchant}</Text>
                )}
              </>
            )}
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border, marginTop: 12 }]}
              placeholder="Kategori"
              placeholderTextColor={theme.textSecondary}
              value={scanCategory}
              onChangeText={setScanCategory}
            />
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              placeholder="Tutar"
              placeholderTextColor={theme.textSecondary}
              keyboardType="decimal-pad"
              value={scanAmount}
              onChangeText={setScanAmount}
            />
            <View style={styles.row}>
              <Pressable style={styles.incomeBtn} onPress={saveFromScan} disabled={saving || !scanAmount}>
                <Text style={styles.btnText}>Kaydet</Text>
              </Pressable>
              <Pressable style={styles.expenseBtn} onPress={() => setScanModal(false)}>
                <Text style={styles.btnText}>İptal</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { color: IteoColors.white, fontSize: 20, fontWeight: '700' },
  form: { margin: 16, borderRadius: 14, borderWidth: 1, padding: 16, gap: 10 },
  plateBox: { borderWidth: 1, borderRadius: 12, padding: 12, backgroundColor: 'rgba(255, 199, 0, 0.08)' },
  plateLabel: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  plateRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  plateChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  row: { flexDirection: 'row', gap: 8 },
  incomeBtn: { flex: 1, backgroundColor: '#16A34A', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  expenseBtn: { flex: 1, backgroundColor: '#DC2626', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  btnText: { color: IteoColors.white, fontWeight: '700' },
  scanBtn: {
    backgroundColor: IteoColors.yellow,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  scanBtnText: { color: IteoColors.black, fontWeight: '700' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  error: { color: '#FCA5A5', textAlign: 'center', marginHorizontal: 16 },
  record: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  recordCategory: { fontSize: 15, fontWeight: '600' },
  recordAmount: { fontSize: 16, fontWeight: '700' },
});
