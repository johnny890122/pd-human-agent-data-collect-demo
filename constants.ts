import { Agent, AgentId, EdgeDef, ExperimentSetup } from './types';

export const AGENTS: Record<AgentId, Agent> = {
  '1': { id: '1', label: '1', group: 'A' },
  '2': { id: '2', label: '2', group: 'A' },
  '3': { id: '3', label: '3', group: 'B' },
  '4': { id: '4', label: '4', group: 'B' },
};

// Define all 12 possible edges in a fully connected directed graph of 4 nodes (excluding self-loops)
export const ALL_EDGES: EdgeDef[] = [
  { id: '1-2', source: '1', target: '2' },
  { id: '1-3', source: '1', target: '3' },
  { id: '1-4', source: '1', target: '4' },
  { id: '2-1', source: '2', target: '1' },
  { id: '2-3', source: '2', target: '3' },
  { id: '2-4', source: '2', target: '4' },
  { id: '3-1', source: '3', target: '1' },
  { id: '3-2', source: '3', target: '2' },
  { id: '3-4', source: '3', target: '4' },
  { id: '4-1', source: '4', target: '1' },
  { id: '4-2', source: '4', target: '2' },
  { id: '4-3', source: '4', target: '3' },
];

export const DEFAULT_EDGE_CONFIG = {
  label: 'Relationship',
  low: 'Not Given',
  high: 'Given',
};

export const COLORS = {
  // Political colors (for Named mode)
  kmt: '#000099', // KMT dark blue
  dpp: '#1B9431', // DPP green
  // Generic colors (for Color mode)
  groupA: '#60a5fa', // blue-400
  groupB: '#f87171', // red-400
  neutral: '#9ca3af', // gray-400
  coop: '#16a34a', // green-600
  defect: '#dc2626', // red-600
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

export const INITIAL_SETUP: ExperimentSetup = {
  activeEdgeIds: [],
  scenarios: [],
  focalNode: '3',
  opponentNode: '2',
  sampleSize: 20,
  submissionCount: 0,
};

export const TOAST_DURATION_MS = 2000;