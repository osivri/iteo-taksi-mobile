import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { RemoteImage } from '@/components/RemoteImage';
import { Ionicons } from '@expo/vector-icons';
import { IteoColors } from '@/constants/Colors';
import { fontSize, radius, SCREEN_BOTTOM_INSET, shadow, spacing } from '@/constants/theme';
import { useForgottenItemsList } from '@/hooks/queries/lists';
import { useVehiclesList } from '@/hooks/queries/vehicles';
import { queryKeys } from '@/hooks/queries/keys';
import { api, ApiResponse } from '@/lib/api';
import { appendImageToFormData, prepareImageForUpload } from '@/lib/image-upload';
import { MemberSubpageToolbar } from '@/components/MemberSubpageToolbar';
import { ModulePageHero } from '@/components/ModulePageHero';
import { Badge, Button, Card, EmptyState, ErrorText, Field, Loader, SectionTitle, useTheme } from '@/components/ui';

interface Vehicle {
  id: string;
  plateNumber: string;
}

interface ForgottenItem {
  id: string;
  plateNumber: string;
  description: string;
  photoUrl: string | null;
  status: string;
  adminNote: string | null;
  createdAt: string;
}

interface UploadResult {
  path: string;
  url: string;
}

const statusLabels: Record<string, string> = {
  PENDING: 'Odaya iletildi',
  REVIEWING: 'İnceleniyor',
  RETURNED: 'Teslim edildi',
  CLOSED: 'Kapatıldı',
};

const statusTone: Record<string, 'success' | 'danger' | 'warning' | 'neutral'> = {
  PENDING: 'warning',
  REVIEWING: 'neutral',
  RETURNED: 'success',
  CLOSED: 'neutral',
};

export default function ForgottenItemsScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const itemsQuery = useForgottenItemsList();
  const vehiclesQuery = useVehiclesList();
  const items = itemsQuery.data ?? [];
  const vehicles = (vehiclesQuery.data ?? []) as Vehicle[];
  const loading = itemsQuery.isLoading && items.length === 0;
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [vehicleId, setVehicleId] = useState('');
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoPath, setPhotoPath] = useState<string | null>(null);

  useEffect(() => {
    if (!vehicleId && vehicles[0]) setVehicleId(vehicles[0].id);
  }, [vehicles, vehicleId]);

  async function pickPhoto(source: 'camera' | 'gallery') {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setError(source === 'camera' ? 'Kamera izni gerekli.' : 'Galeri izni gerekli.');
      return;
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.85 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const prepared = await prepareImageForUpload(asset.uri);
    setPhotoUri(prepared.uri);
    setPhotoPath(null);
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      appendImageToFormData(formData, { ...prepared, name: 'forgotten-item.jpg' });

      const upload = await api.upload<ApiResponse<UploadResult>>('/storage/forgotten-items', formData);
      const path = upload.data?.path;
      if (!path) throw new Error('Fotoğraf yüklenemedi');
      setPhotoPath(path);
    } catch (e) {
      setError((e as Error).message);
      setPhotoUri(null);
    } finally {
      setUploading(false);
    }
  }

  function showPhotoOptions() {
    Alert.alert('Fotoğraf ekle', 'Unutulan eşyayı nasıl fotoğraflayacaksınız?', [
      { text: 'Kamera', onPress: () => pickPhoto('camera') },
      { text: 'Galeri', onPress: () => pickPhoto('gallery') },
      { text: 'İptal', style: 'cancel' },
    ]);
  }

  async function submitReport() {
    if (!vehicleId) {
      setError('Plaka seçmelisiniz.');
      return;
    }
    if (!description.trim()) {
      setError('Eşya açıklaması zorunludur.');
      return;
    }
    if (!photoPath) {
      setError('Fotoğraf yüklemelisiniz.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await api.post('/forgotten-items', {
        vehicleId,
        description: description.trim(),
        photoPath,
      });
      setDescription('');
      setPhotoUri(null);
      setPhotoPath(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.forgottenItems });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const header = (
    <View style={{ gap: spacing.lg }}>
      <MemberSubpageToolbar />
      <ModulePageHero
        badge="Oda Hizmeti"
        title="Unutulan Eşya"
        description="Araçta bulunan unutulan eşyayı fotoğraflayıp odaya bildirin."
        icon="briefcase-outline"
      />

      <Card>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Yeni bildirim</Text>

        {vehicles.length === 0 ? (
          <Text style={{ color: theme.textSecondary, fontSize: fontSize.sm }}>
            Bildirim için önce kayıtlı bir plakanız olmalı.
          </Text>
        ) : (
          <>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Plaka</Text>
            <View style={styles.chipRow}>
              {vehicles.map((v) => (
                <Pressable
                  key={v.id}
                  onPress={() => setVehicleId(v.id)}
                  style={[
                    styles.chip,
                    {
                      borderColor: vehicleId === v.id ? IteoColors.yellow : theme.border,
                      backgroundColor: vehicleId === v.id ? IteoColors.yellowLight : theme.card,
                    },
                  ]}>
                  <Text style={[styles.chipText, { color: theme.text }]}>{v.plateNumber}</Text>
                </Pressable>
              ))}
            </View>

            <Field
              label="Eşya açıklaması"
              placeholder="Örn: Siyah deri cüzdan, içinde kimlik var"
              value={description}
              onChangeText={setDescription}
              multiline
            />

            <Text style={[styles.label, { color: theme.textSecondary }]}>Fotoğraf</Text>
            <Pressable onPress={showPhotoOptions} disabled={uploading} style={[styles.photoBox, { borderColor: theme.border }]}>
              {photoUri ? (
                <RemoteImage uri={photoUri} style={styles.photoPreview} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="camera-outline" size={32} color={theme.textSecondary} />
                  <Text style={{ color: theme.textSecondary, marginTop: spacing.sm, fontWeight: '700' }}>
                    Fotoğraf çek veya yükle
                  </Text>
                </View>
              )}
            </Pressable>
            {uploading ? <Text style={{ color: IteoColors.yellowDark, fontWeight: '700' }}>Fotoğraf yükleniyor...</Text> : null}

            <Button
              title={saving ? 'Gönderiliyor...' : 'Odaya Bildir'}
              icon="send-outline"
              loading={saving}
              disabled={uploading || !photoPath}
              onPress={submitReport}
            />
          </>
        )}
      </Card>

      {error || itemsQuery.error ? <ErrorText>{error ?? itemsQuery.error?.message}</ErrorText> : null}
      <SectionTitle>Bildirimlerim</SectionTitle>
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Unutulan Eşya' }} />
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.backgroundSecondary }]} edges={['bottom']}>
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          ListHeaderComponent={header}
          ListEmptyComponent={loading ? <Loader /> : <EmptyState icon="briefcase-outline" title="Bildirim yok" message="Henüz unutulan eşya bildiriminiz bulunmuyor." />}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          renderItem={({ item }) => (
            <View style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }, theme.scheme === 'light' ? shadow.card : null]}>
              {item.photoUrl ? (
                <RemoteImage uri={item.photoUrl} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbPlaceholder]}>
                  <Ionicons name="image-outline" size={20} color={theme.textSecondary} />
                </View>
              )}
              <View style={styles.flex}>
                <Text style={[styles.plate, { color: theme.text }]}>{item.plateNumber}</Text>
                <Text style={{ color: theme.textSecondary, fontSize: fontSize.sm, marginTop: 2 }} numberOfLines={2}>
                  {item.description}
                </Text>
                <View style={{ marginTop: spacing.sm }}>
                  <Badge label={statusLabels[item.status] ?? item.status} tone={statusTone[item.status] ?? 'neutral'} />
                </View>
                {item.adminNote ? (
                  <Text style={{ color: theme.textSecondary, fontSize: fontSize.xs, marginTop: spacing.xs }}>
                    Oda notu: {item.adminNote}
                  </Text>
                ) : null}
              </View>
            </View>
          )}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: SCREEN_BOTTOM_INSET },
  cardTitle: { fontSize: fontSize.lg, fontWeight: '900', marginBottom: spacing.md },
  label: { fontSize: fontSize.xs, fontWeight: '800', letterSpacing: 0.5, marginBottom: spacing.xs, textTransform: 'uppercase' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  chipText: { fontSize: fontSize.sm, fontWeight: '800' },
  photoBox: { borderWidth: 1, borderRadius: radius.lg, overflow: 'hidden', marginBottom: spacing.md, minHeight: 180 },
  photoPreview: { width: '100%', height: 200 },
  photoPlaceholder: { minHeight: 180, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', gap: spacing.md, borderWidth: 1, borderRadius: radius.lg, padding: spacing.md },
  thumb: { width: 72, height: 72, borderRadius: radius.md },
  thumbPlaceholder: { backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  plate: { fontSize: fontSize.md, fontWeight: '900' },
});
