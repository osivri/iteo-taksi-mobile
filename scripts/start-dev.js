#!/usr/bin/env node
/**
 * Telefon testi (firewall kuralı eklemeden):
 * - Metro: LAN + port 8082 (8081 genelde httpd/XAMPP tarafından dolu)
 * - API: Railway (telefon PC'ye 3001'den bağlanmaz)
 *
 * Tunnel: npm run start:tunnel
 * Yerel API: npm run start:lan + EXPO_PUBLIC_USE_LOCAL_API=true
 */
const os = require('os');
const { spawn } = require('child_process');

const RAILWAY_API = 'https://iteo-taksi-backend-production.up.railway.app/api/v1';
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

const useTunnel = process.argv.includes('--tunnel');
const extraArgs = process.argv.slice(2).filter((a) => a !== '--tunnel' && !a.startsWith('--port'));

const env = { ...process.env };
const hasExplicitApi =
  env.EXPO_PUBLIC_API_URL?.trim() &&
  !/localhost|127\.0\.0\.1/i.test(env.EXPO_PUBLIC_API_URL);

const lan = detectLanHost();
const portArgs = ['--port', METRO_PORT];

if (useTunnel) {
  if (!hasExplicitApi) env.EXPO_PUBLIC_API_URL = RAILWAY_API;
  console.log('\n[expo] Tunnel modu');
  console.log(`[expo] Metro port: ${METRO_PORT}`);
  console.log(`[expo] API: ${env.EXPO_PUBLIC_API_URL}\n`);
} else {
  if (lan) {
    env.REACT_NATIVE_PACKAGER_HOSTNAME = lan.address;
  }
  if (!hasExplicitApi) {
    env.EXPO_PUBLIC_API_URL = RAILWAY_API;
  }
  console.log('\n[expo] LAN modu — Metro port:', METRO_PORT);
  if (lan) {
    console.log(`[expo] Bilgisayar IP: ${lan.address}`);
    console.log(`[expo] Baglanti: exp://${lan.address}:${METRO_PORT}`);
  }
  console.log(`[expo] API: ${env.EXPO_PUBLIC_API_URL}`);
  console.log('[expo] Not: 8081 Apache/httpd tarafindan kullaniliyor, Metro 8082\'de\n');
}

const args = useTunnel
  ? ['expo', 'start', '--tunnel', ...portArgs, ...extraArgs]
  : ['expo', 'start', '--lan', ...portArgs, ...extraArgs];

const child = spawn('npx', args, { env, stdio: 'inherit', shell: process.platform === 'win32' });
child.on('exit', (code) => process.exit(code ?? 0));
