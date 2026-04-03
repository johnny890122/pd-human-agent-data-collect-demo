import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ExperimentSetup, SurveyResult } from '../types';
import { AgentId } from '../types';
import NetworkGraph from './NetworkGraph';
import { generateDesignMatrix } from '../utils/math';
import { generateTrianglePositions, PayoffMatrix, DecisionSlider } from './SurveyShared';
import SurveyIntro from './SurveyIntro';
import SurveyOutro from './SurveyOutro';
import { saveSession } from '../utils/surveySession';

interface SurveyViewProps {
  setup: ExperimentSetup;
  onStartSurvey: () => Promise<string | undefined>;
  onSaveAnswer: (entryId: string, answer: SurveyResult) => Promise<boolean>;
  onComplete: (entryId: string, results: SurveyResult[], demographics: { age: number, gender: string, education: string }) => void;
  onBack: () => void;
  initialEntryId?: string;
}


// ─── Main Survey View ─────────────────────────────────────────────────────────
const SurveyView: React.FC<SurveyViewProps> = ({ setup, onStartSurvey, onSaveAnswer, onComplete, onBack, initialEntryId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const setupId = searchParams.get('setupId');

  const navigateWithSetup = (path: string) => {
    navigate(setupId ? `${path}?setupId=${setupId}` : path);
  };

  // Keep users in the survey flow by ignoring browser Back navigation.
  useEffect(() => {
    const blockBackNavigation = () => {
      // Avoid pushing state repeatedly to prevent history stack bloat
      if (window.history.state !== 'blocked') {
        window.history.pushState('blocked', '', window.location.href);
      }
    };

    blockBackNavigation();
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
  const [demographics, setDemographics] = useState({ age: 25, gender: 'other', education: 'university' });
  const [showDemographics, setShowDemographics] = useState(false);
  const [entryId, setEntryId] = useState<string | undefined>(initialEntryId);

  // Sync initialEntryId when it loads asynchronously
  useEffect(() => {
    if (initialEntryId && !entryId) {
      setEntryId(initialEntryId);
    }
  }, [initialEntryId, entryId]);


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
    setRandomPositions(generateTrianglePositions(setup.focalNode));
  }, [scenarioIdx, setup.focalNode]);

  const scenarios = setup.scenarios || [];
  const currentScenario = scenarios[scenarioIdx];

  const handleNext = async () => {
    const answer: SurveyResult = {
      scenarioId: currentScenario.id,
      cooperationProbability: sliderValue / 100,
    };
    const newResults = [...results];
    newResults[scenarioIdx] = answer;
    setResults(newResults);

    // Persist this answer to the backend immediately
    if (entryId) {
      await onSaveAnswer(entryId, answer);
    }

    if (scenarioIdx < scenarios.length - 1) {
      const nextPath = `/survey/scenarios/${scenarioIdx + 1}${setupId ? `?setupId=${setupId}` : ''}`;
      if (entryId) {
        saveSession(setupId || setup.id || '', entryId, nextPath);
      }
      navigateWithSetup(`/survey/scenarios/${scenarioIdx + 1}`);
    } else {
      const nextPath = `/survey/demographics${setupId ? `?setupId=${setupId}` : ''}`;
      if (entryId) {
        saveSession(setupId || setup.id || '', entryId, nextPath);
      }
      navigateWithSetup('/survey/demographics');
    }
  };


  // Determine which step we're on based on the URL path
  const isIntroStep = location.pathname.startsWith('/survey/intro/');
  const isScenariosStep = location.pathname.startsWith('/survey/scenarios/');
  const isOutroStep = location.pathname === '/survey/outro';
  const isDemographicsStep = location.pathname === '/survey/demographics';

  // ── Intro ──────────────────────────────────────────────────────────────────
  if (isIntroStep) {
    return (
      <SurveyIntro 
        setup={setup} 
        currentStep={introStep}
        onNavigateIntro={(step) => navigateWithSetup(`/survey/intro/${step}`)}
        onFinish={async () => {
          const newEntryId = await onStartSurvey();
          setEntryId(newEntryId);
          navigateWithSetup('/survey/scenarios/0');
        }} 
      />
    );
  }

  // ── Outro ──────────────────────────────────────────────────────────────────
  if (isOutroStep) {
    return <SurveyOutro results={results} onBack={onBack} />;
  }

  // ── Demographics ──────────────────────────────────────────────────────────

  if (isDemographicsStep) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-8">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full space-y-6">
          <h2 className="text-2xl font-bold text-center">About You</h2>
          <p className="text-gray-500 text-sm text-center">Please provide some basic info to help our research.</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Age</label>
              <input 
                type="number" 
                value={demographics.age} 
                onChange={e => setDemographics({...demographics, age: parseInt(e.target.value)})}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Gender</label>
              <select 
                value={demographics.gender} 
                onChange={e => setDemographics({...demographics, gender: e.target.value})}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Education</label>
              <input 
                type="text" 
                value={demographics.education} 
                onChange={e => setDemographics({...demographics, education: e.target.value})}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                placeholder="e.g. University"
              />
            </div>
          </div>
          
          <button
            onClick={() => onComplete(entryId ?? '', results, demographics)}
            className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-colors"
          >
            Submit & Finish
          </button>
        </div>
      </div>
    );
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
                  mode="survey"
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