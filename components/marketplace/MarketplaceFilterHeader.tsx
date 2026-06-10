import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IteoColors } from '@/constants/Colors';
import { fontSize, radius, spacing } from '@/constants/theme';
import { formatLocationLabel } from '@/lib/marketplace-location';
import { useTheme } from '@/components/ui';

interface StatPill {
  label: string;
  value: number;
  highlight?: boolean;
}

interface Props {
  district: string;
  neighborhood: string;
  onResetLocation: () => void;
  resultCount: number;
  resultLabel: string;
  stats?: StatPill[];
  children?: React.ReactNode;
}

export function MarketplaceFilterHeader({
  district,
  neighborhood,
  onResetLocation,
  resultCount,
  resultLabel,
  stats = [],
  children,
}: Props) {
  const theme = useTheme();
  const hasLocationFilter = Boolean(district || neighborhood);

  return (
    <View style={styles.wrap}>
      {stats.length > 0 ? (
        <View style={styles.statsRow}>
          {stats.map((s) => (
            <View
              key={s.label}
              style={[
                styles.statPill,
                {
                  borderColor: s.highlight ? IteoColors.yellow : theme.border,
                  backgroundColor: s.highlight ? IteoColors.yellowLight : theme.card,
                },
              ]}>
              <Text style={[styles.statValue, { color: theme.text }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{s.label}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.locationRow}>
        <Pressable
          onPress={onResetLocation}
          style={[styles.locationBtn, !hasLocationFilter ? styles.locationBtnActive : null]}>
          <Ionicons name="location-outline" size={14} color={!hasLocationFilter ? IteoColors.black : theme.text} />
          <Text style={[styles.locationText, { color: !hasLocationFilter ? IteoColors.black : theme.text }]}>
            {formatLocationLabel(district, neighborhood)}
          </Text>
        </Pressable>
        {hasLocationFilter ? (
          <Pressable onPress={onResetLocation}>
            <Text style={[styles.clearText, { color: theme.textSecondary }]}>Temizle</Text>
          </Pressable>
        ) : null}
        <Text style={[styles.resultText, { color: theme.textSecondary }]}>
          {resultCount} {resultLabel}
        </Text>
      </View>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm, marginBottom: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statPill: { flex: 1, borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center' },
  statValue: { fontSize: fontSize.xl, fontWeight: '900' },
  statLabel: { fontSize: fontSize.xs, marginTop: 2, textAlign: 'center' },
  locationRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  locationBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  locationBtnActive: { backgroundColor: IteoColors.yellow },
  locationText: { fontSize: fontSize.xs, fontWeight: '700' },
  clearText: { fontSize: fontSize.xs, fontWeight: '700', textDecorationLine: 'underline' },
  resultText: { fontSize: fontSize.xs, fontWeight: '700', marginLeft: 'auto' },
});
