import React, { useState, useMemo, useEffect } from 'react';
import { ExperimentSetup } from '../types';
import { AGENTS, COLORS } from '../constants';
import { AgentId } from '../types';
import NetworkGraph from './NetworkGraph';
import { AGENT_IDS, generateTrianglePositions, PayoffMatrix, DecisionSlider } from './SurveyShared';

export interface SurveyIntroProps {
  setup: ExperimentSetup;
  currentStep?: number;
  onNavigateIntro?: (step: number) => void;
  onFinish: () => void;
}

const SurveyIntro: React.FC<SurveyIntroProps> = ({ setup, currentStep = 0, onNavigateIntro, onFinish }) => {
  const [introStep, setIntroStep] = useState(currentStep);
  const [introEdgeRevealed, setIntroEdgeRevealed] = useState(false);
  const [introSliderValue, setIntroSliderValue] = useState(50);
  const [introSliderInteracted, setIntroSliderInteracted] = useState(false);

  const [introGraphRevealed, setIntroGraphRevealed] = useState<Set<string>>(new Set());
  const [comprehensionAnswer, setComprehensionAnswer] = useState<string>('');

  // Sync introStep with URL param
  useEffect(() => {
    setIntroStep(currentStep);
  }, [currentStep]);

  const safeFocalNode = (AGENTS[setup.focalNode as AgentId] ? setup.focalNode : '1') as AgentId;
  const safeOpponentNode = (
    AGENTS[setup.opponentNode as AgentId] && setup.opponentNode !== safeFocalNode
      ? setup.opponentNode
      : (safeFocalNode === '1' ? '2' : '1')
  ) as AgentId;

  const agentMe = AGENTS[safeFocalNode];
  const agentOpponent = AGENTS[safeOpponentNode];


  const networkDemoSetup = useMemo(() => {
    const others = AGENT_IDS.filter(id => id !== safeFocalNode && id !== safeOpponentNode);
    return {
      ...setup,
      focalNode: safeFocalNode,
      opponentNode: safeOpponentNode,
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
    edgeStates: networkDemoSetup.activeEdgeIds.reduce((acc, id) => ({
      ...acc,
      [id]: Math.random() < 0.5 ? 0 : 1
    }), {} as Record<string, 0 | 1>),
  }), [networkDemoSetup]);

  const introNodePositions = useMemo(() => generateTrianglePositions(safeFocalNode, false), [safeFocalNode]);

  const meAccent = agentMe.group === 'A' ? 'blue' : 'green';
  const opponentAccent = agentOpponent.group === 'A' ? 'blue' : 'green';
  const meTitleClass = meAccent === 'blue' ? 'text-blue-900' : 'text-green-900';
  const meGroupClass = meAccent === 'blue' ? 'text-blue-700' : 'text-green-700';
  const opponentBorderClass = opponentAccent === 'blue' ? 'border-blue-100' : 'border-green-100';
  const opponentTitleClass = opponentAccent === 'blue' ? 'text-blue-900' : 'text-green-900';
  const opponentGroupClass = opponentAccent === 'blue' ? 'text-blue-700' : 'text-green-700';

  const isNextDisabled = useMemo(() => {
    // Step 3 (Part 1): Must reveal the single demo edge
    if (introStep === 3) return !introEdgeRevealed;
    // Step 4 (Part 2): Must reveal all edges in the graph
    if (introStep === 4) return introGraphRevealed.size < networkDemoSetup.activeEdgeIds.length;
    // Step 5 (Part 3): Must interact with the slider
    if (introStep === 5) return !introSliderInteracted;
    // Step 6 (Comprehension Check): Must pick the correct answer
    if (introStep === 6) return comprehensionAnswer !== 'all-history-then-slider';
    return false;
  }, [introStep, introEdgeRevealed, introGraphRevealed, introSliderInteracted, comprehensionAnswer, networkDemoSetup]);



    // Helper to draw a single node exactly as it appears in the graph
    const InlineNode = ({ agent, role }: { agent: typeof agentMe, role: 'me' | 'opponent' | 'none' }) => {
      const clipPathId = `${React.useId().replace(/:/g, '')}-inline-clip-${role}`;
      const groupAColor = COLORS.kmt;
      const groupBColor = COLORS.dpp;
      const groupColor = agent.group === 'A' ? groupAColor : groupBColor;

      const r = 36; // Survey standard size
      let strokeColor = groupColor;
      let strokeWidth = 2;

      if (role === 'me') { strokeColor = COLORS.highlight; strokeWidth = 5; }
      else if (role === 'opponent') { strokeColor = COLORS.roleOpponent; strokeWidth = 5; }

      // Re-use avatar drawing logic if selected
      const avatarBody = (
        <g>
          <clipPath id={clipPathId}>
            <circle cx={0} cy={0} r={r} />
          </clipPath>
          <circle cx={0} cy={0} r={r} fill={groupColor} clipPath={`url(#${clipPathId})`} />
          <rect x={-r} y={9} width={r * 2} height={r} fill={agent.group === 'A' ? COLORS.avatarClothKmt : COLORS.avatarClothDpp} clipPath={`url(#${clipPathId})`} />
          <path d={`M -6 9 L -2 5 L 0 7 L 2 5 L 6 9 Z`} fill="white" clipPath={`url(#${clipPathId})`} />
          <rect x={-3} y={4} width={6} height={6} fill={COLORS.avatarSkin} clipPath={`url(#${clipPathId})`} />
          <circle cx={0} cy={-4} r={13} fill={COLORS.avatarSkin} clipPath={`url(#${clipPathId})`} />
          <circle cx={-13} cy={-3} r={2.5} fill={COLORS.avatarSkinShadow} clipPath={`url(#${clipPathId})`} />
          <circle cx={13} cy={-3} r={2.5} fill={COLORS.avatarSkinShadow} clipPath={`url(#${clipPathId})`} />
          {agent.group === 'A' ? (
            <path d={`M -13 -8 Q -8 -22 0 -21 Q 8 -22 13 -8 Q 6 -14 0 -16 Q -6 -14 -13 -8 Z`} fill={COLORS.avatarHairKmt} clipPath={`url(#${clipPathId})`} />
          ) : (
            <path d={`M -13 -8 Q -11 -23 -4 -22 Q 0 -25 4 -22 Q 11 -23 13 -8 Q 5 -15 0 -17 Q -5 -15 -13 -8 Z`} fill={COLORS.avatarHairDppIntro} clipPath={`url(#${clipPathId})`} />
          )}
          <circle cx={-4.5} cy={-4.5} r={2} fill={COLORS.avatarFeature} clipPath={`url(#${clipPathId})`} />
          <circle cx={4.5} cy={-4.5} r={2} fill={COLORS.avatarFeature} clipPath={`url(#${clipPathId})`} />
          <circle cx={-3.8} cy={-5.2} r={0.7} fill="white" clipPath={`url(#${clipPathId})`} />
          <circle cx={5.2} cy={-5.2} r={0.7} fill="white" clipPath={`url(#${clipPathId})`} />
          <path d={`M -3.5 -0.5 Q 0 2 3.5 -0.5`} stroke={COLORS.avatarMouth} strokeWidth="1.2" fill="none" clipPath={`url(#${clipPathId})`} />
          {agent.group === 'A' && (
            <g clipPath={`url(#${clipPathId})`}>
              <rect x={-8.5} y={-7.5} width={6} height={4.5} rx={1.5} fill="none" stroke={COLORS.avatarGlassesBlue} strokeWidth="0.85" />
              <rect x={2.5} y={-7.5} width={6} height={4.5} rx={1.5} fill="none" stroke={COLORS.avatarGlassesBlue} strokeWidth="0.85" />
              <line x1={-2.5} y1={-5.5} x2={2.5} y2={-5.5} stroke={COLORS.avatarGlassesBlue} strokeWidth="0.85" />
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
            <circle r={glowR} fill="none" stroke={role === 'me' ? COLORS.highlight : role === 'opponent' ? COLORS.roleOpponent : 'transparent'} strokeWidth="4" strokeOpacity={role === 'none' ? 0 : 0.6}>
              <animate attributeName="stroke-opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" />
              <animate attributeName="r" values={`${glowR};${glowR + 4};${glowR}`} dur="2s" repeatCount="indefinite" />
            </circle>

            {avatarBody}

            {role !== 'none' && (
              <g transform={`translate(0, ${rDraw})`}>
                <rect x={-45} y="-14" width={90} height="16" rx="8" fill="white" stroke={strokeColor} strokeWidth="2" opacity="0.95" />
                <text y="-2" textAnchor="middle" fontSize="10" className="font-black pointer-events-none">
                  <tspan fill={role === 'me' ? COLORS.highlight : COLORS.rolePartner} className="uppercase">
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
                <text textAnchor="middle" y="4" className="text-[14px] font-black fill-blue-600" style={{ filter: `drop-shadow(0px 1px 1px ${COLORS.blackShadow10})`, fontFamily: 'sans-serif' }}>?</text>
              </g>
            )}
          </g>
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
                    <div className="transform scale-90"><InlineNode agent={{ ...AGENTS['1'], label: 'A' }} role="none" /></div>
                    <span className="text-xl font-black text-blue-400">× 2</span>
                  </div>
                  <span className="text-xs font-bold text-blue-900 bg-blue-50 px-2 py-1 rounded mt-auto">Group A</span>
                </div>

                <div className="hidden sm:block w-px bg-gray-200 self-stretch mx-2"></div>

                {/* Model Group B */}
                <div className="flex-1 flex flex-col items-center p-2 bg-green-50/30 rounded-xl border border-green-100 min-w-[140px] max-w-[200px]">
                  <div className="flex justify-center items-center gap-2 mb-2 transform scale-90">
                    <div className="transform scale-90"><InlineNode agent={{ ...AGENTS['3'], label: 'B' }} role="none" /></div>
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
                  <p className={`text-center text-sm font-bold ${meTitleClass}`}>You</p>
                  <div className="flex flex-col items-center transform scale-100">
                    <InlineNode agent={agentMe} role="me" />
                    <span className={`font-black ${meGroupClass} text-lg mt-2 tracking-tight`}>
                      {agentMe.group === 'A' ? 'Group A' : 'Group B'}
                    </span>
                  </div>
                </div>

                {/* Partner Card */}
                <div className={`flex-1 flex flex-col items-center justify-center gap-4 p-4 rounded-2xl border ${opponentBorderClass} shadow-sm relative overflow-hidden min-w-[140px]`}>
                   <div className={`absolute top-0 left-0 w-full h-1.5`}></div>
                   <p className={`text-center text-sm font-bold ${opponentTitleClass}`}>Partner</p>
                   <div className="flex flex-col items-center transform scale-100">
                     <InlineNode agent={agentOpponent} role="opponent" />
                     <span className={`font-black ${opponentGroupClass} text-lg mt-2 tracking-tight`}>
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
                    hideDecisionEdge={true}
                  />
                </div>

                <div className="w-full max-w-lg md:max-w-sm flex-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 text-center md:text-left">History Description</p>
                  <div className="grid grid-cols-1 gap-3 text-xs max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {networkDemoSetup.activeEdgeIds.filter(edgeId => {
                      const [source, target] = edgeId.split('-');
                      return source === setup.focalNode || target === setup.focalNode || source === setup.opponentNode || target === setup.opponentNode;
                    }).map(edgeId => {
                      const [source, target] = edgeId.split('-');
                      const isGive = networkDemoScenario.edgeStates[edgeId] === 1;
                      const isYou = source === setup.focalNode;
                      
                      const getName = (id: string, agent: any) => {
                        if (id === setup.focalNode) return "You";
                        if (id === setup.opponentNode) return "Partner";

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
                    hideDecisionEdge={false}
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
        title: "Comprehension Check",
        content: (
          <div className="space-y-6 text-gray-600 leading-relaxed text-base animate-in fade-in slide-in-from-bottom-2 duration-500 w-full max-w-3xl mx-auto">
            <div className="bg-amber-50 border border-amber-200 p-6 md:p-8 rounded-3xl shadow-sm">
              <h3 className="text-2xl font-bold text-amber-900 text-center mb-3">Quick Check</h3>
              <p className="text-center text-amber-800 mb-8">
                Before you start, answer this one question to make sure the instructions are clear.
              </p>

              <div className="bg-white rounded-2xl p-5 border border-amber-100 shadow-sm space-y-4">
                <p className="font-bold text-gray-900">
                  In each scenario, what do you do first?
                </p>

                <div className="space-y-3">
                  <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${comprehensionAnswer === 'move-slider-first' ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                    <input
                      type="radio"
                      name="comprehension-check"
                      value="move-slider-first"
                      checked={comprehensionAnswer === 'move-slider-first'}
                      onChange={(e) => setComprehensionAnswer(e.target.value)}
                      className="mt-1"
                    />
                    <span className="text-sm text-gray-700">Move the decision slider first, then reveal history if needed.</span>
                  </label>

                  <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${comprehensionAnswer === 'all-history-then-slider' ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                    <input
                      type="radio"
                      name="comprehension-check"
                      value="all-history-then-slider"
                      checked={comprehensionAnswer === 'all-history-then-slider'}
                      onChange={(e) => setComprehensionAnswer(e.target.value)}
                      className="mt-1"
                    />
                    <span className="text-sm text-gray-700">Reveal all history edges first, then enter decision phase and move the slider.</span>
                  </label>

                  <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${comprehensionAnswer === 'skip-history-random' ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                    <input
                      type="radio"
                      name="comprehension-check"
                      value="skip-history-random"
                      checked={comprehensionAnswer === 'skip-history-random'}
                      onChange={(e) => setComprehensionAnswer(e.target.value)}
                      className="mt-1"
                    />
                    <span className="text-sm text-gray-700">Skip history and make a random choice for faster completion.</span>
                  </label>
                </div>

                {comprehensionAnswer && comprehensionAnswer !== 'all-history-then-slider' && (
                  <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    Please review the onboarding steps and choose the option that matches the instructions.
                  </p>
                )}

                {comprehensionAnswer === 'all-history-then-slider' && (
                  <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    Correct. You are ready to continue.
                  </p>
                )}
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
              There are <strong className="text-indigo-600 text-2xl bg-indigo-50 px-3 py-1 rounded-xl shadow-sm mx-1">{Math.pow(2, setup.activeEdgeIds.length)}</strong> unique scenarios in total.
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
                  onClick={() => {
                    setIntroStep(prev => prev - 1);
                    onNavigateIntro?.(introStep - 1);
                  }}
                  className="flex-1 py-4 text-base font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors"
                >
                  Back
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
                   {isNextDisabled ? 'Interact to Continue' : 'Next \u2192'}
                </button>
              ) : (
                <button
                  onClick={() => onFinish()}
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

};

export default SurveyIntro;
