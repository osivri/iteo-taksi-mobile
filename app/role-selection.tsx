import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { IteoColors } from '@/constants/Colors';
import { fontSize, radius, shadow, spacing } from '@/constants/theme';
import { Button, ErrorText, Field } from '@/components/ui';
import { api, ApiResponse } from '@/lib/api';
import { setOnboardingDone } from '@/lib/onboarding';
import { getLoginIntent, loginPortalCopy, type MemberLoginRole } from '@/lib/login-intent';

const roleLabels: Record<MemberLoginRole, string> = {
  DRIVER: 'Şoför Paneli',
  PLATE_OWNER: 'Oda Üyesi Paneli',
  USER: 'Oda Üyesi Paneli',
};

export default function RoleSelectionScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [role, setRole] = useState<MemberLoginRole>('DRIVER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getLoginIntent().then((intent) => {
      if (intent) setRole(intent);
    });
  }, []);

  async function submit() {
    if (!firstName.trim() || !lastName.trim()) {
      setError('Ad ve soyad zorunludur.');
      return;
    }
    if (!city.trim() || !district.trim() || !addressLine.trim()) {
      setError('İl, ilçe ve açık adres zorunludur.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.post<ApiResponse<unknown>>('/users/me/onboarding', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role,
        city: city.trim(),
        district: district.trim(),
        addressLine: addressLine.trim(),
      });
      await setOnboardingDone();
      router.replace('/kvkk');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const portalCopy = loginPortalCopy[role];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Image source={require('@/assets/images/iteo_logo.jpeg')} style={styles.logo} />
          <Text style={styles.badge}>{roleLabels[role]}</Text>
          <Text style={styles.title}>Profilinizi tamamlayın</Text>
          <Text style={styles.subtitle}>
            Kişisel ve adres bilgilerinizi girin; {portalCopy.badge.toLowerCase()} hemen kullanıma açılır.
          </Text>
        </View>

        <View style={styles.formCard}>
          {error ? <ErrorText>{error}</ErrorText> : null}
          <Field label="Ad" icon="person-outline" placeholder="Adınız" value={firstName} onChangeText={setFirstName} />
          <Field label="Soyad" icon="person-outline" placeholder="Soyadınız" value={lastName} onChangeText={setLastName} />
          <Field label="İl" icon="location-outline" placeholder="İstanbul" value={city} onChangeText={setCity} />
          <Field label="İlçe" icon="map-outline" placeholder="Kadıköy" value={district} onChangeText={setDistrict} />
          <Field
            label="Açık adres"
            placeholder="Mahalle, sokak, bina no, daire"
            value={addressLine}
            onChangeText={setAddressLine}
            multiline
            style={{ minHeight: 88, textAlignVertical: 'top' }}
          />
          <Button title="Devam Et" icon="arrow-forward" loading={loading} onPress={submit} style={{ marginTop: spacing.xs }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: IteoColors.black },
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl, paddingBottom: spacing.xxxl },
  hero: { backgroundColor: '#141414', borderColor: '#262626', borderWidth: 1, borderRadius: radius.xxl, padding: spacing.xxl, alignItems: 'center', marginBottom: spacing.lg },
  logo: { width: 78, height: 78, borderRadius: 20, marginBottom: spacing.lg },
  badge: { color: IteoColors.black, backgroundColor: IteoColors.yellow, overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill, fontSize: fontSize.xs, fontWeight: '800', marginBottom: spacing.md },
  title: { color: IteoColors.white, fontSize: fontSize.display, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { color: '#A3A3A3', fontSize: fontSize.md, textAlign: 'center', marginTop: spacing.sm, lineHeight: 21 },
  formCard: { backgroundColor: IteoColors.white, borderRadius: radius.xxl, padding: spacing.xl, ...shadow.floating },
});
