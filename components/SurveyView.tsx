import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Session, SurveyResult } from '../types';
import { AgentId } from '../types';
import NetworkGraph from './NetworkGraph';
import { generateDesignMatrix } from '../utils/math';
import { generateTrianglePositions, PayoffMatrix, DecisionSlider } from './SurveyShared';
import SurveyIntro from './SurveyIntro';
import SurveyOutro from './SurveyOutro';
import { saveSession } from '../utils/surveySession';

interface SurveyViewProps {
  setup: Session;
  onStartSurvey: () => Promise<string | undefined>;
  onSaveAnswer: (entryId: string, answer: SurveyResult) => Promise<boolean>;
  onComplete: (entryId: string, results: SurveyResult[], demographics: { age: number, gender: string, education: string }) => void;
  onBack: () => void;
  initialEntryId?: string;
  isTurnstileVerified: boolean;
  onTurnstileVerified: () => void;
  mixedModeScenariosPerSession?: number | null;
}


// ─── Main Survey View ─────────────────────────────────────────────────────────
const SurveyView: React.FC<SurveyViewProps> = ({
  setup,
  onStartSurvey,
  onSaveAnswer,
  onComplete,
  onBack,
  initialEntryId,
  isTurnstileVerified,
  onTurnstileVerified,
  mixedModeScenariosPerSession,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const groupId = searchParams.get('groupId');
  const mode = searchParams.get('mode');
  const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const turnstileSiteKey = isLocalHost
    ? '1x00000000000000000000AA'
    : (import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '0x4AAAAAAC2vj0xOA6Fpx2cd');

  const navigateWithSession = (path: string) => {
    // Mixed Mode during intro (before session creation): preserve groupId + mode
    if (groupId && mode === 'mixed' && !sessionId) {
      navigate(`${path}?groupId=${groupId}&mode=mixed`);
    } else if (sessionId) {
      navigate(`${path}?sessionId=${sessionId}`);
    } else {
      navigate(path);
    }
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
  const [showTurnstileGate, setShowTurnstileGate] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState<string | null>(null);
  const [isTurnstileScriptReady, setIsTurnstileScriptReady] = useState(false);
  const [isVerifyingTurnstile, setIsVerifyingTurnstile] = useState(false);
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);

  // Sync initialEntryId when it loads asynchronously
  useEffect(() => {
    if (initialEntryId && !entryId) {
      setEntryId(initialEntryId);
    }
  }, [initialEntryId, entryId]);

  useEffect(() => {
    if (!showTurnstileGate) {
      return;
    }

    const existingScript = document.getElementById('cf-turnstile-script') as HTMLScriptElement | null;
    if ((window as any).turnstile) {
      setIsTurnstileScriptReady(true);
      return;
    }

    if (existingScript) {
      const onLoad = () => setIsTurnstileScriptReady(true);
      existingScript.addEventListener('load', onLoad);
      return () => {
        existingScript.removeEventListener('load', onLoad);
      };
    }

    const script = document.createElement('script');
    script.id = 'cf-turnstile-script';
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = () => setIsTurnstileScriptReady(true);
    document.head.appendChild(script);
  }, [showTurnstileGate]);

  useEffect(() => {
    if (!showTurnstileGate || !isTurnstileScriptReady || !turnstileContainerRef.current || turnstileWidgetIdRef.current) {
      return;
    }

    const turnstile = (window as any).turnstile;
    if (!turnstile) {
      return;
    }

    turnstileWidgetIdRef.current = turnstile.render(turnstileContainerRef.current, {
      sitekey: turnstileSiteKey,
      callback: (token: string) => {
        setTurnstileToken(token);
        setTurnstileError(null);
      },
      'expired-callback': () => {
        setTurnstileToken(null);
      },
      'error-callback': () => {
        setTurnstileToken(null);
        setTurnstileError(
          isLocalHost
            ? '本地端測試被 Turnstile 阻擋。請將 localhost 加入白名單，或設定本機測試金鑰。'
            : '驗證載入失敗，請重試。'
        );
      },
    });
  }, [showTurnstileGate, isTurnstileScriptReady, turnstileSiteKey, isLocalHost]);

  const resetTurnstileWidget = (mode: 'reset' | 'remove' = 'reset') => {
    const turnstile = (window as any).turnstile;
    if (turnstile && turnstileWidgetIdRef.current) {
      if (mode === 'remove') {
        turnstile.remove(turnstileWidgetIdRef.current);
      } else {
        turnstile.reset(turnstileWidgetIdRef.current);
      }
    }
    if (mode === 'remove') {
      turnstileWidgetIdRef.current = null;
    }
    setTurnstileToken(null);
  };

  const handleVerifyTurnstileAndStart = async () => {
    if (!turnstileToken) {
      setTurnstileError('請先完成機器人驗證。');
      return;
    }

    setIsVerifyingTurnstile(true);
    setTurnstileError(null);

    try {
      const verifyResponse = await fetch('/api/turnstile/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: turnstileToken }),
      });

      const verifyBody = await verifyResponse.json();

      if (!verifyResponse.ok || !verifyBody.success) {
        setTurnstileError('驗證未通過，請再試一次。');
        resetTurnstileWidget();
        return;
      }

      const newEntryId = await onStartSurvey();
      if (!newEntryId) {
        setTurnstileError('無法建立測驗連線，請重試。');
        return;
      }

      setEntryId(newEntryId);
      setShowTurnstileGate(false);
      onTurnstileVerified();
      resetTurnstileWidget('remove');
      navigateWithSession('/survey/scenarios/0');
    } catch {
      setTurnstileError('驗證失敗，請再試一次。');
      resetTurnstileWidget();
    } finally {
      setIsVerifyingTurnstile(false);
    }
  };


  // Gradual reveal state — which active edges the user has clicked to reveal
  const [revealedEdgeIds, setRevealedEdgeIds] = useState<Set<string>>(new Set());
  const [isDecisionPhase, setIsDecisionPhase] = useState(false);
  const [showPayoffTable, setShowPayoffTable] = useState(false);

  // Define scenarios and currentScenario FIRST
  const scenarios = setup.scenarios || [];
  const currentScenario = scenarios[scenarioIdx];

  // Mixed Mode: Use currentScenario.activeEdgeIds, fallback to setup.activeEdgeIds for Manual/Batch
  const activeEdgeIds = currentScenario?.activeEdgeIds || setup.activeEdgeIds || [];
  const allRevealed = revealedEdgeIds.size >= activeEdgeIds.length;

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
    setRandomPositions(generateTrianglePositions(setup.focalNode as AgentId));
  }, [scenarioIdx, setup.focalNode]);

  // Debug: Log scenarios to check for duplicates
  React.useEffect(() => {
    console.log('[SurveyView] Total scenarios:', scenarios.length);
    console.log('[SurveyView] Current index:', scenarioIdx);
    if (currentScenario) {
      const scenarioId = currentScenario._id;
      console.log('[SurveyView] Current scenario ID:', scenarioId);
      console.log('[SurveyView] Current scenario activeEdgeIds:', currentScenario.activeEdgeIds);
      console.log('[SurveyView] Current scenario edgeStates:', currentScenario.edgeStates);
    }
    
    // Check if all scenarios are unique
    const scenarioIds = scenarios.map(s => s._id);
    const uniqueIds = [...new Set(scenarioIds)];
    if (uniqueIds.length !== scenarioIds.length) {
      console.warn('[SurveyView] ⚠️  WARNING: Duplicate scenario IDs detected!', {
        total: scenarioIds.length,
        unique: uniqueIds.length
      });
    }
  }, [scenarioIdx, currentScenario, scenarios.length]);

  const handleNext = async () => {
    // Handle both Scenario (_id) and ScenarioPreview (id) types
    const scenarioId = currentScenario._id;
    const answer: SurveyResult = {
      scenarioId,
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
      const nextPath = `/survey/scenarios/${scenarioIdx + 1}${sessionId ? `?sessionId=${sessionId}` : ''}`;
      if (entryId) {
        saveSession(sessionId || setup._id || '', entryId, nextPath);
      }
      navigateWithSession(`/survey/scenarios/${scenarioIdx + 1}`);
    } else {
      const nextPath = `/survey/outro${sessionId ? `?sessionId=${sessionId}` : ''}`;
      if (entryId) {
        saveSession(sessionId || setup._id || '', entryId, nextPath);
      }
      navigateWithSession('/survey/outro');
    }
  };


  // Determine which step we're on based on the URL path
  const isIntroStep = location.pathname.startsWith('/survey/intro/');
  const isScenariosStep = location.pathname.startsWith('/survey/scenarios/');
  const isOutroStep = location.pathname === '/survey/outro';
  const isPostIntroStep = isScenariosStep || isOutroStep;

  useEffect(() => {
    if (!isPostIntroStep || isTurnstileVerified) {
      return;
    }

    navigate(sessionId ? `/survey/intro/0?sessionId=${sessionId}` : '/survey/intro/0', { replace: true });
  }, [isPostIntroStep, isTurnstileVerified, navigate, sessionId]);
  // const isDemographicsStep = location.pathname === '/survey/demographics';

  // ── Intro ──────────────────────────────────────────────────────────────────
  if (isIntroStep) {
    return (
      <>
        <SurveyIntro
          setup={setup}
          currentStep={introStep}
          onNavigateIntro={(step) => navigateWithSession(`/survey/intro/${step}`)}
          mixedModeScenariosPerSession={mixedModeScenariosPerSession}
          onFinish={() => {
            setTurnstileError(null);
            setShowTurnstileGate(true);
          }} 
        />
        {showTurnstileGate && (
          <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900">進入測驗前請先驗證</h3>
                <p className="text-sm text-gray-600">請完成安全性驗證以進入測驗。</p>
              </div>

              <div className="rounded-xl border border-gray-200 p-4 min-h-[90px] flex items-center justify-center bg-gray-50">
                {!isTurnstileScriptReady ? (
                  <span className="text-sm text-gray-500">驗證載入中...</span>
                ) : (
                  <div ref={turnstileContainerRef} />
                )}
              </div>

              {turnstileError && (
                <p className="text-sm text-red-600 font-medium">{turnstileError}</p>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowTurnstileGate(false);
                    setTurnstileError(null);
                    resetTurnstileWidget('remove');
                  }}
                  className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                  disabled={isVerifyingTurnstile}
                >
                  取消
                </button>
                <button
                  onClick={handleVerifyTurnstileAndStart}
                  className="flex-1 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed"
                  disabled={isVerifyingTurnstile || Boolean(turnstileError)}
                >
                  {isVerifyingTurnstile ? '驗證中...' : '進入測驗'}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // ── Outro ──────────────────────────────────────────────────────────────────
  if (isOutroStep) {
    return <SurveyOutro results={results} onBack={onBack} onComplete={onComplete} entryId={entryId} />;
  }

  // ── Demographics ──────────────────────────────────────────────────────────

  // if (isDemographicsStep) {
  //   return (
  //     <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-8">
  //       <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full space-y-6">
  //         <h2 className="text-2xl font-bold text-center">關於您</h2>
  //         <p className="text-gray-500 text-sm text-center">請提供一些基本資料以協助我們的研究。</p>
          
  //         <div className="space-y-4">
  //           <div>
  //             <label className="block text-sm font-medium text-gray-700">年齡</label>
  //             <input 
  //               type="number" 
  //               value={demographics.age} 
  //               onChange={e => setDemographics({...demographics, age: parseInt(e.target.value)})}
  //               className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
  //             />
  //           </div>
  //           <div>
  //             <label className="block text-sm font-medium text-gray-700">性別</label>
  //             <select 
  //               value={demographics.gender} 
  //               onChange={e => setDemographics({...demographics, gender: e.target.value})}
  //               className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
  //             >
  //               <option value="male">男</option>
  //               <option value="female">女</option>
  //               <option value="other">其他</option>
  //               <option value="prefer_not_to_say">不願透露</option>
  //             </select>
  //           </div>
  //           <div>
  //             <label className="block text-sm font-medium text-gray-700">教育程度</label>
  //             <input 
  //               type="text" 
  //               value={demographics.education} 
  //               onChange={e => setDemographics({...demographics, education: e.target.value})}
  //               className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
  //               placeholder="例如：大學"
  //             />
  //           </div>
  //         </div>
          
  //         <button
  //           onClick={() => onComplete(entryId ?? '', results, demographics)}
  //           className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-colors"
  //         >
  //           送出並結束
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }

  // ── Scenarios ──────────────────────────────────────────────────────────────

  if (!isScenariosStep) {
    return null;
  }

  // 檢查是否有 scenarios
  if (!scenarios || scenarios.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full space-y-6 text-center">
          <div className="text-6xl">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900">測驗配置錯誤</h2>
          <p className="text-gray-600">
            此測驗沒有任何題目。這可能是因為管理員在建立測驗時沒有選擇任何互動邊。
          </p>
          <p className="text-sm text-gray-500">
            請聯絡管理員重新設定測驗。
          </p>
          <button
            onClick={onBack}
            className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl shadow-lg hover:bg-black transition-colors"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  // 檢查當前 scenario 是否存在
  if (!currentScenario) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full space-y-6 text-center">
          <div className="text-6xl">🔍</div>
          <h2 className="text-2xl font-bold text-gray-900">找不到題目</h2>
          <p className="text-gray-600">
            題目 #{scenarioIdx + 1} 不存在。總共有 {scenarios.length} 題。
          </p>
          <button
            onClick={() => navigateWithSession('/survey/scenarios/0')}
            className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-colors"
          >
            返回第一題
          </button>
        </div>
      </div>
    );
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
          <span>第 {scenarioIdx + 1} 題，共 {scenarios.length} 題</span>
          <span>進度：{Math.round(((scenarioIdx + 1) / scenarios.length) * 100)}%</span>
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
            <div className="p-4 md:p-6 flex-1 flex flex-col bg-white overflow-hidden">

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

              {/* ── Gradual reveal prompt — shown while edges remain hidden ── */}
              {!allRevealed && (
                <div className="mx-4 mt-4 flex items-center justify-center gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3 shadow-sm animate-in fade-in slide-in-from-top-4 duration-700">
                  <p className="text-xs text-blue-800 font-medium text-center">
                    請點擊以下虛弧線上的「問號」，來閱覽互動記錄
                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-600">
                      剩下 {activeEdgeIds.length - revealedEdgeIds.size} 個
                    </span>
                  </p>
                </div>
              )}
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
                    給或不給？
                  </h3>
                  <p className="text-sm text-gray-500">從0到100，請輸入一個值代表您的決定<br/>（0代表絕對不會給予對方，100代表絕對會給對方）</p>
                  <div className="pt-2">
                    <DecisionSlider value={sliderValue} onChange={(v) => { setSliderValue(v); setHasInteracted(true); }} hasInteracted={hasInteracted} />
                  </div>
                </div>

                {/* ── Common Analysis Section ───────────────────────────────────── */}
                <div className="space-y-4">
                  <button
                    onClick={() => setShowPayoffTable(!showPayoffTable)}
                    className="w-full py-3 bg-gray-50 border border-gray-200 text-gray-700 font-bold rounded-xl shadow-sm hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>{showPayoffTable ? '隱藏' : '顯示'}點數計算方法</span>
                    <span className="text-gray-400 text-xs">{showPayoffTable ? '▲' : '▼'}</span>
                  </button>
                  {showPayoffTable && <PayoffMatrix userProb={sliderValue} compact={false} />}
                </div>
              </div>
            ) : null}

            <button
              onClick={!isDecisionPhase && allRevealed ? () => { setIsDecisionPhase(true); setHasInteracted(false); } : handleNext}
              disabled={!allRevealed || (isDecisionPhase && !hasInteracted)}
              className={`w-full py-4 text-lg font-bold rounded-xl shadow-xl transition-all transform ${!allRevealed || (isDecisionPhase && !hasInteracted)
                ? 'bg-gray-300 text-gray-400 cursor-not-allowed shadow-none'
                : 'bg-gray-900 text-white hover:bg-black hover:-translate-y-1 active:translate-y-0 animate-glow-indigo'
                }`}
            >
              {!allRevealed
                ? '繼續'
                : !isDecisionPhase
                  ? '開始決策'
                  : !hasInteracted
                    ? '請拉動上方滑桿做出決定'
                    : scenarioIdx === scenarios.length - 1 ? '確認並送出' : '確認並前往下一題'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyView;