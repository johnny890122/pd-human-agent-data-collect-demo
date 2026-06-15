import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Session } from '../types';
import { AGENTS, COLORS } from '../constants';
import { AgentId } from '../types';
import NetworkGraph from './NetworkGraph';
import { AGENT_IDS, generateTrianglePositions, PayoffMatrix, DecisionSlider } from './SurveyShared';

export interface SurveyIntroProps {
  setup: Session;
  currentStep?: number;
  onNavigateIntro?: (step: number) => void;
  onFinish: () => void;
  mixedModeScenariosPerSession?: number | null;
}

const SurveyIntro: React.FC<SurveyIntroProps> = ({ setup, currentStep = 0, onNavigateIntro, onFinish, mixedModeScenariosPerSession }) => {
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('groupId');
  const mode = searchParams.get('mode');
  const isMixedModePreSession = groupId && mode === 'mixed' && !setup?.scenarios?.length;
  
  const [introStep, setIntroStep] = useState(currentStep);
  const [introEdgeRevealed, setIntroEdgeRevealed] = useState(false);
  const [introSliderValue, setIntroSliderValue] = useState(50);
  const [introSliderInteracted, setIntroSliderInteracted] = useState(false);

  const [introGraphRevealed, setIntroGraphRevealed] = useState<Set<string>>(new Set());
  const [comprehensionAnswers, setComprehensionAnswers] = useState({ q1: '', q2: '', q3: '', q4: '' });
  const [showRulesHint, setShowRulesHint] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState(false);

  // Sync introStep with URL param
  useEffect(() => {
    setIntroStep(currentStep);
  }, [currentStep]);

  const safeFocalNode = (AGENTS[setup.focalNode as AgentId] ? setup.focalNode : '1') as AgentId;
  const safeOpponentNode = (
    AGENTS[setup.opponentNode as AgentId] && setup.opponentNode !== safeFocalNode
      ? setup.opponentNode
      : (safeFocalNode === 'KMT1' ? 'KMT2' : 'KMT1')
  ) as AgentId;

  const agentMe = AGENTS[safeFocalNode];

  const networkDemoSetup = useMemo(() => {
    const others = AGENT_IDS.filter(id => id !== safeFocalNode && id !== safeOpponentNode);
    return {
      ...setup,
      focalNode: safeFocalNode as string,
      opponentNode: safeOpponentNode as string,
      activeEdgeIds: [
        `${safeFocalNode}-${safeOpponentNode}`,
        `${safeOpponentNode}-${safeFocalNode}`,

        `${others[0]}-${others[1]}`,
        `${others[1]}-${others[0]}`,
      ]
    };
  }, [setup, safeFocalNode, safeOpponentNode]);

  const networkDemoScenario = useMemo(() => ({
    id: 0,
    edgeStates: networkDemoSetup.activeEdgeIds.reduce((acc, id, index) => {
      // Use a consistent pattern instead of random
      acc[id] = index % 2 === 0 ? 'not give' : 'give';
      return acc;
    }, {} as Record<string, 'not give' | 'give'>),
  }), [networkDemoSetup]);

  const introNodePositions = useMemo(() => generateTrianglePositions(safeFocalNode, false), [safeFocalNode]);

  const noEdgeSetup = useMemo(() => ({
    ...setup,
    focalNode: safeFocalNode as string,
    opponentNode: safeOpponentNode as string,
    activeEdgeIds: [],
  }), [setup, safeFocalNode, safeOpponentNode]);

  const introGroupPositions = useMemo<Record<AgentId, { x: number; y: number }>>(() => ({
    KMT1: { x: 110, y: 130 },
    KMT2: { x: 110, y: 310 },
    DPP3: { x: 330, y: 130 },
    DPP4: { x: 330, y: 310 },
  }), []);

  const isNextDisabled = useMemo(() => {
    // Step 3 (Part 1): Must reveal the single demo edge
    if (introStep === 3) return !introEdgeRevealed;
    // Step 4 (Part 2): Must reveal all edges in the graph
    if (introStep === 4) return introGraphRevealed.size < networkDemoSetup.activeEdgeIds.length;
    // Step 5 (Part 3): Must interact with the slider
    if (introStep === 5) return !introSliderInteracted;
    // Step 6 (Comprehension Check): Must submit correct answers
    if (introStep === 6) return !quizCorrect;
    return false;
  }, [introStep, introEdgeRevealed, introGraphRevealed, introSliderInteracted, quizCorrect, networkDemoSetup]);

    // Mini avatar component for history legend
    const MiniAvatar = ({ agent, size = 20 }: { agent: typeof agentMe, size?: number }) => {
      const clipPathId = `mini-avatar-${agent.id}`;
      const groupColor = agent.group === 'KMT' ? COLORS.kmt : COLORS.dpp;
      const r = size / 2;
      
      return (
        <svg width={size} height={size} viewBox={`${-r} ${-r} ${size} ${size}`} className="inline-block">
          <defs>
            <clipPath id={clipPathId}>
              <circle cx={0} cy={0} r={r} />
            </clipPath>
          </defs>
          <circle cx={0} cy={0} r={r} fill={groupColor} clipPath={`url(#${clipPathId})`} />
          <rect x={-r} y={r * 0.25} width={size} height={r} fill={agent.group === 'KMT' ? COLORS.avatarClothKmt : COLORS.avatarClothDpp} clipPath={`url(#${clipPathId})`} />
          <circle cx={0} cy={-r * 0.1} r={r * 0.36} fill={COLORS.avatarSkin} clipPath={`url(#${clipPathId})`} />
          {agent.group === 'KMT' && (
            <g clipPath={`url(#${clipPathId})`}>
              <rect x={-r * 0.3} y={-r * 0.25} width={r * 0.25} height={r * 0.2} rx={r * 0.05} fill="none" stroke={COLORS.avatarGlassesBlue} strokeWidth="0.5" />
              <rect x={r * 0.05} y={-r * 0.25} width={r * 0.25} height={r * 0.2} rx={r * 0.05} fill="none" stroke={COLORS.avatarGlassesBlue} strokeWidth="0.5" />
            </g>
          )}
          <circle cx={0} cy={0} r={r} fill="none" stroke={groupColor} strokeWidth="1.5" />
        </svg>
      );
    };

    const InteractiveInlineEdge = ({ isRevealed, onReveal }: { isRevealed: boolean, onReveal: () => void }) => {
      const COOP_COLOR = COLORS.coop; // green-600
      const UNREVEALED_COLOR = COLORS.neutral; // gray-400
      const BLUE_COLOR = COLORS.blue; // blue-500

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
                  給予
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
                <text textAnchor="middle" y="4" className="text-[14px] font-black fill-blue-600" style={{ filter: `drop-shadow(0px 1px 1px ${COLORS.blackShadow10})`, fontFamily: 'sans-serif' }}>?</text>
              </g>
            )}
          </g>
        </svg>
      );
    };

    const introSteps = [
      {
        title: "參與者的背景與角色",
        content: (
          <div className="space-y-4 text-gray-600 leading-relaxed text-base animate-in fade-in slide-in-from-bottom-2 duration-500 w-full max-w-4xl">
            <p className="text-center text-sm text-gray-500">
              <span className="font-bold text-gray-800">總共有四位參與者（包含您），來自於兩個團體。</span>
            </p>

            <p className="text-center text-sm text-gray-500">
              <span className="font-bold text-gray-800">四位參與者將會兩兩成對進行遊戲。</span>
            </p>

            <p className="text-center text-sm text-gray-500">
              <span className="font-bold text-gray-800">在接下來的實驗中，您會和其他三位參與者分別進行兩人之間的遊戲。</span>
            </p>

            <div className="h-[340px] w-full">
              <NetworkGraph
                mode="survey"
                setup={noEdgeSetup}
                positionOverrides={introGroupPositions}
                hideDecisionEdge={true}
              />
            </div>

          </div>
        )
      },
      {
        title: "遊戲點數",
        content: (
          <div className="space-y-4 text-gray-600 leading-relaxed text-sm animate-in fade-in slide-in-from-bottom-2 duration-500 w-full max-w-4xl">
            <div className="bg-white p-2 sm:p-4 md:p-6 rounded-2xl md:rounded-3xl border-none md:border border-gray-200 shadow-none md:shadow-sm flex flex-col items-center">
              <h3 className="text-lg md:text-xl font-bold text-gray-800 text-center mb-4 md:mb-6">點數計算方法</h3>
              <div className="w-full max-w-2xl transform scale-100 flex justify-center mb-2">
                <PayoffMatrix compact={false} />
              </div>
            </div>
          </div>
        )
      },
      {
        title: "互動紀錄",
        content: (
          <div className="space-y-6 text-gray-600 leading-relaxed text-base animate-in fade-in slide-in-from-bottom-2 duration-500 w-full max-w-4xl">
            <div className="bg-white p-3 sm:p-4 md:p-6 rounded-2xl md:rounded-3xl border-none md:border border-gray-200 shadow-none md:shadow-sm text-center">
              <p className="text-gray-600 mb-4 md:mb-8 max-w-lg mx-auto">
                這張圖展示的是四位參與者之間的<span className="font-bold text-gray-800">互動記錄</span>。
              </p>

              <div className="bg-gray-50/50 rounded-xl md:rounded-2xl p-2 sm:p-4 md:p-8 border-none md:border border-gray-100 flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-12">
                <div className="h-[350px] md:h-[400px] w-full max-w-lg flex-1">
                  <NetworkGraph
                    mode="survey"
                    setup={networkDemoSetup}
                    scenario={networkDemoScenario}
                    positionOverrides={introNodePositions}
                    decision={0}
                    revealedEdgeIds={new Set(networkDemoSetup.activeEdgeIds)}
                    hideDecisionEdge={true}
                  />
                </div>

                <div className="w-full max-w-lg md:max-w-sm flex-1">
                  <div className="grid grid-cols-1 gap-4 text-xs max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {/* Group 1: Your pair (You and Opponent) */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider px-2">您這對的互動</p>
                      {networkDemoSetup.activeEdgeIds
                        .filter(edgeId => {
                          const [source, target] = edgeId.split('-');
                          return (source === setup.focalNode || target === setup.focalNode) ||
                                 (source === setup.opponentNode || target === setup.opponentNode);
                        })
                        .map(edgeId => {
                          const [source, target] = edgeId.split('-');
                          const isGive = networkDemoScenario.edgeStates[edgeId] === 'give';
                          const isYou = source === setup.focalNode;
                          
                          const getName = (id: string) => {
                            if (id === setup.focalNode) return "您";
                            if (id === setup.opponentNode) return "搭檔";
                            return "";
                          };
                          
                          const sourceName = getName(source);
                          const targetName = getName(target);
                          
                          // Only render if both are in your pair
                          if (!sourceName || !targetName) return null;
                          
                          return (
                            <div key={edgeId} className="flex items-center justify-between bg-white-50 px-3 py-2 rounded-lg border border-white-200 shadow-sm">
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <MiniAvatar agent={AGENTS[source as AgentId]} size={18} />
                                  <span className={`font-bold ${isYou ? 'text-indigo-600' : 'text-white-700'}`}>{sourceName}</span>
                                </div>
                                <span className="text-white-300">➜</span>
                                <div className="flex items-center gap-1">
                                  <MiniAvatar agent={AGENTS[target as AgentId]} size={18} />
                                  <span className="text-white-600">{targetName}</span>
                                </div>
                              </div>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${isGive ? 'bg-neutral-700 text-white' : 'bg-gray-300 text-gray-700'}`}>
                                {isGive ? '給予' : '不給予'}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                    
                    {/* Group 2: Other pair */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider px-2">另一對參與者的互動</p>
                      {(() => {
                        // Find the other two participants (not focalNode or opponentNode)
                        const allParticipants = ['KMT1', 'KMT2', 'DPP3', 'DPP4'];
                        const otherParticipants = allParticipants.filter(
                          id => id !== setup.focalNode && id !== setup.opponentNode
                        );
                        
                        // Create simple numbering for the other pair: 參與者 1, 參與者 2
                        const participantNumbers: Record<string, number> = {};
                        otherParticipants.forEach((id, index) => {
                          participantNumbers[id] = index + 1;
                        });
                        
                        return networkDemoSetup.activeEdgeIds
                          .filter(edgeId => {
                            const [source, target] = edgeId.split('-');
                            return otherParticipants.includes(source) && otherParticipants.includes(target);
                          })
                          .map(edgeId => {
                            const [source, target] = edgeId.split('-');
                            const isGive = networkDemoScenario.edgeStates[edgeId] === 'give';
                            const sourceAgent = AGENTS[source as AgentId];
                            const targetAgent = AGENTS[target as AgentId];
                            
                            // Simple labeling: 參與者 1, 參與者 2
                            const getLabel = (id: string) => {
                              return `參與者 ${participantNumbers[id]}`;
                            };
                            
                            const sourceName = getLabel(source);
                            const targetName = getLabel(target);
                            
                            return (
                              <div key={edgeId} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1">
                                    <MiniAvatar agent={sourceAgent} size={18} />
                                    <span className="font-bold text-gray-700">{sourceName}</span>
                                  </div>
                                  <span className="text-gray-300">➜</span>
                                  <div className="flex items-center gap-1">
                                    <MiniAvatar agent={targetAgent} size={18} />
                                    <span className="text-gray-600">{targetName}</span>
                                  </div>
                                </div>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${isGive ? 'bg-neutral-700 text-white' : 'bg-gray-300 text-gray-700'}`}>
                                  {isGive ? '給予' : '不給予'}
                                </span>
                              </div>
                            );
                          });
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      },
      {
        title: "實驗介面提示",
        content: (
          <div className="space-y-6 text-gray-600 leading-relaxed text-sm w-full max-w-4xl h-full flex flex-col justify-center">
            <div className="bg-blue-50/50 md:bg-blue-50 border-none md:border border-blue-200 p-2 sm:p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-none md:shadow-sm text-center relative overflow-hidden flex flex-col items-center min-h-[520px]">
              <h3 className="font-bold text-blue-900 text-xl md:text-2xl mb-4">提示1</h3>
              <p className="text-blue-800 text-base mb-6">
                若要瞭解其他參與者之前的互動記錄，請點擊虛弧線上的「問號」。
              </p>

              <div className="bg-white/80 backdrop-blur rounded-2xl p-4 mb-2 shadow-inner border border-blue-100 w-full max-w-md flex flex-col items-center justify-center flex-1">
                <p className="text-xs text-blue-700 font-bold uppercase tracking-wider mb-2">現在請試試：</p>
                <InteractiveInlineEdge
                  isRevealed={introEdgeRevealed}
                  onReveal={() => setIntroEdgeRevealed(true)}
                />
              </div>
            </div>
          </div>
        )
      },
      {
        title: "實驗介面提示",
        content: (
          <div className="space-y-6 text-gray-600 leading-relaxed text-sm w-full max-w-4xl h-full flex flex-col justify-center">
            <div className="bg-blue-50/50 md:bg-blue-50 border-none md:border border-blue-200 p-2 sm:p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-none md:shadow-sm text-center relative overflow-hidden flex flex-col items-center min-h-[520px]">
              <h3 className="font-bold text-blue-900 text-xl md:text-2xl mb-4">提示2</h3>
              <p className="text-blue-800 text-base mb-6">
                請點擊問號以閱讀歷史紀錄
              </p>

              <div className="bg-white/80 backdrop-blur rounded-xl md:rounded-2xl p-1 sm:p-2 md:p-6 mb-2 shadow-sm md:shadow-inner border-none md:border border-blue-100 w-full h-full flex-1">
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
                  />
                </div>
              </div>


            </div>
          </div>
        )
      },
      {
        title: "實驗介面提示",
        content: (
          <div className="space-y-6 text-gray-600 leading-relaxed text-sm animate-in fade-in slide-in-from-bottom-2 duration-500 w-full max-w-4xl">
            <div className="bg-blue-50/50 md:bg-blue-50 border-none md:border border-blue-200 p-2 sm:p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-none md:shadow-sm text-center relative overflow-hidden min-h-[520px] flex flex-col items-center">
              <h3 className="font-bold text-blue-900 text-xl md:text-2xl mb-4">提示3</h3>
              <p className="text-blue-800 text-base mb-6">
                從 0 到 100，您有多少意願把點數給對方？
              </p>

              <div className="w-full max-w-2xl mb-6 space-y-3 px-0 md:px-4 text-left">
                <p className="text-gray-600 text-sm">
                  0 代表絕對不會給予，100 代表絕對會給。我們將根據您輸入的數字，透過電腦骰子幫您做決定。
                </p>
                <p className="text-gray-600 text-sm">
                  舉例：輸入 50 時，給或不給各有一半機率；輸入 90 時，有 90% 機率電腦幫您給對方點數。
                </p>
              </div>

              <div className="bg-white/80 md:bg-white/80 backdrop-blur rounded-xl md:rounded-2xl p-1 sm:p-4 md:p-6 mb-2 shadow-sm md:shadow-inner border-none md:border border-indigo-100 w-full flex-1 flex flex-col md:flex-row items-center gap-8 justify-center">
                <div className="h-[350px] md:h-[400px] w-full max-w-lg relative flex-1">
                  <NetworkGraph
                    mode="survey"
                    setup={networkDemoSetup}
                    scenario={networkDemoScenario}
                    positionOverrides={introNodePositions}
                    decision={introSliderValue}
                    revealedEdgeIds={new Set(networkDemoSetup.activeEdgeIds)}
                    hideDecisionEdge={false}
                  />
                </div>

                <div className="w-full max-w-sm flex-shrink-0 px-4 md:px-0 bg-white/50 rounded-xl p-6 border border-indigo-50">
                  <p className="text-center font-bold text-indigo-900 mb-6 uppercase tracking-wider text-xs">您的決定</p>
                  <DecisionSlider
                    value={introSliderValue}
                    onChange={(val) => { setIntroSliderValue(val); setIntroSliderInteracted(true); }}
                    hasInteracted={introSliderInteracted}
                  />
                </div>
              </div>
            </div>
          </div>
        )
      },
      {
        title: "理解測試",
        content: (
          <div className="space-y-6 text-gray-600 leading-relaxed text-base animate-in fade-in slide-in-from-bottom-2 duration-500 w-full max-w-3xl mx-auto">
            <div className="bg-amber-50/50 md:bg-amber-50 border-none md:border border-amber-200 p-2 sm:p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-none md:shadow-sm">
              <p className="text-center text-amber-800 mb-8">
                請填答下面的問題，確保您充分瞭解這個遊戲的規則。
              </p>

              <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-5 border-none md:border border-amber-100 shadow-none md:shadow-sm space-y-6">
                
                <div className="space-y-4">
                  {[
                    { key: 'q1' as const, text: '1. 若是您不給對方點數，對方也不給您，那麼您會拿到' },
                    { key: 'q2' as const, text: '2. 若是您給對方點數，對方不給您，那麼對方會拿到' },
                    { key: 'q3' as const, text: '3. 若是您不給對方點數，對方給您，那麼您最後會拿到' },
                    { key: 'q4' as const, text: '4. 若是您給對方點數，對方也給您，那麼對方最後會拿到' },
                  ].map(({ key, text }) => (
                    <p key={key} className="text-sm font-bold text-gray-800 leading-loose">
                      {text}{' '}
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="inline-block align-middle w-14 px-1 py-1 text-center border border-gray-300 rounded bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        value={comprehensionAnswers[key]}
                        disabled={showRulesHint || quizCorrect}
                        onChange={(e) => setComprehensionAnswers(prev => ({ ...prev, [key]: e.target.value.replace(/[^0-9]/g, '') }))}
                      />{' '}點
                    </p>
                  ))}
                </div>

                {!showRulesHint && !quizCorrect && (
                  <button
                    onClick={() => {
                      const { q1, q2, q3, q4 } = comprehensionAnswers;
                      const isCorrect = q1.trim() === '1' && q2.trim() === '3' && q3.trim() === '3' && q4.trim() === '2';
                      if (isCorrect) {
                        setQuizCorrect(true);
                      } else {
                        setShowRulesHint(true);
                      }
                    }}
                    disabled={!comprehensionAnswers.q1 || !comprehensionAnswers.q2 || !comprehensionAnswers.q3 || !comprehensionAnswers.q4}
                    className="mt-4 w-full py-2 px-4 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
                  >
                    提交
                  </button>
                )}

                {quizCorrect && (
                  <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mt-4">
                    正確。您已經準備好可以繼續了。
                  </p>
                )}

                {showRulesHint && (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      有部分答案不正確，請參考以下規則後重新作答。
                    </p>
                    <PayoffMatrix compact={true} />
                    <button
                      onClick={() => {
                        setShowRulesHint(false);
                        setComprehensionAnswers({ q1: '', q2: '', q3: '', q4: '' });
                      }}
                      className="w-full py-2 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg transition-colors"
                    >
                      重新作答
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      },
      {
        title: "點數兌換報酬說明",
        content: (
          <div className="space-y-6 text-gray-600 leading-relaxed text-base animate-in fade-in slide-in-from-bottom-2 duration-500 w-full max-w-3xl mx-auto">
            <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl md:rounded-3xl border-none md:border border-gray-200 shadow-none md:shadow-sm text-center">
              <p className="text-lg text-gray-600 mb-4">
                在實驗中，您將會參與數次的兩人遊戲。在所有遊戲結束後，電腦將隨機抽出其中的一次遊戲，根據您和對方在該遊戲中所做的決定所得到的點數，換算成現金報酬給您。
              </p>
              <div className="inline-block bg-green-50 border border-green-200 rounded-xl px-6 py-3 mt-4">
                <span className="text-xl font-bold text-green-700">1點 = 100元台幣</span>
              </div>
            </div>
          </div>
        )
      },
      {
        title: "準備開始",
        content: (
          <div className="space-y-8 text-gray-600 leading-relaxed text-base text-center animate-in fade-in slide-in-from-bottom-2 duration-500 py-8">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border-4 border-white ring-2 ring-green-50">
              <span className="text-5xl">🚀</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800">一切準備就緒！</h3>
            {!isMixedModePreSession && (
              <p className="text-lg">
                總共有 <strong className="text-indigo-600 text-2xl bg-indigo-50 px-3 py-1 rounded-xl shadow-sm mx-1">{setup.scenarioIds?.length || setup.scenarios?.length || Math.pow(2, setup.activeEdgeIds?.length || 0)}</strong> 個不同的情境。
              </p>
            )}
            {isMixedModePreSession && (
              <p className="text-lg">
                總共有 <strong className="text-indigo-600 text-2xl bg-indigo-50 px-3 py-1 rounded-xl shadow-sm mx-1">{mixedModeScenariosPerSession || '多個'}</strong> 個不同的情境。
              </p>
            )}
            <p className="text-gray-500 max-w-sm mx-auto p-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner">
              在做出每個決定之前，請花時間分析歷史紀錄。祝您好運！
            </p>
          </div>
        )
      }
    ];

    const currentIntro = introSteps[introStep];

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-0 md:p-4">
        <div className="max-w-2xl md:max-w-5xl w-full bg-white md:rounded-[2rem] shadow-none md:shadow-2xl p-4 sm:p-6 md:p-12 flex flex-col min-h-screen md:min-h-[600px] border-none md:border border-gray-100">

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
                  onClick={() => {
                    setIntroStep(prev => prev - 1);
                    onNavigateIntro?.(introStep - 1);
                  }}
                  className="flex-1 py-4 text-base font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors"
                >
                  上一步
                </button>
              ) : (
                <></>
              )}

              {introStep < introSteps.length - 1 ? (
                <button
                  onClick={() => {
                    setIntroStep(prev => prev + 1);
                    onNavigateIntro?.(introStep + 1);
                  }}
                  disabled={isNextDisabled}
                  className={`flex-[2] py-4 text-base font-bold rounded-2xl shadow-lg transition-all active:scale-95 ${isNextDisabled
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none transform-none'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                >
                   {isNextDisabled ? '繼續' : '下一步 \u2192'}
                </button>
              ) : (
                <button
                  onClick={() => onFinish()}
                  className="flex-[2] py-4 bg-green-600 text-white text-base font-black rounded-2xl shadow-xl hover:bg-green-700 transition-all active:scale-95 animate-pulse tracking-wide"
                >
                  開始實驗！
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    );

};

export default SurveyIntro;
