import { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { IteoColors } from '@/constants/Colors';
import { fontSize, radius, SCREEN_BOTTOM_INSET, spacing } from '@/constants/theme';
import { api, ApiResponse } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button, Card, ErrorText, Field, ListRow, Loader, useTheme } from '@/components/ui';
import { roleDashboardTitles, type UserRole } from '@/lib/dashboard';

interface Profile {
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  profileImageUrl: string | null;
  city: string | null;
  district: string | null;
  addressLine: string | null;
  role: string;
  status: string;
}

interface UploadResult {
  url: string;
}

export default function ProfileScreen() {
  const theme = useTheme();
  const { signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadProfile = useCallback(() => {
    setLoading(true);
    api
      .get<ApiResponse<Profile>>('/users/me')
      .then((res) => {
        const p = res.data ?? null;
        setProfile(p);
        if (p) {
          setFirstName(p.firstName);
          setLastName(p.lastName);
          setPhone(p.phone ?? '');
          setCity(p.city ?? '');
          setDistrict(p.district ?? '');
          setAddressLine(p.addressLine ?? '');
          setProfileImageUrl(p.profileImageUrl);
        }
        setError(null);
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { loadProfile(); }, [loadProfile]));

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Galeri erişim izni gerekli.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('bucket', 'profile-images');
      formData.append('file', {
        uri: asset.uri,
        name: 'profile.jpg',
        type: asset.mimeType ?? 'image/jpeg',
      } as unknown as Blob);
      const upload = await api.upload<ApiResponse<UploadResult>>('/storage/upload', formData);
      const url = upload.data?.url;
      if (!url) throw new Error('Fotoğraf yüklenemedi');
      setProfileImageUrl(url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function saveProfile() {
    setSaving(true);
    setError(null);
    try {
      await api.patch('/users/me', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
        city: city.trim() || undefined,
        district: district.trim() || undefined,
        addressLine: addressLine.trim() || undefined,
        profileImageUrl: profileImageUrl ?? undefined,
      });
      setEditing(false);
      loadProfile();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    if (profile) {
      setFirstName(profile.firstName);
      setLastName(profile.lastName);
      setPhone(profile.phone ?? '');
      setCity(profile.city ?? '');
      setDistrict(profile.district ?? '');
      setAddressLine(profile.addressLine ?? '');
      setProfileImageUrl(profile.profileImageUrl);
    }
    setEditing(false);
  }

  async function handleLogout() {
    await signOut();
    router.replace('/login');
  }

  const displayName = editing ? firstName : profile?.firstName ?? '';
  const displayLast = editing ? lastName : profile?.lastName ?? '';
  const initials = `${displayName.charAt(0)}${displayLast.charAt(0)}`.trim().toUpperCase() || '?';
  const avatarUrl = editing ? profileImageUrl : profile?.profileImageUrl;
  const roleLabel = profile ? roleDashboardTitles[(profile.role as UserRole) ?? 'USER'] ?? profile.role : '';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.backgroundSecondary }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Pressable onPress={editing ? pickPhoto : undefined} disabled={!editing || uploading} style={styles.avatarWrap}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
            {editing ? (
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={15} color={IteoColors.black} />
              </View>
            ) : null}
          </Pressable>
          <Text style={styles.heroName}>
            {profile ? `${profile.firstName} ${profile.lastName}` : 'İTEO Üyesi'}
          </Text>
          {roleLabel ? (
            <View style={styles.roleChip}>
              <Text style={styles.roleChipText}>{roleLabel}</Text>
            </View>
          ) : null}
        </View>

        {loading ? (
          <Loader />
        ) : (
          <>
            <Card>
              {editing ? (
                <>
                  <Field label="Ad" value={firstName} onChangeText={setFirstName} placeholder="Ad" />
                  <Field label="Soyad" value={lastName} onChangeText={setLastName} placeholder="Soyad" />
                  <Field
                    label="Telefon"
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="05XX XXX XX XX"
                    keyboardType="phone-pad"
                    icon="call-outline"
                  />
                  <Field label="İl" value={city} onChangeText={setCity} placeholder="İstanbul" icon="location-outline" />
                  <Field label="İlçe" value={district} onChangeText={setDistrict} placeholder="Kadıköy" icon="map-outline" />
                  <Field
                    label="Açık adres"
                    value={addressLine}
                    onChangeText={setAddressLine}
                    placeholder="Mahalle, sokak, bina no, daire"
                    multiline
                    style={{ minHeight: 88, textAlignVertical: 'top' }}
                  />
                  {profile?.email ? (
                    <Text style={[styles.readonly, { color: theme.textSecondary }]}>E-posta: {profile.email}</Text>
                  ) : null}
                  {uploading ? <Text style={styles.uploading}>Fotoğraf yükleniyor...</Text> : null}
                  {error ? <ErrorText>{error}</ErrorText> : null}
                  <View style={styles.actionsRow}>
                    <Button title="Kaydet" onPress={saveProfile} loading={saving} disabled={uploading} icon="checkmark" style={styles.flex} />
                    <Button title="İptal" variant="outline" onPress={cancelEdit} style={styles.flex} />
                  </View>
                </>
              ) : (
                <>
                  <InfoRow icon="call-outline" label="Telefon" value={profile?.phone ?? 'Eklenmemiş'} theme={theme} />
                  <View style={[styles.divider, { backgroundColor: theme.border }]} />
                  <InfoRow icon="mail-outline" label="E-posta" value={profile?.email ?? 'Eklenmemiş'} theme={theme} />
                  <View style={[styles.divider, { backgroundColor: theme.border }]} />
                  <InfoRow
                    icon="location-outline"
                    label="Adres"
                    value={
                      profile?.city && profile?.district
                        ? `${profile.city} / ${profile.district}${profile.addressLine ? `\n${profile.addressLine}` : ''}`
                        : 'Eklenmemiş'
                    }
                    theme={theme}
                  />
                  <View style={[styles.divider, { backgroundColor: theme.border }]} />
                  <InfoRow
                    icon="shield-checkmark-outline"
                    label="Durum"
                    value={profile?.status === 'ACTIVE' ? 'Aktif' : profile?.status ?? '—'}
                    theme={theme}
                  />
                  {error ? <ErrorText>{error}</ErrorText> : null}
                  <Button title="Profili Düzenle" variant="outline" icon="create-outline" onPress={() => setEditing(true)} style={{ marginTop: spacing.md }} />
                </>
              )}
            </Card>

            <View style={styles.menu}>
              <ListRow title="Plaka / Araçlarım" icon="car-sport-outline" onPress={() => router.push('/(tabs)/vehicles')} />
              <ListRow title="Bildirimler" icon="notifications-outline" onPress={() => router.push('/notifications')} />
              <ListRow title="Ayarlar" icon="settings-outline" onPress={() => router.push('/settings')} />
              <ListRow title="Yardım & Destek" icon="help-circle-outline" onPress={() => router.push('/help')} />
            </View>

            <Button title="Çıkış Yap" variant="dark" icon="log-out-outline" onPress={handleLogout} style={{ marginTop: spacing.lg }} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
  theme,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: IteoColors.yellowLight }]}>
        <Ionicons name={icon} size={17} color={IteoColors.black} />
      </View>
      <View style={styles.flex}>
        <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: theme.text }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: SCREEN_BOTTOM_INSET, gap: spacing.lg },
  hero: { backgroundColor: IteoColors.black, borderRadius: radius.xxl, padding: spacing.xl, alignItems: 'center' },
  avatarWrap: { marginBottom: spacing.md },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: IteoColors.yellow, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 96, height: 96, borderRadius: 48, borderWidth: 2, borderColor: IteoColors.yellow },
  avatarText: { fontSize: 34, fontWeight: '900', color: IteoColors.black },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: IteoColors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: IteoColors.black,
  },
  heroName: { color: IteoColors.white, fontSize: fontSize.xxl, fontWeight: '900', letterSpacing: -0.4 },
  roleChip: { backgroundColor: 'rgba(255,199,0,0.16)', borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 6, marginTop: spacing.sm },
  roleChipText: { color: IteoColors.yellow, fontWeight: '800', fontSize: fontSize.sm },
  readonly: { fontSize: fontSize.sm, marginBottom: spacing.sm, marginLeft: 2 },
  uploading: { color: IteoColors.yellowDark, fontWeight: '700', fontSize: fontSize.sm, marginBottom: spacing.sm },
  actionsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  infoIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontSize: fontSize.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  infoValue: { fontSize: fontSize.md, fontWeight: '700', marginTop: 2 },
  divider: { height: 1, marginVertical: spacing.xs },
  menu: { gap: spacing.sm },
});
