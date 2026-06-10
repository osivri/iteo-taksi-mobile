import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { IteoColors } from '@/constants/Colors';
import { fontSize, radius, SCREEN_BOTTOM_INSET, spacing } from '@/constants/theme';
import {
  useAvailableVehicles,
  usePlateRequests,
  useVehiclesList,
  type AvailableVehicle,
  type PlateRequest,
} from '@/hooks/queries/vehicles';
import { queryKeys } from '@/hooks/queries/keys';
import { useProfile } from '@/hooks/useProfile';
import { api } from '@/lib/api';
import { toMemberRole } from '@/lib/dashboard';
import { filterMarketplaceByLocation, formatItemLocationShort } from '@/lib/marketplace-location';
import { MemberSubpageToolbar } from '@/components/MemberSubpageToolbar';
import { ModulePageHero } from '@/components/ModulePageHero';
import { MarketplaceFilterHeader } from '@/components/marketplace/MarketplaceFilterHeader';
import { MarketplaceLocationPicker } from '@/components/MarketplaceLocationPicker';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { Badge, Button, Card, EmptyState, ErrorText, Field, Loader, useTheme } from '@/components/ui';

const requestStatusLabels: Record<string, string> = {
  PENDING: 'Onay bekliyor',
  APPROVED: 'Onaylandı',
  REJECTED: 'Reddedildi',
  CANCELLED: 'İptal',
};

const requestStatusTone: Record<string, 'success' | 'danger' | 'warning' | 'neutral'> = {
  APPROVED: 'success',
  REJECTED: 'danger',
  CANCELLED: 'danger',
  PENDING: 'warning',
};

export function FindVehicleScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const profileQuery = useProfile<{ role: string }>();
  const role = toMemberRole(profileQuery.data?.role);

  const availableQuery = useAvailableVehicles(role === 'DRIVER');
  const vehiclesQuery = useVehiclesList(role === 'DRIVER');
  const requestsQuery = usePlateRequests();

  const available = availableQuery.data ?? [];
  const myVehicles = vehiclesQuery.data ?? [];
  const requests = requestsQuery.data ?? [];

  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pendingInvites = useMemo(
    () => requests.filter((r) => r.status === 'PENDING' && r.initiatedBy === 'OWNER'),
    [requests],
  );

  const filtered = useMemo(() => {
    let list = filterMarketplaceByLocation(available, district, neighborhood);
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (v) =>
        v.plateNumber.toLowerCase().includes(q) ||
        (v.brand?.toLowerCase().includes(q) ?? false) ||
        (v.model?.toLowerCase().includes(q) ?? false) ||
        v.ownerName.toLowerCase().includes(q) ||
        (v.district?.toLowerCase().includes(q) ?? false),
    );
  }, [available, search, district, neighborhood]);

  const resetLocation = () => {
    setDistrict('');
    setNeighborhood('');
  };

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.vehicles });
    await queryClient.invalidateQueries({ queryKey: queryKeys.plateRequests });
    await queryClient.invalidateQueries({ queryKey: queryKeys.availableVehicles });
  }, [queryClient]);

  const loading = availableQuery.isLoading && available.length === 0;

  if (profileQuery.isLoading) return <Loader />;
  if (role !== 'DRIVER') {
    router.replace('/(tabs)');
    return null;
  }

  async function applyToVehicle(vehicleId: string) {
    setActionId(vehicleId);
    setError(null);
    try {
      await api.post('/vehicles/plate-requests/by-vehicle', { vehicleId });
      await invalidate();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setActionId(null);
    }
  }

  async function decideRequest(id: string, decision: 'approve' | 'reject') {
    setActionId(id);
    setError(null);
    try {
      await api.patch(`/vehicles/plate-requests/${id}/${decision}`, {});
      await invalidate();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setActionId(null);
    }
  }

  async function submitPlateRequest() {
    if (!plateNumber.trim()) {
      setError('Plaka alanı zorunludur.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.post('/vehicles/plate-requests', { plateNumber: plateNumber.trim().toUpperCase() });
      setPlateNumber('');
      await invalidate();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.backgroundSecondary }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <MemberSubpageToolbar />
        <ModulePageHero
          badge="Eşleştirme Pazarı"
          title="Araç Bul"
          description="İlçe ve mahalle seçerek boş araçları listeleyin, başvurun veya davetleri yönetin."
          icon="car-sport"
        />

        {error ? <ErrorText>{error}</ErrorText> : null}

        {pendingInvites.length > 0 ? (
          <Card style={{ marginBottom: spacing.sm, borderColor: IteoColors.yellow }}>
            <Text style={[styles.cardTitle, { color: theme.text, marginBottom: spacing.sm }]}>Gelen davetler</Text>
            {pendingInvites.map((r) => (
              <InviteRow key={r.id} request={r} theme={theme} actionId={actionId} onDecide={decideRequest} />
            ))}
          </Card>
        ) : null}

        <Card style={{ marginBottom: spacing.lg }}>
          <MarketplaceFilterHeader
            district={district}
            neighborhood={neighborhood}
            onResetLocation={resetLocation}
            resultCount={filtered.length}
            resultLabel="araç"
            stats={[
              { label: 'boş araç', value: available.length },
              { label: 'davet', value: pendingInvites.length, highlight: pendingInvites.length > 0 },
              { label: 'onaylı', value: myVehicles.length },
            ]}
          />

          <MarketplaceLocationPicker
            items={available}
            district={district}
            neighborhood={neighborhood}
            onDistrictChange={setDistrict}
            onNeighborhoodChange={setNeighborhood}
            onReset={resetLocation}
            entityLabel="araç"
          />

          <Field
            label="Ara"
            icon="search-outline"
            placeholder="Plaka, marka, oda üyesi veya ilçe..."
            value={search}
            onChangeText={setSearch}
          />

          {loading ? (
            <Loader />
          ) : filtered.length === 0 ? (
            <Text style={{ color: theme.textSecondary, fontSize: fontSize.sm }}>
              {available.length === 0 ? 'Şu an başvurulabilir araç yok.' : 'Seçili konum veya arama sonucu bulunamadı.'}
            </Text>
          ) : (
            filtered.map((v) => (
              <VehicleRow key={v.id} vehicle={v} theme={theme} actionId={actionId} onApply={applyToVehicle} />
            ))
          )}
        </Card>

        <CollapsibleSection title="Plaka numarasıyla başvuru (opsiyonel)">
          <Field
            label="Plaka"
            icon="car-outline"
            placeholder="34 ABC 123"
            value={plateNumber}
            onChangeText={(t) => setPlateNumber(t.toUpperCase())}
            autoCapitalize="characters"
          />
          <Button title={saving ? 'Gönderiliyor...' : 'Onay Talebi Gönder'} icon="paper-plane-outline" loading={saving} onPress={submitPlateRequest} />
        </CollapsibleSection>

        <CollapsibleSection title={`Taleplerim (${requests.length})`}>
          {requests.length === 0 ? (
            <EmptyState icon="document-text-outline" title="Talep yok" message="Henüz eşleştirme talebiniz bulunmuyor." />
          ) : (
            requests.map((r) => <RequestHistoryRow key={r.id} request={r} theme={theme} />)
          )}
          <Pressable onPress={() => router.push('/(tabs)/vehicles')} style={{ marginTop: spacing.md }}>
            <Text style={{ color: IteoColors.yellow, fontWeight: '800', fontSize: fontSize.sm }}>Çalışma plakalarım →</Text>
          </Pressable>
        </CollapsibleSection>
      </ScrollView>
    </SafeAreaView>
  );
}

function InviteRow({
  request,
  theme,
  actionId,
  onDecide,
}: {
  request: PlateRequest;
  theme: ReturnType<typeof useTheme>;
  actionId: string | null;
  onDecide: (id: string, decision: 'approve' | 'reject') => void;
}) {
  return (
    <View style={[styles.row, { borderColor: theme.border }]}>
      <View style={styles.flex}>
        <Text style={[styles.plate, { color: theme.text }]}>{request.plateNumber}</Text>
        <Text style={{ color: theme.textSecondary, fontSize: fontSize.xs }}>{request.ownerName ?? 'Oda üyesi'} · Davet</Text>
      </View>
      <View style={styles.actions}>
        <Button title="Kabul" size="md" variant="success" fullWidth={false} loading={actionId === request.id} onPress={() => onDecide(request.id, 'approve')} />
        <Button title="Reddet" size="md" variant="outline" fullWidth={false} disabled={actionId === request.id} onPress={() => onDecide(request.id, 'reject')} />
      </View>
    </View>
  );
}

function VehicleRow({
  vehicle,
  theme,
  actionId,
  onApply,
}: {
  vehicle: AvailableVehicle;
  theme: ReturnType<typeof useTheme>;
  actionId: string | null;
  onApply: (id: string) => void;
}) {
  const location = formatItemLocationShort(vehicle);
  return (
    <View style={[styles.row, { borderColor: theme.border }]}>
      <View style={styles.flex}>
        <Text style={[styles.plate, { color: theme.text }]}>{vehicle.plateNumber}</Text>
        <Text style={{ color: theme.textSecondary, fontSize: fontSize.xs }}>
          {[vehicle.brand, vehicle.model].filter(Boolean).join(' ') || 'Araç bilgisi yok'} · {vehicle.ownerName}
        </Text>
        {location ? (
          <Text style={{ color: theme.textSecondary, fontSize: fontSize.xs, marginTop: 2 }}>📍 {location}</Text>
        ) : null}
      </View>
      {vehicle.hasPendingRequest ? (
        <Badge label="Başvuruldu" tone="warning" />
      ) : (
        <Button title="Başvur" size="md" fullWidth={false} loading={actionId === vehicle.id} onPress={() => onApply(vehicle.id)} />
      )}
    </View>
  );
}

function RequestHistoryRow({ request, theme }: { request: PlateRequest; theme: ReturnType<typeof useTheme> }) {
  return (
    <View style={[styles.row, { borderColor: theme.border }]}>
      <View style={styles.flex}>
        <Text style={[styles.plate, { color: theme.text }]}>{request.plateNumber}</Text>
        <Text style={{ color: theme.textSecondary, fontSize: fontSize.xs }}>
          {(request.initiatedBy ?? 'DRIVER') === 'OWNER' ? 'Davet' : 'Başvuru'} ·{' '}
          {new Date(request.createdAt).toLocaleDateString('tr-TR')}
        </Text>
      </View>
      <Badge label={requestStatusLabels[request.status] ?? request.status} tone={requestStatusTone[request.status] ?? 'neutral'} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: SCREEN_BOTTOM_INSET, gap: spacing.lg },
  flex: { flex: 1 },
  cardTitle: { fontSize: fontSize.lg, fontWeight: '900' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.xs },
  plate: { fontSize: fontSize.md, fontWeight: '900' },
});
