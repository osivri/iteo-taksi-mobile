import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IteoColors } from '@/constants/Colors';
import { fontSize, radius, spacing } from '@/constants/theme';
import {
  ALL_ISTANBUL_LABEL,
  countByDistrict,
  countByNeighborhood,
  formatLocationLabel,
  sortedDistrictEntries,
  sortedNeighborhoodEntries,
  type MarketplaceLocatable,
} from '@/lib/marketplace-location';
import { useTheme } from '@/components/ui';

interface Props<T extends MarketplaceLocatable> {
  items: T[];
  district: string;
  neighborhood: string;
  onDistrictChange: (value: string) => void;
  onNeighborhoodChange: (value: string) => void;
  onReset: () => void;
  entityLabel: string;
}

function CountText({ count, theme }: { count: number; theme: ReturnType<typeof useTheme> }) {
  return (
    <Text style={[styles.countBadge, { color: count > 0 ? theme.textSecondary : theme.textSecondary, opacity: count > 0 ? 1 : 0.5 }]}>
      {count}
    </Text>
  );
}

export function MarketplaceLocationPicker<T extends MarketplaceLocatable>({
  items,
  district,
  neighborhood,
  onDistrictChange,
  onNeighborhoodChange,
  onReset,
}: Props<T>) {
  const theme = useTheme();
  const districtCounts = useMemo(() => countByDistrict(items), [items]);
  const neighborhoodCounts = useMemo(
    () => (district ? countByNeighborhood(items, district) : {}),
    [items, district],
  );
  const districtEntries = useMemo(() => sortedDistrictEntries(districtCounts), [districtCounts]);
  const neighborhoodEntries = useMemo(
    () => (district ? sortedNeighborhoodEntries(neighborhoodCounts, district) : []),
    [district, neighborhoodCounts],
  );

  const locationLabel = formatLocationLabel(district, neighborhood);

  return (
    <View style={[styles.wrap, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={[styles.header, { borderColor: theme.border }]}>
        <View style={styles.flex}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Konum kategorisi</Text>
          <Text style={[styles.headerSub, { color: theme.textSecondary }]} numberOfLines={1}>
            {locationLabel}
          </Text>
        </View>
        {district || neighborhood ? (
          <Pressable onPress={onReset} style={[styles.clearChip, { borderColor: theme.border }]}>
            <Text style={[styles.clearText, { color: theme.textSecondary }]}>Temizle</Text>
          </Pressable>
        ) : null}
      </View>

      <Pressable
        onPress={onReset}
        style={[styles.rowBtn, !district ? styles.rowBtnActive : null, { borderColor: theme.border }]}>
        <View style={styles.rowLeft}>
          <Ionicons name="location-outline" size={16} color={!district ? IteoColors.black : theme.text} />
          <Text style={[styles.rowText, { color: !district ? IteoColors.black : theme.text }]}>{ALL_ISTANBUL_LABEL}</Text>
        </View>
        <CountText count={items.length} theme={theme} />
      </Pressable>

      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>İlçe</Text>
      <ScrollView style={styles.listScroll} nestedScrollEnabled showsVerticalScrollIndicator>
        {districtEntries.map(([name, count]) => (
          <Pressable
            key={name}
            onPress={() => {
              onDistrictChange(name);
              onNeighborhoodChange('');
            }}
            style={[
              styles.listRow,
              district === name ? styles.rowBtnActive : null,
              { borderColor: theme.border },
            ]}>
            <Text style={[styles.rowText, { color: district === name ? IteoColors.black : theme.text }]}>{name}</Text>
            <CountText count={count} theme={theme} />
          </Pressable>
        ))}
      </ScrollView>

      {district ? (
        <>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Mahalle</Text>
          <ScrollView style={styles.listScroll} nestedScrollEnabled showsVerticalScrollIndicator>
            <Pressable
              onPress={() => onNeighborhoodChange('')}
              style={[
                styles.listRow,
                !neighborhood ? styles.rowBtnActive : null,
                { borderColor: theme.border },
              ]}>
              <Text style={[styles.rowText, { color: !neighborhood ? IteoColors.black : theme.text }]}>Tümü</Text>
              <CountText count={districtCounts[district] ?? 0} theme={theme} />
            </Pressable>
            {neighborhoodEntries.map(([name, count]) => (
              <Pressable
                key={name}
                onPress={() => onNeighborhoodChange(name)}
                style={[
                  styles.listRow,
                  neighborhood === name ? styles.rowBtnActive : null,
                  { borderColor: theme.border },
                ]}>
                <Text style={[styles.rowText, { color: neighborhood === name ? IteoColors.black : theme.text }]} numberOfLines={1}>
                  {name}
                </Text>
                <CountText count={count} theme={theme} />
              </Pressable>
            ))}
          </ScrollView>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderWidth: 1, borderRadius: radius.lg, overflow: 'hidden', marginBottom: spacing.md },
  flex: { flex: 1, minWidth: 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  headerTitle: { fontSize: fontSize.sm, fontWeight: '900' },
  headerSub: { fontSize: fontSize.xs, marginTop: 2 },
  clearChip: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  clearText: { fontSize: fontSize.xs, fontWeight: '700' },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  listScroll: { maxHeight: 160, paddingHorizontal: spacing.sm },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.xs,
    marginBottom: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  rowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  rowBtnActive: { backgroundColor: IteoColors.yellow },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  rowText: { fontSize: fontSize.sm, fontWeight: '700', flex: 1 },
  countBadge: { fontSize: fontSize.xs, fontWeight: '800' },
});
