import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api, ApiResponse } from '@/lib/api';
import { IteoColors } from '@/constants/Colors';
import { fontSize, radius, SCREEN_BOTTOM_INSET, spacing } from '@/constants/theme';
import { Button, Card, ErrorText, Field, Loader, ScreenHeader, useTheme } from '@/components/ui';

type ServiceType = 'TOW' | 'INSURANCE' | 'COMPLAINT' | 'PIRATE_REPORT' | 'PETITION';

interface ServiceRequest {
  id: string;
  type: string;
  status: string;
  title: string;
  description: string | null;
  plateNumber: string | null;
  createdAt: string;
}

const TYPES: { key: ServiceType; label: string; icon: keyof typeof Ionicons.glyphMap; hint: string }[] = [
  { key: 'TOW', label: 'Çekici', icon: 'car-outline', hint: 'Araç arızası veya kaza durumunda çekici talebi' },
  { key: 'INSURANCE', label: 'Sigorta', icon: 'shield-outline', hint: 'Sigorta yaptırma veya yenileme başvurusu' },
  { key: 'COMPLAINT', label: 'Şikayet', icon: 'alert-circle-outline', hint: 'Şikayet ve geri bildirim' },
  { key: 'PIRATE_REPORT', label: 'Korsan İhbar', icon: 'eye-outline', hint: 'Korsan taksi ihbarı' },
  { key: 'PETITION', label: 'Dilekçe', icon: 'document-text-outline', hint: 'Resmi dilekçe / talep' },
];

const statusLabels: Record<string, string> = {
  PENDING: 'Beklemede',
  ASSIGNED: 'Atandı',
  IN_PROGRESS: 'İşlemde',
  COMPLETED: 'Tamamlandı',
  REJECTED: 'Reddedildi',
  CANCELLED: 'İptal',
};

export default function ServicesScreen() {
  const theme = useTheme();
  const [activeType, setActiveType] = useState<ServiceType>('TOW');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [items, setItems] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'new' | 'list'>('new');

  const load = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<ServiceRequest> & { items: ServiceRequest[] }>('/service-requests');
      setItems(res.items ?? []);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function submit() {
    if (!title.trim()) {
      setError('Başlık zorunludur.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.post('/service-requests', {
        type: activeType,
        title: title.trim(),
        description: description.trim() || undefined,
        plateNumber: plateNumber.trim() || undefined,
        locationAddress: locationAddress.trim() || undefined,
      });
      setTitle('');
      setDescription('');
      setPlateNumber('');
      setLocationAddress('');
      setTab('list');
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.backgroundSecondary }]} edges={['top']}>
      <ScreenHeader title="Oda Hizmetleri" subtitle="Çekici, sigorta, şikayet ve dilekçe" icon="business-outline" />
      <View style={styles.tabs}>
        <Pressable style={[styles.tab, tab === 'new' && styles.tabActive]} onPress={() => setTab('new')}>
          <Text style={[styles.tabText, tab === 'new' && styles.tabTextActive]}>Yeni Talep</Text>
        </Pressable>
        <Pressable style={[styles.tab, tab === 'list' && styles.tabActive]} onPress={() => setTab('list')}>
          <Text style={[styles.tabText, tab === 'list' && styles.tabTextActive]}>Taleplerim</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {tab === 'new' ? (
          <Card>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeRow}>
              {TYPES.map((t) => (
                <Pressable
                  key={t.key}
                  style={[styles.typeChip, activeType === t.key && styles.typeChipActive]}
                  onPress={() => setActiveType(t.key)}>
                  <Ionicons name={t.icon} size={18} color={activeType === t.key ? IteoColors.black : theme.textSecondary} />
                  <Text style={[styles.typeChipText, activeType === t.key && styles.typeChipTextActive]}>{t.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text style={[styles.hint, { color: theme.textSecondary }]}>
              {TYPES.find((t) => t.key === activeType)?.hint}
            </Text>
            <Field label="Başlık" value={title} onChangeText={setTitle} placeholder="Kısa özet" />
            <Field label="Plaka" value={plateNumber} onChangeText={setPlateNumber} placeholder="34 ABC 123" />
            {(activeType === 'TOW' || activeType === 'PIRATE_REPORT') && (
              <Field label="Konum / Adres" value={locationAddress} onChangeText={setLocationAddress} placeholder="Bulunduğunuz adres" />
            )}
            <Field
              label="Açıklama"
              value={description}
              onChangeText={setDescription}
              placeholder="Detaylı bilgi"
              multiline
              style={{ minHeight: 88, textAlignVertical: 'top' }}
            />
            {error ? <ErrorText>{error}</ErrorText> : null}
            <Button title="Talep Gönder" onPress={submit} loading={saving} icon="send" />
          </Card>
        ) : loading ? (
          <Loader />
        ) : (
          <>
            {error ? <ErrorText>{error}</ErrorText> : null}
            {items.length === 0 ? (
              <Text style={[styles.empty, { color: theme.textSecondary }]}>Henüz talebiniz yok.</Text>
            ) : (
              items.map((item) => (
                <Card key={item.id}>
                  <View style={styles.row}>
                    <Text style={[styles.itemTitle, { color: theme.text }]}>{item.title}</Text>
                    <Text style={styles.badge}>{statusLabels[item.status] ?? item.status}</Text>
                  </View>
                  <Text style={[styles.meta, { color: theme.textSecondary }]}>
                    {TYPES.find((t) => t.key === item.type)?.label ?? item.type}
                    {item.plateNumber ? ` · ${item.plateNumber}` : ''}
                  </Text>
                  {item.description ? (
                    <Text style={[styles.desc, { color: theme.text }]}>{item.description}</Text>
                  ) : null}
                  <Text style={[styles.date, { color: theme.textSecondary }]}>
                    {new Date(item.createdAt).toLocaleString('tr-TR')}
                  </Text>
                </Card>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  tabs: { flexDirection: 'row', marginHorizontal: spacing.lg, marginBottom: spacing.sm, gap: spacing.sm },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.lg,
    backgroundColor: IteoColors.white,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: IteoColors.yellow },
  tabText: { fontWeight: '700', color: IteoColors.gray500 },
  tabTextActive: { color: IteoColors.black },
  content: { padding: spacing.lg, paddingBottom: SCREEN_BOTTOM_INSET, gap: spacing.md },
  typeRow: { gap: spacing.sm, marginBottom: spacing.md },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: IteoColors.gray100,
  },
  typeChipActive: { backgroundColor: IteoColors.yellowLight },
  typeChipText: { fontWeight: '700', fontSize: fontSize.sm, color: IteoColors.gray500 },
  typeChipTextActive: { color: IteoColors.black },
  hint: { fontSize: fontSize.sm, marginBottom: spacing.md },
  empty: { textAlign: 'center', paddingVertical: spacing.xl },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm },
  itemTitle: { fontWeight: '800', fontSize: fontSize.md, flex: 1 },
  badge: {
    backgroundColor: IteoColors.yellowLight,
    color: IteoColors.black,
    fontSize: fontSize.xs,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  meta: { fontSize: fontSize.sm, marginTop: 4 },
  desc: { fontSize: fontSize.sm, marginTop: spacing.sm },
  date: { fontSize: fontSize.xs, marginTop: spacing.sm },
});
