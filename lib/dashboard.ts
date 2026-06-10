import type { Href } from 'expo-router';

export type UserRole = 'USER' | 'DRIVER' | 'PLATE_OWNER' | 'ADMIN' | 'SUPER_ADMIN';
export type MemberRole = 'USER' | 'DRIVER' | 'PLATE_OWNER';

export const roleDashboardTitles: Record<UserRole, string> = {
  USER: 'Oda Üyesi Paneli',
  DRIVER: 'Şoför Paneli',
  PLATE_OWNER: 'Oda Üyesi Paneli',
  ADMIN: 'Admin Paneli',
  SUPER_ADMIN: 'Yönetici Paneli',
};

export function toMemberRole(role: string | undefined | null): MemberRole {
  if (role === 'DRIVER') return 'DRIVER';
  if (role === 'PLATE_OWNER' || role === 'USER') return 'PLATE_OWNER';
  return 'PLATE_OWNER';
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
    labelByRole: { DRIVER: 'Çalışma Bilgileri' },
  },
  announcements: { label: 'Duyurular', roles: ['USER', 'DRIVER', 'PLATE_OWNER'] },
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
    labelByRole: { DRIVER: 'Çalışma Bilgileri' },
  },
  {
    title: 'Şoför Bul',
    subtitle: 'Boş plaka için şoför daveti',
    href: '/find-driver',
    emoji: '👥',
    roles: ['PLATE_OWNER'],
  },
  {
    title: 'Araç Bul',
    subtitle: 'Boş araçlara başvuru',
    href: '/find-vehicle',
    emoji: '🚕',
    roles: ['DRIVER'],
  },
  { title: 'Duyurular', subtitle: 'Oda duyuruları', href: '/(tabs)/announcements', emoji: '📢', roles: ['USER', 'DRIVER', 'PLATE_OWNER'] },
  { title: 'Haberler', subtitle: 'Sektör haberleri', href: '/news', emoji: '📰', roles: ['USER', 'DRIVER', 'PLATE_OWNER'] },
  { title: 'Ödemeler', subtitle: 'Aidat ve ücretler', href: '/(tabs)/payments', emoji: '💳', roles: ['USER', 'PLATE_OWNER'] },
  { title: 'Otel Konaklama', subtitle: 'Oda üyesi konaklama talebi', href: '/hotel-appointments', emoji: '🏨', roles: ['USER', 'DRIVER', 'PLATE_OWNER'] },
  { title: 'Servis Randevu', subtitle: 'Bakım ve onarım randevusu', href: '/service-appointments', emoji: '🔧', roles: ['USER', 'DRIVER', 'PLATE_OWNER'] },
  { title: 'İlanlar', subtitle: 'Kiralama & plaka satış', href: '/listings', emoji: '📌', roles: ['USER', 'DRIVER', 'PLATE_OWNER'] },
  { title: 'Duraklar', subtitle: 'Durak rehberi', href: '/stands', emoji: '🚏', roles: ['USER', 'DRIVER', 'PLATE_OWNER'] },
  { title: 'Yedek Parça', subtitle: 'Parça kataloğu', href: '/spare-parts', emoji: '🔧', roles: ['DRIVER', 'PLATE_OWNER'] },
  { title: 'Puanlarım', subtitle: 'QR şoför puanlama', href: '/ratings', emoji: '⭐', roles: ['DRIVER'] },
  { title: 'Unutulan Eşya', subtitle: 'Odaya eşya bildirimi', href: '/forgotten-items', emoji: '🧳', roles: ['DRIVER', 'PLATE_OWNER'] },
  { title: 'Çekici', subtitle: 'Arıza ve kaza çekici', href: '/service-tow', emoji: '🚗', roles: ['USER', 'DRIVER', 'PLATE_OWNER'] },
  { title: 'Sigorta', subtitle: 'Poliçe ve yenileme', href: '/service-insurance', emoji: '🛡️', roles: ['USER', 'DRIVER', 'PLATE_OWNER'] },
  { title: 'Şikayet', subtitle: 'Şikayet ve öneri', href: '/service-complaint', emoji: '📣', roles: ['USER', 'DRIVER', 'PLATE_OWNER'] },
  { title: 'Korsan İhbar', subtitle: 'Korsan taksi bildirimi', href: '/service-pirate-report', emoji: '👁️', roles: ['USER', 'DRIVER', 'PLATE_OWNER'] },
  { title: 'Dilekçe', subtitle: 'Resmi yazılı talep', href: '/service-petition', emoji: '📄', roles: ['USER', 'DRIVER', 'PLATE_OWNER'] },
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

const launcherOrder: Record<MemberRole, string[]> = {
  DRIVER: ['Profilim', 'Muhasebe', 'Haberler', 'Duyurular', 'İSG', 'Otel Konaklama', 'Servis Randevu', 'Plakalarım', 'Araç Bul', 'Unutulan Eşya', 'İlanlar', 'Çekici', 'Sigorta', 'Şikayet', 'Korsan İhbar', 'Dilekçe', 'Yardım'],
  PLATE_OWNER: ['Profilim', 'Ödemeler', 'Muhasebe', 'Plakalarım', 'Şoför Bul', 'Haberler', 'Duyurular', 'İSG', 'Otel Konaklama', 'Servis Randevu', 'İlanlar', 'Çekici', 'Sigorta', 'Şikayet', 'Korsan İhbar', 'Dilekçe', 'Yardım'],
  USER: ['Profilim', 'Ödemeler', 'Haberler', 'Duyurular', 'İSG', 'Otel Konaklama', 'Servis Randevu', 'Çekici', 'Sigorta', 'Şikayet', 'Korsan İhbar', 'Dilekçe', 'Yardım'],
};

const launcherShortLabels: Record<string, string> = {
  Profilim: 'Profil',
  Plakalarım: 'Plakalar',
  'Çalışma Plakam': 'Plakalar',
  'Çalışma Bilgileri': 'Plakalar',
  'Unutulan Eşya': 'Eşya',
  'Korsan İhbar': 'İhbar',
  'Otel Konaklama': 'Otel',
  'Servis Randevu': 'Servis',
  'Şoför Bul': 'Şoför',
  'Araç Bul': 'Araç',
};

const launcherSubtitles: Record<string, string> = {
  Profilim: 'Hesap ve kişisel bilgiler',
  Muhasebe: 'Gelir, gider ve fiş takibi',
  Haberler: 'Sektör, oda ve gündem haberleri',
  Duyurular: 'Resmi bildirim ve uyarılar',
  İSG: 'Danışman, eğitim ve SSS',
  'Otel Konaklama': 'Oda üyesi konaklama talebi',
  'Servis Randevu': 'Bakım ve onarım randevusu',
  Ödemeler: 'Aidat ve ücretler',
  Plakalarım: 'Plaka kaydı ve araç yönetimi',
  'Çalışma Bilgileri': 'Onaylı çalışma plakalarınız',
  'Unutulan Eşya': 'Kayıp eşya bildirimi',
  'Şoför Bul': 'Boş plaka için şoför daveti',
  'Araç Bul': 'Boş araçlara başvuru ve davetler',
  Çekici: 'Arıza ve kaza çekici talebi',
  Sigorta: 'Poliçe ve yenileme başvurusu',
  Şikayet: 'Şikayet ve geri bildirim',
  'Korsan İhbar': 'Korsan taksi bildirimi',
  Dilekçe: 'Resmi yazılı talep',
  İlanlar: 'Araç kiralama ve plaka satış',
  Yardım: 'SSS ve iletişim',
};

export interface LauncherModule {
  title: string;
  subtitle: string;
  href: Href;
}

export function getLauncherModules(role: MemberRole): LauncherModule[] {
  const order = launcherOrder[role];
  return order
    .map((title) => {
      const action = allQuickActions.find((a) => a.title === title && a.roles.includes(role));
      if (!action) return null;
      const full = quickActionLabel(action, role);
      const label = launcherShortLabels[full] ?? launcherShortLabels[action.title] ?? full;
      return {
        title: label,
        subtitle: launcherSubtitles[full] ?? launcherSubtitles[action.title] ?? action.subtitle,
        href: action.href,
      };
    })
    .filter((m): m is LauncherModule => m !== null);
}
