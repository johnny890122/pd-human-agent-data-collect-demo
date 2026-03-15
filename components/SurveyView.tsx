import React, { useState, useMemo, useEffect } from 'react';
import { ExperimentSetup, Scenario, SurveyResult } from '../types';
import { AGENTS, COLORS } from '../constants';
import { AgentId } from '../types';
import NetworkGraph from './NetworkGraph';
import { generateDesignMatrix } from '../utils/math';

interface SurveyViewProps {
  setup: ExperimentSetup;
  onComplete: (results: SurveyResult[]) => void;
  onBack: () => void;
}

// ─── Grid for Randomized Node Layout ─────────────────────────────────────────
// 3×3 grid on a 400×400 canvas — nodes have radius 24, so keep ≥60px from edges
const GRID_POSITIONS: { x: number; y: number }[] = [
  { x: 80, y: 80 }, { x: 200, y: 80 }, { x: 320, y: 80 },
  { x: 80, y: 200 }, { x: 200, y: 200 }, { x: 320, y: 200 },
  { x: 80, y: 320 }, { x: 200, y: 320 }, { x: 320, y: 320 },
];

const AGENT_IDS: AgentId[] = ['HA', 'RA', 'HB', 'RB'];

function generateRandomPositions(): Record<AgentId, { x: number; y: number }> {
  const shuffledGrids = [...GRID_POSITIONS].sort(() => Math.random() - 0.5).slice(0, 4);
  const shuffledAgents = [...AGENT_IDS].sort(() => Math.random() - 0.5);
  const result = {} as Record<AgentId, { x: number; y: number }>;
  shuffledAgents.forEach((id, i) => { result[id] = shuffledGrids[i]; });
  return result;
}

/**
 * Triangle layout: decisionMaker is placed at the centroid (200, 200).
 * The triangle has two vertices at the TOP (same y-axis) and one at the BOTTOM,
 * forming a standard equilateral triangle (side ≈ 240px).
 *
 * Vertex positions are FIXED each round; only the assignment of the 3 other
 * agents to the three fixed vertices is randomised per scenario.
 */
function generateTrianglePositions(
  decisionMakerId: AgentId,
  shuffle: boolean = true
): Record<AgentId, { x: number; y: number }> {
  // Enlarged equilateral triangle — side = 280px, height ≈ 242px
  // Vertices chosen so centroid = (200, 220), well-centred in the viewBox.
  //   centroid_y = (top_y + top_y + bottom_y) / 3 = 220
  //   bottom_y   = top_y + 242  →  top_y = (660 - 242) / 3 = 139
  const TRIANGLE_VERTICES: { x: number; y: number }[] = [
    { x: 60, y: 139 }, // top-left
    { x: 340, y: 139 }, // top-right  (same y → flat top edge)
    { x: 200, y: 381 }, // bottom-center
  ];

  // True centroid = ((60+340+200)/3, (139+139+381)/3) = (200, 220)
  const centroid = {
    x: Math.round(TRIANGLE_VERTICES.reduce((s, v) => s + v.x, 0) / 3),
    y: Math.round(TRIANGLE_VERTICES.reduce((s, v) => s + v.y, 0) / 3),
  };

  const others = AGENT_IDS.filter(id => id !== decisionMakerId) as AgentId[];
  // Only shuffle AGENT-TO-VERTEX assignment if explicitly requested; vertices themselves stay fixed
  const shuffledOthers = shuffle 
    ? [...others].sort(() => Math.random() - 0.5) 
    : [...others]; // Deterministic order

  const result = {} as Record<AgentId, { x: number; y: number }>;

  // YOU (decision maker) sits at the true geometric centroid of the triangle
  result[decisionMakerId] = centroid;

  // Assign each of the 3 others to one of the fixed triangle vertices
  shuffledOthers.forEach((id, i) => {
    result[id] = TRIANGLE_VERTICES[i];
  });

  return result;
}

// ─── Layout Config ────────────────────────────────────────────────────────────
type LayoutKey = 'progressBar' | 'payoffMatrix' | 'decisionSlider' | 'nodeLayout' | 'groupLabel' | 'nodeIdentity' | 'roleIdentity' | 'graphInteraction';
type LayoutOptions = Record<LayoutKey, string>;

interface PanelOption { label: string; value: string; }
interface PanelItem {
  label: string;
  layoutKey: LayoutKey;
  options: PanelOption[];
}
interface PanelSection {
  label: string;
  items: PanelItem[];
}

const PANEL_SECTIONS: PanelSection[] = [
  {
    label: '① Progress Bar',
    items: [
      {
        label: '', layoutKey: 'progressBar', options: [
          { label: 'Bar', value: '1' },
          { label: 'Text', value: '2' },
          { label: 'Off', value: 'off' },
        ]
      },
    ],
  },
  {
    label: '② Network History',
    items: [
      {
        label: '2.1 Location', layoutKey: 'nodeLayout', options: [
          { label: 'Fixed', value: '1' },
          { label: 'Random', value: '2' },
          { label: 'Triangle', value: '3' },
        ]
      },
      {
        label: '2.2 Group Label', layoutKey: 'groupLabel', options: [
          { label: 'Color', value: '1' },
          { label: 'Named', value: '2' },
        ]
      },
      {
        label: '2.3 Group Layout', layoutKey: 'nodeIdentity', options: [
          { label: 'Default', value: '1' },
          { label: 'Shape', value: '2' },
          { label: 'Avatar', value: '3' },
        ]
      },
      {
        label: '2.4 Role Identity', layoutKey: 'roleIdentity', options: [
          { label: 'Badge', value: '1' },
          { label: 'Glow + Badge', value: '2' },
        ]
      },
    ],
  },
  {
    label: '③ Payoff Matrix',
    items: [
      {
        label: '', layoutKey: 'payoffMatrix', options: [
          { label: 'Table', value: '1' },
          { label: 'Hidden Table', value: '2' },
          { label: 'Off', value: 'off' },
        ]
      },
    ],
  },
  {
    label: '④ Decision Slider',
    items: [
      {
        label: '', layoutKey: 'decisionSlider', options: [
          { label: 'Slider', value: '1' },
          { label: 'Buttons', value: '2' },
          { label: 'Interactive', value: '3' },
        ]
      },
    ],
  },
  {
    label: '⑤ Graph Interaction',
    items: [
      {
        label: '', layoutKey: 'graphInteraction', options: [
          { label: 'Instant', value: '1' },
          { label: 'Gradual', value: '2' },
        ]
      },
    ],
  },
];

// ─── Layout Control Panel ─────────────────────────────────────────────────────
const LayoutPanel: React.FC<{
  layouts: LayoutOptions;
  onChange: (key: LayoutKey, value: string) => void;
}> = ({ layouts, onChange }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 bg-white border border-gray-200 shadow-lg rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
      >
        <span className="text-base">⚙️</span>
        <span>Layout</span>
        <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="mt-2 bg-white border border-gray-200 shadow-2xl rounded-2xl p-4 w-64 space-y-4">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">
            Block Layout Options
          </h4>

          {PANEL_SECTIONS.map((section) => (
            <div key={section.label}>
              {/* Section header */}
              <p className="text-xs font-bold text-gray-700 mb-2">{section.label}</p>

              {/* Items (options row or sub-items) */}
              {section.items.map((item) => (
                <div key={item.layoutKey} className={item.label ? 'ml-3 mb-2' : 'mb-0'}>
                  {item.label && (
                    <p className="text-[11px] font-semibold text-gray-500 mb-1">{item.label}</p>
                  )}
                  <div className="flex gap-1.5">
                    {item.options.map((opt) => {
                      const isActive = layouts[item.layoutKey] === opt.value;
                      const isOff = opt.value === 'off';
                      return (
                        <button
                          key={opt.value}
                          onClick={() => onChange(item.layoutKey, opt.value)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${isActive
                            ? isOff
                              ? 'bg-gray-700 text-white border-gray-700 shadow-sm'
                              : 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                            }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}

          <p className="text-[10px] text-gray-300 text-center pt-1 border-t border-gray-100">
            Option 1 = default layout
          </p>
        </div>
      )}
    </div>
  );
};

// ─── Payoff Matrix ─────────────────────────────────────────────────────────────
const PayoffMatrix = ({ compact = false, userProb }: { compact?: boolean; userProb?: number }) => {
  // Determine opacity/highlight based on user probability
  // If userProb is undefined, show all equally (default/static view)
  // If userProb > 50, Cooperate is active. < 50, Defect is active.
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

      {/* Row 1: YOU Give */}
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

      {/* Row 2: YOU Not Give */}
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

// ─── Payoff Text (Option 2) ────────────────────────────────────────────────────
const PayoffText = () => (
  <div className="text-xs text-gray-700 space-y-2">
    <p>• <span className="font-semibold text-green-700">Both Give</span> → You <strong>+2</strong>, Opponent <strong>+2</strong></p>
    <p>• <span className="font-semibold">You Give, Opp Does Not Give</span> → You <strong className="text-red-600">−1</strong>, Opponent <strong>+5</strong></p>
    <p>• <span className="font-semibold">You Not Give, Opp Gives</span> → You <strong className="text-green-600">+5</strong>, Opponent <strong>−1</strong></p>
    <p>• <span className="font-semibold text-red-700">Both Not Give</span> → You <strong>+1</strong>, Opponent <strong>+1</strong></p>
  </div>
);

// ─── Decision Buttons (Option 2) ──────────────────────────────────────────────
const DecisionButtons: React.FC<{
  sliderValue: number;
  onChange: (v: number) => void;
  opponentLabel: string;
  onInteraction?: () => void;
}> = ({ sliderValue, onChange, opponentLabel, onInteraction }) => {
  const options = [
    { label: 'Definitely Not Give', value: 0, active: 'bg-red-600 text-white border-red-600', idle: 'bg-red-50 text-red-700 border-red-200' },
    { label: 'Likely Not Give', value: 25, active: 'bg-red-400 text-white border-red-400', idle: 'bg-red-50/50 text-red-500 border-red-200' },
    { label: 'Unsure', value: 50, active: 'bg-gray-500 text-white border-gray-500', idle: 'bg-gray-50 text-gray-600 border-gray-200' },
    { label: 'Likely Give', value: 75, active: 'bg-green-400 text-white border-green-400', idle: 'bg-green-50/50 text-green-600 border-green-200' },
    { label: 'Definitely Give', value: 100, active: 'bg-green-600 text-white border-green-600', idle: 'bg-green-50 text-green-700 border-green-200' },
  ];
  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <h3 className="text-xl font-medium text-gray-800">
          Will you give to <span className="font-bold text-indigo-600">{opponentLabel}</span>?
        </h3>
        <p className="text-sm text-gray-500">Select your decision.</p>
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              onChange(opt.value);
              if (onInteraction) onInteraction();
            }}
            className={`flex-1 min-w-[120px] py-3 rounded-xl font-semibold text-sm border-2 transition-all shadow-sm ${sliderValue === opt.value ? opt.active : opt.idle
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <p className="text-center text-xs text-gray-400">
        Current: <span className="font-bold">{sliderValue}% Give</span>
      </p>
    </div>
  );
};

const DecisionSlider: React.FC<{
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

// ─── Main Survey View ─────────────────────────────────────────────────────────
const SurveyView: React.FC<SurveyViewProps> = ({ setup, onComplete, onBack }) => {
  const [step, setStep] = useState<'intro' | 'scenarios' | 'outro'>('intro');
  const [currentScenarioIdx, setCurrentScenarioIdx] = useState(0);
  const [sliderValue, setSliderValue] = useState(50);
  const [results, setResults] = useState<SurveyResult[]>([]);
  const [hasInteracted, setHasInteracted] = useState(false);

  const [layouts, setLayouts] = useState<LayoutOptions>({
    progressBar: '1',
    payoffMatrix: '2',
    decisionSlider: '1',
    nodeLayout: '3',
    groupLabel: '2',
    nodeIdentity: '3',
    roleIdentity: '2',
    graphInteraction: '2',
  });
  const setLayout = (key: LayoutKey, value: string) =>
    setLayouts(prev => ({ ...prev, [key]: value }));

  // Gradual reveal state — which active edges the user has clicked to reveal
  const [revealedEdgeIds, setRevealedEdgeIds] = useState<Set<string>>(new Set());
  const [isDecisionPhase, setIsDecisionPhase] = useState(false);
  const [showPayoffTable, setShowPayoffTable] = useState(false);
  const isGradual = layouts.graphInteraction === '2';
  const allRevealed = revealedEdgeIds.size >= setup.activeEdgeIds.length;

  // Reset revealed edges on each new scenario or when switching to gradual mode
  useEffect(() => {
    setRevealedEdgeIds(new Set());
    setIsDecisionPhase(false);
    setHasInteracted(false);
  }, [currentScenarioIdx, isGradual]);

  const handleEdgeReveal = (edgeId: string) => {
    setRevealedEdgeIds(prev => new Set([...prev, edgeId]));
  };

  // Randomized node positions — refreshed per scenario or when mode switches to 'Random'
  const [randomPositions, setRandomPositions] = useState<Record<AgentId, { x: number; y: number }> | null>(null);

  useEffect(() => {
    if (layouts.nodeLayout === '2') {
      setRandomPositions(generateRandomPositions());
    } else if (layouts.nodeLayout === '3') {
      setRandomPositions(generateTrianglePositions(setup.decisionMaker));
    } else {
      setRandomPositions(null);
    }
  }, [currentScenarioIdx, layouts.nodeLayout, setup.decisionMaker]);

  const scenarios = useMemo(() => generateDesignMatrix(setup.activeEdgeIds), [setup.activeEdgeIds]);
  const currentScenario = scenarios[currentScenarioIdx];

  const handleNext = () => {
    const newResults = [...results];
    newResults[currentScenarioIdx] = {
      scenarioId: currentScenario.id,
      cooperationProbability: sliderValue / 100,
    };
    setResults(newResults);
    if (currentScenarioIdx < scenarios.length - 1) {
      setCurrentScenarioIdx(prev => prev + 1);
      setSliderValue(50);
      setHasInteracted(false);
    } else {
      setStep('outro');
      onComplete(newResults);
    }
  };

  const agentMe = AGENTS[setup.decisionMaker];
  const agentOpponent = AGENTS[setup.opponent];

  // ── Intro ──────────────────────────────────────────────────────────────────
  const [introStep, setIntroStep] = useState(0);
  const [introEdgeRevealed, setIntroEdgeRevealed] = useState(false);
  const [introDecisionEdgeRevealed, setIntroDecisionEdgeRevealed] = useState(false);
  const [introSliderValue, setIntroSliderValue] = useState(50);
  const [introSliderInteracted, setIntroSliderInteracted] = useState(false);

  const [introGraphRevealed, setIntroGraphRevealed] = useState<Set<string>>(new Set());

  const networkDemoSetup = useMemo(() => {
    const others = AGENT_IDS.filter(id => id !== setup.decisionMaker && id !== setup.opponent);
    return {
      ...setup,
      activeEdgeIds: [
        `${setup.decisionMaker}-${setup.opponent}`,
        `${setup.opponent}-${setup.decisionMaker}`,
        `${others[0]}-${others[1]}`,
        `${others[1]}-${others[0]}`,
      ]
    };
  }, [setup]);

  const networkDemoScenario = useMemo(() => ({
    id: 0,
    edgeStates: networkDemoSetup.activeEdgeIds.reduce((acc, id) => ({
      ...acc,
      [id]: Math.random() < 0.5 ? 0 : 1
    }), {} as Record<string, 0 | 1>),
  }), [networkDemoSetup]);

  const introNodePositions = useMemo(() => generateTrianglePositions(setup.decisionMaker, false), [setup.decisionMaker]);

  const isNextDisabled = useMemo(() => {
    // Step 3 (Part 1): Must reveal the single demo edge
    if (introStep === 3) return !introEdgeRevealed;
    // Step 4 (Part 2): Must reveal all edges in the graph
    if (introStep === 4) return introGraphRevealed.size < networkDemoSetup.activeEdgeIds.length;
    // Step 5 (Part 3): Must interact with the slider
    if (introStep === 5) return !introSliderInteracted;
    return false;
  }, [introStep, introEdgeRevealed, introGraphRevealed, introSliderInteracted, networkDemoSetup]);

  if (step === 'intro') {

    // Helper to draw a single node exactly as it appears in the graph
    const InlineNode = ({ agent, role }: { agent: typeof agentMe, role: 'me' | 'opponent' | 'none' }) => {
      const isNamed = layouts.groupLabel === '2';
      const groupAColor = isNamed ? COLORS.kmt : COLORS.groupA;
      const groupBColor = isNamed ? COLORS.dpp : COLORS.groupB;
      const groupColor = agent.group === 'A' ? groupAColor : groupBColor;

      const r = 36; // Survey standard size
      let strokeColor = layouts.nodeIdentity === '3' ? groupColor : 'white';
      let strokeWidth = 2;

      if (layouts.roleIdentity === '1' || layouts.roleIdentity === '2') {
        if (role === 'me') { strokeColor = COLORS.highlight; strokeWidth = 5; }
        else if (role === 'opponent') { strokeColor = '#374151'; strokeWidth = 5; }
      } else {
        // purely color based role
        if (role === 'me') { strokeColor = '#fbbf24'; strokeWidth = 6; }
        else if (role === 'opponent') { strokeColor = '#374151'; strokeWidth = 6; }
      }

      // Re-use avatar drawing logic if selected
      const avatarBody = layouts.nodeIdentity === '3' && (
        <g>
          <clipPath id={`inline-clip-${role}`}>
            <circle cx={0} cy={0} r={r} />
          </clipPath>
          <circle cx={0} cy={0} r={r} fill={groupColor} clipPath={`url(#inline-clip-${role})`} />
          <rect x={-r} y={9} width={r * 2} height={r} fill={agent.group === 'A' ? '#00004d' : '#0a3a10'} clipPath={`url(#inline-clip-${role})`} />
          <path d={`M -6 9 L -2 5 L 0 7 L 2 5 L 6 9 Z`} fill="white" clipPath={`url(#inline-clip-${role})`} />
          <rect x={-3} y={4} width={6} height={6} fill="#FDDCB5" clipPath={`url(#inline-clip-${role})`} />
          <circle cx={0} cy={-4} r={13} fill="#FDDCB5" clipPath={`url(#inline-clip-${role})`} />
          <circle cx={-13} cy={-3} r={2.5} fill="#F0C090" clipPath={`url(#inline-clip-${role})`} />
          <circle cx={13} cy={-3} r={2.5} fill="#F0C090" clipPath={`url(#inline-clip-${role})`} />
          {agent.group === 'A' ? (
            <path d={`M -13 -8 Q -8 -22 0 -21 Q 8 -22 13 -8 Q 6 -14 0 -16 Q -6 -14 -13 -8 Z`} fill="#1a1a6e" clipPath={`url(#inline-clip-${role})`} />
          ) : (
            <path d={`M -13 -8 Q -11 -23 -4 -22 Q 0 -25 4 -22 Q 11 -23 13 -8 Q 5 -15 0 -17 Q -5 -15 -13 -8 Z`} fill="#0d2a0d" clipPath={`url(#inline-clip-${role})`} />
          )}
          <circle cx={-4.5} cy={-4.5} r={2} fill="#1a1a1a" clipPath={`url(#inline-clip-${role})`} />
          <circle cx={4.5} cy={-4.5} r={2} fill="#1a1a1a" clipPath={`url(#inline-clip-${role})`} />
          <circle cx={-3.8} cy={-5.2} r={0.7} fill="white" clipPath={`url(#inline-clip-${role})`} />
          <circle cx={5.2} cy={-5.2} r={0.7} fill="white" clipPath={`url(#inline-clip-${role})`} />
          <path d={`M -3.5 -0.5 Q 0 2 3.5 -0.5`} stroke="#aa6655" strokeWidth="1.2" fill="none" clipPath={`url(#inline-clip-${role})`} />
          {agent.group === 'A' && (
            <g clipPath={`url(#inline-clip-${role})`}>
              <rect x={-8.5} y={-7.5} width={6} height={4.5} rx={1.5} fill="none" stroke="#5566aa" strokeWidth="0.85" />
              <rect x={2.5} y={-7.5} width={6} height={4.5} rx={1.5} fill="none" stroke="#5566aa" strokeWidth="0.85" />
              <line x1={-2.5} y1={-5.5} x2={2.5} y2={-5.5} stroke="#5566aa" strokeWidth="0.85" />
            </g>
          )}
          <circle cx={0} cy={0} r={r} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
        </g>
      );

      const rDraw = 36;
      const glowR = rDraw + 4;

      return (
        <svg width={rDraw * 3} height={rDraw * 3} viewBox="-60 -60 120 120" className="inline-block overflow-visible mx-2">
          <g>
            {layouts.roleIdentity === '2' && (
              <circle r={glowR} fill="none" stroke={role === 'me' ? COLORS.highlight : role === 'opponent' ? '#374151' : 'transparent'} strokeWidth="4" strokeOpacity={role === 'none' ? 0 : 0.6}>
                <animate attributeName="stroke-opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" />
                <animate attributeName="r" values={`${glowR};${glowR + 4};${glowR}`} dur="2s" repeatCount="indefinite" />
              </circle>
            )}

            {layouts.nodeIdentity === '3' ? avatarBody :
              layouts.nodeIdentity === '2' ? (
                agent.group === 'A' ? (
                  <polygon points="0,-36 31,-18 31,18 0,36 -31,18 -31,-18" fill={groupColor} stroke={strokeColor} strokeWidth={strokeWidth} />
                ) : (
                  <polygon points="0,-36 36,0 0,36 -36,0" fill={groupColor} stroke={strokeColor} strokeWidth={strokeWidth} />
                )
              ) : (
                <circle r={rDraw} fill={groupColor} stroke={strokeColor} strokeWidth={strokeWidth} className="shadow-xl" />
              )}

            {layouts.nodeIdentity !== '3' && !isNamed && (
              <text dy="5" textAnchor="middle" className="text-xl font-bold fill-white pointer-events-none uppercase">
                {agent.label}
              </text>
            )}

            {layouts.nodeIdentity === '3' && !isNamed && (
              <g transform={`translate(0, ${rDraw - 8})`}>
                <rect x="-20" y="-8" width="40" height="16" rx="6" fill="rgba(255,255,255,0.85)" />
                <text y="4" textAnchor="middle" fontSize="12" className="font-[800] fill-[#333] pointer-events-none uppercase">
                  {agent.label}
                </text>
              </g>
            )}

            {isNamed && role !== 'none' && (
              <g transform={`translate(0, ${rDraw})`}>
                <rect x={-45} y="-14" width={90} height="16" rx="8" fill="white" stroke={strokeColor} strokeWidth="2" opacity="0.95" />
                <text y="-2" textAnchor="middle" fontSize="10" className="font-black pointer-events-none">
                  <tspan fill={role === 'me' ? COLORS.highlight : '#6b7280'} className="uppercase">
                    {role === 'me' ? 'YOU' : 'Partner'}
                  </tspan>
                </text>
              </g>
            )}
          </g>
        </svg>
      );
    }

    const InteractiveInlineEdge = ({ isRevealed, onReveal }: { isRevealed: boolean, onReveal: () => void }) => {
      const COOP_COLOR = '#16a34a'; // green-600
      const UNREVEALED_COLOR = '#9ca3af'; // gray-400
      const BLUE_COLOR = '#3b82f6'; // blue-500

      return (
        <svg
          viewBox="-20 -20 240 100"
          className={`w-full max-w-[240px] h-auto mx-auto block overflow-visible my-2 transition-all duration-300 ${!isRevealed ? 'cursor-pointer hover:scale-105' : ''}`}
          onClick={!isRevealed ? onReveal : undefined}
        >
          <defs>
            <marker
              id="arrow-coop-intro"
              viewBox="0 -5 10 10"
              refX="0"
              refY="0"
              markerWidth="8"
              markerHeight="8"
              orient="auto"
            >
              <path d="M0,-5L10,0L0,5" fill={COOP_COLOR} />
            </marker>
          </defs>

          {!isRevealed}

          {/* Path: slightly flatter quad curve to match NetworkGraph feel */}
          <path d="M 20 30 Q 100 5 180 30"
            stroke={isRevealed ? COOP_COLOR : UNREVEALED_COLOR}
            strokeWidth={isRevealed ? "3" : "2"}
            strokeDasharray={isRevealed ? undefined : "6 3"}
            fill="none"
            markerEnd={isRevealed ? "url(#arrow-coop-intro)" : undefined}
            className="transition-all duration-500"
          />

          <g transform="translate(100, 17.5)">
            {isRevealed ? (
              <g className="animate-in zoom-in duration-300 origin-center">
                <rect x="-26" y="-10" width="52" height="20" rx="10" fill={COOP_COLOR} stroke="white" strokeWidth="1.5" />
                <text textAnchor="middle" y="4" className="text-[10px] font-black fill-white uppercase tracking-tighter" style={{ fontFamily: 'sans-serif' }}>
                  GIVE
                </text>
              </g>
            ) : (
              <g>
                <circle r="16" fill={BLUE_COLOR} fillOpacity="0.2">
                  <animate attributeName="r" values="14;18;14" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="fill-opacity" values="0.2;0.4;0.2" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle r="12" fill="white" stroke={BLUE_COLOR} strokeWidth="2" className="shadow-lg">
                  <animate attributeName="stroke-width" values="2;3;2" dur="1.4s" repeatCount="indefinite" />
                </circle>
                <text textAnchor="middle" y="4" className="text-[14px] font-black fill-blue-600" style={{ filter: 'drop-shadow(0px 1px 1px rgba(0,0,0,0.1))', fontFamily: 'sans-serif' }}>?</text>
              </g>
            )}
          </g>
        </svg>
      );
    };

    const DecisionEdgeDemo = ({ isVisible }: { isVisible: boolean }) => {
      const decisionColor = COLORS.highlight; // usually amber
      return (
        <svg viewBox="0 0 240 120" className="w-full max-w-[240px] h-auto mx-auto block overflow-visible">
          {/* Mock Nodes */}
          <g transform="translate(40, 60)">
            <InlineNode agent={agentMe} role="me" />
          </g>
          <g transform="translate(200, 60)">
            <InlineNode agent={agentOpponent} role="opponent" />
          </g>

          {/* Decision Edge */}
          {isVisible && (
            <>
              <path
                d="M 60 60 Q 120 20 180 60"
                fill="none"
                stroke={decisionColor}
                strokeWidth="4"
                strokeDasharray="8 4"
                markerEnd={`url(#arrow-decision-intro)`}
                className="animate-in fade-in duration-700 animate-[dash_1s_linear_infinite]"
              >
                <style>{`@keyframes dash { to { stroke-dashoffset: -12; } }`}</style>
              </path>

              <defs>
                <marker
                  id="arrow-decision-intro"
                  viewBox="0 -5 10 10"
                  refX="0"
                  refY="0"
                  markerWidth="8"
                  markerHeight="8"
                  orient="auto"
                >
                  <path d="M0,-5L10,0L0,5" fill={decisionColor} />
                </marker>
              </defs>

              {/* Label */}
              <g transform="translate(120, 35)">
                <rect x="-30" y="-10" width="60" height="20" rx="10" fill="white" stroke={decisionColor} strokeWidth="2" className="animate-in zoom-in duration-500" />
                <text textAnchor="middle" dy="4" fontSize="10" fontWeight="bold" fill={decisionColor} className="animate-in fade-in duration-700">DECISION</text>
              </g>
            </>
          )}
        </svg>
      );
    };

    const introSteps = [
      {
        title: "Groups & Your Role",
        content: (
          <div className="space-y-6 text-gray-600 leading-relaxed text-base animate-in fade-in slide-in-from-bottom-2 duration-500 w-full max-w-4xl">
            <p className="text-center text-sm text-gray-500">
              There are <span className="font-bold text-gray-800">4 participants</span> in this game. Each of them belongs to one of <span className="font-bold text-gray-800">two groups</span>.
            </p>

            <div className="bg-white p-4 md:p-6 rounded-3xl border border-gray-200 shadow-sm">
              <p className="text-center text-sm font-bold text-gray-700 mb-6 uppercase tracking-wide">Two Groups</p>
              <div className="flex flex-col sm:flex-row justify-center items-center sm:items-stretch gap-4 md:gap-8">
                {/* Model Group A */}
                <div className="flex-1 flex flex-col items-center p-2 bg-blue-50/30 rounded-xl border border-blue-100 min-w-[140px] max-w-[200px]">
                  <div className="flex justify-center items-center gap-2 mb-2 transform scale-90">
                    <div className="transform scale-90"><InlineNode agent={{ ...AGENTS.HA, label: 'A' }} role="none" /></div>
                    <span className="text-xl font-black text-blue-400">× 2</span>
                  </div>
                  <span className="text-xs font-bold text-blue-900 bg-blue-50 px-2 py-1 rounded mt-auto">Group A</span>
                </div>

                <div className="hidden sm:block w-px bg-gray-200 self-stretch mx-2"></div>

                {/* Model Group B */}
                <div className="flex-1 flex flex-col items-center p-2 bg-green-50/30 rounded-xl border border-green-100 min-w-[140px] max-w-[200px]">
                  <div className="flex justify-center items-center gap-2 mb-2 transform scale-90">
                    <div className="transform scale-90"><InlineNode agent={{ ...AGENTS.HB, label: 'B' }} role="none" /></div>
                    <span className="text-xl font-black text-green-400">× 2</span>
                  </div>
                  <span className="text-xs font-bold text-green-900 bg-green-50 px-2 py-1 rounded mt-auto">Group B</span>
                </div>
              </div>
            </div>

            <p className="text-center text-sm text-gray-500">
              The 4 participants are paired <span className="font-bold text-gray-900">two-by-two</span>. Each pair plays a separate <span className="font-bold text-gray-900">2-person game</span>.
            </p>

            <div className="bg-white p-4 md:p-6 rounded-3xl border border-gray-200 shadow-sm">
              <p className="text-center text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Your Pair</p>


              <div className="flex flex-col sm:flex-row justify-center items-center sm:items-stretch gap-4 md:gap-8 mb-6">
                {/* You Card */}
                <div className={`flex-1 flex flex-col items-center justify-center gap-4 p-4 rounded-2xl border shadow-sm relative overflow-hidden min-w-[140px]`}>
                  <div className={`absolute top-0 left-0 w-full h-1.5`}></div>
                  <p className={`text-center text-sm font-bold text-${agentMe.group === 'A' ? 'blue' : 'green'}-900`}>You</p>
                  <div className="flex flex-col items-center transform scale-100">
                    <InlineNode agent={agentMe} role="me" />
                    <span className={`font-black text-${agentMe.group === 'A' ? 'blue' : 'green'}-700 text-lg mt-2 tracking-tight`}>
                      {agentMe.group === 'A' ? 'Group A' : 'Group B'}
                    </span>
                  </div>
                </div>

                {/* Partner Card */}
                <div className={`flex-1 flex flex-col items-center justify-center gap-4 p-4 rounded-2xl border border-${agentOpponent.group === 'A' ? 'blue' : 'green'}-100 shadow-sm relative overflow-hidden min-w-[140px]`}>
                   <div className={`absolute top-0 left-0 w-full h-1.5`}></div>
                   <p className={`text-center text-sm font-bold text-${agentOpponent.group === 'A' ? 'blue' : 'green'}-900`}>Partner</p>
                   <div className="flex flex-col items-center transform scale-100">
                     <InlineNode agent={agentOpponent} role="opponent" />
                     <span className={`font-black text-${agentOpponent.group === 'A' ? 'blue' : 'green'}-700 text-lg mt-2 tracking-tight`}>
                       {agentOpponent.group === 'A' ? 'Group A' : 'Group B'}
                     </span>
                   </div>
                </div>
              </div>
            </div>
          </div>
        )
      },
      {
        title: "Game Payoffs",
        content: (
          <div className="space-y-4 text-gray-600 leading-relaxed text-sm animate-in fade-in slide-in-from-bottom-2 duration-500 w-full max-w-4xl">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
              <h3 className="text-xl font-bold text-gray-800 text-center mb-6">How Points Are Awarded</h3>
              <p className="text-center mb-6 text-base text-gray-600">
                [More Info Here]
              </p>
              <p className="text-center mb-6 text-base text-gray-600">
                Your score depends on <span className="font-bold text-indigo-600">your decision</span> and <span className="font-bold text-indigo-600">your partner's decision</span>.
              </p>
              <div className="transform scale-100 flex justify-center mb-6">
                <PayoffMatrix />
              </div>
            </div>
          </div>
        )
      },
      {
        title: "The Network",
        content: (
          <div className="space-y-6 text-gray-600 leading-relaxed text-base animate-in fade-in slide-in-from-bottom-2 duration-500 w-full max-w-4xl">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm text-center">
              <p className="text-gray-600 mb-8 max-w-lg mx-auto">
                The network displays the <span className="font-bold text-gray-800">history</span> decisions from past rounds between all participants.
              </p>

              <div className="bg-gray-50/50 rounded-2xl p-4 md:p-8 border border-gray-100 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-12">
                <div className="h-[350px] md:h-[400px] w-full max-w-lg flex-1">
                  <NetworkGraph
                    mode="survey"
                    setup={networkDemoSetup}
                    scenario={networkDemoScenario}
                    positionOverrides={introNodePositions}
                    decision={0}
                    revealedEdgeIds={new Set(networkDemoSetup.activeEdgeIds)}
                    onDecisionChange={() => {}}
                    hideDecisionEdge={true}
                    groupLabel={layouts.groupLabel === '2' ? 'named' : 'color'}
                    nodeIdentity={layouts.nodeIdentity === '3' ? 'avatar' : 'shape'}
                    roleIdentity={layouts.roleIdentity === '2' ? 'glow' : 'badge'}
                  />
                </div>

                <div className="w-full max-w-lg md:max-w-sm flex-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 text-center md:text-left">History Description</p>
                  <div className="grid grid-cols-1 gap-3 text-xs max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {networkDemoSetup.activeEdgeIds.filter(edgeId => {
                      const [source, target] = edgeId.split('-');
                      return source === setup.decisionMaker || target === setup.decisionMaker || source === setup.opponent || target === setup.opponent;
                    }).map(edgeId => {
                      const [source, target] = edgeId.split('-');
                      const isGive = networkDemoScenario.edgeStates[edgeId] === 1;
                      const isYou = source === setup.decisionMaker;
                      
                      const getName = (id: string, agent: any) => {
                        if (id === setup.decisionMaker) return "You";
                        if (id === setup.opponent) return "Partner";
                        return `Agent ${agent.group}`;
                      };
                      
                      const sourceName = getName(source, AGENTS[source as AgentId]);
                      const targetName = getName(target, AGENTS[target as AgentId]);
                      return (
                        <div key={edgeId} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${isYou ? 'text-indigo-600' : 'text-gray-700'}`}>{sourceName}</span>
                            <span className="text-gray-300">➜</span>
                            <span className="text-gray-600">{targetName}</span>
                          </div>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${isGive ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {isGive ? 'Gave' : 'Not Give'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      },
      {
        title: "Onboarding",
        content: (
          <div className="space-y-6 text-gray-600 leading-relaxed text-sm w-full max-w-4xl h-full flex flex-col justify-center">
            <div className="bg-blue-50 border border-blue-200 p-4 md:p-8 rounded-3xl shadow-sm text-center relative overflow-hidden flex flex-col items-center min-h-[520px]">
              <h3 className="font-bold text-blue-900 text-2xl mb-4">Step 1: Reveal History</h3>
              <p className="text-blue-800 text-base mb-6">
                In each scenario, network connections start as <strong>hidden</strong>. You must reveal them to see what happened.
              </p>

              <div className="bg-white/80 backdrop-blur rounded-2xl p-4 mb-2 shadow-inner border border-blue-100 w-full max-w-md flex flex-col items-center justify-center flex-1">
                <p className="text-xs text-blue-700 font-bold uppercase tracking-wider mb-2">Try it now:</p>
                <InteractiveInlineEdge
                  isRevealed={introEdgeRevealed}
                  onReveal={() => setIntroEdgeRevealed(true)}
                />
              </div>

              {!introEdgeRevealed && (
                <div className="mt-auto pt-4 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700 font-bold animate-pulse w-full max-w-md">
                  👆 Please click the question mark to continue
                </div>
              )}
            </div>
          </div>
        )
      },
      {
        title: "Onboarding",
        content: (
          <div className="space-y-6 text-gray-600 leading-relaxed text-sm w-full max-w-4xl h-full flex flex-col justify-center">
            <div className="bg-blue-50 border border-blue-200 p-4 md:p-8 rounded-3xl shadow-sm text-center relative overflow-hidden flex flex-col items-center min-h-[520px]">
              <h3 className="font-bold text-blue-900 text-2xl mb-4">Step 2: Observe History</h3>
              <p className="text-blue-800 text-base mb-6">
                Once revealed, you can see the full history of interactions between all agents.
              </p>

              <div className="bg-white/80 backdrop-blur rounded-2xl p-4 md:p-6 mb-2 shadow-inner border border-blue-100 w-full h-full flex-1">
                <div className="h-[350px] md:h-[400px] w-full">
                  <NetworkGraph
                    mode="survey"
                    setup={networkDemoSetup}
                    scenario={networkDemoScenario}
                    positionOverrides={introNodePositions}
                    decision={0}
                    revealedEdgeIds={introGraphRevealed}
                    onEdgeReveal={(id) => setIntroGraphRevealed(prev => new Set([...prev, id]))}
                    hideDecisionEdge={true}
                    groupLabel={layouts.groupLabel === '2' ? 'named' : 'color'}
                    nodeIdentity={layouts.nodeIdentity === '3' ? 'avatar' : 'shape'}
                    roleIdentity={layouts.roleIdentity === '2' ? 'glow' : 'badge'}
                  />
                </div>
              </div>

              <div className="mt-4 p-2 bg-blue-100/50 rounded-lg text-xs text-blue-700 font-bold">
                Tap the question marks to reveal who gave to whom.
              </div>
            </div>
          </div>
        )
      },
      {
        title: "Onboarding",
        content: (
          <div className="space-y-6 text-gray-600 leading-relaxed text-sm animate-in fade-in slide-in-from-bottom-2 duration-500 w-full max-w-4xl">
            <div className="bg-blue-50 border border-blue-200 p-4 md:p-8 rounded-3xl shadow-sm text-center relative overflow-hidden min-h-[520px] flex flex-col items-center">
              <h3 className="font-bold text-blue-900 text-2xl mb-4">Step 3: Decide</h3>
              <p className="text-blue-800 text-base mb-6">
                Based on the history you revealed, decide the probability that you will <strong>Give</strong> to your opponent.
              </p>

              <div className="bg-white/80 backdrop-blur rounded-2xl p-4 md:p-6 mb-2 shadow-inner border border-indigo-100 w-full flex-1 flex flex-col md:flex-row items-center gap-8 justify-center">
                <div className="h-[350px] md:h-[400px] w-full max-w-lg relative flex-1">
                  <NetworkGraph
                    mode="survey"
                    setup={networkDemoSetup}
                    scenario={networkDemoScenario}
                    positionOverrides={introNodePositions}
                    decision={introSliderValue}
                    revealedEdgeIds={new Set(networkDemoSetup.activeEdgeIds)}
                    // onDecisionChange={(val) => { setIntroSliderValue(val); setIntroSliderInteracted(true); }} // Disable drag interaction
                    hideDecisionEdge={false}
                    groupLabel={layouts.groupLabel === '2' ? 'named' : 'color'}
                    nodeIdentity={layouts.nodeIdentity === '3' ? 'avatar' : 'shape'}
                    roleIdentity={layouts.roleIdentity === '2' ? 'glow' : 'badge'}
                  />
                </div>

                <div className="w-full max-w-sm flex-shrink-0 px-4 md:px-0 bg-white/50 rounded-xl p-6 border border-indigo-50">
                  <p className="text-center font-bold text-indigo-900 mb-6 uppercase tracking-wider text-xs">Your Decision</p>
                  <DecisionSlider
                    value={introSliderValue}
                    onChange={(val) => { setIntroSliderValue(val); setIntroSliderInteracted(true); }}
                  />
                </div>
              </div>
            </div>
          </div>
        )
      },
      {
        title: "Ready to Begin",
        content: (
          <div className="space-y-8 text-gray-600 leading-relaxed text-base text-center animate-in fade-in slide-in-from-bottom-2 duration-500 py-8">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border-4 border-white ring-2 ring-green-50">
              <span className="text-5xl">🚀</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800">You're all set!</h3>
            <p className="text-lg">
              There are <strong className="text-indigo-600 text-2xl bg-indigo-50 px-3 py-1 rounded-xl shadow-sm mx-1">{scenarios.length}</strong> unique scenarios in total.
            </p>
            <p className="text-gray-500 max-w-sm mx-auto p-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner">
              Take your time to analyze the history before making each decision. Good luck!
            </p>
          </div>
        )
      }
    ];

    const currentIntro = introSteps[introStep];

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-2xl md:max-w-5xl w-full bg-white rounded-[2rem] shadow-2xl p-8 md:p-12 flex flex-col min-h-[600px] border border-gray-100">

          {/* Header */}
          <div className="text-center space-y-3 mb-10">
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight transition-all duration-300">
              {currentIntro.title}
            </h1>
            <div className="w-20 h-1.5 bg-indigo-500 mx-auto rounded-full" />
          </div>

          {/* Dynamic Content Body */}
          <div className="flex-1 flex flex-col justify-center max-w-lg md:max-w-4xl mx-auto w-full">
            {currentIntro.content}
          </div>

          {/* Footer & Controls */}
          <div className="mt-12 space-y-8 max-w-lg md:max-w-4xl mx-auto w-full">

            {/* Dot Indicators */}
            <div className="flex justify-center gap-3">
              {introSteps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2.5 rounded-full transition-all duration-500 ${idx === introStep ? 'w-10 bg-indigo-600 shadow-md shadow-indigo-200' : 'w-2.5 bg-gray-200 hover:bg-gray-300'
                    }`}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              {introStep > 0 ? (
                <button
                  onClick={() => setIntroStep(prev => prev - 1)}
                  className="flex-1 py-4 text-base font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors"
                >
                  Back
                </button>
              ) : (
                <></>
              )}

              {introStep < introSteps.length - 1 ? (
                <button
                  onClick={() => setIntroStep(prev => prev + 1)}
                  disabled={isNextDisabled}
                  className={`flex-[2] py-4 text-base font-bold rounded-2xl shadow-lg transition-all active:scale-95 ${isNextDisabled
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none transform-none'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                >
                   {isNextDisabled ? 'Interact to Continue' : 'Next \u2192'}
                </button>
              ) : (
                <button
                  onClick={() => setStep('scenarios')}
                  className="flex-[2] py-4 bg-green-600 text-white text-base font-black rounded-2xl shadow-xl hover:bg-green-700 transition-all active:scale-95 animate-pulse tracking-wide"
                >
                  Begin Experiment!
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    );
  }

  // ── Outro ──────────────────────────────────────────────────────────────────
  if (step === 'outro') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 md:p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Survey Complete</h2>
          <p className="text-gray-600">Thank you for your participation. Your responses have been recorded.</p>
          <div className="bg-gray-100 p-4 rounded-lg text-left text-xs font-mono overflow-auto max-h-60">
            {JSON.stringify(results, null, 2)}
          </div>
          <button onClick={onBack} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            Start New Session
          </button>
        </div>
      </div>
    );
  }

  // ── Active Scenario ────────────────────────────────────────────────────────
  const activeConfigs = setup.activeEdgeIds.map(id => ({
    id,
    state: currentScenario.edgeStates[id] as 0 | 1,
    config: setup.edgeConfigs[id],
  }));

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-start p-4 md:p-8">
      <style>{`
        @keyframes glow-pulse {
          0% { box-shadow: 0 0 5px rgba(245, 158, 11, 0.2), 0 0 10px rgba(245, 158, 11, 0.1); border-color: rgba(245, 158, 11, 0.4); }
          50% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.6), 0 0 30px rgba(245, 158, 11, 0.4); border-color: rgba(245, 158, 11, 0.8); }
          100% { box-shadow: 0 0 5px rgba(245, 158, 11, 0.2), 0 0 10px rgba(245, 158, 11, 0.1); border-color: rgba(245, 158, 11, 0.4); }
        }
        @keyframes glow-indigo-pulse {
          0% { box-shadow: 0 0 5px rgba(79, 70, 229, 0.2); transform: scale(1); }
          50% { box-shadow: 0 0 20px rgba(79, 70, 229, 0.6); transform: scale(1.02); }
          100% { box-shadow: 0 0 5px rgba(79, 70, 229, 0.2); transform: scale(1); }
        }
        .animate-glow-blue {
          animation: glow-pulse 2s infinite ease-in-out;
        }
        .animate-glow-indigo {
          animation: glow-indigo-pulse 2s infinite ease-in-out;
        }
      `}</style>

      {/* Floating Layout Panel */}
      <LayoutPanel layouts={layouts} onChange={setLayout} />

      {/* ── Block 1: Progress Bar ──────────────────────────────────────────── */}
      {layouts.progressBar !== 'off' && (
        <div className="w-full max-w-5xl mb-6 mt-12 lg:mt-0">
          {layouts.progressBar === '1' ? (
            <>
              <div className="flex justify-between text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                <span>Scenario {currentScenarioIdx + 1} of {scenarios.length}</span>
                <span>Progress: {Math.round((currentScenarioIdx / scenarios.length) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${((currentScenarioIdx + 1) / scenarios.length) * 100}%` }}
                />
              </div>
            </>
          ) : (
            /* Text */
            <div className="text-center text-sm font-semibold text-gray-600 bg-white rounded-xl py-2 shadow-sm border border-gray-200">
              Scenario <span className="text-indigo-600 font-bold">{currentScenarioIdx + 1}</span> / {scenarios.length}
              &nbsp;·&nbsp;
              <span className="text-gray-400">{Math.round((currentScenarioIdx / scenarios.length) * 100)}% complete</span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 w-full max-w-5xl">

        {/* ── Left Column ───────────────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* ── Block 2: Network History (always Graph; location can be randomized) ── */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="bg-gray-50 border-b border-gray-100 p-3 md:p-4 flex items-center justify-between">
              <h3 className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-wider">Network History</h3>
            </div>
            <div className="p-4 md:p-6 flex-1 flex flex-col bg-white overflow-hidden">
              {/* ── Gradual reveal prompt — shown while edges remain hidden ── */}
              {isGradual && !allRevealed && (
                <div className="mx-4 mt-4 flex items-center justify-center gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3 shadow-sm animate-in fade-in slide-in-from-top-4 duration-700">
                  <p className="text-xs text-blue-800 font-medium text-center">
                    Click the <span className="font-bold border-b border-blue-400 border-dashed">dashed edges</span> to reveal history.
                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-600">
                      {setup.activeEdgeIds.length - revealedEdgeIds.size} left
                    </span>
                  </p>
                </div>
              )}

              {/* ── Gradual reveal debrief — shown once all edges revealed, but BEFORE decision phase ── */}
              {isGradual && allRevealed && !isDecisionPhase && (
                <div className="mx-4 mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-amber-50 border-2 border-amber-200 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-500 animate-glow-amber">
                  <div className="flex items-start gap-3">
                    <div>
                      <p className="text-xs font-bold text-amber-800">Review the history below carefully.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsDecisionPhase(true);
                      setHasInteracted(false);
                    }}
                    className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2 px-4 rounded-lg shadow-sm transition-colors whitespace-nowrap"
                  >
                    Enter Decision Phase
                  </button>
                </div>
              )}

              {/* ── Gradual reveal decision phase callout ── */}
              {/* {isGradual && allRevealed && isDecisionPhase && (
                <div className="mx-4 mt-4 flex items-start gap-3 bg-indigo-50 border border-indigo-200 rounded-xl p-3 animate-in fade-in slide-in-from-top-2 duration-500">
                  <span className="text-xl mt-0.5">🎯</span>
                  <div>
                    <p className="text-xs font-bold text-indigo-800">Decision Phase Active</p>
                  </div>
                </div>
              )} */}

              <div className="flex-1 flex items-center justify-center min-h-[350px] md:min-h-[400px]">
                <NetworkGraph
                  mode="survey"
                  setup={setup}
                  scenario={currentScenario}
                  positionOverrides={randomPositions ?? undefined}
                  groupLabel={layouts.groupLabel === '2' ? 'named' : 'color'}
                  nodeIdentity={layouts.nodeIdentity === '3' ? 'avatar' : layouts.nodeIdentity === '2' ? 'shape' : 'circle'}
                  roleIdentity={layouts.roleIdentity === '2' ? 'glow' : 'badge'}
                  decision={sliderValue}
                  onDecisionChange={layouts.decisionSlider === '3' ? setSliderValue : undefined}
                  onInteraction={() => setHasInteracted(true)}
                  revealedEdgeIds={isGradual ? revealedEdgeIds : undefined}
                  onEdgeReveal={isGradual ? handleEdgeReveal : undefined}
                  hideDecisionEdge={isGradual && (!allRevealed || !isDecisionPhase)}
                />
              </div>

              {/* Interactive HUD Panel - Non-overlapping */}
              {layouts.decisionSlider === '3' && (!isGradual || isDecisionPhase) && (
                <div className="mt-4 bg-gray-50 border border-gray-100 rounded-2xl p-3 md:p-4 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="space-y-0.5">
                    <h3 className="text-xs md:text-sm font-bold text-gray-800">Will you give to your partner?</h3>
                    <p className="text-[9px] md:text-[10px] text-gray-500 font-medium italic">Drag the bubble on the graph to set your probability</p>
                  </div>
                  <div className="bg-indigo-600 self-stretch px-3 md:px-4 rounded-xl flex flex-col items-center justify-center shadow-lg shadow-indigo-100">
                    <span className="text-lg md:text-xl font-black text-white leading-none">{sliderValue}%</span>
                    <span className="text-[7px] md:text-[8px] uppercase font-bold text-indigo-200 tracking-widest mt-0.5">Decision</span>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* ── Block 3: Payoff Matrix ─────────────────────────────────────── */}
          {/* Moved to Right Column for all layouts, so this block is now empty/removed */}
        </div>

        {/* ── Right Column ──────────────────────────────────────────────────── */}
        <div className="flex flex-col justify-start">
          <div className={`bg-white rounded-2xl shadow-lg p-6 md:p-8 space-y-8 xl:sticky xl:top-6 ${layouts.decisionSlider === '3' ? 'border-2 border-indigo-100' : ''}`}>

            {/* ── Block 4: Decision Input ───────────────────────────────────── */}
            {(!isGradual || isDecisionPhase) ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
                {layouts.decisionSlider === '1' ? (
                  <>
                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-medium text-gray-800">
                        Will you give to your partner?
                      </h3>
                      <p className="text-sm text-gray-500">Drag the slider to indicate your probability.</p>
                      <div className="pt-2">
                        <DecisionSlider value={sliderValue} onChange={(v) => { setSliderValue(v); setHasInteracted(true); }} />
                      </div>
                    </div>
                  </>
                ) : layouts.decisionSlider === '2' ? (
                  <DecisionButtons
                    sliderValue={sliderValue}
                    onChange={setSliderValue}
                    opponentLabel={agentOpponent.label}
                    onInteraction={() => setHasInteracted(true)}
                  />
                ) : (
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-medium text-gray-800">Projected Outcome</h3>
                    <p className="text-sm text-gray-500">
                      Based on your <span className="font-bold text-indigo-600">{sliderValue}%</span> probability of giving
                    </p>
                  </div>
                )}

                {/* ── Common Analysis Section ───────────────────────────────────── */}
                {layouts.payoffMatrix !== 'off' && (
                  <>
                    {layouts.payoffMatrix === '2' ? (
                      <div className="space-y-4">
                        <button
                          onClick={() => setShowPayoffTable(!showPayoffTable)}
                          className="w-full py-3 bg-gray-50 border border-gray-200 text-gray-700 font-bold rounded-xl shadow-sm hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                        >
                          <span>{showPayoffTable ? 'Hide' : 'Show'} Payoff Table</span>
                          <span className="text-gray-400 text-xs">{showPayoffTable ? '▲' : '▼'}</span>
                        </button>
                        {showPayoffTable && <PayoffMatrix userProb={sliderValue} compact={false} />}
                      </div>
                    ) : (
                      <PayoffMatrix userProb={sliderValue} compact={false} />
                    )}

                    {layouts.decisionSlider !== '1' && (
                      <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-2 border border-gray-100">
                        <p className="font-semibold text-gray-800 border-gray-200 pb-2 mb-2">Analysis:</p>
                        {sliderValue > 50 ? (
                          <>
                            <p>You are leaning towards <span className="text-green-600 font-bold">Giving</span>.</p>
                          </>
                        ) : sliderValue < 50 ? (
                          <>
                            <p>You are leaning towards <span className="text-red-600 font-bold">Not Giving</span>.</p>
                          </>
                        ) : (
                          <p>You are <span className="text-gray-500 font-bold">Undecided</span>. Adjust the slider/bubble to see outcomes.</p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="text-center py-12 px-4 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50 animate-in fade-in duration-700">
                <span className="text-4xl">🔒</span>
                <h3 className="mt-4 text-sm font-bold text-gray-400 uppercase tracking-widest">Decision Locked</h3>
                <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                  Please reveal all network history edges <br /> before making your decision.
                </p>
              </div>
            )}

            <button
              onClick={handleNext}
              disabled={(isGradual && (!allRevealed || !isDecisionPhase)) || !hasInteracted}
              className={`w-full py-4 text-lg font-bold rounded-xl shadow-xl transition-all transform ${(isGradual && (!allRevealed || !isDecisionPhase)) || !hasInteracted
                ? 'bg-gray-300 text-gray-400 cursor-not-allowed shadow-none'
                : 'bg-gray-900 text-white hover:bg-black hover:-translate-y-1 active:translate-y-0 animate-glow-indigo'
                } ${layouts.decisionSlider === '3' ? 'mt-4 lg:mt-auto' : ''}`}
            >
              {isGradual && !allRevealed
                ? `Reveal all edges first (${revealedEdgeIds.size}/${setup.activeEdgeIds.length})`
                : isGradual && !isDecisionPhase
                  ? 'Enter decision phase first'
                  : !hasInteracted
                    ? 'Interact with Slider first'
                    : currentScenarioIdx === scenarios.length - 1 ? 'Submit Results' : 'Confirm & Next'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyView;