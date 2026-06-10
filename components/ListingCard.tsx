import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IteoColors } from '@/constants/Colors';
import { fontSize, radius, shadow, spacing } from '@/constants/theme';
import type { Listing } from '@/lib/listings-shared';
import { formatLocation, formatPrice, typeLabels } from '@/lib/listings-shared';
import { Badge, useTheme } from '@/components/ui';

interface Props {
  listing: Listing;
  onPress: () => void;
  showStatus?: boolean;
}

export function ListingCard({ listing, onPress, showStatus }: Props) {
  const theme = useTheme();
  const photo = listing.photos?.[0];
  const isRental = listing.type === 'VEHICLE_RENTAL';

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }, theme.scheme === 'light' ? shadow.card : null]}
    >
      <View style={styles.media}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.placeholder, isRental ? styles.placeholderRental : styles.placeholderSale]}>
            <Ionicons name={isRental ? 'car-sport' : 'pricetag'} size={32} color={IteoColors.gray500} />
          </View>
        )}
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{typeLabels[listing.type] ?? listing.type}</Text>
        </View>
        {showStatus && listing.status !== 'APPROVED' ? (
          <View style={styles.statusWrap}>
            <Badge
              label={listing.status === 'PENDING' ? 'Onay bekliyor' : listing.status === 'REJECTED' ? 'Reddedildi' : listing.status}
              tone={listing.status === 'PENDING' ? 'warning' : listing.status === 'REJECTED' ? 'danger' : 'neutral'}
            />
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
          {listing.title}
        </Text>
        <Text style={{ color: theme.textSecondary, fontSize: fontSize.sm, marginTop: 4 }} numberOfLines={1}>
          {formatLocation(listing)}
        </Text>
        <Text style={styles.price}>{formatPrice(listing.price)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.xl, overflow: 'hidden' },
  media: { position: 'relative', height: 140, backgroundColor: IteoColors.gray100 },
  image: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholderRental: { backgroundColor: 'rgba(255,199,0,0.12)' },
  placeholderSale: { backgroundColor: 'rgba(10,10,10,0.06)' },
  typeBadge: {
    position: 'absolute',
    left: spacing.sm,
    top: spacing.sm,
    backgroundColor: 'rgba(10,10,10,0.82)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  typeText: { color: IteoColors.yellow, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  statusWrap: { position: 'absolute', right: spacing.sm, top: spacing.sm },
  body: { padding: spacing.md },
  title: { fontSize: fontSize.md, fontWeight: '900' },
  price: { color: IteoColors.yellowDark, fontWeight: '900', fontSize: fontSize.lg, marginTop: spacing.sm },
});
