import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IteoColors } from '@/constants/Colors';
import { fontSize, radius, spacing } from '@/constants/theme';

interface Props {
  badge: string;
  title: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function ModulePageHero({ badge, title, description, icon = 'grid' }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.inner}>
        <View style={styles.badgeRow}>
          <View style={styles.iconWrap}>
            <Ionicons name={icon} size={18} color={IteoColors.yellow} />
          </View>
          <Text style={styles.badge}>{badge.toUpperCase()}</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.desc}>{description}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: IteoColors.black,
  },
  inner: { padding: spacing.lg },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,199,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: { color: IteoColors.yellow, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: IteoColors.white, fontSize: fontSize.xxl, fontWeight: '900' },
  desc: { color: 'rgba(255,255,255,0.65)', fontSize: fontSize.sm, marginTop: spacing.sm, lineHeight: 20 },
});
