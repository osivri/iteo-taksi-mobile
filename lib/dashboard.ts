import type { Href } from 'expo-router';

export type UserRole = 'USER' | 'DRIVER' | 'PLATE_OWNER' | 'ADMIN' | 'SUPER_ADMIN';
export type MemberRole = 'USER' | 'DRIVER' | 'PLATE_OWNER';

export const roleDashboardTitles: Record<UserRole, string> = {
  USER: 'Üye Paneli',
  DRIVER: 'Şoför Paneli',
  PLATE_OWNER: 'Plaka Sahibi Paneli',
  ADMIN: 'Admin Paneli',
  SUPER_ADMIN: 'Yönetici Paneli',
};

export function toMemberRole(role: string | undefined | null): MemberRole {
  return role === 'DRIVER' || role === 'PLATE_OWNER' ? role : 'USER';
}

/* ------------------------------------------------------------- Tab bar config

Her rol için ayrı bir "oda" (sekme dizilimi) tanımlanır. `two` (Menü) ve
`profile` sekmeleri layout içinde sabit yönetilir; aşağıdaki yapı rol bazlı
görünen sekmeleri ve etiketlerini belirler. Sıralama, sekmelerin alt çubuktaki
görünüm sırasını verir. */

export type RoleTabName = 'index' | 'finance' | 'vehicles' | 'announcements' | 'payments' | 'appointments';

export interface RoleTabConfig {
  label: string;
  roles: MemberRole[];
  labelByRole?: Partial<Record<MemberRole, string>>;
}

export const roleTabOrder: RoleTabName[] = [
  'index',
  'finance',
  'vehicles',
  'announcements',
  'payments',
  'appointments',
];

export const roleTabConfig: Record<RoleTabName, RoleTabConfig> = {
  index: { label: 'Ana Sayfa', roles: ['USER', 'DRIVER', 'PLATE_OWNER'] },
  finance: { label: 'Muhasebe', roles: ['DRIVER', 'PLATE_OWNER'] },
  vehicles: {
    label: 'Plakalarım',
    roles: ['DRIVER', 'PLATE_OWNER'],
    labelByRole: { DRIVER: 'Çalışma Plakam' },
  },
  announcements: { label: 'Duyurular', roles: ['USER', 'DRIVER'] },
  payments: { label: 'Ödemeler', roles: ['USER', 'PLATE_OWNER'] },
  appointments: { label: 'Randevu', roles: ['USER'] },
};

export function isTabVisible(name: RoleTabName, role: MemberRole): boolean {
  return roleTabConfig[name].roles.includes(role);
}

export function tabLabel(name: RoleTabName, role: MemberRole): string {
  const cfg = roleTabConfig[name];
  return cfg.labelByRole?.[role] ?? cfg.label;
}

/* --------------------------------------------------------------- Menu actions

Menü sekmesi (ve ana sayfa kısayolları) için tüm hedefler. Rol filtresi web
panelindeki `memberNavItems` ile aynı kuralları izler:
  - Muhasebe & Plaka: yalnızca DRIVER, PLATE_OWNER
  - Ödemeler: yalnızca PLATE_OWNER, USER (şoföre kapalı)
  - Diğer hizmetler: tüm roller */

export interface QuickAction {
  title: string;
  subtitle: string;
  href: Href;
  emoji: string;
  roles: MemberRole[];
  labelByRole?: Partial<Record<MemberRole, string>>;
}

export const allQuickActions: QuickAction[] = [
  { title: 'Profilim', subtitle: 'Hesap bilgileriniz', href: '/(tabs)/profile', emoji: '👤', roles: ['USER', 'DRIVER', 'PLATE_OWNER'] },
  { title: 'Muhasebe', subtitle: 'Gelir & gider takibi', href: '/(tabs)/finance', emoji: '📒', roles: ['DRIVER', 'PLATE_OWNER'] },
  {
    title: 'Plakalarım',
    subtitle: 'Araç ve plaka kayıtları',
    href: '/(tabs)/vehicles',
    emoji: '🚕',
    roles: ['DRIVER', 'PLATE_OWNER'],
    labelByRole: { DRIVER: 'Çalışma Plakam' },
  },
  { title: 'Duyurular', subtitle: 'Oda duyuruları', href: '/(tabs)/announcements', emoji: '📢', roles: ['USER', 'DRIVER', 'PLATE_OWNER'] },
  { title: 'Haberler', subtitle: 'Sektör haberleri', href: '/news', emoji: '📰', roles: ['USER', 'DRIVER', 'PLATE_OWNER'] },
  { title: 'Ödemeler', subtitle: 'Aidat ve ücretler', href: '/(tabs)/payments', emoji: '💳', roles: ['USER', 'PLATE_OWNER'] },
  { title: 'Randevu', subtitle: 'Otel & oto servis', href: '/(tabs)/appointments', emoji: '📅', roles: ['USER'] },
  { title: 'İlanlar', subtitle: 'Kiralama & plaka satış', href: '/listings', emoji: '📌', roles: ['USER', 'DRIVER', 'PLATE_OWNER'] },
  { title: 'Duraklar', subtitle: 'Durak rehberi', href: '/stands', emoji: '🚏', roles: ['USER', 'DRIVER', 'PLATE_OWNER'] },
  { title: 'Yedek Parça', subtitle: 'Parça kataloğu', href: '/spare-parts', emoji: '🔧', roles: ['DRIVER', 'PLATE_OWNER'] },
  { title: 'Puanlarım', subtitle: 'QR şoför puanlama', href: '/ratings', emoji: '⭐', roles: ['DRIVER'] },
  { title: 'Unutulan Eşya', subtitle: 'Odaya eşya bildirimi', href: '/forgotten-items', emoji: '🧳', roles: ['DRIVER', 'PLATE_OWNER'] },
  { title: 'Oda Hizmetleri', subtitle: 'Çekici, sigorta, şikayet', href: '/services', emoji: '🛎️', roles: ['USER', 'DRIVER', 'PLATE_OWNER'] },
  { title: 'İSG', subtitle: 'Eğitim ve dijital danışman', href: '/ohs', emoji: '🦺', roles: ['USER', 'DRIVER', 'PLATE_OWNER'] },
  { title: 'Bildirimler', subtitle: 'Mesajlarınız', href: '/notifications', emoji: '🔔', roles: ['USER', 'DRIVER', 'PLATE_OWNER'] },
  { title: 'Yardım', subtitle: 'SSS ve iletişim', href: '/help', emoji: '❓', roles: ['USER', 'DRIVER', 'PLATE_OWNER'] },
];

export function getQuickActionsForRole(role: MemberRole): QuickAction[] {
  return allQuickActions.filter((action) => action.roles.includes(role));
}

export function quickActionLabel(action: QuickAction, role: MemberRole): string {
  return action.labelByRole?.[role] ?? action.title;
}
