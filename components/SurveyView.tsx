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
  decisionMakerId: AgentId
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
  // Only shuffle AGENT-TO-VERTEX assignment; vertices themselves stay fixed
  const shuffledOthers = [...others].sort(() => Math.random() - 0.5);

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
        <div className="p-2 text-green-700 bg-green-50/50">Cooperate</div>
        <div className="p-2 text-red-700 bg-red-50/50">Defect</div>
      </div>

      {/* Row 1: YOU Cooperate */}
      <div className={`grid grid-cols-3 border-b border-gray-100 transition-all duration-500 ${coopOpacity} ${isCoop ? 'bg-green-50/30' : ''}`}>
        <div className="p-2 font-bold text-green-700 bg-green-50 flex items-center justify-between relative">
          <span>Cooperate</span>
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

      {/* Row 2: YOU Defect */}
      <div className={`grid grid-cols-3 transition-all duration-500 ${defectOpacity} ${isDefect ? 'bg-red-50/30' : ''}`}>
        <div className="p-2 font-bold text-red-700 bg-red-50 flex items-center justify-between relative">
          <span>Defect</span>
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
    <p>• <span className="font-semibold text-green-700">Both Cooperate</span> → You <strong>+2</strong>, Opponent <strong>+2</strong></p>
    <p>• <span className="font-semibold">You Cooperate, Opp Defects</span> → You <strong className="text-red-600">−1</strong>, Opponent <strong>+5</strong></p>
    <p>• <span className="font-semibold">You Defect, Opp Cooperates</span> → You <strong className="text-green-600">+5</strong>, Opponent <strong>−1</strong></p>
    <p>• <span className="font-semibold text-red-700">Both Defect</span> → You <strong>+1</strong>, Opponent <strong>+1</strong></p>
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
    { label: 'Definitely Defect', value: 0, active: 'bg-red-600 text-white border-red-600', idle: 'bg-red-50 text-red-700 border-red-200' },
    { label: 'Likely Defect', value: 25, active: 'bg-red-400 text-white border-red-400', idle: 'bg-red-50/50 text-red-500 border-red-200' },
    { label: 'Unsure', value: 50, active: 'bg-gray-500 text-white border-gray-500', idle: 'bg-gray-50 text-gray-600 border-gray-200' },
    { label: 'Likely Cooperate', value: 75, active: 'bg-green-400 text-white border-green-400', idle: 'bg-green-50/50 text-green-600 border-green-200' },
    { label: 'Definitely Cooperate', value: 100, active: 'bg-green-600 text-white border-green-600', idle: 'bg-green-50 text-green-700 border-green-200' },
  ];
  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <h3 className="text-xl font-medium text-gray-800">
          Will you cooperate with <span className="font-bold text-indigo-600">{opponentLabel}</span>?
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
        Current: <span className="font-bold">{sliderValue}% Cooperate</span>
      </p>
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

  // Layout switcher — all default to '1' (Option 1)
  const [layouts, setLayouts] = useState<LayoutOptions>({
    progressBar: '1',
    payoffMatrix: '1',
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
  if (step === 'intro') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl p-6 md:p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Experiment Instructions</h1>
            <div className="w-16 h-1 bg-indigo-500 mx-auto rounded-full" />
          </div>
          <div className="space-y-4 text-gray-600 leading-relaxed text-sm">
            <p>Welcome. In this experiment, you will be playing the role of{' '}
              <span className="font-bold text-indigo-600">{agentMe.label}</span>.
            </p>
            <p>You will interact with <span className="font-bold text-red-600">{agentOpponent.label}</span> in a series of scenarios.</p>
            <p className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-blue-900">
              <strong>Your Goal:</strong> For each scenario, we will show you a "History Report".
              Based on this history, you must decide the <strong>probability</strong> that you will{' '}
              <strong>Cooperate</strong> with your opponent to maximize your points.
            </p>
            <div className="mt-4">
              <h3 className="font-bold text-gray-700 mb-2">Game Payoffs (You, Opponent):</h3>
              <PayoffMatrix />
            </div>
            <p>There are <strong>{scenarios.length}</strong> unique scenarios in total.</p>
          </div>
          <button
            onClick={() => setStep('scenarios')}
            className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-transform active:scale-95"
          >
            I Understand, Begin &rarr;
          </button>
          <button onClick={onBack} className="w-full text-sm text-gray-400 hover:text-gray-600 mt-2">
            Back to Config
          </button>
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
        .animate-glow-amber {
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
                <div className="mx-4 mt-4 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-700">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg">
                    <span className="text-xl">🔍</span>
                  </div>
                  <div>
                    <p className="text-sm text-blue-900 font-bold mb-0.5">Unlock the History</p>
                    <p className="text-xs text-blue-700 font-medium leading-relaxed">
                      Click each <span className="text-blue-900 font-bold underline decoration-blue-300">gray dashed edge</span> on the graph to reveal what happened in the past.
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-600 uppercase tracking-tighter">
                        {setup.activeEdgeIds.length - revealedEdgeIds.size} remaining
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {/* ── Gradual reveal debrief — shown once all edges revealed, but BEFORE decision phase ── */}
              {isGradual && allRevealed && !isDecisionPhase && (
                <div className="mx-4 mt-4 flex items-center justify-between gap-3 bg-amber-50 border-2 border-amber-200 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-500 animate-glow-amber">
                  <div className="flex items-start gap-3">
                    <span className="text-xl mt-0.5">✅</span>
                    <div>
                      <p className="text-xs font-bold text-amber-800">All history revealed!</p>
                      <p className="text-xs text-amber-700 mt-0.5">Review the network history above carefully.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsDecisionPhase(true);
                      setHasInteracted(false);
                    }}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2 px-4 rounded-lg shadow-sm transition-colors whitespace-nowrap"
                  >
                    Enter Decision Phase
                  </button>
                </div>
              )}

              {/* ── Gradual reveal decision phase callout ── */}
              {isGradual && allRevealed && isDecisionPhase && (
                <div className="mx-4 mt-4 flex items-start gap-3 bg-indigo-50 border border-indigo-200 rounded-xl p-3 animate-in fade-in slide-in-from-top-2 duration-500">
                  <span className="text-xl mt-0.5">🎯</span>
                  <div>
                    <p className="text-xs font-bold text-indigo-800">Decision Phase Active</p>
                    <p className="text-xs text-indigo-700 mt-0.5">
                      Now check the <span className="font-bold">dashed amber edge</span> pointing from YOU to your Partner — set your probability using the slider.
                    </p>
                  </div>
                </div>
              )}

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
                    <h3 className="text-xs md:text-sm font-bold text-gray-800">Will you cooperate with your partner?</h3>
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
                        Will you cooperate with your partner?
                      </h3>
                      <p className="text-sm text-gray-500">Drag the slider to indicate your probability.</p>
                    </div>
                    <div className="space-y-6">
                      <div className="relative pt-6 pb-2">
                        <div
                          className="absolute -top-2 transform -translate-x-1/2 bg-gray-900 text-white text-xs font-bold px-2 py-1 rounded transition-all"
                          style={{ left: `${sliderValue}%` }}
                        >
                          {sliderValue}%
                        </div>
                        <input
                          type="range" min="0" max="100" value={sliderValue}
                          onChange={(e) => setSliderValue(Number(e.target.value))}
                          onBlur={() => setHasInteracted(true)}
                          onPointerUp={() => setHasInteracted(true)}
                          className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        />
                        <div className="flex justify-between text-xs font-bold text-gray-400 mt-2 uppercase">
                          <span>Definitely Defect</span>
                          <span>Unsure</span>
                          <span>Definitely Cooperate</span>
                        </div>
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
                      Based on your <span className="font-bold text-indigo-600">{sliderValue}%</span> cooperation probability
                    </p>
                  </div>
                )}

                {/* ── Common Analysis Section ───────────────────────────────────── */}
                {layouts.payoffMatrix !== 'off' && (
                  <>
                    <PayoffMatrix userProb={sliderValue} compact={false} />

                    <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-2 border border-gray-100">
                      <p className="font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-2">Analysis:</p>
                      {sliderValue > 50 ? (
                        <>
                          <p>You are leaning towards <span className="text-green-600 font-bold">Cooperation</span>.</p>
                          <ul className="list-disc list-inside space-y-1 text-xs text-gray-500">
                            <li>If they also cooperate, you both win <strong className="text-gray-900">2 pts</strong> (Best Group Outcome).</li>
                            <li>If they defect, you lose <strong className="text-red-600">1 pt</strong> (Worst Personal Outcome).</li>
                          </ul>
                        </>
                      ) : sliderValue < 50 ? (
                        <>
                          <p>You are leaning towards <span className="text-red-600 font-bold">Defection</span>.</p>
                          <ul className="list-disc list-inside space-y-1 text-xs text-gray-500">
                            <li>If they cooperate, you win <strong className="text-green-600">5 pts</strong> (Best Personal Outcome).</li>
                            <li>If they also defect, you get <strong className="text-gray-900">1 pt</strong> (Safety Net).</li>
                          </ul>
                        </>
                      ) : (
                        <p>You are <span className="text-gray-500 font-bold">Undecided</span>. Adjust the slider/bubble to see outcomes.</p>
                      )}
                    </div>
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