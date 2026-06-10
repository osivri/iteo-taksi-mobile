import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { IteoColors } from '@/constants/Colors';
import { fontSize, radius, shadow, spacing } from '@/constants/theme';
import { getLauncherModules, roleDashboardTitles, type MemberRole, type UserRole } from '@/lib/dashboard';
import { useMemberCockpitTheme } from '@/providers/MemberCockpitThemeProvider';
import { MemberLauncherHeaderActions } from '@/components/MemberLauncherHeaderActions';

interface Props {
  role: MemberRole;
  firstName: string;
  lastName: string;
}

const iconByTitle: Record<string, keyof typeof Ionicons.glyphMap> = {
  Profil: 'person',
  Muhasebe: 'wallet',
  Haberler: 'newspaper',
  Duyurular: 'megaphone',
  İSG: 'shield-checkmark',
  Otel: 'business',
  Servis: 'construct',
  Ödemeler: 'card',
  Plakalar: 'car-sport',
  Eşya: 'briefcase',
  İlanlar: 'pricetag',
  Yardım: 'help-circle',
  Şoför: 'people',
  Araç: 'car-sport',
  Çekici: 'car',
  Sigorta: 'shield',
  Şikayet: 'megaphone',
  İhbar: 'eye',
  Dilekçe: 'document-text',
};

export function ModuleLauncherGrid({ role, firstName, lastName }: Props) {
  const router = useRouter();
  const { theme } = useMemberCockpitTheme();
  const isLight = theme === 'light';
  const modules = getLauncherModules(role);
  const primary = modules.slice(0, 6);
  const extra = modules.slice(6);
  const panelTitle = roleDashboardTitles[role as UserRole] ?? 'Oda Üyesi Paneli';

  const headerText = isLight ? IteoColors.black : IteoColors.white;
  const headerMuted = isLight ? 'rgba(10,10,10,0.55)' : 'rgba(255,255,255,0.55)';
  const sectionLabel = isLight ? 'rgba(10,10,10,0.4)' : 'rgba(255,199,0,0.55)';

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <View style={styles.headerRow}>
          <Image source={require('@/assets/images/iteo_logo.jpeg')} style={styles.logo} />
          <View style={styles.flex}>
            <Text style={[styles.badge, { color: headerMuted }]}>{panelTitle.toUpperCase()}</Text>
            <Text style={[styles.org, { color: headerMuted }]}>İstanbul Taksiciler Esnaf Odası</Text>
          </View>
        </View>
        <MemberLauncherHeaderActions />
      </View>

      <Text style={[styles.welcome, { color: headerText }]}>
        Hoşgeldiniz, {firstName} {lastName}
      </Text>
      <Text style={[styles.hint, { color: headerMuted }]}>
        Kullanmak istediğiniz modülü seçin. Her kart ayrı bir hizmet alanına götürür.
      </Text>

      <View style={styles.grid}>
        {primary.map((mod) => (
          <ModuleTile
            key={mod.href as string}
            label={mod.title}
            subtitle={mod.subtitle}
            icon={iconByTitle[mod.title] ?? 'apps'}
            onPress={() => router.push(mod.href)}
            featured
            variant={theme}
          />
        ))}
      </View>

      {extra.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, { color: sectionLabel }]}>Diğer hizmetler</Text>
          <View style={styles.extraGrid}>
            {extra.map((mod) => (
              <ModuleTile
                key={mod.href as string}
                label={mod.title}
                icon={iconByTitle[mod.title] ?? 'apps'}
                onPress={() => router.push(mod.href)}
                variant={theme}
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

function ModuleTile({
  label,
  subtitle,
  icon,
  onPress,
  featured = false,
  variant,
}: {
  label: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  featured?: boolean;
  variant: 'light' | 'dark';
}) {
  const isLight = variant === 'light';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        isLight ? styles.tileLight : styles.tileDark,
        featured ? styles.tileFeatured : styles.tileCompact,
        pressed && styles.tilePressed,
      ]}
    >
      <View style={[styles.iconWrap, isLight ? styles.iconWrapLight : styles.iconWrapDark, featured && styles.iconWrapFeatured]}>
        <Ionicons name={icon} size={featured ? 28 : 22} color={isLight ? IteoColors.yellow : IteoColors.black} />
      </View>
      <Text style={[styles.tileLabel, isLight ? styles.tileLabelLight : styles.tileLabelDark, featured && styles.tileLabelFeatured]}>
        {label}
      </Text>
      {featured && subtitle ? (
        <Text style={[styles.tileSub, isLight ? styles.tileSubLight : styles.tileSubDark]} numberOfLines={2}>
          {subtitle}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  flex: { flex: 1 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  headerRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md, minWidth: 0 },
  logo: { width: 64, height: 64, borderRadius: radius.xl, ...shadow.card },
  badge: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  org: { fontSize: fontSize.sm, fontWeight: '600', marginTop: 2 },
  welcome: { fontSize: fontSize.xxl, fontWeight: '900', lineHeight: 32 },
  hint: { fontSize: fontSize.sm, marginTop: spacing.sm, marginBottom: spacing.lg, fontWeight: '600', lineHeight: 20 },
  sectionLabel: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    fontSize: fontSize.xs,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.md },
  extraGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.sm },
  tile: { borderRadius: radius.xl, padding: spacing.md, justifyContent: 'space-between', ...shadow.raised },
  tileLight: { backgroundColor: IteoColors.black },
  tileDark: { backgroundColor: IteoColors.yellow },
  tileFeatured: { width: '48%', minHeight: 168 },
  tileCompact: { width: '31%', minHeight: 108 },
  tilePressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapLight: { backgroundColor: 'rgba(255,199,0,0.15)', borderWidth: 1, borderColor: 'rgba(255,199,0,0.25)' },
  iconWrapDark: { backgroundColor: 'rgba(10,10,10,0.1)', borderWidth: 1, borderColor: 'rgba(10,10,10,0.12)' },
  iconWrapFeatured: { width: 52, height: 52 },
  tileLabel: { fontWeight: '900', fontSize: fontSize.md, marginTop: spacing.md },
  tileLabelLight: { color: IteoColors.white },
  tileLabelDark: { color: IteoColors.black },
  tileLabelFeatured: { fontSize: fontSize.lg },
  tileSub: { fontSize: fontSize.xs, marginTop: 4, lineHeight: 16 },
  tileSubLight: { color: 'rgba(255,255,255,0.55)' },
  tileSubDark: { color: 'rgba(10,10,10,0.6)' },
});
