export type UserRole = 'USER' | 'DRIVER' | 'PLATE_OWNER' | 'ADMIN' | 'SUPER_ADMIN';

export interface QuickAction {
  title: string;
  subtitle: string;
  href: '/(tabs)/finance' | '/(tabs)/announcements' | '/news' | '/payments' | '/appointments' | '/vehicles' | '/notifications' | '/ohs' | '/help';
  emoji: string;
  roles: UserRole[];
}

export const allQuickActions: QuickAction[] = [
  { title: 'Gelir Ekle', subtitle: 'Hasılat kaydı', href: '/(tabs)/finance', emoji: '💰', roles: ['USER', 'DRIVER', 'PLATE_OWNER'] },
  { title: 'Gider Ekle', subtitle: 'Masraf kaydı', href: '/(tabs)/finance', emoji: '🧾', roles: ['USER', 'DRIVER', 'PLATE_OWNER'] },
  { title: 'Plakalarım', subtitle: 'Araç kayıtları', href: '/vehicles', emoji: '🚕', roles: ['DRIVER', 'PLATE_OWNER'] },
  { title: 'Ödemeler', subtitle: 'Aidat ve ücretler', href: '/payments', emoji: '💳', roles: ['USER', 'DRIVER', 'PLATE_OWNER'] },
  { title: 'Randevu Al', subtitle: 'Otel & oto servis', href: '/appointments', emoji: '📅', roles: ['USER', 'DRIVER', 'PLATE_OWNER'] },
  { title: 'Duyurular', subtitle: 'Oda duyuruları', href: '/(tabs)/announcements', emoji: '📢', roles: ['USER', 'DRIVER', 'PLATE_OWNER'] },
  { title: 'Haberler', subtitle: 'Sektör haberleri', href: '/news', emoji: '📰', roles: ['USER', 'DRIVER', 'PLATE_OWNER'] },
  { title: 'Bildirimler', subtitle: 'Mesajlarınız', href: '/notifications', emoji: '🔔', roles: ['USER', 'DRIVER', 'PLATE_OWNER'] },
  { title: 'İSG', subtitle: 'Eğitim ve dijital danışman', href: '/ohs', emoji: '🦺', roles: ['USER', 'DRIVER', 'PLATE_OWNER'] },
  { title: 'Yardım', subtitle: 'SSS ve iletişim', href: '/help', emoji: '❓', roles: ['USER', 'DRIVER', 'PLATE_OWNER'] },
];

export function getQuickActionsForRole(role: UserRole): QuickAction[] {
  const seen = new Set<string>();
  return allQuickActions.filter((action) => {
    if (!action.roles.includes(role)) return false;
    const key = `${action.href}-${action.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const roleDashboardTitles: Record<UserRole, string> = {
  USER: 'Üye Paneli',
  DRIVER: 'Şoför Paneli',
  PLATE_OWNER: 'Plaka Sahibi Paneli',
  ADMIN: 'Admin Paneli',
  SUPER_ADMIN: 'Yönetici Paneli',
};
