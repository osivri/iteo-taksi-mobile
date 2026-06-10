import { useLocalSearchParams } from 'expo-router';
import { useListing } from '@/hooks/queries/catalog';
import { ListingDetailScreen } from '@/components/ListingDetailScreen';

export default function ListingDetailPage() {
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const listingId = typeof id === 'string' ? id : '';
  const query = useListing(listingId);

  return (
    <ListingDetailScreen
      listing={query.data}
      loading={query.isLoading}
      error={query.error?.message ?? null}
      fromMine={from === 'mine'}
    />
  );
}
