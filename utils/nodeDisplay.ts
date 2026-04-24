import { AGENTS } from '../constants';
import { AgentId } from '../types';

/** Mapping from internal group ID to display name (UI only). */
export const GROUP_DISPLAY_NAMES: Record<string, string> = {
  'A': '國民黨',
  'B': '民進黨',
};

/**
 * Returns a human-readable display name for a node based on its role in the session.
 * - Focal node → "Focal"
 * - Opponent (partner) node → "Partner"
 * - Same group as focal → "In-Group" (or "In-Group 1/2" if multiple)
 * - Different group from focal → "Out-Group" (or "Out-Group 1/2" if multiple)
 */
export const getNodeDisplayName = (nodeId: string, focalNode: string, opponentNode: string): string => {
  if (nodeId === focalNode) return 'Focal';
  if (nodeId === opponentNode) return 'Partner';

  const focalGroup = AGENTS[focalNode as AgentId].group;
  const isSameGroup = AGENTS[nodeId as AgentId].group === focalGroup;

  const categoryNodes = Object.values(AGENTS).filter(a => {
    if (a.id === focalNode || a.id === opponentNode) return false;
    return (a.group === focalGroup) === isSameGroup;
  }).sort((a, b) => a.id.localeCompare(b.id));

  const baseName = isSameGroup ? 'In-Group' : 'Out-Group';

  if (categoryNodes.length > 1) {
    const index = categoryNodes.findIndex(a => a.id === nodeId) + 1;
    return `${baseName} ${index}`;
  }

  return baseName;
};

/**
 * Returns a human-readable display name for an edge.
 * e.g. "A1-B3" → "Focal → Out-Group 1"
 */
export const getEdgeDisplayName = (edgeId: string, focalNode: string, opponentNode: string): string => {
  const [source, target] = edgeId.split('-');
  const sourceName = getNodeDisplayName(source, focalNode, opponentNode);
  const targetName = getNodeDisplayName(target, focalNode, opponentNode);
  return `${sourceName} → ${targetName}`;
};

/**
 * Returns the group label for the focal node, e.g. "國民黨" or "民進黨".
 */
export const getFocalGroupLabel = (focalNode: string): string => {
  const group = AGENTS[focalNode as AgentId].group;
  return GROUP_DISPLAY_NAMES[group] ?? `Group ${group}`;
};

/**
 * Returns the group label for the partner (opponent) node, e.g. "國民黨" or "民進黨".
 */
export const getPartnerGroupLabel = (opponentNode: string): string => {
  const group = AGENTS[opponentNode as AgentId].group;
  return GROUP_DISPLAY_NAMES[group] ?? `Group ${group}`;
};
