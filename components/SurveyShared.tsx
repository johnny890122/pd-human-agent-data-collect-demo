import React from 'react';
import { AgentId } from '../types';

export const AGENT_IDS: AgentId[] = ['KMT1', 'KMT2', 'DPP3', 'DPP4'];

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

  const coopOpacity = isNeutral || isCoop ? 'opacity-100' : 'opacity-40 blur-[0.5px]';
  const defectOpacity = isNeutral || isDefect ? 'opacity-100' : 'opacity-40 blur-[0.5px]';

  return (
    <div className={`bg-gray-50 rounded-xl border border-gray-200 p-4 transition-all duration-300 ${compact ? 'text-xs' : 'text-sm'} text-gray-700 text-left w-full mx-auto`}>
      <div className="space-y-3 mb-4">
        <p>
          遊戲每一回合一開始，您將會收到<strong className="text-gray-900"> 1 點數</strong>，接下來您有選兩個選擇：
        </p>
        <ul className="list-disc pl-6 space-y-1 font-medium">
          <li>將點數給對方</li>
          <li>將點數保留給自己</li>
        </ul>
        <p className="mt-2">
          若是您將1點數給予對方，對方會收到<strong className="text-gray-900"> 2 點數</strong>。<br/>
          若是對方給予您點數，您會收到<strong className="text-gray-900"> 2 點數</strong>。
        </p>
      </div>
      
      <p className="font-bold text-gray-800 mb-2 border-b border-gray-200 pb-1">以下是所有可能發生的情況：</p>
      
      <ul className="space-y-2">
        <li className={`transition-all duration-300 p-2 rounded-lg ${defectOpacity} ${isDefect ? 'bg-red-50 border border-red-100' : ''}`}>
          <span className="inline-block w-2 h-2 rounded-full bg-gray-400 mr-2"></span>
          若是您<strong>不給</strong>，對方也<strong>不給</strong>，那麼您和對方都是拿到 <strong className="text-gray-900">1 點</strong>
        </li>
        <li className={`transition-all duration-300 p-2 rounded-lg ${coopOpacity} ${isCoop ? 'bg-green-50 border border-green-100' : ''}`}>
          <span className="inline-block w-2 h-2 rounded-full bg-gray-400 mr-2"></span>
          若是您<strong>給</strong>對方，對方<strong>不給</strong>您，那麼您拿到 <strong className="text-red-700">0點</strong>，對方拿到 2 + 1 總共 <strong className="text-gray-900">3 點</strong>
        </li>
        <li className={`transition-all duration-300 p-2 rounded-lg ${defectOpacity} ${isDefect ? 'bg-red-50 border border-red-100' : ''}`}>
          <span className="inline-block w-2 h-2 rounded-full bg-gray-400 mr-2"></span>
          若是您<strong>不給</strong>對方，對方<strong>給</strong>您，那麼您拿到 2 + 1 總共 <strong className="text-green-700">3點</strong>，對方拿 <strong className="text-gray-900">0 點</strong>
        </li>
        <li className={`transition-all duration-300 p-2 rounded-lg ${coopOpacity} ${isCoop ? 'bg-green-50 border border-green-100' : ''}`}>
          <span className="inline-block w-2 h-2 rounded-full bg-gray-400 mr-2"></span>
          若是您和對方<strong>都給</strong>彼此，那麼您和對方都是拿到 <strong className="text-gray-900">2 點</strong>
        </li>
      </ul>
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
          <p className="font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-2">決策分析：</p>
          {value > 50 ? (
            <p>您偏向 <span className="bg-neutral-700 text-white px-2 py-0.5 rounded font-bold">給予</span>對方點數。</p>
          ) : value < 50 ? (
            <p>您偏向 <span className="bg-gray-300 text-gray-700 px-2 py-0.5 rounded font-bold">不給予</span>對方點數。</p>
          ) : (
            <p>您目前 <span className="text-gray-500 font-bold">尚未決定</span>。請來回調整滑桿以了解預期的決策。</p>
          )}
        </div>
      </div>
    </div>
  );
};
