import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { IteoColors } from '@/constants/Colors';
import { fontSize, radius, spacing } from '@/constants/theme';
import type { Vehicle } from '@/hooks/queries/vehicles';
import { formatVehiclePlateLabel } from '@/lib/vehicles-shared';
import { useTheme } from '@/components/ui';

interface Props {
  vehicles: Vehicle[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function VehiclePlatePicker({ vehicles, selectedId, onSelect }: Props) {
  const theme = useTheme();

  return (
    <View>
      <Text style={[styles.label, { color: theme.text }]}>Davet plakası</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {vehicles.map((v) => {
          const active = selectedId === v.id;
          return (
            <Pressable
              key={v.id}
              onPress={() => onSelect(v.id)}
              style={[
                styles.chip,
                {
                  borderColor: active ? IteoColors.yellow : theme.border,
                  backgroundColor: active ? IteoColors.yellowLight : theme.card,
                },
              ]}>
              <Text style={[styles.chipText, { color: theme.text }]} numberOfLines={1}>
                {formatVehiclePlateLabel(v)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: fontSize.sm, fontWeight: '800', marginBottom: spacing.xs },
  row: { gap: spacing.sm, paddingBottom: spacing.xs },
  chip: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, maxWidth: 220 },
  chipText: { fontSize: fontSize.xs, fontWeight: '800' },
});
