import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { IteoColors } from '@/constants/Colors';
import { setLoginIntent, type MemberLoginRole } from '@/lib/login-intent';

const portals: Array<{
  role: MemberLoginRole;
  emoji: string;
  title: string;
  desc: string;
}> = [
  {
    role: 'DRIVER',
    emoji: '🚕',
    title: 'Şoför',
    desc: 'Hasılat, gider, plaka ve vardiya işlemleri',
  },
  {
    role: 'PLATE_OWNER',
    emoji: '🏷️',
    title: 'Mal / Plaka Sahibi',
    desc: 'Plaka yönetimi, gelir-gider ve aidat takibi',
  },
  {
    role: 'USER',
    emoji: '👤',
    title: 'Oda Üyesi',
    desc: 'Duyuru, haber, ödeme ve randevu hizmetleri',
  },
];

export default function WelcomeScreen() {
  async function openPortal(role: MemberLoginRole) {
    await setLoginIntent(role);
    router.push({ pathname: '/login', params: { role } });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Image source={require('@/assets/images/iteo_logo.jpeg')} style={styles.logo} />
        <Text style={styles.brand}>İTEO Mobil</Text>
        <Text style={styles.title}>Hoş Geldiniz</Text>
        <Text style={styles.subtitle}>
          Devam etmek için size uygun giriş türünü seçin. Her rol için özelleştirilmiş panel açılır.
        </Text>

        <View style={styles.cards}>
          {portals.map((portal) => (
            <Pressable
              key={portal.role}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => openPortal(portal.role)}>
              <Text style={styles.cardEmoji}>{portal.emoji}</Text>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{portal.title}</Text>
                <Text style={styles.cardDesc}>{portal.desc}</Text>
              </View>
              <Text style={styles.cardArrow}>→</Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={styles.adminLink}
          onPress={() => Linking.openURL(process.env.EXPO_PUBLIC_ADMIN_URL ?? 'http://localhost:3002/login')}>
          <Text style={styles.adminLinkText}>Oda yönetimi girişi (web panel)</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: IteoColors.black },
  container: { padding: 24, paddingBottom: 40 },
  logo: { width: 88, height: 88, borderRadius: 18, alignSelf: 'center', marginBottom: 16 },
  brand: { color: IteoColors.yellow, textAlign: 'center', fontWeight: '700', letterSpacing: 1 },
  title: { color: IteoColors.white, fontSize: 26, fontWeight: '800', textAlign: 'center', marginTop: 8 },
  subtitle: { color: IteoColors.gray500, textAlign: 'center', marginTop: 10, lineHeight: 22, marginBottom: 28 },
  cards: { gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IteoColors.blackSoft,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  cardPressed: { borderColor: IteoColors.yellow, backgroundColor: 'rgba(255,199,0,0.08)' },
  cardEmoji: { fontSize: 28 },
  cardBody: { flex: 1 },
  cardTitle: { color: IteoColors.white, fontSize: 17, fontWeight: '700' },
  cardDesc: { color: IteoColors.gray500, fontSize: 13, marginTop: 4, lineHeight: 18 },
  cardArrow: { color: IteoColors.yellow, fontSize: 20, fontWeight: '700' },
  adminLink: { marginTop: 28, alignItems: 'center' },
  adminLinkText: { color: IteoColors.gray500, fontSize: 13, textDecorationLine: 'underline' },
});
