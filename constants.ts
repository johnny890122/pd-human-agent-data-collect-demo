import { Agent, AgentId, EdgeDef, SessionSetup } from './types';

export const AGENTS: Record<AgentId, Agent> = {
  'A1': { id: 'A1', label: '1', group: 'A' },
  'A2': { id: 'A2', label: '2', group: 'A' },
  'B3': { id: 'B3', label: '3', group: 'B' },
  'B4': { id: 'B4', label: '4', group: 'B' },
};

// Define all 12 possible edges in a fully connected directed graph of 4 nodes (excluding self-loops)
export const ALL_EDGES: EdgeDef[] = [
  { id: 'A1-A2', source: 'A1', target: 'A2' },
  { id: 'A1-B3', source: 'A1', target: 'B3' },
  { id: 'A1-B4', source: 'A1', target: 'B4' },
  { id: 'A2-A1', source: 'A2', target: 'A1' },
  { id: 'A2-B3', source: 'A2', target: 'B3' },
  { id: 'A2-B4', source: 'A2', target: 'B4' },
  { id: 'B3-A1', source: 'B3', target: 'A1' },
  { id: 'B3-A2', source: 'B3', target: 'A2' },
  { id: 'B3-B4', source: 'B3', target: 'B4' },
  { id: 'B4-A1', source: 'B4', target: 'A1' },
  { id: 'B4-A2', source: 'B4', target: 'A2' },
  { id: 'B4-B3', source: 'B4', target: 'B3' },
];

export const DEFAULT_EDGE_CONFIG = {
  label: 'Relationship',
  low: '不給予',
  high: '給予',
};

export const COLORS = {
  // Political colors (for Named mode)
  kmt: '#000099', // KMT dark blue
  dpp: '#1B9431', // DPP green
  // Generic colors (for Color mode)
  groupA: '#60a5fa', // blue-400
  groupB: '#f87171', // red-400
  neutral: '#9ca3af', // gray-400
  coop: '#404040', // neutral-700
  defect: '#d1d5db', // gray-300
  highlight: '#f59e0b', // amber-500

  // Shared UI tokens used in components
  edgeInactive: '#e5e7eb',
  roleOpponent: '#374151',
  rolePartner: '#6b7280',
  blue: '#3b82f6',
  textDark: '#333333',

  // Avatar palette
  avatarSkin: '#FDDCB5',
  avatarSkinShadow: '#F0C090',
  avatarFeature: '#1a1a1a',
  avatarMouth: '#aa6655',
  avatarHairKmt: '#1a1a6e',
  avatarHairDpp: '#0d5a1f',
  avatarHairDppIntro: '#0d2a0d',
  avatarHairGroupA: '#1e3a8a',
  avatarHairGroupB: '#7c2d12',
  avatarHairFallback: '#1a1a1a',
  avatarClothKmt: '#00004d',
  avatarClothDpp: '#0a3a10',
  avatarClothGroupA: '#001a4d',
  avatarClothGroupB: '#4c1010',
  avatarClothFallback: '#1a1a1a',
  avatarGlassesBlue: '#5566aa',
  avatarGlassesBrown: '#8b6b47',

  // RGBA tokens
  white85: 'rgba(255,255,255,0.85)',
  blackShadow10: 'rgba(0,0,0,0.1)',
  blackShadow15: 'rgba(0,0,0,0.15)',
  textShadowDark40: 'rgba(0,0,0,0.4)',

  // Animation RGB channels
  highlightRgb: '245, 158, 11',
  indigoRgb: '79, 70, 229',
};

export const INITIAL_SETUP: SessionSetup = {
  activeEdgeIds: [],
  scenarios: [],
  focalNode: 'A1',
  opponentNode: 'A2',
  sampleSize: 20,
};

export const TOAST_DURATION_MS = 2000;