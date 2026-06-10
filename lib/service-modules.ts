import type { Ionicons } from '@expo/vector-icons';

export type ServiceType = 'TOW' | 'INSURANCE' | 'COMPLAINT' | 'PIRATE_REPORT' | 'PETITION';

export interface ServiceModule {
  type: ServiceType;
  href: '/service-tow' | '/service-insurance' | '/service-complaint' | '/service-pirate-report' | '/service-petition';
  title: string;
  subtitle: string;
  emoji: string;
  icon: keyof typeof Ionicons.glyphMap;
  hint: string;
  fields: { plate: boolean; location: boolean };
}

export const SERVICE_MODULES: ServiceModule[] = [
  {
    type: 'TOW',
    href: '/service-tow',
    title: 'Çekici',
    subtitle: 'Arıza ve kaza çekici',
    emoji: '🚗',
    icon: 'car-outline',
    hint: 'Araç arızası veya kaza durumunda çekici talebi',
    fields: { plate: true, location: true },
  },
  {
    type: 'INSURANCE',
    href: '/service-insurance',
    title: 'Sigorta',
    subtitle: 'Poliçe ve yenileme',
    emoji: '🛡️',
    icon: 'shield-outline',
    hint: 'Sigorta yaptırma veya yenileme başvurusu',
    fields: { plate: true, location: false },
  },
  {
    type: 'COMPLAINT',
    href: '/service-complaint',
    title: 'Şikayet',
    subtitle: 'Şikayet ve öneri',
    emoji: '📣',
    icon: 'alert-circle-outline',
    hint: 'Şikayet ve geri bildirim',
    fields: { plate: false, location: false },
  },
  {
    type: 'PIRATE_REPORT',
    href: '/service-pirate-report',
    title: 'Korsan İhbar',
    subtitle: 'Korsan taksi bildirimi',
    emoji: '👁️',
    icon: 'eye-outline',
    hint: 'Korsan taksi ihbarı',
    fields: { plate: true, location: true },
  },
  {
    type: 'PETITION',
    href: '/service-petition',
    title: 'Dilekçe',
    subtitle: 'Resmi yazılı talep',
    emoji: '📄',
    icon: 'document-text-outline',
    hint: 'Resmi dilekçe / talep',
    fields: { plate: false, location: false },
  },
];
