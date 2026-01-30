import { Agent, AgentId, EdgeDef } from './types';

export const AGENTS: Record<AgentId, Agent> = {
  HA: { id: 'HA', label: 'ID 1', group: 'A', isRobot: false },
  RA: { id: 'RA', label: 'ID 2', group: 'A', isRobot: true },
  HB: { id: 'HB', label: 'ID 3', group: 'B', isRobot: false },
  RB: { id: 'RB', label: 'ID 4', group: 'B', isRobot: true },
};

// Define all 12 possible edges in a fully connected directed graph of 4 nodes (excluding self-loops)
export const ALL_EDGES: EdgeDef[] = [
  { id: 'HA-RA', source: 'HA', target: 'RA' },
  { id: 'HA-HB', source: 'HA', target: 'HB' },
  { id: 'HA-RB', source: 'HA', target: 'RB' },
  { id: 'RA-HA', source: 'RA', target: 'HA' },
  { id: 'RA-HB', source: 'RA', target: 'HB' },
  { id: 'RA-RB', source: 'RA', target: 'RB' },
  { id: 'HB-HA', source: 'HB', target: 'HA' },
  { id: 'HB-RA', source: 'HB', target: 'RA' },
  { id: 'HB-RB', source: 'HB', target: 'RB' },
  { id: 'RB-HA', source: 'RB', target: 'HA' },
  { id: 'RB-RA', source: 'RB', target: 'RA' },
  { id: 'RB-HB', source: 'RB', target: 'HB' },
];

export const DEFAULT_EDGE_CONFIG = {
  label: 'Relationship',
  low: 'Defected',
  high: 'Cooperated',
};

export const COLORS = {
  groupA: '#60a5fa', // blue-400
  groupB: '#f87171', // red-400
  neutral: '#9ca3af', // gray-400
  coop: '#16a34a', // green-600
  defect: '#dc2626', // red-600
  highlight: '#f59e0b', // amber-500
};