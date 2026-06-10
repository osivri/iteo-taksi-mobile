import * as SecureStore from 'expo-secure-store';

export type MemberLoginRole = 'DRIVER' | 'PLATE_OWNER' | 'USER';

const LOGIN_INTENT_KEY = 'iteo_login_intent';

export async function setLoginIntent(role: MemberLoginRole): Promise<void> {
  await SecureStore.setItemAsync(LOGIN_INTENT_KEY, role);
}

export async function getLoginIntent(): Promise<MemberLoginRole | null> {
  const value = await SecureStore.getItemAsync(LOGIN_INTENT_KEY);
  if (value === 'DRIVER' || value === 'PLATE_OWNER' || value === 'USER') {
    return value;
  }
  return null;
}

export async function clearLoginIntent(): Promise<void> {
  await SecureStore.deleteItemAsync(LOGIN_INTENT_KEY);
}

export const loginPortalCopy: Record<
  MemberLoginRole,
  { title: string; subtitle: string; badge: string }
> = {
  DRIVER: {
    title: 'Şoför Girişi',
    subtitle: 'Vardiya, hasılat ve plaka işlemleriniz',
    badge: 'Şoför Paneli',
  },
  PLATE_OWNER: {
    title: 'Oda Üyesi Girişi',
    subtitle: 'Plaka, gelir-gider, aidat ve oda hizmetleriniz',
    badge: 'Oda Üyesi Paneli',
  },
  USER: {
    title: 'Oda Üyesi Girişi',
    subtitle: 'Duyuru, haber, ödeme ve randevu hizmetleri',
    badge: 'Oda Üyesi Paneli',
  },
};
