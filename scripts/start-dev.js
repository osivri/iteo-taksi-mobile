#!/usr/bin/env node
/**
 * Telefon testi:
 * - Metro: LAN + port 8082 (8081 genelde httpd/XAMPP tarafından dolu)
 * - API varsayılanı: yerel backend (LAN IP veya emulator)
 *
 * Tunnel: npm run start:tunnel
 * Production API: EXPO_PUBLIC_USE_REMOTE_API=true
 * Açık API URL: EXPO_PUBLIC_API_URL=...
 */
const os = require('os');
const { spawn } = require('child_process');

const DEFAULT_API_PORT = 3001;
const API_PATH = '/api/v1';
const METRO_PORT = process.env.EXPO_METRO_PORT || '8082';

const VIRTUAL_HINTS = [
  'vethernet', 'default switch', 'wsl', 'virtualbox', 'vmware',
  'hyper-v', 'loopback', 'docker', 'tailscale', 'zerotier',
];

function scoreInterface(name, address) {
  const lowerName = name.toLowerCase();
  if (VIRTUAL_HINTS.some((hint) => lowerName.includes(hint))) return -100;
  if (address.startsWith('192.168.')) return 100;
  if (address.startsWith('10.')) return 80;
  return 10;
}

function detectLanHost() {
  const candidates = [];
  for (const [name, addrs] of Object.entries(os.networkInterfaces())) {
    if (!addrs) continue;
    for (const addr of addrs) {
      const family = typeof addr.family === 'string' ? addr.family : `IPv${addr.family}`;
      if (family !== 'IPv4' || addr.internal || addr.address.startsWith('169.254.')) continue;
      candidates.push({ name, address: addr.address, score: scoreInterface(name, addr.address) });
    }
  }
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0] ?? null;
}

function resolveLocalApiUrl(lan) {
  if (lan) return `http://${lan.address}:${DEFAULT_API_PORT}${API_PATH}`;
  return `http://localhost:${DEFAULT_API_PORT}${API_PATH}`;
}

const useTunnel = process.argv.includes('--tunnel');
const extraArgs = process.argv.slice(2).filter((a) => a !== '--tunnel' && !a.startsWith('--port'));

const env = { ...process.env };
const hasExplicitApi =
  env.EXPO_PUBLIC_API_URL?.trim() &&
  !/localhost|127\.0\.0\.1/i.test(env.EXPO_PUBLIC_API_URL);
const useRemoteApi = env.EXPO_PUBLIC_USE_REMOTE_API === 'true';

const lan = detectLanHost();
const portArgs = ['--port', METRO_PORT];

if (!hasExplicitApi && !useRemoteApi) {
  env.EXPO_PUBLIC_API_URL = resolveLocalApiUrl(lan);
}

if (useTunnel) {
  console.log('\n[expo] Tunnel modu');
  console.log(`[expo] Metro port: ${METRO_PORT}`);
  console.log(`[expo] API: ${env.EXPO_PUBLIC_API_URL}`);
  console.log('[expo] Production API icin: EXPO_PUBLIC_USE_REMOTE_API=true\n');
} else {
  if (lan) {
    env.REACT_NATIVE_PACKAGER_HOSTNAME = lan.address;
  }
  console.log('\n[expo] LAN modu — Metro port:', METRO_PORT);
  if (lan) {
    console.log(`[expo] Bilgisayar IP: ${lan.address}`);
    console.log(`[expo] Baglanti: exp://${lan.address}:${METRO_PORT}`);
  }
  console.log(`[expo] API: ${env.EXPO_PUBLIC_API_URL}`);
  console.log('[expo] Production API icin: EXPO_PUBLIC_USE_REMOTE_API=true');
  console.log('[expo] Not: 8081 Apache/httpd tarafindan kullaniliyor, Metro 8082\'de\n');
}

const args = useTunnel
  ? ['expo', 'start', '--tunnel', ...portArgs, ...extraArgs]
  : ['expo', 'start', '--lan', ...portArgs, ...extraArgs];

const child = spawn('npx', args, { env, stdio: 'inherit', shell: process.platform === 'win32' });
child.on('exit', (code) => process.exit(code ?? 0));
