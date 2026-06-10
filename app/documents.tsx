import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { fontSize, radius, SCREEN_BOTTOM_INSET, spacing } from '@/constants/theme';
import { api, ApiResponse } from '@/lib/api';
import { Badge, Button, Card, EmptyState, ErrorText, Loader, ScreenHeader, useTheme } from '@/components/ui';

const DOC_TYPES = [
  { key: 'DRIVERS_LICENSE', label: 'Ehliyet' },
  { key: 'VEHICLE_REGISTRATION', label: 'Ruhsat' },
  { key: 'SRC_CERTIFICATE', label: 'SRC Belgesi' },
] as const;

const statusLabels: Record<string, string> = {
  PENDING: 'İnceleniyor',
  APPROVED: 'Onaylandı',
  REJECTED: 'Reddedildi',
};

export default function DocumentsScreen() {
  const theme = useTheme();
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<Record<string, unknown>[]>>('/user-documents/me');
      setItems(res.data ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function uploadDocument(type: string) {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError('Galeri izni gerekli.');
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (picked.canceled || !picked.assets[0]) return;

    setUploading(type);
    setError(null);
    try {
      const asset = picked.assets[0];
      const form = new FormData();
      form.append('file', {
        uri: asset.uri,
        name: 'document.jpg',
        type: 'image/jpeg',
      } as unknown as Blob);

      const uploadRes = await api.upload<ApiResponse<{ url: string }> & { data?: { url: string } }>(
        '/storage/verification-documents',
        form,
      );
      const fileUrl = uploadRes.data?.url ?? (uploadRes as { data?: { url: string } }).data?.url;
      if (!fileUrl) throw new Error('Yükleme başarısız');

      await api.post('/user-documents', { type, fileUrl });
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(null);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.backgroundSecondary }]} edges={['top']}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={{ gap: spacing.lg }}>
            <ScreenHeader eyebrow="Doğrulama" title="Belgelerim" icon="document-text" />
            <Card>
              <Text style={{ color: theme.textSecondary, lineHeight: 22 }}>
                Şoför ve plaka sahibi doğrulaması için ehliyet, ruhsat ve SRC belgelerinizi yükleyin.
              </Text>
            </Card>
            {DOC_TYPES.map((doc) => (
              <Button
                key={doc.key}
                title={`${doc.label} Yükle`}
                icon="cloud-upload-outline"
                loading={uploading === doc.key}
                onPress={() => uploadDocument(doc.key)}
              />
            ))}
            {error ? <ErrorText>{error}</ErrorText> : null}
          </View>
        }
        ListEmptyComponent={loading ? <Loader /> : <EmptyState icon="document-outline" title="Belge yok" message="Henüz belge yüklemediniz." />}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={{ color: theme.text, fontWeight: '800' }}>{String(item.type)}</Text>
            <Badge label={statusLabels[String(item.status)] ?? String(item.status)} tone={item.status === 'APPROVED' ? 'success' : item.status === 'REJECTED' ? 'danger' : 'warning'} />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: SCREEN_BOTTOM_INSET, gap: spacing.sm },
  card: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
});
