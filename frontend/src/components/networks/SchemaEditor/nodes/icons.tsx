import React from 'react';
import {
  Network as SwitchIcon, Router as RouterIcon, Shield, ShieldAlert,
  Server, Monitor, Cable, Radio, Phone, Smartphone, Battery,
  Cpu, Box, Wifi,
} from 'lucide-react';

export type NodeIconKey =
  | 'switch' | 'router' | 'firewall' | 'server' | 'workstation'
  | 'patch-panel' | 'media-converter' | 'pbx' | 'modem' | 'szi'
  | 'sha' | 'phone' | 'radio' | 'battery' | 'antenna' | 'cable' | 'generic';

const SIZE = 28;

export const NODE_ICONS: Record<NodeIconKey, React.ReactNode> = {
  switch: <SwitchIcon size={SIZE} color="#2563eb" />,
  router: <RouterIcon size={SIZE} color="#7c3aed" />,
  firewall: <Shield size={SIZE} color="#ef4444" />,
  server: <Server size={SIZE} color="#0ea5e9" />,
  workstation: <Monitor size={SIZE} color="#64748b" />,
  'patch-panel': <Cable size={SIZE} color="#94a3b8" />,
  'media-converter': <Wifi size={SIZE} color="#0d9488" />,
  pbx: <Phone size={SIZE} color="#a16207" />,
  modem: <Wifi size={SIZE} color="#ea580c" />,
  szi: <Shield size={SIZE} color="#7e22ce" />,
  sha: <ShieldAlert size={SIZE} color="#b91c1c" />,
  phone: <Phone size={SIZE} color="#475569" />,
  radio: <Radio size={SIZE} color="#0369a1" />,
  battery: <Battery size={SIZE} color="#15803d" />,
  antenna: <Radio size={SIZE} color="#7c2d12" />,
  cable: <Cable size={SIZE} color="#475569" />,
  generic: <Box size={SIZE} color="#334155" />,
};

const CATEGORY_TO_ICON: Record<string, NodeIconKey> = {
  tko: 'switch',
  analog: 'phone',
  radio: 'radio',
  computer: 'workstation',
  antenna: 'antenna',
  power: 'battery',
  battery: 'battery',
  cabel: 'cable',
  telephone: 'phone',
  mobileTelephone: 'workstation',
  shd: 'sha',
  shdTelephone: 'sha',
  szi: 'szi',
};

const DEVICE_TO_ICON: Record<string, NodeIconKey> = {
  switch: 'switch', router: 'router', firewall: 'firewall',
  server: 'server', workstation: 'workstation',
  'patch-panel': 'patch-panel', 'media-converter': 'media-converter',
  pbx: 'pbx', modem: 'modem', szi: 'szi', other: 'generic',
};

/** Приоритет: closed → SHA; device_type; category.value; generic. */
export function pickEquipmentIcon(eq: any): { key: NodeIconKey; icon: React.ReactNode } {
  if (eq?.is_closed || eq?.category?.is_closed) {
    return { key: 'sha', icon: NODE_ICONS.sha };
  }
  if (eq?.device_type && DEVICE_TO_ICON[eq.device_type]) {
    const k = DEVICE_TO_ICON[eq.device_type];
    return { key: k, icon: NODE_ICONS[k] };
  }
  const catValue = eq?.category?.value;
  if (catValue && CATEGORY_TO_ICON[catValue]) {
    const k = CATEGORY_TO_ICON[catValue];
    return { key: k, icon: NODE_ICONS[k] };
  }
  return { key: 'generic', icon: NODE_ICONS.generic };
}