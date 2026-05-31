import { useCallback, useState } from 'react';

import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { useFocusEffect } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

import { IteoColors } from '@/constants/Colors';

import { fontSize, radius, SCREEN_BOTTOM_INSET, shadow, spacing } from '@/constants/theme';

import { api, ApiResponse } from '@/lib/api';

import { Badge, Button, Card, EmptyState, ErrorText, Field, Loader, ScreenHeader, SectionTitle, useTheme } from '@/components/ui';

import { toMemberRole } from '@/lib/dashboard';



interface Vehicle {

  id: string;

  plateNumber: string;

  brand: string | null;

  model: string | null;

  status: string;

  activeDriverId?: string | null;

}



interface PlateRequest {

  id: string;

  plateNumber: string;

  status: string;

  initiatedBy?: string;

  driverName?: string;

  ownerName?: string;

  createdAt: string;

}



interface AvailableVehicle {

  id: string;

  plateNumber: string;

  brand: string | null;

  model: string | null;

  ownerName: string;

  hasPendingRequest: boolean;

}



interface AvailableDriver {

  id: string;

  fullName: string;

  memberNo: string | null;

  phone: string | null;

}



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

  const [role, setRole] = useState<'DRIVER' | 'PLATE_OWNER' | 'USER'>('USER');

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [requests, setRequests] = useState<PlateRequest[]>([]);

  const [availableVehicles, setAvailableVehicles] = useState<AvailableVehicle[]>([]);

  const [availableDrivers, setAvailableDrivers] = useState<AvailableDriver[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  const [actionId, setActionId] = useState<string | null>(null);



  const [plateNumber, setPlateNumber] = useState('');

  const [brand, setBrand] = useState('');

  const [model, setModel] = useState('');

  const [selectedVehicleForInvite, setSelectedVehicleForInvite] = useState<string | null>(null);



  const isDriver = role === 'DRIVER';

  const isOwner = role === 'PLATE_OWNER';



  const load = useCallback(async () => {

    const profileRes = await api.get<ApiResponse<{ role: string }>>('/users/me');

    const memberRole = toMemberRole(profileRes.data?.role);

    setRole(memberRole);



    const [vehiclesRes, requestsRes] = await Promise.all([

      api.get<ApiResponse<Vehicle[]>>('/vehicles'),

      api.get<ApiResponse<PlateRequest[]>>('/vehicles/plate-requests'),

    ]);

    setVehicles(Array.isArray(vehiclesRes.data) ? vehiclesRes.data : []);

    setRequests(Array.isArray(requestsRes.data) ? requestsRes.data : []);



    if (memberRole === 'DRIVER') {

      const availRes = await api.get<ApiResponse<AvailableVehicle[]>>('/vehicles/marketplace/available-vehicles');

      setAvailableVehicles(Array.isArray(availRes.data) ? availRes.data : []);

      setAvailableDrivers([]);

    } else if (memberRole === 'PLATE_OWNER') {

      const driversRes = await api.get<ApiResponse<AvailableDriver[]>>('/vehicles/marketplace/available-drivers');

      setAvailableDrivers(Array.isArray(driversRes.data) ? driversRes.data : []);

      setAvailableVehicles([]);

    }

  }, []);



  useFocusEffect(

    useCallback(() => {

      setLoading(true);

      load()

        .catch((e) => setError((e as Error).message))

        .finally(() => setLoading(false));

    }, [load]),

  );



  async function submitDriverRequest() {

    if (!plateNumber.trim()) {

      setError('Plaka alanı zorunludur.');

      return;

    }

    setSaving(true);

    setError(null);

    try {

      await api.post('/vehicles/plate-requests', { plateNumber: plateNumber.trim().toUpperCase() });

      setPlateNumber('');

      await load();

    } catch (e) {

      setError((e as Error).message);

    } finally {

      setSaving(false);

    }

  }



  async function applyToVehicle(vehicleId: string) {

    setActionId(vehicleId);

    setError(null);

    try {

      await api.post('/vehicles/plate-requests/by-vehicle', { vehicleId });

      await load();

    } catch (e) {

      setError((e as Error).message);

    } finally {

      setActionId(null);

    }

  }



  async function inviteDriver(driverId: string) {

    const driverlessVehicles = vehicles.filter((v) => v.status === 'ACTIVE');

    let vehicleId = selectedVehicleForInvite;



    if (!vehicleId && driverlessVehicles.length === 1) {

      vehicleId = driverlessVehicles[0].id;

    }



    if (!vehicleId) {

      setError('Lütfen önce şoför daveti için bir plaka seçin.');

      return;

    }



    setActionId(driverId);

    setError(null);

    try {

      await api.post(`/vehicles/${vehicleId}/invite-driver`, { driverId });

      await load();

    } catch (e) {

      setError((e as Error).message);

    } finally {

      setActionId(null);

    }

  }



  async function addOwnerVehicle() {

    if (!plateNumber.trim()) {

      setError('Plaka alanı zorunludur.');

      return;

    }

    setSaving(true);

    setError(null);

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



  async function decideRequest(id: string, decision: 'approve' | 'reject') {

    setActionId(id);

    setError(null);

    try {

      await api.patch(`/vehicles/plate-requests/${id}/${decision}`, {});

      await load();

    } catch (e) {

      setError((e as Error).message);

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

            await load();

          } catch (e) {

            setError((e as Error).message);

          } finally {

            setActionId(null);

          }

        },

      },

    ]);

  }



  const pendingOwnerRequests = requests.filter((r) => r.status === 'PENDING' && (r.initiatedBy ?? 'DRIVER') === 'DRIVER');

  const pendingDriverInvites = requests.filter((r) => r.status === 'PENDING' && r.initiatedBy === 'OWNER');

  const driverlessOwnerVehicles = vehicles.filter((v) => v.status === 'ACTIVE' && !v.activeDriverId);



  const driverHeader = (

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

          <View style={{ gap: spacing.sm }}>

            {pendingDriverInvites.map((r) => (

              <View key={r.id} style={[styles.pendingRow, { borderColor: theme.border }]}>

                <View style={styles.flex}>

                  <Text style={[styles.plate, { color: theme.text }]}>{r.plateNumber}</Text>

                  <Text style={{ color: theme.textSecondary, fontSize: fontSize.xs, marginTop: 2 }}>

                    {r.ownerName ?? 'Mal sahibi'} · Davet

                  </Text>

                </View>

                <View style={styles.decideRow}>

                  <Button title="Kabul" size="md" variant="success" fullWidth={false} loading={actionId === r.id} onPress={() => decideRequest(r.id, 'approve')} />

                  <Button title="Reddet" size="md" variant="outline" fullWidth={false} disabled={actionId === r.id} onPress={() => decideRequest(r.id, 'reject')} />

                </View>

              </View>

            ))}

          </View>

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

          <View style={{ gap: spacing.sm }}>

            {availableVehicles.map((v) => (

              <View key={v.id} style={[styles.marketRow, { borderColor: theme.border }]}>

                <View style={styles.flex}>

                  <Text style={[styles.plate, { color: theme.text }]}>{v.plateNumber}</Text>

                  <Text style={{ color: theme.textSecondary, fontSize: fontSize.xs, marginTop: 2 }}>

                    {[v.brand, v.model].filter(Boolean).join(' ') || 'Araç bilgisi yok'} · {v.ownerName}

                  </Text>

                </View>

                {v.hasPendingRequest ? (

                  <Badge label="Başvuruldu" tone="warning" />

                ) : (

                  <Button title="Başvur" size="md" fullWidth={false} loading={actionId === v.id} onPress={() => applyToVehicle(v.id)} />

                )}

              </View>

            ))}

          </View>

        )}

      </Card>



      <Card>

        <Text style={[styles.cardTitle, { color: theme.text }]}>Plaka numarasıyla başvur</Text>

        <Field

          label="Plaka"

          icon="car-outline"

          placeholder="34 ABC 123"

          value={plateNumber}

          onChangeText={(t) => setPlateNumber(t.toUpperCase())}

          autoCapitalize="characters"

        />

        <Button title={saving ? 'Gönderiliyor...' : 'Onay Talebi Gönder'} icon="paper-plane-outline" loading={saving} onPress={submitDriverRequest} />

      </Card>

      {error ? <ErrorText>{error}</ErrorText> : null}

      <SectionTitle>Taleplerim</SectionTitle>

    </View>

  );



  const ownerHeader = (

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

          <View style={{ gap: spacing.sm }}>

            {pendingOwnerRequests.map((r) => (

              <View key={r.id} style={[styles.pendingRow, { borderColor: theme.border }]}>

                <View style={styles.flex}>

                  <Text style={[styles.plate, { color: theme.text }]}>{r.plateNumber}</Text>

                  <Text style={{ color: theme.textSecondary, fontSize: fontSize.xs, marginTop: 2 }}>

                    {r.driverName ?? 'Şoför'} · Başvuru

                  </Text>

                </View>

                <View style={styles.decideRow}>

                  <Button title="Onayla" size="md" variant="success" fullWidth={false} loading={actionId === r.id} onPress={() => decideRequest(r.id, 'approve')} />

                  <Button title="Reddet" size="md" variant="outline" fullWidth={false} disabled={actionId === r.id} onPress={() => decideRequest(r.id, 'reject')} />

                </View>

              </View>

            ))}

          </View>

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



          <View style={{ gap: spacing.sm }}>

            {availableDrivers.map((d) => (

              <View key={d.id} style={[styles.marketRow, { borderColor: theme.border }]}>

                <View style={styles.flex}>

                  <Text style={[styles.plate, { color: theme.text }]}>{d.fullName}</Text>

                  <Text style={{ color: theme.textSecondary, fontSize: fontSize.xs, marginTop: 2 }}>

                    {[d.memberNo ? `Üye No: ${d.memberNo}` : null, d.phone].filter(Boolean).join(' · ') || 'İletişim bilgisi yok'}

                  </Text>

                </View>

                <Button title="Davet Et" size="md" fullWidth={false} loading={actionId === d.id} onPress={() => inviteDriver(d.id)} />

              </View>

            ))}

          </View>

        </Card>

      ) : null}



      <Card>

        <Text style={[styles.cardTitle, { color: theme.text }]}>Yeni plaka ekle</Text>

        <Field label="Plaka" icon="car-outline" placeholder="34 ABC 123" value={plateNumber} onChangeText={(t) => setPlateNumber(t.toUpperCase())} autoCapitalize="characters" />

        <Field label="Marka" placeholder="Opsiyonel" value={brand} onChangeText={setBrand} />

        <Field label="Model" placeholder="Opsiyonel" value={model} onChangeText={setModel} />

        <Button title={saving ? 'Ekleniyor...' : 'Plaka Ekle'} icon="add" loading={saving} onPress={addOwnerVehicle} />

      </Card>

      {error ? <ErrorText>{error}</ErrorText> : null}

      <SectionTitle>Kayıtlı Plakalarım</SectionTitle>

    </View>

  );



  return (

    <SafeAreaView style={[styles.safe, { backgroundColor: theme.backgroundSecondary }]} edges={['top']}>

      {isDriver ? (

        <FlatList

          data={loading ? [] : requests}

          keyExtractor={(item) => item.id}

          contentContainerStyle={styles.content}

          showsVerticalScrollIndicator={false}

          ListHeaderComponent={driverHeader}

          ListEmptyComponent={loading ? <Loader /> : <EmptyState icon="document-text-outline" title="Talep yok" message="Henüz plaka çalışma talebiniz bulunmuyor." />}

          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}

          ListFooterComponent={

            vehicles.length > 0 ? (

              <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>

                <SectionTitle>Onaylı çalışma plakalarım</SectionTitle>

                {vehicles.map((v) => (

                  <View key={v.id} style={[styles.approvedCard]}>

                    <Ionicons name="checkmark-circle" size={20} color={IteoColors.success} />

                    <Text style={styles.approvedPlate}>{v.plateNumber}</Text>

                  </View>

                ))}

              </View>

            ) : null

          }

          renderItem={({ item }) => (

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

          )}

        />

      ) : (

        <FlatList

          data={loading ? [] : vehicles}

          keyExtractor={(item) => item.id}

          contentContainerStyle={styles.content}

          showsVerticalScrollIndicator={false}

          ListHeaderComponent={ownerHeader}

          ListEmptyComponent={loading ? <Loader /> : <EmptyState icon="car-outline" title="Kayıtlı plaka yok" message={isOwner ? 'Yukarıdaki formdan ilk plakanızı ekleyin.' : 'Bu bölüm plaka sahipleri içindir.'} />}

          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}

          renderItem={({ item }) => (

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

              <Pressable onPress={() => removeVehicle(item.id)} hitSlop={8} style={styles.deleteBtn} disabled={actionId === item.id}>

                <Ionicons name="trash-outline" size={20} color={IteoColors.error} />

              </Pressable>

            </View>

          )}

        />

      )}

    </SafeAreaView>

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

  chip: { borderWidth: 1, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },

  chipText: { fontSize: fontSize.sm, fontWeight: '800' },

});


