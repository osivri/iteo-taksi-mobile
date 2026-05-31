import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  ScrollView,
  type StyleProp,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Colors, { IteoColors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { fontSize, radius, SCREEN_BOTTOM_INSET, shadow, spacing } from '@/constants/theme';

type IconName = keyof typeof Ionicons.glyphMap;

export function useTheme() {
  const scheme = useColorScheme() ?? 'light';
  return { ...Colors[scheme], scheme };
}

/* ------------------------------------------------------------------ Screen */

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: readonly Edge[];
  /** Alt tab bar ile çakışmayı önlemek için ekstra alt boşluk bırakır. */
  withTabBar?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  refreshControl?: ScrollViewProps['refreshControl'];
}

type ScrollViewProps = React.ComponentProps<typeof ScrollView>;

export function Screen({
  children,
  scroll = false,
  padded = true,
  edges = ['top'],
  withTabBar = false,
  contentStyle,
  refreshControl,
}: ScreenProps) {
  const theme = useTheme();
  const padding = padded ? spacing.lg : 0;
  const paddingBottom = withTabBar ? SCREEN_BOTTOM_INSET : padding;

  if (scroll) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: theme.backgroundSecondary }]} edges={edges}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[{ padding, paddingBottom }, contentStyle]}
          refreshControl={refreshControl}>
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.backgroundSecondary }]} edges={edges}>
      <View style={[styles.flex, { padding, paddingBottom }, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ Header */

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  icon?: IconName;
  right?: ReactNode;
}

/** Yuvarlatılmış koyu kahraman başlık — sekme ekranlarının üst bloğu. */
export function ScreenHeader({ title, subtitle, eyebrow, icon, right }: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <View style={styles.flex}>
          {eyebrow ? <Text style={styles.headerEyebrow}>{eyebrow}</Text> : null}
          <View style={styles.headerTitleRow}>
            {icon ? (
              <View style={styles.headerIcon}>
                <Ionicons name={icon} size={20} color={IteoColors.black} />
              </View>
            ) : null}
            <Text style={styles.headerTitle}>{title}</Text>
          </View>
          {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
        </View>
        {right ? <View style={styles.headerRight}>{right}</View> : null}
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------- Card */

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
}

export function Card({ children, style, elevated = true }: CardProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border },
        elevated && theme.scheme === 'light' ? shadow.card : null,
        style,
      ]}>
      {children}
    </View>
  );
}

/* ----------------------------------------------------------------- Buttons */

type ButtonVariant = 'primary' | 'dark' | 'success' | 'danger' | 'ghost' | 'outline';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  icon?: IconName;
  fullWidth?: boolean;
  size?: 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
}

const variantBg: Record<ButtonVariant, string> = {
  primary: IteoColors.yellow,
  dark: IteoColors.black,
  success: IteoColors.success,
  danger: IteoColors.error,
  ghost: 'transparent',
  outline: 'transparent',
};

const variantFg: Record<ButtonVariant, string> = {
  primary: IteoColors.black,
  dark: IteoColors.white,
  success: IteoColors.white,
  danger: IteoColors.white,
  ghost: IteoColors.yellowDark,
  outline: IteoColors.black,
};

export function Button({
  title,
  variant = 'primary',
  loading = false,
  icon,
  fullWidth = true,
  size = 'lg',
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const fg = variant === 'outline' ? theme.text : variantFg[variant];

  return (
    <Pressable
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        size === 'md' ? styles.buttonMd : styles.buttonLg,
        { backgroundColor: variantBg[variant] },
        variant === 'outline' ? { borderWidth: 1.5, borderColor: theme.border } : null,
        fullWidth ? null : styles.buttonAuto,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.buttonDisabled : null,
        style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.buttonInner}>
          {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
          <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

/* ------------------------------------------------------------------- Field */

interface FieldProps extends TextInputProps {
  label?: string;
  icon?: IconName;
  hint?: string;
}

export function Field({ label, icon, hint, style, ...rest }: FieldProps) {
  const theme = useTheme();
  return (
    <View style={styles.fieldWrap}>
      {label ? <Text style={[styles.fieldLabel, { color: theme.text }]}>{label}</Text> : null}
      <View
        style={[
          styles.fieldBox,
          { backgroundColor: theme.scheme === 'light' ? IteoColors.gray100 : theme.background, borderColor: theme.border },
        ]}>
        {icon ? <Ionicons name={icon} size={18} color={theme.textSecondary} style={{ marginRight: spacing.sm }} /> : null}
        <TextInput
          style={[styles.fieldInput, { color: theme.text }, style]}
          placeholderTextColor={theme.textSecondary}
          {...rest}
        />
      </View>
      {hint ? <Text style={[styles.fieldHint, { color: theme.textSecondary }]}>{hint}</Text> : null}
    </View>
  );
}

/* -------------------------------------------------------- SegmentedControl */

interface SegmentedControlProps<T extends string> {
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
}

export function SegmentedControl<T extends string>({ value, options, onChange, style }: SegmentedControlProps<T>) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.segment,
        { backgroundColor: theme.scheme === 'light' ? IteoColors.gray100 : IteoColors.black },
        style,
      ]}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.segmentItem, active && styles.segmentItemActive]}>
            <Text style={[styles.segmentText, { color: active ? IteoColors.black : theme.textSecondary }]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* -------------------------------------------------------------------- Chip */

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

export function Chip({ label, active = false, onPress }: ChipProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? IteoColors.yellow : theme.card,
          borderColor: active ? IteoColors.yellow : theme.border,
        },
      ]}>
      <Text style={[styles.chipText, { color: active ? IteoColors.black : theme.textSecondary }]}>{label}</Text>
    </Pressable>
  );
}

/* ------------------------------------------------------------------- Badge */

type BadgeTone = 'neutral' | 'warning' | 'success' | 'danger' | 'info';

const badgeTones: Record<BadgeTone, { bg: string; fg: string }> = {
  neutral: { bg: IteoColors.yellowLight, fg: IteoColors.black },
  warning: { bg: '#FEF3C7', fg: '#92400E' },
  success: { bg: '#DCFCE7', fg: '#166534' },
  danger: { bg: '#FEE2E2', fg: '#991B1B' },
  info: { bg: '#DBEAFE', fg: '#1E40AF' },
};

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: BadgeTone }) {
  const t = badgeTones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text style={[styles.badgeText, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

/* -------------------------------------------------------------- IconBubble */

export function IconBubble({
  icon,
  size = 48,
  bg = IteoColors.yellow,
  color = IteoColors.black,
}: {
  icon: IconName;
  size?: number;
  bg?: string;
  color?: string;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 3,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Ionicons name={icon} size={size * 0.5} color={color} />
    </View>
  );
}

/* ---------------------------------------------------------------- ListRow */

interface ListRowProps {
  title: string;
  subtitle?: string;
  icon?: IconName;
  right?: ReactNode;
  onPress?: () => void;
  tone?: string;
}

export function ListRow({ title, subtitle, icon, right, onPress, tone }: ListRowProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.listRow,
        { backgroundColor: theme.card, borderColor: theme.border },
        theme.scheme === 'light' ? shadow.card : null,
        pressed && onPress ? styles.pressed : null,
      ]}>
      {icon ? <IconBubble icon={icon} size={44} bg={tone ?? IteoColors.yellowLight} /> : null}
      <View style={styles.flex}>
        <Text style={[styles.listTitle, { color: theme.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.listSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text> : null}
      </View>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} /> : null)}
    </Pressable>
  );
}

/* ------------------------------------------------------------- EmptyState */

export function EmptyState({ icon = 'file-tray-outline', title, message }: { icon?: IconName; title: string; message?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Ionicons name={icon} size={30} color={theme.textSecondary} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>{title}</Text>
      {message ? <Text style={[styles.emptyMessage, { color: theme.textSecondary }]}>{message}</Text> : null}
    </View>
  );
}

/* ------------------------------------------------------------- misc texts */

export function ErrorText({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.errorText, style]}>{children}</Text>;
}

export function SectionTitle({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const theme = useTheme();
  return <Text style={[styles.sectionTitle, { color: theme.text }, style]}>{children}</Text>;
}

export function Loader() {
  return (
    <View style={styles.loader}>
      <ActivityIndicator color={IteoColors.yellow} size="large" />
    </View>
  );
}

/* ------------------------------------------------------------------ styles */

const styles = StyleSheet.create({
  flex: { flex: 1 },

  header: {
    backgroundColor: IteoColors.black,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerEyebrow: {
    color: IteoColors.yellow,
    fontSize: fontSize.xs,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xs },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: IteoColors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: IteoColors.white, fontSize: fontSize.display, fontWeight: '900', letterSpacing: -0.6 },
  headerSubtitle: { color: '#A3A3A3', fontSize: fontSize.md, marginTop: spacing.sm, lineHeight: 20 },
  headerRight: { marginLeft: spacing.md },

  card: { borderRadius: radius.xl, borderWidth: 1, padding: spacing.lg },

  button: { borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  buttonLg: { paddingVertical: 16 },
  buttonMd: { paddingVertical: 12, paddingHorizontal: 18 },
  buttonAuto: { alignSelf: 'flex-start', paddingHorizontal: 22 },
  buttonInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  buttonText: { fontSize: fontSize.lg, fontWeight: '800' },
  buttonDisabled: { opacity: 0.5 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.992 }] },

  fieldWrap: { marginBottom: spacing.md },
  fieldLabel: { fontSize: fontSize.sm, fontWeight: '800', marginBottom: spacing.sm, marginLeft: 2 },
  fieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
  },
  fieldInput: { flex: 1, paddingVertical: 14, fontSize: fontSize.lg },
  fieldHint: { fontSize: fontSize.xs, marginTop: spacing.xs, marginLeft: 2 },

  segment: { flexDirection: 'row', borderRadius: radius.md, padding: 4 },
  segmentItem: { flex: 1, paddingVertical: 10, borderRadius: radius.sm, alignItems: 'center' },
  segmentItemActive: { backgroundColor: IteoColors.yellow },
  segmentText: { fontSize: fontSize.sm, fontWeight: '800' },

  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill, borderWidth: 1 },
  chipText: { fontSize: fontSize.sm, fontWeight: '700' },

  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: fontSize.xs, fontWeight: '800' },

  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  listTitle: { fontSize: fontSize.lg, fontWeight: '800' },
  listSubtitle: { fontSize: fontSize.sm, marginTop: 3, lineHeight: 18 },

  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: spacing.xl },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '800' },
  emptyMessage: { fontSize: fontSize.md, textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 },

  errorText: { color: IteoColors.error, textAlign: 'center', fontWeight: '600', marginVertical: spacing.sm },
  sectionTitle: { fontSize: fontSize.xl, fontWeight: '900', letterSpacing: -0.3, marginBottom: spacing.md },
  loader: { paddingVertical: 48, alignItems: 'center' },
});
