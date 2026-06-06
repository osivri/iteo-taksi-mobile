import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { IteoColors } from '@/constants/Colors';
import { fontSize, radius, shadow, spacing } from '@/constants/theme';
import { getAdminWebUrl } from '@/lib/config';
import { openSafeUrl } from '@/lib/safe-url';
import { setLoginIntent, type MemberLoginRole } from '@/lib/login-intent';

const portals: Array<{
  role: MemberLoginRole;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
}> = [
  { role: 'DRIVER', icon: 'car-sport', title: 'Şoför', desc: 'Hasılat, gider, plaka ve vardiya işlemleri' },
  { role: 'PLATE_OWNER', icon: 'pricetags', title: 'Mal / Plaka Sahibi', desc: 'Plaka yönetimi, gelir-gider ve aidat takibi' },
  { role: 'USER', icon: 'person', title: 'Oda Üyesi', desc: 'Duyuru, haber, ödeme ve randevu hizmetleri' },
];

export default function WelcomeScreen() {
  async function openPortal(role: MemberLoginRole) {
    await setLoginIntent(role);
    router.push({ pathname: '/login', params: { role } });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Image source={require('@/assets/images/iteo_logo.jpeg')} style={styles.logo} />
          <Text style={styles.brand}>İTEO MOBİL</Text>
          <Text style={styles.title}>Taksi esnafının dijital çalışma alanı</Text>
          <Text style={styles.subtitle}>İşlemlerinize hızlıca ulaşmak için size uygun girişi seçin.</Text>
        </View>

        <Text style={styles.sectionLabel}>GİRİŞ TÜRÜ</Text>
        <View style={styles.cards}>
          {portals.map((portal) => (
            <Pressable
              key={portal.role}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => openPortal(portal.role)}>
              <View style={styles.iconBubble}>
                <Ionicons name={portal.icon} size={24} color={IteoColors.black} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{portal.title}</Text>
                <Text style={styles.cardDesc}>{portal.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={IteoColors.gray500} />
            </Pressable>
          ))}
        </View>

        <Pressable
          style={styles.adminLink}
          onPress={async () => {
            const opened = await openSafeUrl(getAdminWebUrl());
            if (!opened) Alert.alert('Bağlantı engellendi', 'Yönetim sayfası bağlantısı güvenli değil.');
          }}>
          <Ionicons name="business-outline" size={16} color={IteoColors.yellow} />
          <Text style={styles.adminLinkText}>Oda yönetimi girişi</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: IteoColors.black },
  container: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  hero: {
    backgroundColor: '#141414',
    borderColor: '#262626',
    borderWidth: 1,
    borderRadius: radius.xxl,
    padding: spacing.xxl,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logo: { width: 88, height: 88, borderRadius: 22, marginBottom: spacing.lg },
  brand: { color: IteoColors.yellow, textAlign: 'center', fontWeight: '900', letterSpacing: 2, fontSize: fontSize.xs },
  title: { color: IteoColors.white, fontSize: fontSize.display, fontWeight: '900', textAlign: 'center', marginTop: spacing.md, letterSpacing: -0.7, lineHeight: 34 },
  subtitle: { color: '#A3A3A3', textAlign: 'center', marginTop: spacing.md, lineHeight: 22, fontSize: fontSize.md },
  sectionLabel: { color: IteoColors.gray500, fontSize: fontSize.xs, fontWeight: '900', letterSpacing: 1, marginBottom: spacing.md, marginLeft: 2 },
  cards: { gap: spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IteoColors.white,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow.raised,
  },
  cardPressed: { borderColor: IteoColors.yellow, transform: [{ scale: 0.99 }] },
  iconBubble: { width: 52, height: 52, borderRadius: 18, backgroundColor: IteoColors.yellow, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1 },
  cardTitle: { color: IteoColors.black, fontSize: fontSize.lg, fontWeight: '900' },
  cardDesc: { color: IteoColors.gray500, fontSize: fontSize.sm, marginTop: 4, lineHeight: 18 },
  adminLink: { marginTop: spacing.xxl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  adminLinkText: { color: IteoColors.yellow, fontSize: fontSize.md, fontWeight: '700' },
});
