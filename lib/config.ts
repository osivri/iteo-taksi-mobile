import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEFAULT_API_PORT = 3001;
const DEFAULT_ADMIN_PORT = 3002;
const API_PATH = '/api/v1';

/** Firewall gerektirmeyen varsayılan — Railway production API */
const DEFAULT_REMOTE_API = 'https://iteo-taksi-backend-production.up.railway.app/api/v1';

function isLoopbackHost(host: string): boolean {
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
}

function isLoopbackUrl(url: string): boolean {
  return /localhost|127\.0\.0\.1|\[::1\]/i.test(url);
}

function isPrivateLanUrl(url: string): boolean {
  return /192\.168\.|10\.\d+\.|172\.(1[6-9]|2\d|3[01])\./i.test(url);
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, '');
}

export function resolveDevLanHost(): string | null {
  const candidates = [
    Constants.expoGoConfig?.debuggerHost,
    Constants.expoConfig?.hostUri,
    (Constants.manifest as { debuggerHost?: string } | null)?.debuggerHost,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const host = candidate.split(':')[0]?.trim();
    if (!host || isLoopbackHost(host)) continue;
    return host;
  }

  return null;
}

function resolveLocalDevApiUrl(): string | null {
  const lanHost = resolveDevLanHost();
  if (lanHost) {
    return `http://${lanHost}:${DEFAULT_API_PORT}${API_PATH}`;
  }

  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${DEFAULT_API_PORT}${API_PATH}`;
  }

  return `http://localhost:${DEFAULT_API_PORT}${API_PATH}`;
}

export function getApiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  const useRemoteInDev = process.env.EXPO_PUBLIC_USE_REMOTE_API === 'true';

  if (__DEV__) {
    if (configured && !isLoopbackUrl(configured)) {
      return normalizeBaseUrl(configured);
    }

    if (!useRemoteInDev) {
      const localUrl = resolveLocalDevApiUrl();
      if (localUrl) return localUrl;
    }

    if (configured) {
      return normalizeBaseUrl(configured);
    }

    return DEFAULT_REMOTE_API;
  }

  if (configured) {
    const normalized = normalizeBaseUrl(configured);
    if (normalized.startsWith('http://')) {
      throw new Error('Production build requires HTTPS API URL.');
    }
    return normalized;
  }

  return DEFAULT_REMOTE_API;
}

export function getAdminWebUrl(): string {
  const configured = process.env.EXPO_PUBLIC_ADMIN_URL?.trim();

  if (configured && !isLoopbackUrl(configured)) {
    return normalizeBaseUrl(configured);
  }

  if (__DEV__ && process.env.EXPO_PUBLIC_USE_LOCAL_API === 'true') {
    const lanHost = resolveDevLanHost();
    if (lanHost) {
      return `http://${lanHost}:${DEFAULT_ADMIN_PORT}/login`;
    }
  }

  if (__DEV__) {
    return configured ? normalizeBaseUrl(configured) : 'http://localhost:3002/login';
  }

  if (!configured) {
    throw new Error('EXPO_PUBLIC_ADMIN_URL is required for production builds.');
  }

  return normalizeBaseUrl(configured);
}

export function getDevConnectionInfo(): {
  apiUrl: string;
  lanHost: string | null;
  platform: string;
  mode: 'remote' | 'local';
} {
  const apiUrl = getApiBaseUrl();
  return {
    apiUrl,
    lanHost: resolveDevLanHost(),
    platform: Platform.OS,
    mode: isPrivateLanUrl(apiUrl) ? 'local' : 'remote',
  };
}
