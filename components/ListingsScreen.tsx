import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { IteoColors } from '@/constants/Colors';
import { fontSize, radius, SCREEN_BOTTOM_INSET, spacing } from '@/constants/theme';
import { useListings, useMyListings } from '@/hooks/queries/catalog';
import { useVehiclesList } from '@/hooks/queries/vehicles';
import { api, ApiResponse } from '@/lib/api';
import * as ImagePicker from 'expo-image-picker';
import { appendImageToFormData } from '@/lib/image-upload';
import type { Listing, ListingTab, ListingTypeFilter, SortOption } from '@/lib/listings-shared';
import { filterListingsClient, fuelTypeOptions, sortListings, typeLabels } from '@/lib/listings-shared';
import { ListingCard } from '@/components/ListingCard';
import { MemberSubpageToolbar } from '@/components/MemberSubpageToolbar';
import { ModulePageHero } from '@/components/ModulePageHero';
import { Button, Card, EmptyState, ErrorText, Field, Loader, useTheme } from '@/components/ui';

const tabs: { id: ListingTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'browse', label: 'Göz At', icon: 'grid' },
  { id: 'create', label: 'İlan Ver', icon: 'add-circle' },
  { id: 'mine', label: 'İlanlarım', icon: 'person' },
];

export function ListingsScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<ListingTab>('browse');

  const [typeFilter, setTypeFilter] = useState<ListingTypeFilter>('ALL');
  const [district, setDistrict] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [search, setSearch] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState<SortOption>('newest');

  const [appliedDistrict, setAppliedDistrict] = useState('');
  const [appliedNeighborhood, setAppliedNeighborhood] = useState('');
  const [appliedType, setAppliedType] = useState<ListingTypeFilter>('ALL');

  const browseQuery = useListings({
    type: appliedType !== 'ALL' ? appliedType : undefined,
    district: appliedDistrict,
    neighborhood: appliedNeighborhood,
  });
  const mineQuery = useMyListings();
  const vehiclesQuery = useVehiclesList(true);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [listingType, setListingType] = useState('VEHICLE_RENTAL');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [formDistrict, setFormDistrict] = useState('');
  const [formNeighborhood, setFormNeighborhood] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [mileage, setMileage] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [damageInfo, setDamageInfo] = useState('');
  const [photoUris, setPhotoUris] = useState<string[]>([]);

  const browseItems = useMemo(() => {
    const raw = browseQuery.data ?? [];
    return sortListings(filterListingsClient(raw, { search, minPrice, maxPrice }), sort);
  }, [browseQuery.data, search, minPrice, maxPrice, sort]);

  const myItems = mineQuery.data ?? [];
  const vehicles = vehiclesQuery.data ?? [];

  const invalidateListings = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['listings'] });
  }, [queryClient]);

  function applyServerFilters() {
    setAppliedDistrict(district);
    setAppliedNeighborhood(neighborhood);
    setAppliedType(typeFilter);
  }

  function openListing(listing: Listing, fromMine: boolean) {
    router.push((fromMine ? `/listing/${listing.id}?from=mine` : `/listing/${listing.id}`) as Href);
  }

  async function pickPhotos() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 5,
      quality: 0.9,
    });
    if (result.canceled || !result.assets.length) return;
    setPhotoUris((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, 8));
  }

  async function uploadPhoto(uri: string): Promise<string> {
    const prepared = await import('@/lib/image-upload').then((m) => m.prepareImageForUpload(uri));
    const formData = new FormData();
    appendImageToFormData(formData, prepared);
    const upload = await api.upload<ApiResponse<{ url: string }>>('/storage/listing-photos', formData);
    const url = upload.data?.url;
    if (!url) throw new Error('Fotoğraf yüklenemedi');
    return url;
  }

  async function handleCreate() {
    if (!title.trim() || !price.trim()) {
      setError('Başlık ve fiyat zorunludur.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const photoUrls: string[] = [];
      for (const uri of photoUris) {
        photoUrls.push(await uploadPhoto(uri));
      }
      const parsedYear = vehicleYear.trim() ? Number(vehicleYear) : undefined;
      const parsedMileage = mileage.trim() ? Number(mileage) : undefined;
      const selectedVehicle = vehicles.find((v) => v.id === vehicleId);

      const res = await api.post<ApiResponse<Listing>>('/listings', {
        type: listingType,
        title: title.trim(),
        description: description.trim() || undefined,
        price: Number(price),
        district: formDistrict.trim() || undefined,
        neighborhood: formNeighborhood.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
        vehicleYear: parsedYear != null && !Number.isNaN(parsedYear) ? parsedYear : undefined,
        plateNumber: selectedVehicle?.plateNumber ?? undefined,
        mileage: parsedMileage != null && !Number.isNaN(parsedMileage) ? parsedMileage : undefined,
        fuelType: fuelType.trim() || undefined,
        damageInfo: damageInfo.trim() || undefined,
        photos: photoUrls.length > 0 ? photoUrls : undefined,
      });
      await invalidateListings();
      const newId = res.data?.id;
      if (newId) {
        router.push(`/listing/${newId}?from=mine` as Href);
      } else {
        setTab('mine');
      }
      setTitle('');
      setDescription('');
      setPrice('');
      setFormDistrict('');
      setFormNeighborhood('');
      setContactPhone('');
      setBrand('');
      setModel('');
      setVehicleYear('');
      setVehicleId('');
      setMileage('');
      setFuelType('');
      setDamageInfo('');
      setPhotoUris([]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const loading = tab === 'browse' ? browseQuery.isLoading : tab === 'mine' ? mineQuery.isLoading : false;
  const queryError = tab === 'browse' ? browseQuery.error : tab === 'mine' ? mineQuery.error : null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.backgroundSecondary }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <MemberSubpageToolbar />
        <ModulePageHero
          badge="İTEO Pazar Yeri"
          title="İlanlar"
          description="Araç kiralama ve plaka satış ilanları — filtrele, karşılaştır, doğrudan iletişime geç."
          icon="pricetag"
        />

        <View style={[styles.tabBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {tabs.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => setTab(t.id)}
              style={[styles.tab, tab === t.id && styles.tabActive]}
            >
              <Ionicons name={t.icon} size={16} color={tab === t.id ? IteoColors.black : theme.textSecondary} />
              <Text style={[styles.tabText, { color: tab === t.id ? IteoColors.black : theme.textSecondary }]}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {error || queryError ? <ErrorText>{error ?? queryError?.message}</ErrorText> : null}

        {tab === 'browse' ? (
          <BrowseTab
            theme={theme}
            loading={loading}
            items={browseItems}
            typeFilter={typeFilter}
            district={district}
            neighborhood={neighborhood}
            search={search}
            minPrice={minPrice}
            maxPrice={maxPrice}
            sort={sort}
            onTypeFilterChange={(v) => {
              setTypeFilter(v);
              setAppliedType(v);
            }}
            onDistrictChange={setDistrict}
            onNeighborhoodChange={setNeighborhood}
            onSearchChange={setSearch}
            onMinPriceChange={setMinPrice}
            onMaxPriceChange={setMaxPrice}
            onSortChange={setSort}
            onApplyFilters={applyServerFilters}
            onSelect={openListing}
          />
        ) : null}

        {tab === 'create' ? (
          <CreateTab
            theme={theme}
            listingType={listingType}
            title={title}
            description={description}
            price={price}
            formDistrict={formDistrict}
            formNeighborhood={formNeighborhood}
            contactPhone={contactPhone}
            brand={brand}
            model={model}
            vehicleYear={vehicleYear}
            vehicleId={vehicleId}
            mileage={mileage}
            fuelType={fuelType}
            damageInfo={damageInfo}
            photoUris={photoUris}
            vehicles={vehicles}
            saving={saving}
            onListingTypeChange={setListingType}
            onTitleChange={setTitle}
            onDescriptionChange={setDescription}
            onPriceChange={setPrice}
            onFormDistrictChange={setFormDistrict}
            onFormNeighborhoodChange={setFormNeighborhood}
            onContactPhoneChange={setContactPhone}
            onBrandChange={setBrand}
            onModelChange={setModel}
            onVehicleYearChange={setVehicleYear}
            onVehicleIdChange={(id) => {
              setVehicleId(id);
              const v = vehicles.find((x) => x.id === id);
              if (v?.brand) setBrand(v.brand);
              if (v?.model) setModel(v.model);
            }}
            onMileageChange={setMileage}
            onFuelTypeChange={setFuelType}
            onDamageInfoChange={setDamageInfo}
            onPickPhotos={pickPhotos}
            onRemovePhoto={(idx) => setPhotoUris((p) => p.filter((_, i) => i !== idx))}
            onSubmit={handleCreate}
          />
        ) : null}

        {tab === 'mine' ? (
          <MineTab theme={theme} loading={loading} items={myItems} onSelect={(l) => openListing(l, true)} />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function BrowseTab({
  theme,
  loading,
  items,
  typeFilter,
  district,
  neighborhood,
  search,
  minPrice,
  maxPrice,
  sort,
  onTypeFilterChange,
  onDistrictChange,
  onNeighborhoodChange,
  onSearchChange,
  onMinPriceChange,
  onMaxPriceChange,
  onSortChange,
  onApplyFilters,
  onSelect,
}: {
  theme: ReturnType<typeof useTheme>;
  loading: boolean;
  items: Listing[];
  typeFilter: ListingTypeFilter;
  district: string;
  neighborhood: string;
  search: string;
  minPrice: string;
  maxPrice: string;
  sort: SortOption;
  onTypeFilterChange: (v: ListingTypeFilter) => void;
  onDistrictChange: (v: string) => void;
  onNeighborhoodChange: (v: string) => void;
  onSearchChange: (v: string) => void;
  onMinPriceChange: (v: string) => void;
  onMaxPriceChange: (v: string) => void;
  onSortChange: (v: SortOption) => void;
  onApplyFilters: () => void;
  onSelect: (l: Listing, fromMine: boolean) => void;
}) {
  const typeOptions: { value: ListingTypeFilter; label: string }[] = [
    { value: 'ALL', label: 'Tümü' },
    { value: 'VEHICLE_RENTAL', label: 'Araç Kiralama' },
    { value: 'PLATE_SALE', label: 'Plaka Satış' },
  ];

  return (
    <View style={styles.section}>
      <Card>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Filtreler</Text>
        <View style={styles.chipRow}>
          {typeOptions.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => onTypeFilterChange(opt.value)}
              style={[styles.chip, typeFilter === opt.value && styles.chipActive]}
            >
              <Text style={[styles.chipText, typeFilter === opt.value && styles.chipTextActive]}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>
        <Field label="İlçe" value={district} onChangeText={onDistrictChange} placeholder="Örn. Kadıköy" />
        <Field label="Mahalle" value={neighborhood} onChangeText={onNeighborhoodChange} placeholder="Opsiyonel" />
        <Field label="Ara" value={search} onChangeText={onSearchChange} placeholder="Başlık, marka, plaka..." icon="search" />
        <View style={styles.row2}>
          <View style={styles.flex}>
            <Field label="Min ₺" value={minPrice} onChangeText={onMinPriceChange} keyboardType="numeric" />
          </View>
          <View style={styles.flex}>
            <Field label="Max ₺" value={maxPrice} onChangeText={onMaxPriceChange} keyboardType="numeric" />
          </View>
        </View>
        <View style={styles.chipRow}>
          {(['newest', 'price_asc', 'price_desc'] as SortOption[]).map((s) => (
            <Pressable key={s} onPress={() => onSortChange(s)} style={[styles.chip, sort === s && styles.chipActive]}>
              <Text style={[styles.chipText, sort === s && styles.chipTextActive]}>
                {s === 'newest' ? 'En yeni' : s === 'price_asc' ? 'Ucuzdan' : 'Pahalıdan'}
              </Text>
            </Pressable>
          ))}
        </View>
        <Button title="Filtrele" icon="funnel" onPress={onApplyFilters} />
      </Card>

      {loading ? (
        <Loader />
      ) : items.length === 0 ? (
        <EmptyState icon="pricetag-outline" title="İlan bulunamadı" message="Filtreleri değiştirmeyi deneyin." />
      ) : (
        <View style={styles.grid}>
          {items.map((item) => (
            <ListingCard key={item.id} listing={item} onPress={() => onSelect(item, false)} />
          ))}
        </View>
      )}
    </View>
  );
}

function CreateTab(props: {
  theme: ReturnType<typeof useTheme>;
  listingType: string;
  title: string;
  description: string;
  price: string;
  formDistrict: string;
  formNeighborhood: string;
  contactPhone: string;
  brand: string;
  model: string;
  vehicleYear: string;
  vehicleId: string;
  mileage: string;
  fuelType: string;
  damageInfo: string;
  photoUris: string[];
  vehicles: { id: string; plateNumber: string; brand?: string | null; model?: string | null }[];
  saving: boolean;
  onListingTypeChange: (v: string) => void;
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onPriceChange: (v: string) => void;
  onFormDistrictChange: (v: string) => void;
  onFormNeighborhoodChange: (v: string) => void;
  onContactPhoneChange: (v: string) => void;
  onBrandChange: (v: string) => void;
  onModelChange: (v: string) => void;
  onVehicleYearChange: (v: string) => void;
  onVehicleIdChange: (id: string) => void;
  onMileageChange: (v: string) => void;
  onFuelTypeChange: (v: string) => void;
  onDamageInfoChange: (v: string) => void;
  onPickPhotos: () => void;
  onRemovePhoto: (idx: number) => void;
  onSubmit: () => void;
}) {
  const { theme, listingType, vehicles, saving, photoUris } = props;

  return (
    <View style={styles.section}>
      <Card style={{ backgroundColor: IteoColors.yellowLight, borderColor: IteoColors.yellow }}>
        <Text style={{ color: IteoColors.black, fontSize: fontSize.sm, lineHeight: 20 }}>
          İlanınız oda onayından sonra yayına alınır. Araç/plaka bilgilerini eksiksiz girin.
        </Text>
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Kategori</Text>
        <View style={styles.chipRow}>
          {(['VEHICLE_RENTAL', 'PLATE_SALE'] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => props.onListingTypeChange(t)}
              style={[styles.chip, listingType === t && styles.chipActive]}
            >
              <Text style={[styles.chipText, listingType === t && styles.chipTextActive]}>{typeLabels[t]}</Text>
            </Pressable>
          ))}
        </View>

        <Field label="Başlık" value={props.title} onChangeText={props.onTitleChange} placeholder="İlan başlığı" />
        <Field label="Açıklama" value={props.description} onChangeText={props.onDescriptionChange} placeholder="Detaylar" multiline />
        <Field label="Fiyat (₺)" value={props.price} onChangeText={props.onPriceChange} keyboardType="numeric" />
        <Field label="İlçe" value={props.formDistrict} onChangeText={props.onFormDistrictChange} />
        <Field label="Mahalle" value={props.formNeighborhood} onChangeText={props.onFormNeighborhoodChange} />
        <Field label="Telefon" value={props.contactPhone} onChangeText={props.onContactPhoneChange} keyboardType="phone-pad" />

        {vehicles.length > 0 ? (
          <>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Kayıtlı plaka (opsiyonel)</Text>
            <View style={styles.chipRow}>
              {vehicles.map((v) => (
                <Pressable
                  key={v.id}
                  onPress={() => props.onVehicleIdChange(v.id)}
                  style={[styles.chip, props.vehicleId === v.id && styles.chipActive]}
                >
                  <Text style={[styles.chipText, props.vehicleId === v.id && styles.chipTextActive]}>{v.plateNumber}</Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        <Field label="Marka" value={props.brand} onChangeText={props.onBrandChange} />
        <Field label="Model" value={props.model} onChangeText={props.onModelChange} />
        <Field label="Model yılı" value={props.vehicleYear} onChangeText={props.onVehicleYearChange} keyboardType="numeric" />
        <Field label="Kilometre" value={props.mileage} onChangeText={props.onMileageChange} keyboardType="numeric" />
        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Yakıt tipi</Text>
        <View style={styles.chipRow}>
          {fuelTypeOptions.map((f) => (
            <Pressable
              key={f}
              onPress={() => props.onFuelTypeChange(f)}
              style={[styles.chip, props.fuelType === f && styles.chipActive]}
            >
              <Text style={[styles.chipText, props.fuelType === f && styles.chipTextActive]}>{f}</Text>
            </Pressable>
          ))}
        </View>
        <Field label="Hasar bilgisi" value={props.damageInfo} onChangeText={props.onDamageInfoChange} multiline />

        <Button title="Fotoğraf ekle" icon="camera" variant="outline" onPress={props.onPickPhotos} />
        {photoUris.length > 0 ? (
          <View style={styles.chipRow}>
            {photoUris.map((_, idx) => (
              <Pressable key={idx} onPress={() => props.onRemovePhoto(idx)} style={styles.photoChip}>
                <Text style={styles.chipText}>Foto {idx + 1} ✕</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <Button title={saving ? 'Gönderiliyor...' : 'İlanı Gönder'} icon="send" loading={saving} onPress={props.onSubmit} />
      </Card>
    </View>
  );
}

function MineTab({
  theme,
  loading,
  items,
  onSelect,
}: {
  theme: ReturnType<typeof useTheme>;
  loading: boolean;
  items: Listing[];
  onSelect: (l: Listing) => void;
}) {
  const pending = items.filter((i) => i.status === 'PENDING').length;
  const approved = items.filter((i) => i.status === 'APPROVED').length;

  return (
    <View style={styles.section}>
      <View style={styles.statsRow}>
        <StatBox label="Toplam" value={items.length} theme={theme} />
        <StatBox label="Onay bekleyen" value={pending} theme={theme} tone="warning" />
        <StatBox label="Yayında" value={approved} theme={theme} tone="success" />
      </View>

      {loading ? (
        <Loader />
      ) : items.length === 0 ? (
        <EmptyState icon="pin" title="Henüz ilanınız yok" message="İlan Ver sekmesinden ilk ilanınızı oluşturun." />
      ) : (
        <View style={styles.grid}>
          {items.map((item) => (
            <ListingCard key={item.id} listing={item} onPress={() => onSelect(item)} showStatus />
          ))}
        </View>
      )}
    </View>
  );
}

function StatBox({
  label,
  value,
  theme,
  tone,
}: {
  label: string;
  value: number;
  theme: ReturnType<typeof useTheme>;
  tone?: 'warning' | 'success';
}) {
  return (
    <View
      style={[
        styles.statBox,
        { backgroundColor: theme.card, borderColor: theme.border },
        tone === 'warning' && { borderColor: IteoColors.yellowDark, backgroundColor: IteoColors.yellowLight },
        tone === 'success' && { borderColor: IteoColors.success, backgroundColor: '#F0FDF4' },
      ]}
    >
      <Text style={{ color: theme.textSecondary, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>{label}</Text>
      <Text style={{ color: theme.text, fontSize: fontSize.xl, fontWeight: '900', marginTop: 4 }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: SCREEN_BOTTOM_INSET, gap: spacing.lg },
  tabBar: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  tabActive: { backgroundColor: IteoColors.yellow },
  tabText: { fontSize: fontSize.sm, fontWeight: '800' },
  section: { gap: spacing.md },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '900', marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: IteoColors.gray200,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: IteoColors.white,
  },
  chipActive: { backgroundColor: IteoColors.yellow, borderColor: IteoColors.yellow },
  chipText: { fontSize: fontSize.sm, fontWeight: '700', color: IteoColors.gray500 },
  chipTextActive: { color: IteoColors.black },
  row2: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  grid: { gap: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statBox: { flex: 1, borderWidth: 1, borderRadius: radius.lg, padding: spacing.md },
  fieldLabel: { fontSize: fontSize.xs, fontWeight: '700', marginBottom: spacing.xs, textTransform: 'uppercase' },
  photoChip: {
    borderWidth: 1,
    borderColor: IteoColors.gray200,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
});
