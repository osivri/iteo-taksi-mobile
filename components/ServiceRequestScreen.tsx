import { useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { useServiceRequestsByType } from '@/hooks/queries/lists';
import { useVehiclesList } from '@/hooks/queries/vehicles';
import { queryKeys } from '@/hooks/queries/keys';
import { api } from '@/lib/api';
import { router } from 'expo-router';
import type { ServiceModule } from '@/lib/service-modules';
import { IteoColors } from '@/constants/Colors';
import { fontSize, radius, SCREEN_BOTTOM_INSET, spacing } from '@/constants/theme';
import { MemberSubpageToolbar } from '@/components/MemberSubpageToolbar';
import { ModulePageHero } from '@/components/ModulePageHero';
import { Button, Card, ErrorText, Field, Loader, useTheme } from '@/components/ui';

const statusLabels: Record<string, string> = {
  PENDING: 'Beklemede',
  ASSIGNED: 'Atandı',
  IN_PROGRESS: 'İşlemde',
  COMPLETED: 'Tamamlandı',
  REJECTED: 'Reddedildi',
  CANCELLED: 'İptal',
};

interface Props {
  module: ServiceModule;
}

export function ServiceRequestScreen({ module }: Props) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const requestsQuery = useServiceRequestsByType(module.type);
  const items = requestsQuery.data ?? [];
  const loading = requestsQuery.isLoading && items.length === 0;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const vehiclesQuery = useVehiclesList(module.fields.plate);
  const vehicles = (vehiclesQuery.data ?? []).filter((v) => !v.status || v.status === 'ACTIVE');
  const [vehicleId, setVehicleId] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'new' | 'list'>('new');
  const selectedVehicle = vehicles.find((v) => v.id === vehicleId);

  useEffect(() => {
    if (!vehicleId && vehicles[0]) setVehicleId(vehicles[0].id);
  }, [vehicles, vehicleId]);

  async function submit() {
    if (!title.trim()) {
      setError('Başlık zorunludur.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.post('/service-requests', {
        type: module.type,
        title: title.trim(),
        description: description.trim() || undefined,
        plateNumber: module.fields.plate ? selectedVehicle?.plateNumber : undefined,
        vehicleId: module.fields.plate ? vehicleId || undefined : undefined,
        locationAddress: module.fields.location ? locationAddress.trim() || undefined : undefined,
      });
      setTitle('');
      setDescription('');
      setVehicleId(vehicles[0]?.id ?? '');
      setLocationAddress('');
      setTab('list');
      await queryClient.invalidateQueries({ queryKey: queryKeys.serviceRequests });
      await queryClient.invalidateQueries({ queryKey: queryKeys.serviceRequestsByType(module.type) });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.backgroundSecondary }]} edges={['top']}>
      <View style={styles.top}>
        <MemberSubpageToolbar />
        <ModulePageHero badge="Oda Hizmetleri" title={module.title} description={module.hint} icon={module.icon} />
      </View>
      <View style={styles.tabs}>
        <Button
          title="Yeni Talep"
          variant={tab === 'new' ? 'primary' : 'outline'}
          onPress={() => setTab('new')}
          style={styles.tabBtn}
        />
        <Button
          title="Taleplerim"
          variant={tab === 'list' ? 'primary' : 'outline'}
          onPress={() => setTab('list')}
          style={styles.tabBtn}
        />
      </View>

      {tab === 'new' ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Card>
            <Text style={[styles.hint, { color: theme.textSecondary }]}>{module.hint}</Text>
            <Field label="Başlık" value={title} onChangeText={setTitle} placeholder="Kısa özet" />
            {module.fields.plate && (
              <View style={styles.plateBlock}>
                <Text style={[styles.plateLabel, { color: theme.textSecondary }]}>Plaka</Text>
                {vehicles.length === 0 ? (
                  <View style={[styles.emptyPlate, { borderColor: theme.border, backgroundColor: theme.card }]}>
                    <Text style={[styles.emptyPlateText, { color: theme.textSecondary }]}>
                      Kayıtlı plakanız yok. Önce Plakalarım menüsünden plaka ekleyin.
                    </Text>
                    <Pressable onPress={() => router.push('/(tabs)/vehicles')}>
                      <Text style={styles.plateLink}>Plakalarım →</Text>
                    </Pressable>
                  </View>
                ) : (
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
                )}
              </View>
            )}
            {module.fields.location && (
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
            {error || requestsQuery.error ? <ErrorText>{error ?? requestsQuery.error?.message}</ErrorText> : null}
            <Button title="Talep Gönder" onPress={submit} loading={saving} icon="send" />
          </Card>
        </ScrollView>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={error || requestsQuery.error ? <ErrorText>{error ?? requestsQuery.error?.message}</ErrorText> : null}
          ListEmptyComponent={
            loading ? <Loader /> : <Text style={[styles.empty, { color: theme.textSecondary }]}>Henüz talebiniz yok.</Text>
          }
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item }) => (
            <Card>
              <View style={styles.row}>
                <Text style={[styles.itemTitle, { color: theme.text }]}>{item.title}</Text>
                <Text style={styles.badge}>{statusLabels[item.status] ?? item.status}</Text>
              </View>
              {item.plateNumber ? (
                <Text style={[styles.meta, { color: theme.textSecondary }]}>Plaka: {item.plateNumber}</Text>
              ) : null}
              {item.description ? <Text style={[styles.desc, { color: theme.text }]}>{item.description}</Text> : null}
              <Text style={[styles.date, { color: theme.textSecondary }]}>
                {new Date(item.createdAt).toLocaleString('tr-TR')}
              </Text>
            </Card>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  top: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.md },
  tabs: { flexDirection: 'row', marginHorizontal: spacing.lg, marginBottom: spacing.sm, gap: spacing.sm },
  tabBtn: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: SCREEN_BOTTOM_INSET, gap: spacing.md },
  hint: { fontSize: fontSize.sm, marginBottom: spacing.md },
  plateBlock: { marginBottom: spacing.md },
  plateLabel: { fontSize: fontSize.sm, fontWeight: '700', marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderWidth: 1.5,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipText: { fontWeight: '800', fontSize: fontSize.sm },
  emptyPlate: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  emptyPlateText: { fontSize: fontSize.sm, lineHeight: 20 },
  plateLink: { color: IteoColors.yellowDark, fontWeight: '800', fontSize: fontSize.sm },
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
