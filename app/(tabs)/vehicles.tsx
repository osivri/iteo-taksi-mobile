import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { IteoColors } from '@/constants/Colors';
import { fontSize, radius, SCREEN_BOTTOM_INSET, shadow, spacing } from '@/constants/theme';
import { useProfile } from '@/hooks/useProfile';
import { formatVehicleSummary, useVehiclesList, type Vehicle } from '@/hooks/queries/vehicles';
import { normalizeDateInput, parseVehicleYear, vehicleStatusLabels, vehicleStatusTone } from '@/lib/vehicles-shared';
import { queryKeys } from '@/hooks/queries/keys';
import { api } from '@/lib/api';
import { toMemberRole } from '@/lib/dashboard';
import { MemberSubpageToolbar } from '@/components/MemberSubpageToolbar';
import { ModulePageHero } from '@/components/ModulePageHero';
import { Badge, Button, Card, EmptyState, ErrorText, Field, Loader, SectionTitle, useTheme } from '@/components/ui';

export default function VehiclesScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const profileQuery = useProfile<{ role: string }>();
  const role = toMemberRole(profileQuery.data?.role);
  const isDriver = role === 'DRIVER';
  const isOwner = role === 'PLATE_OWNER';

  const vehiclesQuery = useVehiclesList();
  const vehicles = vehiclesQuery.data ?? [];
  const loading = vehiclesQuery.isLoading && vehicles.length === 0;
  const error = vehiclesQuery.error?.message ?? null;

  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [plateNumber, setPlateNumber] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [inspectionExpiry, setInspectionExpiry] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');

  const driverlessCount = useMemo(
    () => vehicles.filter((v) => v.status === 'ACTIVE' && !v.activeDriverId).length,
    [vehicles],
  );

  const invalidateVehicles = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.vehicles });
  }, [queryClient]);

  async function addOwnerVehicle() {
    if (!plateNumber.trim()) {
      setActionError('Plaka alanı zorunludur.');
      return;
    }
    if (year.trim() && parseVehicleYear(year) === undefined) {
      setActionError('Geçerli bir model yılı girin (1980–' + (new Date().getFullYear() + 1) + ').');
      return;
    }
    const inspection = normalizeDateInput(inspectionExpiry);
    const insurance = normalizeDateInput(insuranceExpiry);
    const license = normalizeDateInput(licenseExpiry);
    if ((inspectionExpiry.trim() && !inspection) || (insuranceExpiry.trim() && !insurance) || (licenseExpiry.trim() && !license)) {
      setActionError('Tarihleri YYYY-AA-GG formatında girin.');
      return;
    }
    setSaving(true);
    setActionError(null);
    try {
      await api.post('/vehicles', {
        plateNumber: plateNumber.trim().toUpperCase(),
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
        year: parseVehicleYear(year),
        inspectionExpiry: inspection,
        insuranceExpiry: insurance,
        licenseExpiry: license,
      });
      setPlateNumber('');
      setBrand('');
      setModel('');
      setYear('');
      setInspectionExpiry('');
      setInsuranceExpiry('');
      setLicenseExpiry('');
      await invalidateVehicles();
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setSaving(false);
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

  const marketplaceCta = isDriver ? (
    <Pressable
      onPress={() => router.push('/find-vehicle')}
      style={[styles.cta, { borderColor: IteoColors.yellow, backgroundColor: IteoColors.yellowLight }]}>
      <View style={styles.ctaIcon}>
        <Ionicons name="car-sport" size={22} color={IteoColors.black} />
      </View>
      <View style={styles.flex}>
        <Text style={[styles.ctaTitle, { color: theme.text }]}>Araç Bul</Text>
        <Text style={{ color: theme.textSecondary, fontSize: fontSize.sm }}>
          Boş araçlara başvurun ve gelen davetleri yönetin
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.text} />
    </Pressable>
  ) : isOwner ? (
    <Pressable
      onPress={() => router.push('/find-driver')}
      style={[styles.cta, { borderColor: IteoColors.yellow, backgroundColor: IteoColors.yellowLight }]}>
      <View style={styles.ctaIcon}>
        <Ionicons name="people" size={22} color={IteoColors.black} />
      </View>
      <View style={styles.flex}>
        <Text style={[styles.ctaTitle, { color: theme.text }]}>Şoför Bul</Text>
        <Text style={{ color: theme.textSecondary, fontSize: fontSize.sm }}>
          {driverlessCount > 0
            ? `${driverlessCount} boş plaka için şoför arayın`
            : 'Boş plakanız için şoför daveti gönderin'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.text} />
    </Pressable>
  ) : null;

  const driverHeader = (
    <View style={{ gap: spacing.lg }}>
      <MemberSubpageToolbar showBack={false} />
      <ModulePageHero
        badge="Şoför"
        title="Çalışma Bilgileri"
        description="Onaylı çalışma plakalarınızı görün. Yeni araç aramak için Araç Bul modülünü kullanın."
        icon="car-sport"
      />
      {marketplaceCta}
      {displayError ? <ErrorText>{displayError}</ErrorText> : null}
      <SectionTitle>Onaylı çalışma plakalarım</SectionTitle>
    </View>
  );

  const ownerHeader = (
    <View style={{ gap: spacing.lg }}>
      <MemberSubpageToolbar showBack={false} />
      <ModulePageHero
        badge="Oda Üyesi"
        title="Plakalarım"
        description="Plakalarınızı kaydedin. Şoför eşleştirmesi için Şoför Bul modülüne gidin."
        icon="car-sport"
      />
      {marketplaceCta}
      <Card>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Yeni plaka ekle</Text>
        <Text style={{ color: theme.textSecondary, fontSize: fontSize.sm, marginBottom: spacing.md }}>
          Aracınızı odaya kaydedin
        </Text>
        <Field label="Plaka" icon="car-outline" placeholder="34 ABC 123" value={plateNumber} onChangeText={(t) => setPlateNumber(t.toUpperCase())} autoCapitalize="characters" />
        <View style={styles.fieldRow}>
          <View style={styles.fieldHalf}>
            <Field label="Marka" placeholder="Fiat" value={brand} onChangeText={setBrand} />
          </View>
          <View style={styles.fieldHalf}>
            <Field label="Model" placeholder="Egea" value={model} onChangeText={setModel} />
          </View>
        </View>
        <Field label="Model yılı" placeholder="2020" value={year} onChangeText={setYear} keyboardType="number-pad" />
        <Field label="Muayene bitiş" placeholder="YYYY-AA-GG" value={inspectionExpiry} onChangeText={setInspectionExpiry} />
        <View style={styles.fieldRow}>
          <View style={styles.fieldHalf}>
            <Field label="Sigorta bitiş" placeholder="YYYY-AA-GG" value={insuranceExpiry} onChangeText={setInsuranceExpiry} />
          </View>
          <View style={styles.fieldHalf}>
            <Field label="Ruhsat bitiş" placeholder="YYYY-AA-GG" value={licenseExpiry} onChangeText={setLicenseExpiry} />
          </View>
        </View>
        <Button title={saving ? 'Ekleniyor...' : 'Plaka Ekle'} icon="add" loading={saving} onPress={addOwnerVehicle} />
      </Card>
      {displayError ? <ErrorText>{displayError}</ErrorText> : null}
      <View style={styles.listHeader}>
        <SectionTitle>Kayıtlı Plakalarım</SectionTitle>
        {vehicles.length > 0 ? (
          <Badge
            label={driverlessCount > 0 ? `${driverlessCount} şoför aranıyor` : 'Tümü dolu'}
            tone={driverlessCount > 0 ? 'warning' : 'neutral'}
          />
        ) : null}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.backgroundSecondary }]} edges={['top']}>
      {isDriver ? (
        <FlatList
          data={vehicles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={driverHeader}
          ListEmptyComponent={
            loading ? (
              <Loader />
            ) : (
              <EmptyState
                icon="car-outline"
                title="Onaylı plaka yok"
                message="Araç Bul modülünden boş plakalara başvurabilirsiniz."
              />
            )
          }
          ItemSeparatorComponent={RowSeparator}
          renderItem={({ item }) => <ApprovedVehicleRow item={item} />}
        />
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={ownerHeader}
          ListEmptyComponent={
            loading ? (
              <Loader />
            ) : (
              <EmptyState icon="car-outline" title="Kayıtlı plaka yok" message="Yukarıdaki formdan ilk plakanızı ekleyin." />
            )
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

function ApprovedVehicleRow({ item }: { item: Vehicle }) {
  return (
    <View style={styles.approvedCard}>
      <Ionicons name="checkmark-circle" size={20} color={IteoColors.success} />
      <View style={styles.flex}>
        <Text style={styles.approvedPlate}>{item.plateNumber}</Text>
        <Text style={{ color: '#166534', fontSize: fontSize.xs, marginTop: 2 }}>
          Onaylı · {vehicleStatusLabels[item.status] ?? item.status} · {formatVehicleSummary(item)}
        </Text>
      </View>
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
          {formatVehicleSummary(item)}
        </Text>
        <View style={{ marginTop: spacing.sm, flexDirection: 'row', gap: spacing.xs }}>
          <Badge label={vehicleStatusLabels[item.status] ?? item.status} tone={vehicleStatusTone(item.status)} />
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
  cardTitle: { fontSize: fontSize.lg, fontWeight: '900', marginBottom: spacing.xs },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, flexWrap: 'wrap' },
  fieldRow: { flexDirection: 'row', gap: spacing.sm },
  fieldHalf: { flex: 1 },
  cta: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg },
  ctaIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: IteoColors.black, alignItems: 'center', justifyContent: 'center' },
  ctaTitle: { fontSize: fontSize.md, fontWeight: '900' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg },
  plateIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: IteoColors.yellow, alignItems: 'center', justifyContent: 'center' },
  plate: { fontSize: fontSize.lg, fontWeight: '900', letterSpacing: 0.5 },
  deleteBtn: { padding: spacing.xs },
  approvedCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderColor: '#BBF7D0', backgroundColor: '#F0FDF4', borderRadius: radius.lg, padding: spacing.lg },
  approvedPlate: { fontSize: fontSize.lg, fontWeight: '900', color: '#166534', letterSpacing: 0.5 },
});
