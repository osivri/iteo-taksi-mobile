import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fontSize, radius, spacing } from '@/constants/theme';
import { Card, useTheme } from '@/components/ui';

interface Props {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  style?: object;
}

export function CollapsibleSection({ title, children, defaultOpen = false, style }: Props) {
  const theme = useTheme();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card style={style}>
      <Pressable onPress={() => setOpen((v) => !v)} style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={theme.textSecondary} />
      </Pressable>
      {open ? <View style={styles.body}>{children}</View> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: fontSize.md, fontWeight: '900', flex: 1 },
  body: { marginTop: spacing.md },
});
