import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Colors, { IteoColors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { api, ApiResponse } from '@/lib/api';

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

const typeLabels: Record<string, string> = {
  HOTEL: 'Otel',
  AUTO_SERVICE: 'Oto Servis',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Beklemede',
  APPROVED: 'Onaylandı',
  REJECTED: 'Reddedildi',
  COMPLETED: 'Tamamlandı',
  CANCELLED: 'İptal',
};

export default function AppointmentsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
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
        await api.post('/appointments', {
          type: 'HOTEL',
          requestedDate: new Date().toISOString(),
          description,
          guestCount: 2,
        });
        setDescription('');
      } else {
        await api.post('/appointments', {
          type: 'AUTO_SERVICE',
          requestedDate: new Date().toISOString(),
          description,
          plateNumber,
          serviceType,
        });
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
    <View style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
      <View style={styles.tabs}>
        {(['HOTEL', 'AUTO_SERVICE'] as TabType[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tab, tab === t && styles.tabActive]}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{typeLabels[t]}</Text>
          </Pressable>
        ))}
      </View>

      <View style={[styles.form, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {tab === 'AUTO_SERVICE' && (
          <>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              placeholder="Plaka (34 ABC 123)"
              placeholderTextColor={theme.textSecondary}
              value={plateNumber}
              onChangeText={setPlateNumber}
              autoCapitalize="characters"
            />
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              placeholder="Servis türü"
              placeholderTextColor={theme.textSecondary}
              value={serviceType}
              onChangeText={setServiceType}
            />
          </>
        )}
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.border }]}
          placeholder={tab === 'HOTEL' ? 'Otel talep notu' : 'Ek not'}
          placeholderTextColor={theme.textSecondary}
          value={description}
          onChangeText={setDescription}
        />
        <Pressable style={styles.btn} onPress={createRequest} disabled={saving}>
          <Text style={styles.btnText}>
            {saving ? 'Gönderiliyor...' : tab === 'HOTEL' ? 'Otel Talebi Oluştur' : 'Servis Talebi Oluştur'}
          </Text>
        </Pressable>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
      {loading ? (
        <ActivityIndicator color={IteoColors.yellow} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          ListEmptyComponent={<Text style={{ color: theme.textSecondary, textAlign: 'center' }}>Talep yok</Text>}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={{ color: theme.text, fontWeight: '600' }}>{typeLabels[item.type] ?? item.type}</Text>
              <Text style={{ color: theme.textSecondary, marginTop: 4 }}>
                {statusLabels[item.status] ?? item.status} ·{' '}
                {new Date(item.requestedDate).toLocaleDateString('tr-TR')}
              </Text>
              {item.plateNumber && (
                <Text style={{ color: theme.textSecondary, marginTop: 2, fontSize: 12 }}>
                  Plaka: {item.plateNumber}
                </Text>
              )}
              {item.status === 'PENDING' && (
                <Pressable onPress={() => cancelAppointment(item.id)} style={styles.cancelBtn}>
                  <Text style={styles.cancelText}>İptal Et</Text>
                </Pressable>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabs: { flexDirection: 'row', margin: 16, marginBottom: 0, gap: 8 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: IteoColors.blackSoft,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: IteoColors.yellow },
  tabText: { color: IteoColors.white, fontWeight: '600', fontSize: 13 },
  tabTextActive: { color: IteoColors.black },
  form: { margin: 16, borderWidth: 1, borderRadius: 14, padding: 16, gap: 10 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  btn: { backgroundColor: IteoColors.yellow, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  btnText: { color: IteoColors.black, fontWeight: '700' },
  error: { color: '#FCA5A5', textAlign: 'center', marginHorizontal: 16 },
  card: { borderWidth: 1, borderRadius: 12, padding: 14 },
  cancelBtn: { marginTop: 10, alignSelf: 'flex-start' },
  cancelText: { color: '#DC2626', fontWeight: '600', fontSize: 13 },
});
