import React from 'react';
import { AgentId } from '../types';

export const AGENT_IDS: AgentId[] = ['HA', 'RA', 'HB', 'RB'];

export function generateTrianglePositions(
  decisionMakerId: AgentId,
  shuffle: boolean = true
): Record<AgentId, { x: number; y: number }> {
  const TRIANGLE_VERTICES: { x: number; y: number }[] = [
    { x: 60, y: 139 },
    { x: 340, y: 139 },
    { x: 200, y: 381 },
  ];

  const centroid = {
    x: Math.round(TRIANGLE_VERTICES.reduce((s, v) => s + v.x, 0) / 3),
    y: Math.round(TRIANGLE_VERTICES.reduce((s, v) => s + v.y, 0) / 3),
  };

  const others = AGENT_IDS.filter(id => id !== decisionMakerId) as AgentId[];
  const shuffledOthers = shuffle 
    ? [...others].sort(() => Math.random() - 0.5) 
    : [...others];

  const result = {} as Record<AgentId, { x: number; y: number }>;

  result[decisionMakerId] = centroid;

  shuffledOthers.forEach((id, i) => {
    result[id] = TRIANGLE_VERTICES[i];
  });

  return result;
}

export const PayoffMatrix = ({ compact = false, userProb }: { compact?: boolean; userProb?: number }) => {
  const isCoop = userProb !== undefined && userProb > 50;
  const isDefect = userProb !== undefined && userProb < 50;
  const isNeutral = userProb === undefined || userProb === 50;

  const coopOpacity = isNeutral || isCoop ? 'opacity-100' : 'opacity-30 blur-[1px]';
  const defectOpacity = isNeutral || isDefect ? 'opacity-100' : 'opacity-30 blur-[1px]';

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-300 ${compact ? 'text-xs' : 'text-sm'}`}>
      <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200 font-semibold text-center">
        <div className="p-2 flex items-center justify-center text-gray-400 italic">
          <span className="text-[10px]">YOU \ PARTNER</span>
        </div>
        <div className="p-2 text-green-700 bg-green-50/50">Give</div>
        <div className="p-2 text-red-700 bg-red-50/50">Not Give</div>
      </div>

      <div className={`grid grid-cols-3 border-b border-gray-100 transition-all duration-500 ${coopOpacity} ${isCoop ? 'bg-green-50/30' : ''}`}>
        <div className="p-2 font-bold text-green-700 bg-green-50 flex items-center justify-between relative">
          <span>Give</span>
          {isCoop && <span className="absolute left-1 w-1 h-full bg-green-500 rounded-r"></span>}
        </div>
        <div className="p-2 border-l border-gray-100 text-center flex flex-col justify-center">
          <span className="font-bold text-gray-800">2, 2</span>
          {!compact && <span className="text-gray-400 text-xs">Mutual Reward</span>}
        </div>
        <div className="p-2 border-l border-gray-100 text-center flex flex-col justify-center bg-red-50/10">
          <span className="font-bold text-red-600">-1, 5</span>
          {!compact && <span className="text-gray-400 text-xs">Sucker's Payoff</span>}
        </div>
      </div>

      <div className={`grid grid-cols-3 transition-all duration-500 ${defectOpacity} ${isDefect ? 'bg-red-50/30' : ''}`}>
        <div className="p-2 font-bold text-red-700 bg-red-50 flex items-center justify-between relative">
          <span>Not Give</span>
          {isDefect && <span className="absolute left-1 w-1 h-full bg-red-500 rounded-r"></span>}
        </div>
        <div className="p-2 border-l border-gray-100 text-center flex flex-col justify-center bg-green-50/10">
          <span className="font-bold text-green-600">5, -1</span>
          {!compact && <span className="text-gray-400 text-xs">Temptation</span>}
        </div>
        <div className="p-2 border-l border-gray-100 text-center flex flex-col justify-center">
          <span className="font-bold text-gray-800">1, 1</span>
          {!compact && <span className="text-gray-400 text-xs">Mutual Punishment</span>}
        </div>
      </div>
    </div>
  );
};

export const DecisionSlider: React.FC<{
  value: number;
  onChange: (val: number) => void;
  onInteraction?: () => void;
}> = ({ value, onChange, onInteraction }) => {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative pt-6 pb-2 px-4">
        <div
          className="absolute -top-1 transform -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded transition-all shadow-md"
          style={{ left: `${value}%` }}
        >
          {value}%
        </div>
        <input
          type="range" min="0" max="100" value={value}
          onChange={(e) => {
            onChange(Number(e.target.value));
            if (onInteraction) onInteraction();
          }}
          className="w-full h-4 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-100"
        />
        <div className="flex justify-between text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-wide">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-2 border border-gray-100">
          <p className="font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-2">Analysis:</p>
          {value > 50 ? (
            <p>You are leaning towards <span className="text-green-600 font-bold">Giving</span>.</p>
          ) : value < 50 ? (
            <p>You are leaning towards <span className="text-red-600 font-bold">Not Giving</span>.</p>
          ) : (
            <p>You are <span className="text-gray-500 font-bold">Undecided</span>. Adjust the slider to see outcomes.</p>
          )}
        </div>
      </div>
    </div>
  );
};
