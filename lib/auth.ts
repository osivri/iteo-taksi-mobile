import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEYS = {
  access: 'iteo_access_token',
  refresh: 'iteo_refresh_token',
  role: 'iteo_user_role',
} as const;

export interface AuthSessionPayload {
  accessToken: string;
  refreshToken: string;
  expiresAt?: number | null;
  user?: { role?: string };
}

const memoryStore = new Map<string, string>();

async function setItem(key: string, value: string) {
  if (Platform.OS === 'web') {
    memoryStore.set(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return memoryStore.get(key) ?? null;
  }
  return SecureStore.getItemAsync(key);
}

async function removeItem(key: string) {
  if (Platform.OS === 'web') {
    memoryStore.delete(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function setSession(session: AuthSessionPayload) {
  await setItem(KEYS.access, session.accessToken);
  await setItem(KEYS.refresh, session.refreshToken);
  if (session.user?.role) {
    await setItem(KEYS.role, session.user.role);
  }
}

export async function clearSession() {
  await Promise.all([removeItem(KEYS.access), removeItem(KEYS.refresh), removeItem(KEYS.role)]);
}

export async function getAccessToken(): Promise<string | null> {
  return getItem(KEYS.access);
}

export async function getRefreshToken(): Promise<string | null> {
  return getItem(KEYS.refresh);
}

export async function getUserRole(): Promise<string | null> {
  return getItem(KEYS.role);
}

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

interface AuthApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

async function parseError(response: Response, fallback: string): Promise<string> {
  try {
    const json = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(json.message)) return json.message.join(', ');
    return json.message ?? fallback;
  } catch {
    return fallback;
  }
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    await clearSession();
    return null;
  }

  const json = (await response.json()) as AuthApiResponse<AuthSessionPayload>;
  if (!json.data?.accessToken || !json.data.refreshToken) {
    await clearSession();
    return null;
  }

  await setSession(json.data);
  return json.data.accessToken;
}

export async function resolveAccessToken(): Promise<string | null> {
  const existing = await getAccessToken();
  if (existing) return existing;
  return refreshAccessToken();
}

export async function requestOtp(phone: string): Promise<void> {
  const response = await fetch(`${API_URL}/auth/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, 'OTP gönderilemedi'));
  }
}

export async function verifyOtp(phone: string, code: string): Promise<AuthSessionPayload & { user?: unknown }> {
  const response = await fetch(`${API_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, 'OTP doğrulanamadı'));
  }

  const json = (await response.json()) as AuthApiResponse<AuthSessionPayload & { user?: unknown }>;
  if (!json.data?.accessToken || !json.data.refreshToken) {
    throw new Error('Giriş yanıtı geçersiz');
  }

  await setSession(json.data);
  return json.data;
}

export async function logoutSession(): Promise<void> {
  const token = await getAccessToken();
  if (token) {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => undefined);
  }
  await clearSession();
}
