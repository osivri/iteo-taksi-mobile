import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { IteoColors } from '@/constants/Colors';
import { fontSize, radius, SCREEN_BOTTOM_INSET, shadow, spacing } from '@/constants/theme';
import { api, ApiResponse } from '@/lib/api';
import { Badge, Button, Card, EmptyState, ErrorText, Field, Loader, ScreenHeader, SegmentedControl, useTheme } from '@/components/ui';

interface Appointment {
  id: string;
  type: string;
  status: string;
  requestedDate: string;
  description: string | null;
  plateNumber: string | null;
  serviceType: string | null;
}

type TabType = 'HOTEL' | 'AUTO_SERVICE';

const typeLabels: Record<string, string> = { HOTEL: 'Otel', AUTO_SERVICE: 'Oto Servis' };

const statusLabels: Record<string, string> = {
  PENDING: 'Beklemede',
  APPROVED: 'Onaylandı',
  REJECTED: 'Reddedildi',
  COMPLETED: 'Tamamlandı',
  CANCELLED: 'İptal',
};

const statusTone: Record<string, 'success' | 'danger' | 'warning' | 'neutral'> = {
  APPROVED: 'success',
  COMPLETED: 'success',
  REJECTED: 'danger',
  CANCELLED: 'danger',
  PENDING: 'warning',
};

export default function AppointmentsScreen() {
  const theme = useTheme();
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabType>('HOTEL');
  const [description, setDescription] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [serviceType, setServiceType] = useState('Periyodik bakım');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await api.get<ApiResponse<Appointment> & { items: Appointment[] }>('/appointments');
    setItems(res.items ?? []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load()
        .catch((e) => setError((e as Error).message))
        .finally(() => setLoading(false));
    }, [load]),
  );

  async function createRequest() {
    setSaving(true);
    setError(null);
    try {
      if (tab === 'HOTEL') {
        await api.post('/appointments', { type: 'HOTEL', requestedDate: new Date().toISOString(), description, guestCount: 2 });
        setDescription('');
      } else {
        await api.post('/appointments', { type: 'AUTO_SERVICE', requestedDate: new Date().toISOString(), description, plateNumber, serviceType });
        setDescription('');
        setPlateNumber('');
      }
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function cancelAppointment(id: string) {
    try {
      await api.patch(`/appointments/${id}/cancel`, {});
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.backgroundSecondary }]} edges={['top']}>
      <FlatList
        data={loading ? [] : items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ gap: spacing.lg }}>
            <ScreenHeader eyebrow="Oda Hizmetleri" title="Randevu" icon="calendar" />
            <Card>
              <SegmentedControl
                value={tab}
                onChange={setTab}
                options={[
                  { value: 'HOTEL', label: 'Otel' },
                  { value: 'AUTO_SERVICE', label: 'Oto Servis' },
                ]}
                style={{ marginBottom: spacing.lg }}
              />
              {tab === 'AUTO_SERVICE' ? (
                <>
                  <Field label="Plaka" icon="car-outline" placeholder="34 ABC 123" value={plateNumber} onChangeText={setPlateNumber} autoCapitalize="characters" />
                  <Field label="Servis Türü" placeholder="Servis türü" value={serviceType} onChangeText={setServiceType} />
                </>
              ) : null}
              <Field
                label="Açıklama"
                placeholder={tab === 'HOTEL' ? 'Otel talep notu' : 'Ek not'}
                value={description}
                onChangeText={setDescription}
              />
              <Button
                title={saving ? 'Gönderiliyor...' : tab === 'HOTEL' ? 'Otel Talebi Oluştur' : 'Servis Talebi Oluştur'}
                icon="paper-plane-outline"
                loading={saving}
                onPress={createRequest}
              />
            </Card>
            {error ? <ErrorText>{error}</ErrorText> : null}
          </View>
        }
        ListEmptyComponent={loading ? <Loader /> : <EmptyState icon="calendar-outline" title="Talep yok" message="Henüz randevu talebiniz bulunmuyor." />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={({ item }) => (
          <View
            style={[
              styles.card,
              { backgroundColor: theme.card, borderColor: theme.border },
              theme.scheme === 'light' ? shadow.card : null,
            ]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>{typeLabels[item.type] ?? item.type}</Text>
              <Badge label={statusLabels[item.status] ?? item.status} tone={statusTone[item.status] ?? 'neutral'} />
            </View>
            <Text style={{ color: theme.textSecondary, marginTop: spacing.sm, fontSize: fontSize.sm }}>
              {new Date(item.requestedDate).toLocaleDateString('tr-TR')}
              {item.plateNumber ? ` · ${item.plateNumber}` : ''}
            </Text>
            {item.description ? (
              <Text style={{ color: theme.text, marginTop: spacing.sm, lineHeight: 20 }}>{item.description}</Text>
            ) : null}
            {item.status === 'PENDING' ? (
              <Pressable onPress={() => cancelAppointment(item.id)} hitSlop={6} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>İptal Et</Text>
              </Pressable>
            ) : null}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: SCREEN_BOTTOM_INSET },
  card: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: fontSize.lg, fontWeight: '800' },
  cancelBtn: { marginTop: spacing.md, alignSelf: 'flex-start' },
  cancelText: { color: IteoColors.error, fontWeight: '800', fontSize: fontSize.sm },
});
