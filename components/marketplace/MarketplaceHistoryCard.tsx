import { StyleSheet, Text, View } from 'react-native';
import { fontSize, spacing } from '@/constants/theme';
import type { PlateRequest } from '@/hooks/queries/vehicles';
import { Badge, useTheme } from '@/components/ui';
import { CollapsibleSection } from '@/components/CollapsibleSection';

const requestStatusLabels: Record<string, string> = {
  PENDING: 'Onay bekliyor',
  APPROVED: 'Onaylandı',
  REJECTED: 'Reddedildi',
  CANCELLED: 'İptal',
};

const requestStatusTone: Record<string, 'success' | 'danger' | 'warning' | 'neutral'> = {
  APPROVED: 'success',
  REJECTED: 'danger',
  CANCELLED: 'danger',
  PENDING: 'warning',
};

interface Props {
  requests: PlateRequest[];
}

export function MarketplaceHistoryCard({ requests }: Props) {
  const theme = useTheme();
  if (requests.length === 0) return null;

  return (
    <CollapsibleSection title={`Eşleştirme geçmişi (${requests.length})`}>
      {requests.slice(0, 10).map((r) => (
        <View key={r.id} style={[styles.row, { borderColor: theme.border }]}>
          <View style={styles.flex}>
            <Text style={[styles.plate, { color: theme.text }]}>{r.plateNumber}</Text>
            <Text style={{ color: theme.textSecondary, fontSize: fontSize.xs }}>
              {(r.initiatedBy ?? 'DRIVER') === 'OWNER' ? 'Davet' : 'Başvuru'} ·{' '}
              {new Date(r.createdAt).toLocaleDateString('tr-TR')}
            </Text>
          </View>
          <Badge label={requestStatusLabels[r.status] ?? r.status} tone={requestStatusTone[r.status] ?? 'neutral'} />
        </View>
      ))}
    </CollapsibleSection>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  plate: { fontSize: fontSize.md, fontWeight: '900' },
});
