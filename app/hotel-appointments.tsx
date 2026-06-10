import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { IteoColors } from '@/constants/Colors';
import { fontSize, radius, SCREEN_BOTTOM_INSET, shadow, spacing } from '@/constants/theme';
import { useAppointmentsList } from '@/hooks/queries/lists';
import { queryKeys } from '@/hooks/queries/keys';
import { api } from '@/lib/api';
import { MemberSubpageToolbar } from '@/components/MemberSubpageToolbar';
import { ModulePageHero } from '@/components/ModulePageHero';
import { Badge, Button, Card, EmptyState, ErrorText, Field, Loader, useTheme } from '@/components/ui';

interface Appointment {
  id: string;
  type: string;
  status: string;
  requestedDate: string;
  description: string | null;
  guestCount: number | null;
}

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

export default function HotelAppointmentsScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const appointmentsQuery = useAppointmentsList();
  const allItems = (appointmentsQuery.data ?? []) as Appointment[];
  const items = allItems.filter((a) => a.type === 'HOTEL');
  const loading = appointmentsQuery.isLoading && items.length === 0;
  const [description, setDescription] = useState('');
  const [guestCount, setGuestCount] = useState(2);
  const [requestedDate, setRequestedDate] = useState(new Date());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function shiftDate(days: number) {
    const next = new Date(requestedDate);
    next.setDate(next.getDate() + days);
    setRequestedDate(next);
  }

  async function createRequest() {
    if (!description.trim()) {
      setError('Açıklama zorunludur.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const dateIso = requestedDate.toISOString();
      await api.post('/appointments', {
        type: 'HOTEL',
        requestedDate: dateIso,
        description: description.trim(),
        guestCount,
      });
      setDescription('');
      await queryClient.invalidateQueries({ queryKey: queryKeys.appointments });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function cancelAppointment(id: string) {
    try {
      await api.patch(`/appointments/${id}/cancel`, {});
      await queryClient.invalidateQueries({ queryKey: queryKeys.appointments });
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.backgroundSecondary }]} edges={['top']}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ gap: spacing.lg }}>
            <MemberSubpageToolbar />
            <ModulePageHero badge="Konaklama" title="Otel Rezervasyonu" description="Oda üyesi konaklama talebi oluşturun ve rezervasyonlarınızı görün." icon="business" />
            <Card>
              <View style={styles.dateRow}>
                <Button title="-" variant="ghost" onPress={() => shiftDate(-1)} />
                <Text style={{ color: theme.text, fontWeight: '800', flex: 1, textAlign: 'center' }}>
                  {requestedDate.toLocaleDateString('tr-TR')}
                </Text>
                <Button title="+" variant="ghost" onPress={() => shiftDate(1)} />
              </View>
              <View style={styles.dateRow}>
                <Text style={{ color: theme.text, fontWeight: '700' }}>Kişi sayısı</Text>
                <Button title="-" variant="ghost" onPress={() => setGuestCount((n) => Math.max(1, n - 1))} />
                <Text style={{ color: theme.text, fontWeight: '900' }}>{guestCount}</Text>
                <Button title="+" variant="ghost" onPress={() => setGuestCount((n) => Math.min(10, n + 1))} />
              </View>
              <Field
                label="Açıklama"
                placeholder="Otel talep notu"
                value={description}
                onChangeText={setDescription}
              />
              <Button
                title={saving ? 'Gönderiliyor...' : 'Otel Talebi Oluştur'}
                icon="paper-plane-outline"
                loading={saving}
                onPress={createRequest}
              />
            </Card>
            {error || appointmentsQuery.error ? <ErrorText>{error ?? appointmentsQuery.error?.message}</ErrorText> : null}
          </View>
        }
        ListEmptyComponent={
          loading ? <Loader /> : <EmptyState icon="business-outline" title="Rezervasyon yok" message="Henüz otel talebiniz bulunmuyor." />
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={({ item }) => (
          <View
            style={[
              styles.card,
              { backgroundColor: theme.card, borderColor: theme.border },
              theme.scheme === 'light' ? shadow.card : null,
            ]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Otel Konaklama</Text>
              <Badge label={statusLabels[item.status] ?? item.status} tone={statusTone[item.status] ?? 'neutral'} />
            </View>
            <Text style={{ color: theme.textSecondary, marginTop: spacing.sm, fontSize: fontSize.sm }}>
              {new Date(item.requestedDate).toLocaleDateString('tr-TR')}
              {item.guestCount ? ` · ${item.guestCount} kişi` : ''}
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
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md, gap: spacing.sm },
});
