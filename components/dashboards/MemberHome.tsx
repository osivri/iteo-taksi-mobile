import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { IteoColors } from '@/constants/Colors';

interface Props {
  theme: { card: string; border: string; text: string; textSecondary: string };
}

const shortcuts: Array<{ title: string; subtitle: string; href: Href; emoji: string }> = [
  { title: 'Duyurular', subtitle: 'Oda duyuruları', href: '/(tabs)/announcements', emoji: '📢' },
  { title: 'Haberler', subtitle: 'Sektörel gelişmeler', href: '/news', emoji: '📰' },
  { title: 'Ödemeler', subtitle: 'Aidat ve ücretler', href: '/payments', emoji: '💳' },
  { title: 'Randevu', subtitle: 'Otel & servis', href: '/appointments', emoji: '📅' },
  { title: 'İSG', subtitle: 'Eğitim ve danışman', href: '/ohs', emoji: '🦺' },
  { title: 'Yardım', subtitle: 'Destek hattı', href: '/help', emoji: '❓' },
];

export function MemberHome({ theme }: Props) {
  return (
    <>
      <View style={[styles.hero, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={styles.heroBadge}>Üye Paneli</Text>
        <Text style={[styles.heroTitle, { color: theme.text }]}>İTEO dijital hizmetlerine hoş geldiniz</Text>
        <Text style={{ color: theme.textSecondary, marginTop: 8, lineHeight: 20 }}>
          Duyurular, haberler, ödemeler ve randevu işlemlerinize tek ekrandan ulaşın.
        </Text>
      </View>

      <Text style={[styles.section, { color: theme.text }]}>Hizmetler</Text>
      <View style={styles.grid}>
        {shortcuts.map((item) => (
          <Link key={item.title} href={item.href} asChild>
            <Pressable style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={styles.emoji}>{item.emoji}</Text>
              <Text style={[styles.cardTitle, { color: theme.text }]}>{item.title}</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }}>{item.subtitle}</Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  hero: { borderWidth: 1, borderRadius: 16, padding: 20, marginBottom: 24 },
  heroBadge: { color: IteoColors.yellow, fontWeight: '700', fontSize: 12, marginBottom: 8 },
  heroTitle: { fontSize: 18, fontWeight: '700' },
  section: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '47%', borderWidth: 1, borderRadius: 14, padding: 16, minHeight: 110 },
  emoji: { fontSize: 24, marginBottom: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
});
