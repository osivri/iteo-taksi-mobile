import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { IteoColors } from '@/constants/Colors';
import { fontSize, radius, SCREEN_BOTTOM_INSET, shadow, spacing } from '@/constants/theme';
import {
  useAvailableDrivers,
  usePlateRequests,
  useVehiclesList,
  type AvailableDriver,
  type PlateRequest,
} from '@/hooks/queries/vehicles';
import { queryKeys } from '@/hooks/queries/keys';
import { useProfile } from '@/hooks/useProfile';
import { api } from '@/lib/api';
import { toMemberRole } from '@/lib/dashboard';
import { MemberSubpageToolbar } from '@/components/MemberSubpageToolbar';
import { ModulePageHero } from '@/components/ModulePageHero';
import { MarketplaceLocationPicker } from '@/components/MarketplaceLocationPicker';
import { Badge, Button, Card, EmptyState, ErrorText, Field, Loader, useTheme } from '@/components/ui';
import { filterMarketplaceByLocation, formatItemLocationShort } from '@/lib/marketplace-location';

const requestStatusLabels: Record<string, string> = {
  PENDING: 'Onay bekliyor',
  APPROVED: 'Onaylandı',
  REJECTED: 'Reddedildi',
  CANCELLED: 'İptal',
};

export function FindDriverScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const profileQuery = useProfile<{ role: string }>();
  const role = toMemberRole(profileQuery.data?.role);

  const vehiclesQuery = useVehiclesList(role === 'PLATE_OWNER');
  const requestsQuery = usePlateRequests();
  const driversQuery = useAvailableDrivers(role === 'PLATE_OWNER');

  const vehicles = vehiclesQuery.data ?? [];
  const requests = requestsQuery.data ?? [];
  const drivers = driversQuery.data ?? [];

  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const driverlessVehicles = useMemo(
    () => vehicles.filter((v) => v.status === 'ACTIVE' && !v.activeDriverId),
    [vehicles],
  );

  const pendingApplications = useMemo(
    () => requests.filter((r) => r.status === 'PENDING' && (r.initiatedBy ?? 'DRIVER') === 'DRIVER'),
    [requests],
  );

  const filteredDrivers = useMemo(() => {
    let list = filterMarketplaceByLocation(drivers, district, neighborhood);
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (d) =>
        d.fullName.toLowerCase().includes(q) ||
        (d.memberNo?.toLowerCase().includes(q) ?? false) ||
        (d.phone?.toLowerCase().includes(q) ?? false) ||
        (d.district?.toLowerCase().includes(q) ?? false),
    );
  }, [drivers, search, district, neighborhood]);

  const effectiveVehicleId = selectedVehicleId || driverlessVehicles[0]?.id || '';

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.vehicles });
    await queryClient.invalidateQueries({ queryKey: queryKeys.plateRequests });
    await queryClient.invalidateQueries({ queryKey: queryKeys.availableDrivers });
  }, [queryClient]);

  const loading =
    (vehiclesQuery.isLoading || driversQuery.isLoading) && vehicles.length === 0 && drivers.length === 0;

  if (profileQuery.isLoading) return <Loader />;
  if (role !== 'PLATE_OWNER') {
    router.replace('/(tabs)');
    return null;
  }

  async function inviteDriver(driverId: string) {
    if (!effectiveVehicleId) {
      setError('Davet için önce boş bir plaka seçin.');
      return;
    }
    setActionId(driverId);
    setError(null);
    try {
      await api.post(`/vehicles/${effectiveVehicleId}/invite-driver`, { driverId });
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

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.backgroundSecondary }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <MemberSubpageToolbar />
        <ModulePageHero
          badge="Eşleştirme Pazarı"
          title="Şoför Bul"
          description="Boş plakanız için onaylı şoförlere davet gönderin veya gelen başvuruları yönetin."
          icon="people"
        />

        {error ? <ErrorText>{error}</ErrorText> : null}

        {pendingApplications.length > 0 ? (
          <Card style={{ marginBottom: spacing.sm, borderColor: IteoColors.yellow }}>
            <Text style={[styles.cardTitle, { color: theme.text, marginBottom: spacing.sm }]}>Gelen başvurular</Text>
            {pendingApplications.map((r) => (
              <PendingRow key={r.id} request={r} theme={theme} actionId={actionId} onDecide={decideRequest} />
            ))}
          </Card>
        ) : null}

        {driverlessVehicles.length === 0 ? (
          <Card>
            <EmptyState icon="car-outline" title="Boş plaka yok" message="Önce Plakalarım bölümünden plaka ekleyin." />
            <Button title="Plakalarım" icon="car-sport-outline" onPress={() => router.push('/(tabs)/vehicles')} />
          </Card>
        ) : (
          <Card>
            <View style={styles.statsRow}>
              <StatPill label="Boş plaka" value={driverlessVehicles.length} theme={theme} />
              <StatPill label="Şoför" value={drivers.length} theme={theme} />
              <StatPill label="Başvuru" value={pendingApplications.length} theme={theme} highlight={pendingApplications.length > 0} />
            </View>

            <Text style={[styles.meta, { color: theme.textSecondary }]}>
              {filteredDrivers.length} şoför listeleniyor
            </Text>

            <Text style={[styles.sectionLabel, { color: theme.text }]}>Davet plakası</Text>
            <View style={styles.chipRow}>
              {driverlessVehicles.map((v) => (
                <Pressable
                  key={v.id}
                  onPress={() => setSelectedVehicleId(v.id)}
                  style={[
                    styles.chip,
                    {
                      borderColor: effectiveVehicleId === v.id ? IteoColors.yellow : theme.border,
                      backgroundColor: effectiveVehicleId === v.id ? IteoColors.yellowLight : theme.card,
                    },
                  ]}>
                  <Text style={[styles.chipText, { color: theme.text }]}>{v.plateNumber}</Text>
                </Pressable>
              ))}
            </View>

            <MarketplaceLocationPicker
              items={drivers}
              district={district}
              neighborhood={neighborhood}
              onDistrictChange={setDistrict}
              onNeighborhoodChange={setNeighborhood}
              onReset={() => {
                setDistrict('');
                setNeighborhood('');
              }}
              entityLabel="şoför"
            />

            <Field
              label="Ara"
              icon="search-outline"
              placeholder="İsim, üye no, telefon..."
              value={search}
              onChangeText={setSearch}
            />

            {loading ? (
              <Loader />
            ) : filteredDrivers.length === 0 ? (
              <Text style={{ color: theme.textSecondary, fontSize: fontSize.sm, marginTop: spacing.sm }}>
                {drivers.length === 0 ? 'Şu an boşta şoför yok.' : 'Seçili konum veya arama sonucu bulunamadı.'}
              </Text>
            ) : (
              filteredDrivers.map((d) => (
                <DriverRow key={d.id} driver={d} theme={theme} actionId={actionId} onInvite={inviteDriver} />
              ))
            )}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatPill({
  label,
  value,
  theme,
  highlight,
}: {
  label: string;
  value: number;
  theme: ReturnType<typeof useTheme>;
  highlight?: boolean;
}) {
  return (
    <View
      style={[
        styles.statPill,
        {
          backgroundColor: highlight ? IteoColors.yellowLight : theme.card,
          borderColor: highlight ? IteoColors.yellow : theme.border,
        },
      ]}>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

function PendingRow({
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
        <Text style={{ color: theme.textSecondary, fontSize: fontSize.xs }}>{request.driverName ?? 'Şoför'} · Başvuru</Text>
      </View>
      <View style={styles.actions}>
        <Button title="Onayla" size="md" variant="success" fullWidth={false} loading={actionId === request.id} onPress={() => onDecide(request.id, 'approve')} />
        <Button title="Reddet" size="md" variant="outline" fullWidth={false} disabled={actionId === request.id} onPress={() => onDecide(request.id, 'reject')} />
      </View>
    </View>
  );
}

function DriverRow({
  driver,
  theme,
  actionId,
  onInvite,
}: {
  driver: AvailableDriver;
  theme: ReturnType<typeof useTheme>;
  actionId: string | null;
  onInvite: (id: string) => void;
}) {
  const location = formatItemLocationShort(driver);
  return (
    <View style={[styles.row, { borderColor: theme.border }]}>
      <View style={styles.flex}>
        <Text style={[styles.plate, { color: theme.text }]}>{driver.fullName}</Text>
        <Text style={{ color: theme.textSecondary, fontSize: fontSize.xs }}>
          {[driver.memberNo ? `Üye No: ${driver.memberNo}` : null, driver.phone].filter(Boolean).join(' · ') || 'İletişim yok'}
        </Text>
        {location ? (
          <Text style={{ color: theme.textSecondary, fontSize: fontSize.xs, marginTop: 2 }}>📍 {location}</Text>
        ) : null}
      </View>
      <Button title="Davet" size="md" fullWidth={false} loading={actionId === driver.id} onPress={() => onInvite(driver.id)} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: SCREEN_BOTTOM_INSET, gap: spacing.lg },
  flex: { flex: 1 },
  cardTitle: { fontSize: fontSize.lg, fontWeight: '900', marginBottom: spacing.md },
  meta: { fontSize: fontSize.xs, fontWeight: '700', marginBottom: spacing.sm },
  sectionLabel: { fontSize: fontSize.sm, fontWeight: '800', marginBottom: spacing.xs },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  statPill: { flex: 1, borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center' },
  statValue: { fontSize: fontSize.xl, fontWeight: '900' },
  statLabel: { fontSize: fontSize.xs, marginTop: 2, textAlign: 'center' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  chipText: { fontSize: fontSize.sm, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.xs },
  plate: { fontSize: fontSize.md, fontWeight: '900' },
});
