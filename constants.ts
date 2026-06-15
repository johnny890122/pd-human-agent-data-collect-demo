import { Agent, AgentId, EdgeDef, Session } from './types';

export const AGENTS: Record<AgentId, Agent> = {
  'KMT1': { id: 'KMT1', label: '1', group: 'KMT' },
  'KMT2': { id: 'KMT2', label: '2', group: 'KMT' },
  'DPP3': { id: 'DPP3', label: '3', group: 'DPP' },
  'DPP4': { id: 'DPP4', label: '4', group: 'DPP' },
};

// Define all 12 possible edges in a fully connected directed graph of 4 nodes (excluding self-loops)
export const ALL_EDGES: EdgeDef[] = [
  { id: 'KMT1-KMT2', source: 'KMT1', target: 'KMT2' },
  { id: 'KMT1-DPP3', source: 'KMT1', target: 'DPP3' },
  { id: 'KMT1-DPP4', source: 'KMT1', target: 'DPP4' },
  { id: 'KMT2-KMT1', source: 'KMT2', target: 'KMT1' },
  { id: 'KMT2-DPP3', source: 'KMT2', target: 'DPP3' },
  { id: 'KMT2-DPP4', source: 'KMT2', target: 'DPP4' },
  { id: 'DPP3-KMT1', source: 'DPP3', target: 'KMT1' },
  { id: 'DPP3-KMT2', source: 'DPP3', target: 'KMT2' },
  { id: 'DPP3-DPP4', source: 'DPP3', target: 'DPP4' },
  { id: 'DPP4-KMT1', source: 'DPP4', target: 'KMT1' },
  { id: 'DPP4-KMT2', source: 'DPP4', target: 'KMT2' },
  { id: 'DPP4-DPP3', source: 'DPP4', target: 'DPP3' },
];

export const GROUP_DISPLAY_NAMES: Record<string, string> = {
  'KMT': '國民黨',
  'DPP': '民進黨',
};

export const RADIUS = 42; // Node radius for NetworkGraph

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
  rolePartnerHighlight: '#f472b6', // pink-400 — partner node emphasis (ring, glow, badge)
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

export const INITIAL_SETUP: Session = {
  _id: '',
  scenarioIds: [],
  scenarios: [],
  focalNode: 'KMT1',
  opponentNode: 'KMT2',
  activeEdgeIds: [],
  sampleSize: 20,
  submissionCount: 0,
  createdAt: '',
  updatedAt: '',
};

export const TOAST_DURATION_MS = 2000;