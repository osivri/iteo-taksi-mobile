import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import Colors, { IteoColors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { api, ApiResponse } from '@/lib/api';

interface Vehicle {
  id: string;
  plateNumber: string;
  brand: string | null;
  model: string | null;
  status: string;
}

export default function VehiclesScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [plateNumber, setPlateNumber] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await api.get<ApiResponse<Vehicle[]>>('/vehicles');
    setVehicles(res.data ?? []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load()
        .catch((e) => setError((e as Error).message))
        .finally(() => setLoading(false));
    }, [load]),
  );

  async function addVehicle() {
    if (!plateNumber.trim()) return;
    setSaving(true);
    try {
      await api.post('/vehicles', {
        plateNumber: plateNumber.trim().toUpperCase(),
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
      });
      setPlateNumber('');
      setBrand('');
      setModel('');
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function removeVehicle(id: string) {
    Alert.alert('Sil', 'Bu aracı silmek istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/vehicles/${id}`);
            await load();
          } catch (e) {
            setError((e as Error).message);
          }
        },
      },
    ]);
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
      <View style={[styles.form, { backgroundColor: theme.card, borderColor: theme.border }]}>
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
          placeholder="Marka (opsiyonel)"
          placeholderTextColor={theme.textSecondary}
          value={brand}
          onChangeText={setBrand}
        />
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.border }]}
          placeholder="Model (opsiyonel)"
          placeholderTextColor={theme.textSecondary}
          value={model}
          onChangeText={setModel}
        />
        <Pressable style={styles.btn} onPress={addVehicle} disabled={saving}>
          <Text style={styles.btnText}>{saving ? 'Ekleniyor...' : 'Araç Ekle'}</Text>
        </Pressable>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
      {loading ? (
        <ActivityIndicator color={IteoColors.yellow} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          ListEmptyComponent={<Text style={{ color: theme.textSecondary, textAlign: 'center' }}>Kayıtlı araç yok</Text>}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontWeight: '700', fontSize: 16 }}>{item.plateNumber}</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }}>
                  {[item.brand, item.model].filter(Boolean).join(' ') || 'Marka/model belirtilmedi'} · {item.status}
                </Text>
              </View>
              <Pressable onPress={() => removeVehicle(item.id)}>
                <Text style={{ color: '#DC2626', fontWeight: '600' }}>Sil</Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  form: { margin: 16, borderWidth: 1, borderRadius: 14, padding: 16, gap: 10 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  btn: { backgroundColor: IteoColors.yellow, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  btnText: { color: IteoColors.black, fontWeight: '700' },
  error: { color: '#FCA5A5', textAlign: 'center', marginHorizontal: 16 },
  card: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 14 },
});
