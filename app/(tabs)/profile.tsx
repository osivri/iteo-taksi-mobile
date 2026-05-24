import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Colors, { IteoColors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { api, ApiResponse } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface Profile {
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  profileImageUrl: string | null;
  role: string;
  status: string;
}

interface UploadResult {
  url: string;
}

export default function ProfileScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
      <View style={[styles.header, { backgroundColor: IteoColors.black }]}>
        <Text style={styles.headerTitle}>Profilim</Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {loading ? (
          <ActivityIndicator color={IteoColors.yellow} />
        ) : error && !profile ? (
          <Text style={styles.error}>{error}</Text>
        ) : profile ? (
          <>
            <Pressable onPress={editing ? pickPhoto : undefined} disabled={!editing || uploading}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
              )}
            </Pressable>
            {editing && (
              <Pressable onPress={pickPhoto} disabled={uploading} style={{ marginTop: 8 }}>
                <Text style={{ color: IteoColors.yellow, fontWeight: '700', fontSize: 13 }}>
                  {uploading ? 'Yükleniyor...' : 'Fotoğraf Seç'}
                </Text>
              </Pressable>
            )}

            {editing ? (
              <View style={styles.editForm}>
                <TextInput
                  style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Ad"
                  placeholderTextColor={theme.textSecondary}
                />
                <TextInput
                  style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Soyad"
                  placeholderTextColor={theme.textSecondary}
                />
                <TextInput
                  style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Telefon (05XX XXX XX XX)"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="phone-pad"
                />
                {profile.email && (
                  <Text style={[styles.readOnlyField, { color: theme.textSecondary }]}>
                    E-posta: {profile.email}
                  </Text>
                )}
                <View style={styles.editActions}>
                  <Pressable style={styles.saveBtn} onPress={saveProfile} disabled={saving || uploading}>
                    <Text style={styles.saveBtnText}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Text>
                  </Pressable>
                  <Pressable onPress={cancelEdit}>
                    <Text style={{ color: theme.textSecondary, marginTop: 8 }}>İptal</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <>
                <Text style={[styles.name, { color: theme.text }]}>
                  {profile.firstName} {profile.lastName}
                </Text>
                <Text style={[styles.meta, { color: theme.textSecondary }]}>
                  {profile.phone ?? 'Telefon eklenmemiş'} · {profile.role}
                </Text>
                {profile.email && (
                  <Text style={[styles.meta, { color: theme.textSecondary }]}>{profile.email}</Text>
                )}
                <Pressable onPress={() => setEditing(true)} style={{ marginTop: 12 }}>
                  <Text style={{ color: IteoColors.yellow, fontWeight: '700' }}>Profili Düzenle</Text>
                </Pressable>
              </>
            )}

            {error && profile && <Text style={[styles.error, { marginTop: 12 }]}>{error}</Text>}
          </>
        ) : null}

        <View style={styles.menu}>
          <Link href="/vehicles" asChild>
            <Pressable style={[styles.menuItem, { borderColor: theme.border }]}>
              <Text style={{ color: theme.text }}>Plaka / Araçlarım</Text>
              <Text style={{ color: theme.textSecondary }}>→</Text>
            </Pressable>
          </Link>
          <Link href="/notifications" asChild>
            <Pressable style={[styles.menuItem, { borderColor: theme.border }]}>
              <Text style={{ color: theme.text }}>Bildirimler</Text>
              <Text style={{ color: theme.textSecondary }}>→</Text>
            </Pressable>
          </Link>
          <Link href="/settings" asChild>
            <Pressable style={[styles.menuItem, { borderColor: theme.border }]}>
              <Text style={{ color: theme.text }}>Ayarlar</Text>
              <Text style={{ color: theme.textSecondary }}>→</Text>
            </Pressable>
          </Link>
        </View>

        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { color: IteoColors.white, fontSize: 20, fontWeight: '700' },
  card: { margin: 16, borderRadius: 14, borderWidth: 1, padding: 24, alignItems: 'center' },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: IteoColors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: IteoColors.yellow,
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: IteoColors.black },
  name: { marginTop: 16, fontSize: 20, fontWeight: '700' },
  meta: { marginTop: 4, fontSize: 14 },
  editForm: { width: '100%', marginTop: 16, gap: 10 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, width: '100%' },
  readOnlyField: { fontSize: 13, paddingHorizontal: 4 },
  editActions: { alignItems: 'center', marginTop: 8 },
  saveBtn: { backgroundColor: IteoColors.yellow, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  saveBtnText: { color: IteoColors.black, fontWeight: '700' },
  menu: { width: '100%', marginTop: 20, gap: 8 },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  error: { color: '#FCA5A5', textAlign: 'center' },
  logoutBtn: {
    marginTop: 24,
    backgroundColor: IteoColors.black,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  logoutText: { color: IteoColors.white, fontWeight: '700' },
});
