import { useState } from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { IteoColors } from '@/constants/Colors';
import { fontSize, radius, SCREEN_BOTTOM_INSET, spacing } from '@/constants/theme';
import type { Listing } from '@/lib/listings-shared';
import {
  formatDate,
  formatLocation,
  formatPrice,
  hasVehicleDetails,
  statusLabels,
  statusTone,
  typeLabels,
} from '@/lib/listings-shared';
import { MemberSubpageToolbar } from '@/components/MemberSubpageToolbar';
import { Badge, Button, Card, ErrorText, Loader, useTheme } from '@/components/ui';

interface Props {
  listing: Listing | null | undefined;
  loading: boolean;
  error: string | null;
  fromMine?: boolean;
}

export function ListingDetailScreen({ listing, loading, error, fromMine }: Props) {
  const theme = useTheme();
  const [activePhoto, setActivePhoto] = useState(0);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.backgroundSecondary }]} edges={['top']}>
        <View style={styles.center}>
          <Loader />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !listing) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.backgroundSecondary }]} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <MemberSubpageToolbar />
          <ErrorText>{error ?? 'İlan bulunamadı.'}</ErrorText>
          <Button title="İlanlara dön" icon="arrow-back" variant="outline" onPress={() => router.replace('/listings' as Href)} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const photos = listing.photos?.length ? listing.photos : [];
  const isRental = listing.type === 'VEHICLE_RENTAL';
  const showStatus = listing.isOwner || listing.status !== 'APPROVED';
  const showSpecs = hasVehicleDetails(listing);

  const specRows: { label: string; value: string }[] = [];
  if (listing.brand) specRows.push({ label: 'Marka', value: listing.brand });
  if (listing.model) specRows.push({ label: 'Model', value: listing.model });
  if (listing.vehicleYear) specRows.push({ label: 'Model Yılı', value: String(listing.vehicleYear) });
  if (listing.plateNumber) specRows.push({ label: 'Plaka', value: listing.plateNumber });
  if (listing.mileage != null) specRows.push({ label: 'Kilometre', value: `${listing.mileage.toLocaleString('tr-TR')} km` });
  if (listing.fuelType) specRows.push({ label: 'Yakıt', value: listing.fuelType });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.backgroundSecondary }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <MemberSubpageToolbar />
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Ionicons name="arrow-back" size={16} color={IteoColors.yellowDark} />
          <Text style={styles.backText}>{fromMine ? 'İlanlarıma dön' : 'Tüm ilanlara dön'}</Text>
        </Pressable>

        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <View style={styles.hero}>
            {photos.length > 0 ? (
              <Image source={{ uri: photos[activePhoto] }} style={styles.heroImage} resizeMode="cover" />
            ) : (
              <View style={[styles.heroPlaceholder, isRental ? styles.heroRental : styles.heroSale]}>
                <Ionicons name={isRental ? 'car-sport' : 'pricetag'} size={56} color={IteoColors.gray500} />
              </View>
            )}
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{typeLabels[listing.type] ?? listing.type}</Text>
            </View>
            {showStatus ? (
              <View style={styles.statusBadge}>
                <Badge label={statusLabels[listing.status] ?? listing.status} tone={statusTone(listing.status)} />
              </View>
            ) : null}
          </View>

          {photos.length > 1 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbs}>
              {photos.map((url, idx) => (
                <Pressable key={url} onPress={() => setActivePhoto(idx)} style={[styles.thumb, activePhoto === idx && styles.thumbActive]}>
                  <Image source={{ uri: url }} style={styles.thumbImage} />
                </Pressable>
              ))}
            </ScrollView>
          ) : null}

          <View style={styles.body}>
            <Text style={[styles.title, { color: theme.text }]}>{listing.title}</Text>
            <Text style={styles.price}>{formatPrice(listing.price)}</Text>
            <Text style={{ color: theme.textSecondary, marginTop: spacing.xs }}>{formatLocation(listing)}</Text>
            <Text style={{ color: theme.textSecondary, fontSize: fontSize.sm, marginTop: spacing.xs }}>
              Yayın: {formatDate(listing.createdAt)}
            </Text>
          </View>
        </Card>

        {listing.description ? (
          <Card>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Açıklama</Text>
            <Text style={{ color: theme.textSecondary, lineHeight: 22 }}>{listing.description}</Text>
          </Card>
        ) : null}

        {showSpecs ? (
          <Card>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Araç bilgileri</Text>
            {specRows.map((row) => (
              <View key={row.label} style={styles.specRow}>
                <Text style={{ color: theme.textSecondary, fontSize: fontSize.sm }}>{row.label}</Text>
                <Text style={{ color: theme.text, fontWeight: '800' }}>{row.value}</Text>
              </View>
            ))}
            {listing.damageInfo ? (
              <View style={[styles.specRow, { marginTop: spacing.sm }]}>
                <Text style={{ color: theme.textSecondary, fontSize: fontSize.sm }}>Hasar</Text>
                <Text style={{ color: theme.text, flex: 1, textAlign: 'right' }}>{listing.damageInfo}</Text>
              </View>
            ) : null}
          </Card>
        ) : null}

        {listing.contactPhone ? (
          <Button
            title={`Ara: ${listing.contactPhone}`}
            icon="call"
            onPress={() => Linking.openURL(`tel:${listing.contactPhone}`)}
          />
        ) : null}

        {listing.adminNote && listing.isOwner ? (
          <Card style={{ borderColor: IteoColors.yellowDark, backgroundColor: IteoColors.yellowLight }}>
            <Text style={[styles.sectionTitle, { color: IteoColors.black }]}>Oda notu</Text>
            <Text style={{ color: IteoColors.black }}>{listing.adminNote}</Text>
          </Card>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.lg, paddingBottom: SCREEN_BOTTOM_INSET, gap: spacing.lg },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  backText: { color: IteoColors.yellowDark, fontWeight: '800', fontSize: fontSize.sm },
  hero: { height: 220, backgroundColor: IteoColors.gray100, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroRental: { backgroundColor: 'rgba(255,199,0,0.15)' },
  heroSale: { backgroundColor: 'rgba(10,10,10,0.06)' },
  typeBadge: {
    position: 'absolute',
    left: spacing.md,
    top: spacing.md,
    backgroundColor: 'rgba(10,10,10,0.82)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  typeBadgeText: { color: IteoColors.yellow, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  statusBadge: { position: 'absolute', right: spacing.md, top: spacing.md },
  thumbs: { padding: spacing.sm, gap: spacing.sm },
  thumb: { width: 72, height: 56, borderRadius: radius.md, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  thumbActive: { borderColor: IteoColors.yellow },
  thumbImage: { width: '100%', height: '100%' },
  body: { padding: spacing.lg },
  title: { fontSize: fontSize.xl, fontWeight: '900' },
  price: { color: IteoColors.yellowDark, fontSize: fontSize.xxl, fontWeight: '900', marginTop: spacing.sm },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '900', marginBottom: spacing.sm },
  specRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs, gap: spacing.md },
});
