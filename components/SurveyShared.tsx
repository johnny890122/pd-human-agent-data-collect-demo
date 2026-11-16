import React from 'react';
import { AgentId } from '../types';
import { COLORS } from '../constants';

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
          遊戲每一回合一開始，您將會收到<strong className="text-gray-900"> 1 點</strong>，接下來您有兩個選擇：
        </p>
        <ul className="list-disc pl-6 space-y-1 font-medium">
          <li>將點數給對方</li>
          <li>將點數保留給自己</li>
        </ul>
        <p className="mt-2">
          若是您將 1 點給予對方，對方會收到<strong className="text-gray-900"> 2 點</strong>。<br/>
          若是對方給予您點數，您會收到<strong className="text-gray-900"> 2 點</strong>。
        </p>
      </div>
      
      <p className="font-bold text-gray-800 mb-2 border-b border-gray-200 pb-1">以下是所有可能發生的情況：</p>
      
      <ul className="space-y-2">
        <li className={`transition-all duration-300 p-2 rounded-lg`}>
          <span className="inline-block w-2 h-2 rounded-full bg-gray-400 mr-2"></span>
          若是您<strong>不給</strong>，對方也<strong>不給</strong>，那麼您和對方都保留原本的 <strong className="text-gray-900">1 點</strong>
        </li>
        <li className={`transition-all duration-300 p-2 rounded-lg`}>
          <span className="inline-block w-2 h-2 rounded-full bg-gray-400 mr-2"></span>
          若是您<strong>給</strong>對方，對方<strong>不給</strong>您，那麼您拿到 <strong className="text-red-700">0 點</strong>，對方拿到 2 + 1 總共 <strong className="text-gray-900">3 點</strong>
        </li>
        <li className={`transition-all duration-300 p-2 rounded-lg`}>
          <span className="inline-block w-2 h-2 rounded-full bg-gray-400 mr-2"></span>
          若是您<strong>不給</strong>對方，對方<strong>給</strong>您，那麼您拿到 2 + 1 總共 <strong className="text-green-700">3 點</strong>，對方拿 <strong className="text-gray-900">0 點</strong>
        </li>
        <li className={`transition-all duration-300 p-2 rounded-lg`}>
          <span className="inline-block w-2 h-2 rounded-full bg-gray-400 mr-2"></span>
          若是您和對方<strong>都給</strong>彼此，那麼您和對方都是拿到 <strong className="text-gray-900">2 點</strong>
        </li>
      </ul>
    </div>
  );
};

// ─── Graph legend & captions (REQ-409.1, REQ-409.2) ──────────────────────────

export type LegendItem = 'you' | 'partner' | 'groups' | 'give' | 'notGive' | 'unrevealed' | 'decision';

export const ALL_LEGEND_ITEMS: LegendItem[] = ['you', 'partner', 'groups', 'give', 'notGive', 'unrevealed', 'decision'];

const LEGEND_TEXT: Record<LegendItem, { label: string; description: string }> = {
  you: { label: '您', description: '橘色外框的頭像是您本人' },
  partner: { label: '搭檔', description: '粉紅色外框的頭像是與您配對進行遊戲的參與者' },
  groups: { label: '國民黨／民進黨', description: '頭像顏色代表所屬團體：藍色為國民黨、綠色為民進黨' },
  give: { label: '給予', description: '深色標籤：箭頭起點的人把點數給了箭頭終點的人' },
  notGive: { label: '不給予', description: '淺色標籤：箭頭起點的人把點數留給自己' },
  unrevealed: { label: '尚未查看', description: '點擊虛線上的「?」即可看到這筆互動紀錄' },
  decision: { label: '您的決定', description: '從您指向搭檔的動態虛線，會隨滑桿改變' },
};

// Miniatures drawn with the same color tokens as NetworkGraph, so the legend always matches it
const LegendSwatch = ({ item }: { item: LegendItem }) => {
  const edge = (color: string, dashed = false) => (
    <>
      <line x1="2" y1="12" x2="36" y2="12" stroke={color} strokeWidth="3" strokeDasharray={dashed ? '6 3' : undefined} />
      <path d="M35,6 L45,12 L35,18 Z" fill={color} />
    </>
  );

  return (
    <svg width="48" height="24" viewBox="0 0 48 24" className="flex-shrink-0" aria-hidden="true">
      {item === 'you' && <circle cx="24" cy="12" r="9" fill="white" stroke={COLORS.highlight} strokeWidth="3.5" />}
      {item === 'partner' && <circle cx="24" cy="12" r="9" fill="white" stroke={COLORS.rolePartnerHighlight} strokeWidth="3.5" />}
      {item === 'groups' && (
        <>
          <circle cx="15" cy="12" r="8" fill={COLORS.kmt} />
          <circle cx="33" cy="12" r="8" fill={COLORS.dpp} />
        </>
      )}
      {item === 'give' && (
        <>
          {edge(COLORS.coop)}
          <rect x="11" y="5" width="18" height="14" rx="7" fill={COLORS.coop} stroke="white" strokeWidth="1.5" />
        </>
      )}
      {item === 'notGive' && (
        <>
          {edge(COLORS.defect)}
          <rect x="11" y="5" width="18" height="14" rx="7" fill={COLORS.defect} stroke="white" strokeWidth="1.5" />
        </>
      )}
      {item === 'unrevealed' && (
        <>
          {edge(COLORS.neutral, true)}
          <circle cx="20" cy="12" r="9" fill="white" stroke={COLORS.blue} strokeWidth="2" />
          <text x="20" y="16.5" textAnchor="middle" fontSize="13" fontWeight="900" fill={COLORS.blue}>?</text>
        </>
      )}
      {item === 'decision' && edge(COLORS.highlight, true)}
    </svg>
  );
};

export const GraphLegend: React.FC<{ items: LegendItem[]; compact?: boolean; className?: string }> = ({
  items,
  compact = false,
  className = '',
}) => (
  <div className={`rounded-xl border border-gray-200 bg-white text-left ${compact ? 'p-3' : 'p-4'} ${className}`}>
    <p className="text-sm font-bold text-gray-700 mb-2">圖例</p>
    <dl className={`grid gap-x-6 ${compact ? 'gap-y-2 sm:grid-cols-2' : 'gap-y-3 md:grid-cols-2'}`}>
      {items.map(item => (
        <div key={item} className="flex items-center gap-3">
          <LegendSwatch item={item} />
          <div className="text-sm leading-snug">
            <dt className="font-bold text-gray-800">{LEGEND_TEXT[item].label}</dt>
            <dd className="text-gray-600">{LEGEND_TEXT[item].description}</dd>
          </div>
        </div>
      ))}
    </dl>
  </div>
);

export const FigureCaption: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <p className={`text-sm text-gray-700 leading-relaxed text-left bg-gray-50 border-l-4 border-indigo-300 rounded-r-lg px-4 py-3 ${className}`}>
    <span className="font-bold text-indigo-700 mr-1">圖說</span>
    {children}
  </p>
);

export const DecisionSlider: React.FC<{
  value: number;
  onChange: (val: number) => void;
  onInteraction?: () => void;
  hasInteracted?: boolean;
}> = ({ value, onChange, onInteraction, hasInteracted = true }) => {
  return (
    <div className="w-full max-w-md mx-auto">
      {!hasInteracted && (
        <style>{`
          @keyframes glow-slider-pulse {
            0% { box-shadow: 0 0 5px rgba(79, 70, 229, 0.3), 0 0 10px rgba(79, 70, 229, 0.15); }
            50% { box-shadow: 0 0 15px rgba(79, 70, 229, 0.7), 0 0 25px rgba(79, 70, 229, 0.4); }
            100% { box-shadow: 0 0 5px rgba(79, 70, 229, 0.3), 0 0 10px rgba(79, 70, 229, 0.15); }
          }
          .animate-glow-slider {
            animation: glow-slider-pulse 1.6s infinite ease-in-out;
          }
        `}</style>
      )}
      <div className="relative pt-6 pb-2 px-4">
        {hasInteracted && (
          <div
            className="absolute -top-1 transform -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded transition-all shadow-md"
            style={{ left: `${value}%` }}
          >
            {value}%
          </div>
        )}
        <input
          type="range" min="0" max="100" value={value}
          onChange={(e) => {
            onChange(Number(e.target.value));
            if (onInteraction) onInteraction();
          }}
          className={`w-full h-4 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-4 focus:ring-indigo-100 ${!hasInteracted ? 'accent-gray-200 animate-glow-slider' : 'accent-indigo-600'}`}
        />
        <div className="flex justify-between text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-wide">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-2 border border-gray-100">
          <p className="font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-2">決策分析：</p>
          <p className={`transition-colors duration-300 ${!hasInteracted ? 'text-gray-300' : ''}`}>
            {hasInteracted
              ? <>您有 <span>{value}%</span> 機率會給予，<span>{100 - value}%</span> 機率不會給予對方。</>
              : '請點擊輸入您的決策'}
          </p>
        </div>
      </div>
    </div>
  );
};
