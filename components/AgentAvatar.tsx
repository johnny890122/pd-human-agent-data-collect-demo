import React from 'react';
import { Agent } from '../types';
import { COLORS } from '../constants';

interface AgentAvatarProps {
  agent: Agent;
  size?: number;
}

const AgentAvatar: React.FC<AgentAvatarProps> = ({ agent, size = 48 }) => {
  const groupColor = agent.group === 'KMT' ? COLORS.kmt : COLORS.dpp;
  const r = 42;
  const ax = 0;
  const ay = 0;

  const getDarkerColor = (color: string): string => {
    if (color === COLORS.kmt) return COLORS.avatarHairKmt;
    if (color === COLORS.dpp) return COLORS.avatarHairDpp;
    if (color === COLORS.groupA) return COLORS.avatarHairGroupA;
    if (color === COLORS.groupB) return COLORS.avatarHairGroupB;
    return COLORS.avatarHairFallback;
  };
  const getClothColor = (color: string): string => {
    if (color === COLORS.kmt) return COLORS.avatarClothKmt;
    if (color === COLORS.dpp) return COLORS.avatarClothDpp;
    if (color === COLORS.groupA) return COLORS.avatarClothGroupA;
    if (color === COLORS.groupB) return COLORS.avatarClothGroupB;
    return COLORS.avatarClothFallback;
  };
  const getGlassesColor = (color: string): string => {
    if ([COLORS.kmt, COLORS.groupA].includes(color)) return COLORS.avatarGlassesBlue;
    return COLORS.avatarGlassesBrown;
  };

  const avatarHairColor = getDarkerColor(groupColor);
  const avatarClothColor = getClothColor(groupColor);
  const avatarGlassesColor = getGlassesColor(groupColor);
  const isGroupA = agent.group === 'KMT';
  const clipId = `clip-${agent.id}-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <svg width={size} height={size} viewBox="-44 -44 88 88" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id={clipId}>
          <circle cx={ax} cy={ay} r={r} />
        </clipPath>
      </defs>
      <g>
        <circle cx={ax} cy={ay} r={r} fill={groupColor} clipPath={`url(#${clipId})`} />
        <rect x={ax - r} y={ay + 9} width={r * 2} height={r} fill={avatarClothColor} clipPath={`url(#${clipId})`} />
        <path d={`M ${ax - 6} ${ay + 9} L ${ax - 2} ${ay + 5} L ${ax} ${ay + 7} L ${ax + 2} ${ay + 5} L ${ax + 6} ${ay + 9} Z`} fill="white" clipPath={`url(#${clipId})`} />
        <rect x={ax - 3} y={ay + 4} width={6} height={6} fill={COLORS.avatarSkin} clipPath={`url(#${clipId})`} />
        <circle cx={ax} cy={ay - 4} r={13} fill={COLORS.avatarSkin} clipPath={`url(#${clipId})`} />
        <circle cx={ax - 13} cy={ay - 3} r={2.5} fill={COLORS.avatarSkinShadow} clipPath={`url(#${clipId})`} />
        <circle cx={ax + 13} cy={ay - 3} r={2.5} fill={COLORS.avatarSkinShadow} clipPath={`url(#${clipId})`} />
        {isGroupA ? (
          <path d={`M ${ax - 13} ${ay - 8} Q ${ax - 8} ${ay - 22} ${ax} ${ay - 21} Q ${ax + 8} ${ay - 22} ${ax + 13} ${ay - 8} Q ${ax + 6} ${ay - 14} ${ax} ${ay - 16} Q ${ax - 6} ${ay - 14} ${ax - 13} ${ay - 8} Z`} fill={avatarHairColor} clipPath={`url(#${clipId})`} />
        ) : (
          <path d={`M ${ax - 13} ${ay - 8} Q ${ax - 11} ${ay - 23} ${ax - 4} ${ay - 22} Q ${ax} ${ay - 25} ${ax + 4} ${ay - 22} Q ${ax + 11} ${ay - 23} ${ax + 13} ${ay - 8} Q ${ax + 5} ${ay - 15} ${ax} ${ay - 17} Q ${ax - 5} ${ay - 15} ${ax - 13} ${ay - 8} Z`} fill={avatarHairColor} clipPath={`url(#${clipId})`} />
        )}
        <circle cx={ax - 4.5} cy={ay - 4.5} r={2} fill={COLORS.avatarFeature} clipPath={`url(#${clipId})`} />
        <circle cx={ax + 4.5} cy={ay - 4.5} r={2} fill={COLORS.avatarFeature} clipPath={`url(#${clipId})`} />
        <circle cx={ax - 3.8} cy={ay - 5.2} r={0.7} fill="white" clipPath={`url(#${clipId})`} />
        <circle cx={ax + 5.2} cy={ay - 5.2} r={0.7} fill="white" clipPath={`url(#${clipId})`} />
        <path d={`M ${ax - 3.5} ${ay - 0.5} Q ${ax} ${ay + 2} ${ax + 3.5} ${ay - 0.5}`} stroke={COLORS.avatarMouth} strokeWidth="1.2" fill="none" clipPath={`url(#${clipId})`} />
        {isGroupA && (
          <g clipPath={`url(#${clipId})`}>
            <rect x={ax - 8.5} y={ay - 7.5} width={6} height={4.5} rx={1.5} fill="none" stroke={avatarGlassesColor} strokeWidth="0.85" />
            <rect x={ax + 2.5} y={ay - 7.5} width={6} height={4.5} rx={1.5} fill="none" stroke={avatarGlassesColor} strokeWidth="0.85" />
            <line x1={ax - 2.5} y1={ay - 5.5} x2={ax + 2.5} y2={ay - 5.5} stroke={avatarGlassesColor} strokeWidth="0.85" />
          </g>
        )}
        <circle cx={ax} cy={ay} r={r} fill="none" stroke={groupColor} strokeWidth="2" />
      </g>
    </svg>
  );
};

export default AgentAvatar;
