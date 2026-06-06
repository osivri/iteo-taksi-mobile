import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { IteoColors } from '@/constants/Colors';
import { fontSize, radius, SCREEN_BOTTOM_INSET, shadow, spacing } from '@/constants/theme';
import { VirtualRows } from '@/components/VirtualRows';
import { useProfile } from '@/hooks/useProfile';
import {
  useAvailableDrivers,
  useAvailableVehicles,
  usePlateRequests,
  useVehiclesList,
  type AvailableDriver,
  type AvailableVehicle,
  type PlateRequest,
  type Vehicle,
} from '@/hooks/queries/vehicles';
import { queryKeys } from '@/hooks/queries/keys';
import { api } from '@/lib/api';
import { toMemberRole } from '@/lib/dashboard';
import { Badge, Button, Card, EmptyState, ErrorText, Field, Loader, ScreenHeader, SectionTitle, useTheme } from '@/components/ui';

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

export default function VehiclesScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const profileQuery = useProfile<{ role: string }>();
  const role = toMemberRole(profileQuery.data?.role);
  const isDriver = role === 'DRIVER';
  const isOwner = role === 'PLATE_OWNER';

  const vehiclesQuery = useVehiclesList();
  const requestsQuery = usePlateRequests();
  const availableVehiclesQuery = useAvailableVehicles(isDriver);
  const availableDriversQuery = useAvailableDrivers(isOwner);

  const vehicles = vehiclesQuery.data ?? [];
  const requests = requestsQuery.data ?? [];
  const availableVehicles = availableVehiclesQuery.data ?? [];
  const availableDrivers = availableDriversQuery.data ?? [];

  const loading =
    vehiclesQuery.isLoading &&
    requestsQuery.isLoading &&
    vehicles.length === 0 &&
    requests.length === 0;
  const error =
    vehiclesQuery.error?.message ??
    requestsQuery.error?.message ??
    availableVehiclesQuery.error?.message ??
    availableDriversQuery.error?.message ??
    null;

  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [plateNumber, setPlateNumber] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [selectedVehicleForInvite, setSelectedVehicleForInvite] = useState<string | null>(null);

  const invalidateVehicles = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.vehicles });
    await queryClient.invalidateQueries({ queryKey: queryKeys.plateRequests });
    await queryClient.invalidateQueries({ queryKey: queryKeys.availableVehicles });
    await queryClient.invalidateQueries({ queryKey: queryKeys.availableDrivers });
  }, [queryClient]);

  const pendingOwnerRequests = useMemo(
    () => requests.filter((r) => r.status === 'PENDING' && (r.initiatedBy ?? 'DRIVER') === 'DRIVER'),
    [requests],
  );
  const pendingDriverInvites = useMemo(
    () => requests.filter((r) => r.status === 'PENDING' && r.initiatedBy === 'OWNER'),
    [requests],
  );
  const driverlessOwnerVehicles = useMemo(
    () => vehicles.filter((v) => v.status === 'ACTIVE' && !v.activeDriverId),
    [vehicles],
  );

  async function submitDriverRequest() {
    if (!plateNumber.trim()) {
      setActionError('Plaka alanı zorunludur.');
      return;
    }
    setSaving(true);
    setActionError(null);
    try {
      await api.post('/vehicles/plate-requests', { plateNumber: plateNumber.trim().toUpperCase() });
      setPlateNumber('');
      await invalidateVehicles();
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function applyToVehicle(vehicleId: string) {
    setActionId(vehicleId);
    setActionError(null);
    try {
      await api.post('/vehicles/plate-requests/by-vehicle', { vehicleId });
      await invalidateVehicles();
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setActionId(null);
    }
  }

  async function inviteDriver(driverId: string) {
    const driverlessVehicles = vehicles.filter((v) => v.status === 'ACTIVE');
    let vehicleId = selectedVehicleForInvite;
    if (!vehicleId && driverlessVehicles.length === 1) vehicleId = driverlessVehicles[0].id;
    if (!vehicleId) {
      setActionError('Lütfen önce şoför daveti için bir plaka seçin.');
      return;
    }
    setActionId(driverId);
    setActionError(null);
    try {
      await api.post(`/vehicles/${vehicleId}/invite-driver`, { driverId });
      await invalidateVehicles();
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setActionId(null);
    }
  }

  async function addOwnerVehicle() {
    if (!plateNumber.trim()) {
      setActionError('Plaka alanı zorunludur.');
      return;
    }
    setSaving(true);
    setActionError(null);
    try {
      await api.post('/vehicles', {
        plateNumber: plateNumber.trim().toUpperCase(),
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
      });
      setPlateNumber('');
      setBrand('');
      setModel('');
      await invalidateVehicles();
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function decideRequest(id: string, decision: 'approve' | 'reject') {
    setActionId(id);
    setActionError(null);
    try {
      await api.patch(`/vehicles/plate-requests/${id}/${decision}`, {});
      await invalidateVehicles();
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setActionId(null);
    }
  }

  function removeVehicle(id: string) {
    Alert.alert('Sil', 'Bu plakayı silmek istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          setActionId(id);
          try {
            await api.delete(`/vehicles/${id}`);
            await invalidateVehicles();
          } catch (e) {
            setActionError((e as Error).message);
          } finally {
            setActionId(null);
          }
        },
      },
    ]);
  }

  const displayError = actionError ?? error;

  const driverHeader = useMemo(
    () => (
      <View style={{ gap: spacing.lg }}>
        <ScreenHeader
          eyebrow="Eşleştirme"
          title="Çalışma Plakam"
          subtitle="Boş araçlara başvurun veya plaka numarasıyla talep oluşturun."
          icon="car-sport"
        />

        {pendingDriverInvites.length > 0 ? (
          <Card>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Gelen plaka davetleri</Text>
            <VirtualRows
              data={pendingDriverInvites}
              keyExtractor={(r) => r.id}
              renderItem={(r) => <PendingRequestRow request={r} theme={theme} actionId={actionId} onDecide={decideRequest} />}
            />
          </Card>
        ) : null}

        <Card>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Boşta araçlar</Text>
          <Text style={{ color: theme.textSecondary, fontSize: fontSize.sm, marginBottom: spacing.md }}>
            Şoför arayan kayıtlı plakalar. Başvurunuz mal sahibine iletilir.
          </Text>
          {availableVehicles.length === 0 ? (
            <Text style={{ color: theme.textSecondary, fontSize: fontSize.sm }}>Şu an boşta araç bulunmuyor.</Text>
          ) : (
            <VirtualRows
              data={availableVehicles}
              keyExtractor={(v) => v.id}
              renderItem={(v) => (
                <AvailableVehicleRow vehicle={v} theme={theme} actionId={actionId} onApply={applyToVehicle} />
              )}
            />
          )}
        </Card>

        <Card>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Plaka numarasıyla başvur</Text>
          <Field label="Plaka" icon="car-outline" placeholder="34 ABC 123" value={plateNumber} onChangeText={(t) => setPlateNumber(t.toUpperCase())} autoCapitalize="characters" />
          <Button title={saving ? 'Gönderiliyor...' : 'Onay Talebi Gönder'} icon="paper-plane-outline" loading={saving} onPress={submitDriverRequest} />
        </Card>

        {displayError ? <ErrorText>{displayError}</ErrorText> : null}
        <SectionTitle>Taleplerim</SectionTitle>
      </View>
    ),
    [theme, pendingDriverInvites, availableVehicles, plateNumber, saving, actionId, displayError],
  );

  const ownerHeader = useMemo(
    () => (
      <View style={{ gap: spacing.lg }}>
        <ScreenHeader
          eyebrow="Eşleştirme"
          title="Plakalarım"
          subtitle="Boşta şoför bulun veya gelen başvuruları değerlendirin."
          icon="car-sport"
        />

        {pendingOwnerRequests.length > 0 ? (
          <Card>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Gelen şoför başvuruları</Text>
            <VirtualRows
              data={pendingOwnerRequests}
              keyExtractor={(r) => r.id}
              renderItem={(r) => <PendingRequestRow request={r} theme={theme} actionId={actionId} onDecide={decideRequest} />}
            />
          </Card>
        ) : null}

        {driverlessOwnerVehicles.length > 0 && availableDrivers.length > 0 ? (
          <Card>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Boşta şoförler</Text>
            <Text style={{ color: theme.textSecondary, fontSize: fontSize.sm, marginBottom: spacing.md }}>
              Şoför arayan plakanız için uygun adayları davet edin.
            </Text>
            {driverlessOwnerVehicles.length > 1 ? (
              <View style={{ marginBottom: spacing.md, gap: spacing.xs }}>
                <Text style={{ color: theme.textSecondary, fontSize: fontSize.xs, fontWeight: '700' }}>DAVET İÇİN PLAKA SEÇİN</Text>
                <View style={styles.chipRow}>
                  {driverlessOwnerVehicles.map((v) => (
                    <Pressable
                      key={v.id}
                      onPress={() => setSelectedVehicleForInvite(v.id)}
                      style={[
                        styles.chip,
                        {
                          borderColor: selectedVehicleForInvite === v.id ? IteoColors.yellow : theme.border,
                          backgroundColor: selectedVehicleForInvite === v.id ? IteoColors.yellowLight : theme.card,
                        },
                      ]}>
                      <Text style={[styles.chipText, { color: theme.text }]}>{v.plateNumber}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}
            <VirtualRows
              data={availableDrivers}
              keyExtractor={(d) => d.id}
              renderItem={(d) => <AvailableDriverRow driver={d} theme={theme} actionId={actionId} onInvite={inviteDriver} />}
            />
          </Card>
        ) : null}

        <Card>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Yeni plaka ekle</Text>
          <Field label="Plaka" icon="car-outline" placeholder="34 ABC 123" value={plateNumber} onChangeText={(t) => setPlateNumber(t.toUpperCase())} autoCapitalize="characters" />
          <Field label="Marka" placeholder="Opsiyonel" value={brand} onChangeText={setBrand} />
          <Field label="Model" placeholder="Opsiyonel" value={model} onChangeText={setModel} />
          <Button title={saving ? 'Ekleniyor...' : 'Plaka Ekle'} icon="add" loading={saving} onPress={addOwnerVehicle} />
        </Card>

        {displayError ? <ErrorText>{displayError}</ErrorText> : null}
        <SectionTitle>Kayıtlı Plakalarım</SectionTitle>
      </View>
    ),
    [
      theme,
      pendingOwnerRequests,
      driverlessOwnerVehicles,
      availableDrivers,
      selectedVehicleForInvite,
      plateNumber,
      brand,
      model,
      saving,
      actionId,
      displayError,
    ],
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.backgroundSecondary }]} edges={['top']}>
      {isDriver ? (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={driverHeader}
          ListEmptyComponent={loading ? <Loader /> : <EmptyState icon="document-text-outline" title="Talep yok" message="Henüz plaka çalışma talebiniz bulunmuyor." />}
          ItemSeparatorComponent={RowSeparator}
          ListFooterComponent={
            vehicles.length > 0 ? (
              <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
                <SectionTitle>Onaylı çalışma plakalarım</SectionTitle>
                {vehicles.map((v) => (
                  <View key={v.id} style={styles.approvedCard}>
                    <Ionicons name="checkmark-circle" size={20} color={IteoColors.success} />
                    <Text style={styles.approvedPlate}>{v.plateNumber}</Text>
                  </View>
                ))}
              </View>
            ) : null
          }
          renderItem={({ item }) => <RequestRow item={item} theme={theme} />}
        />
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={ownerHeader}
          ListEmptyComponent={
            loading ? <Loader /> : <EmptyState icon="car-outline" title="Kayıtlı plaka yok" message={isOwner ? 'Yukarıdaki formdan ilk plakanızı ekleyin.' : 'Bu bölüm plaka sahipleri içindir.'} />
          }
          ItemSeparatorComponent={RowSeparator}
          renderItem={({ item }) => <VehicleRow item={item} theme={theme} actionId={actionId} onRemove={removeVehicle} />}
        />
      )}
    </SafeAreaView>
  );
}

function RowSeparator() {
  return <View style={{ height: spacing.sm }} />;
}

function PendingRequestRow({
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
    <View style={[styles.pendingRow, { borderColor: theme.border }]}>
      <View style={styles.flex}>
        <Text style={[styles.plate, { color: theme.text }]}>{request.plateNumber}</Text>
        <Text style={{ color: theme.textSecondary, fontSize: fontSize.xs, marginTop: 2 }}>
          {(request.ownerName ?? request.driverName ?? 'Üye') ?? 'Üye'} · {request.initiatedBy === 'OWNER' ? 'Davet' : 'Başvuru'}
        </Text>
      </View>
      <View style={styles.decideRow}>
        <Button title="Kabul" size="md" variant="success" fullWidth={false} loading={actionId === request.id} onPress={() => onDecide(request.id, 'approve')} />
        <Button title="Reddet" size="md" variant="outline" fullWidth={false} disabled={actionId === request.id} onPress={() => onDecide(request.id, 'reject')} />
      </View>
    </View>
  );
}

function AvailableVehicleRow({
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
  return (
    <View style={[styles.marketRow, { borderColor: theme.border }]}>
      <View style={styles.flex}>
        <Text style={[styles.plate, { color: theme.text }]}>{vehicle.plateNumber}</Text>
        <Text style={{ color: theme.textSecondary, fontSize: fontSize.xs, marginTop: 2 }}>
          {[vehicle.brand, vehicle.model].filter(Boolean).join(' ') || 'Araç bilgisi yok'} · {vehicle.ownerName}
        </Text>
      </View>
      {vehicle.hasPendingRequest ? <Badge label="Başvuruldu" tone="warning" /> : <Button title="Başvur" size="md" fullWidth={false} loading={actionId === vehicle.id} onPress={() => onApply(vehicle.id)} />}
    </View>
  );
}

function AvailableDriverRow({
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
  return (
    <View style={[styles.marketRow, { borderColor: theme.border }]}>
      <View style={styles.flex}>
        <Text style={[styles.plate, { color: theme.text }]}>{driver.fullName}</Text>
        <Text style={{ color: theme.textSecondary, fontSize: fontSize.xs, marginTop: 2 }}>
          {[driver.memberNo ? `Üye No: ${driver.memberNo}` : null, driver.phone].filter(Boolean).join(' · ') || 'İletişim bilgisi yok'}
        </Text>
      </View>
      <Button title="Davet Et" size="md" fullWidth={false} loading={actionId === driver.id} onPress={() => onInvite(driver.id)} />
    </View>
  );
}

function RequestRow({ item, theme }: { item: PlateRequest; theme: ReturnType<typeof useTheme> }) {
  return (
    <View style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }, theme.scheme === 'light' ? shadow.card : null]}>
      <View style={styles.plateIcon}>
        <Ionicons name="car-sport" size={20} color={IteoColors.black} />
      </View>
      <View style={styles.flex}>
        <Text style={[styles.plate, { color: theme.text }]}>{item.plateNumber}</Text>
        <Text style={{ color: theme.textSecondary, fontSize: fontSize.xs, marginTop: 2 }}>
          {new Date(item.createdAt).toLocaleDateString('tr-TR')} · {(item.initiatedBy ?? 'DRIVER') === 'OWNER' ? 'Davet' : 'Başvuru'}
        </Text>
      </View>
      <Badge label={requestStatusLabels[item.status] ?? item.status} tone={requestStatusTone[item.status] ?? 'neutral'} />
    </View>
  );
}

function VehicleRow({
  item,
  theme,
  actionId,
  onRemove,
}: {
  item: Vehicle;
  theme: ReturnType<typeof useTheme>;
  actionId: string | null;
  onRemove: (id: string) => void;
}) {
  return (
    <View style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }, theme.scheme === 'light' ? shadow.card : null]}>
      <View style={styles.plateIcon}>
        <Ionicons name="car-sport" size={20} color={IteoColors.black} />
      </View>
      <View style={styles.flex}>
        <Text style={[styles.plate, { color: theme.text }]}>{item.plateNumber}</Text>
        <Text style={{ color: theme.textSecondary, fontSize: fontSize.sm, marginTop: 2 }}>
          {[item.brand, item.model].filter(Boolean).join(' ') || 'Marka/model belirtilmedi'}
        </Text>
        <View style={{ marginTop: spacing.sm, flexDirection: 'row', gap: spacing.xs }}>
          <Badge label={item.status === 'ACTIVE' ? 'Aktif' : item.status} tone={item.status === 'ACTIVE' ? 'success' : 'neutral'} />
          {!item.activeDriverId ? <Badge label="Şoför aranıyor" tone="warning" /> : null}
        </View>
      </View>
      <Pressable onPress={() => onRemove(item.id)} hitSlop={8} style={styles.deleteBtn} disabled={actionId === item.id}>
        <Ionicons name="trash-outline" size={20} color={IteoColors.error} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: SCREEN_BOTTOM_INSET },
  cardTitle: { fontSize: fontSize.lg, fontWeight: '900', marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg },
  marketRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderWidth: 1, borderRadius: radius.md, padding: spacing.md },
  plateIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: IteoColors.yellow, alignItems: 'center', justifyContent: 'center' },
  plate: { fontSize: fontSize.lg, fontWeight: '900', letterSpacing: 0.5 },
  deleteBtn: { padding: spacing.xs },
  pendingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderWidth: 1, borderRadius: radius.md, padding: spacing.md },
  decideRow: { flexDirection: 'row', gap: spacing.sm },
  approvedCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderColor: '#BBF7D0', backgroundColor: '#F0FDF4', borderRadius: radius.lg, padding: spacing.lg },
  approvedPlate: { fontSize: fontSize.lg, fontWeight: '900', color: '#166534', letterSpacing: 0.5 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  chipText: { fontSize: fontSize.sm, fontWeight: '800' },
});
