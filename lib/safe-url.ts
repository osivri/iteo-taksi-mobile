import { Linking } from 'react-native';
import { getAdminWebUrl, getApiBaseUrl } from './config';

function getAllowedHosts(): Set<string> {
  const hosts = new Set<string>();

  try {
    hosts.add(new URL(getApiBaseUrl()).hostname);
  } catch {
    // ignore invalid API URL during startup
  }

  try {
    hosts.add(new URL(getAdminWebUrl()).hostname);
  } catch {
    // ignore invalid admin URL during startup
  }

  hosts.add('iteo-taksi-backend-production.up.railway.app');
  hosts.add('railway.app');
  hosts.add('supabase.co');
  hosts.add('localhost');
  hosts.add('127.0.0.1');

  return hosts;
}

function isPrivateLanHost(hostname: string): boolean {
  return /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(hostname);
}

function hostAllowed(hostname: string, allowedHosts: Set<string>): boolean {
  if (allowedHosts.has(hostname)) return true;
  return [...allowedHosts].some(
    (allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`),
  );
}

export function isSafeExternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'tel:' || parsed.protocol === 'mailto:') return true;
    if (!hostAllowed(parsed.hostname, getAllowedHosts())) return false;
    if (parsed.protocol === 'https:') return true;
    if (
      __DEV__ &&
      parsed.protocol === 'http:' &&
      (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' || isPrivateLanHost(parsed.hostname))
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function openSafeUrl(url: string): Promise<boolean> {
  if (!isSafeExternalUrl(url)) return false;
  await Linking.openURL(url);
  return true;
}
