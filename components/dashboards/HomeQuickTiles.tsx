import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IteoColors } from '@/constants/Colors';
import { fontSize, radius, shadow, spacing } from '@/constants/theme';

export interface HomeTile {
  title: string;
  href: Href;
  icon: keyof typeof Ionicons.glyphMap;
}

interface Props {
  theme: { card: string; border: string; text: string; textSecondary: string };
  tiles: HomeTile[];
}

export function HomeQuickTiles({ theme, tiles }: Props) {
  return (
    <View style={styles.row}>
      {tiles.map((tile) => (
        <Link key={tile.title} href={tile.href} asChild>
          <Pressable
            style={({ pressed }) => [
              styles.tile,
              { backgroundColor: theme.card, borderColor: theme.border },
              shadow.card,
              pressed ? styles.pressed : null,
            ]}>
            <View style={styles.tileIcon}>
              <Ionicons name={tile.icon} size={22} color={IteoColors.black} />
            </View>
            <Text style={[styles.tileTitle, { color: theme.text }]} numberOfLines={1}>
              {tile.title}
            </Text>
          </Pressable>
        </Link>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  tile: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: spacing.sm,
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
