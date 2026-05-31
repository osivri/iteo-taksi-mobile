import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { IteoColors } from '@/constants/Colors';
import { fontSize, radius, shadow, spacing } from '@/constants/theme';
import { Button, ErrorText, Field } from '@/components/ui';
import { api, ApiResponse } from '@/lib/api';
import { needsAddressSetup } from '@/lib/onboarding';

interface Profile {
  city: string | null;
  district: string | null;
  addressLine: string | null;
}

export default function AddressScreen() {
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<ApiResponse<Profile>>('/users/me')
      .then((res) => {
        const profile = res.data;
        if (profile && !needsAddressSetup(profile)) {
          router.replace('/(tabs)');
          return;
        }
        if (profile?.city) setCity(profile.city);
        if (profile?.district) setDistrict(profile.district);
        if (profile?.addressLine) setAddressLine(profile.addressLine);
      })
      .catch(() => undefined)
      .finally(() => setChecking(false));
  }, []);

  async function submit() {
    if (!city.trim() || !district.trim() || !addressLine.trim()) {
      setError('İl, ilçe ve açık adres zorunludur.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.patch('/users/me', {
        city: city.trim(),
        district: district.trim(),
        addressLine: addressLine.trim(),
      });
      router.replace('/(tabs)');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.loading}>Yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Image source={require('@/assets/images/iteo_logo.jpeg')} style={styles.logo} />
          <Text style={styles.title}>Adres Bilgileriniz</Text>
          <Text style={styles.subtitle}>Oda kayıtları ve iletişim için adres bilgilerinizi girin.</Text>
        </View>

        <View style={styles.formCard}>
          {error ? <ErrorText>{error}</ErrorText> : null}
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
          <Button title="Kaydet ve Devam Et" icon="checkmark" loading={loading} onPress={submit} style={{ marginTop: spacing.xs }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: IteoColors.black },
  loading: { color: '#A3A3A3', textAlign: 'center', marginTop: spacing.xxxl },
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl, paddingBottom: spacing.xxxl },
  hero: { backgroundColor: '#141414', borderColor: '#262626', borderWidth: 1, borderRadius: radius.xxl, padding: spacing.xxl, alignItems: 'center', marginBottom: spacing.lg },
  logo: { width: 78, height: 78, borderRadius: 20, marginBottom: spacing.lg },
  title: { color: IteoColors.white, fontSize: fontSize.display, fontWeight: '900', textAlign: 'center' },
  subtitle: { color: '#A3A3A3', fontSize: fontSize.md, textAlign: 'center', marginTop: spacing.sm, lineHeight: 21 },
  formCard: { backgroundColor: IteoColors.white, borderRadius: radius.xxl, padding: spacing.xl, ...shadow.floating },
});
