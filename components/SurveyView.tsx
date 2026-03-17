import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ExperimentSetup, SurveyResult } from '../types';
import { AgentId } from '../types';
import NetworkGraph from './NetworkGraph';
import { generateDesignMatrix } from '../utils/math';
import { generateTrianglePositions, PayoffMatrix, DecisionSlider } from './SurveyShared';
import SurveyIntro from './SurveyIntro';
import SurveyOutro from './SurveyOutro';

interface SurveyViewProps {
  setup: ExperimentSetup;
  onComplete: (results: SurveyResult[]) => void;
  onBack: () => void;
}

// ─── Main Survey View ─────────────────────────────────────────────────────────
const SurveyView: React.FC<SurveyViewProps> = ({ setup, onComplete, onBack }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  // Keep users in the survey flow by ignoring browser Back navigation.
  useEffect(() => {
    const blockBackNavigation = () => {
      window.history.pushState(null, '', window.location.href);
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', blockBackNavigation);

    return () => {
      window.removeEventListener('popstate', blockBackNavigation);
    };
  }, [location.pathname]);
  
  // Get intro step and scenario index from URL params
  const introStep = params.introStep ? parseInt(params.introStep, 10) : 0;
  const scenarioIdx = params.scenarioIdx ? parseInt(params.scenarioIdx, 10) : 0;
  
  // State for survey progression
  const [sliderValue, setSliderValue] = useState(50);
  const [results, setResults] = useState<SurveyResult[]>([]);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Gradual reveal state — which active edges the user has clicked to reveal
  const [revealedEdgeIds, setRevealedEdgeIds] = useState<Set<string>>(new Set());
  const [isDecisionPhase, setIsDecisionPhase] = useState(false);
  const [showPayoffTable, setShowPayoffTable] = useState(false);
  const allRevealed = revealedEdgeIds.size >= setup.activeEdgeIds.length;

  // Reset reveal/decision state on each new scenario
  useEffect(() => {
    setRevealedEdgeIds(new Set());
    setIsDecisionPhase(false);
    setHasInteracted(false);
    setSliderValue(50);
  }, [scenarioIdx]);

  const handleEdgeReveal = (edgeId: string) => {
    setRevealedEdgeIds(prev => new Set([...prev, edgeId]));
  };

  // Randomized node positions — refreshed per scenario
  const [randomPositions, setRandomPositions] = useState<Record<AgentId, { x: number; y: number }> | null>(null);

  useEffect(() => {
    setRandomPositions(generateTrianglePositions(setup.decisionMaker));
  }, [scenarioIdx, setup.decisionMaker]);

  const scenarios = useMemo(() => generateDesignMatrix(setup.activeEdgeIds), [setup.activeEdgeIds]);
  const currentScenario = scenarios[scenarioIdx];
  const surveyGraphStyleProps = {
    mode: 'survey' as const,
    groupLabel: 'named' as const,
    nodeIdentity: 'avatar' as const,
    roleIdentity: 'glow' as const,
  };

  const handleNext = () => {
    const newResults = [...results];
    newResults[scenarioIdx] = {
      scenarioId: currentScenario.id,
      cooperationProbability: sliderValue / 100,
    };
    setResults(newResults);
    if (scenarioIdx < scenarios.length - 1) {
      navigate(`/survey/scenarios/${scenarioIdx + 1}`);
    } else {
      onComplete(newResults);
    }
  };

  // Determine which step we're on based on the URL path
  const isIntroStep = location.pathname.startsWith('/survey/intro/');
  const isScenariosStep = location.pathname.startsWith('/survey/scenarios/');
  const isOutroStep = location.pathname === '/survey/outro';

  // ── Intro ──────────────────────────────────────────────────────────────────
  if (isIntroStep) {
    return (
      <SurveyIntro 
        setup={setup} 
        currentStep={introStep}
        onNavigateIntro={(step) => navigate(`/survey/intro/${step}`)}
        onFinish={() => navigate('/survey/scenarios/0')} 
      />
    );
  }

  // ── Outro ──────────────────────────────────────────────────────────────────
  if (isOutroStep) {
    return <SurveyOutro results={results} onBack={onBack} />;
  }

  // ── Scenarios ──────────────────────────────────────────────────────────────
  if (!isScenariosStep || !currentScenario) {
    return null;
  }

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


      {/* ── Block 1: Progress Bar ──────────────────────────────────────────── */}
      <div className="w-full max-w-5xl mb-6 mt-12 lg:mt-0">
        <div className="flex justify-between text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
          <span>Scenario {scenarioIdx + 1} of {scenarios.length}</span>
          <span>Progress: {Math.round(((scenarioIdx + 1) / scenarios.length) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((scenarioIdx + 1) / scenarios.length) * 100}%` }}
          />
        </div>
      </div>

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
              {!allRevealed && (
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
              {allRevealed && !isDecisionPhase && (
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

              <div className="flex-1 flex items-center justify-center min-h-[350px] md:min-h-[400px]">
                <NetworkGraph
                  {...surveyGraphStyleProps}
                  setup={setup}
                  scenario={currentScenario}
                  positionOverrides={randomPositions ?? undefined}
                  decision={sliderValue}
                  onInteraction={() => setHasInteracted(true)}
                  revealedEdgeIds={revealedEdgeIds}
                  onEdgeReveal={handleEdgeReveal}
                  hideDecisionEdge={!allRevealed || !isDecisionPhase}
                />
              </div>
            </div>

          </div>
        </div>

        {/* ── Right Column ──────────────────────────────────────────────────── */}
        <div className="flex flex-col justify-start">
          <div className={`bg-white rounded-2xl shadow-lg p-6 md:p-8 space-y-8 xl:sticky xl:top-6`}>

            {/* ── Block 4: Decision Input ───────────────────────────────────── */}
            {isDecisionPhase ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-medium text-gray-800">
                    Will you give to your partner?
                  </h3>
                  <p className="text-sm text-gray-500">Drag the slider to indicate your probability.</p>
                  <div className="pt-2">
                    <DecisionSlider value={sliderValue} onChange={(v) => { setSliderValue(v); setHasInteracted(true); }} />
                  </div>
                </div>

                {/* ── Common Analysis Section ───────────────────────────────────── */}
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
              disabled={(!allRevealed || !isDecisionPhase) || !hasInteracted}
              className={`w-full py-4 text-lg font-bold rounded-xl shadow-xl transition-all transform ${(!allRevealed || !isDecisionPhase) || !hasInteracted
                ? 'bg-gray-300 text-gray-400 cursor-not-allowed shadow-none'
                : 'bg-gray-900 text-white hover:bg-black hover:-translate-y-1 active:translate-y-0 animate-glow-indigo'
                }`}
            >
              {!allRevealed
                ? `Reveal all edges first (${revealedEdgeIds.size}/${setup.activeEdgeIds.length})`
                : !isDecisionPhase
                  ? 'Enter decision phase first'
                  : !hasInteracted
                    ? 'Interact with Slider first'
                    : scenarioIdx === scenarios.length - 1 ? 'Submit Results' : 'Confirm & Next'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyView;