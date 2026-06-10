import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IteoColors } from '@/constants/Colors';
import { fontSize, radius, shadow, spacing } from '@/constants/theme';

interface Props {
  theme: { card: string; border: string; text: string; textSecondary: string };
}

const highlights: Array<{ title: string; href: Href; icon: keyof typeof Ionicons.glyphMap }> = [
  { title: 'Duyurular', href: '/(tabs)/announcements', icon: 'megaphone-outline' },
  { title: 'Ödemeler', href: '/(tabs)/payments', icon: 'card-outline' },
  { title: 'Otel', href: '/hotel-appointments', icon: 'business-outline' },
  { title: 'Servis', href: '/service-appointments', icon: 'construct-outline' },
];

export function MemberHome({ theme }: Props) {
  return (
    <>
      <View style={[styles.hero, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={styles.heroBadge}>ÜYE HİZMETLERİ</Text>
        <Text style={[styles.heroTitle, { color: theme.text }]}>İTEO dijital hizmetlerine hoş geldiniz</Text>
        <Text style={[styles.heroDesc, { color: theme.textSecondary }]}>
          Tüm işlemlerinize alt menüdeki “Menü” sekmesinden ulaşabilirsiniz.
        </Text>
      </View>

      <View style={styles.row}>
        {highlights.map((item) => (
          <Link key={item.title} href={item.href} asChild>
            <Pressable
              style={({ pressed }) => [
                styles.tile,
                { backgroundColor: theme.card, borderColor: theme.border },
                pressed ? styles.pressed : null,
              ]}>
              <View style={styles.tileIcon}>
                <Ionicons name={item.icon} size={22} color={IteoColors.black} />
              </View>
              <Text style={[styles.tileTitle, { color: theme.text }]}>{item.title}</Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  hero: { borderWidth: 1, borderRadius: radius.xxl, padding: spacing.xl, marginBottom: spacing.lg, ...shadow.card },
  heroBadge: { color: IteoColors.yellowDark, fontWeight: '900', fontSize: fontSize.xs, letterSpacing: 1, marginBottom: spacing.sm },
  heroTitle: { fontSize: fontSize.xxl, fontWeight: '900', letterSpacing: -0.4 },
  heroDesc: { marginTop: spacing.sm, lineHeight: 20, fontSize: fontSize.md },
  row: { flexDirection: 'row', gap: spacing.md },
  tile: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadow.card,
  },
  tileIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: IteoColors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileTitle: { fontSize: fontSize.sm, fontWeight: '800' },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});
