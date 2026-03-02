import React, { useState } from 'react';
import { AGENTS, ALL_EDGES, COLORS } from '../constants';
import { AgentId, ExperimentSetup, Scenario } from '../types';

interface NetworkGraphProps {
  mode: 'admin' | 'survey';
  setup: ExperimentSetup;
  scenario?: Scenario;
  onEdgeClick?: (edgeId: string) => void;
  className?: string;
  /** Optional override for node positions (randomized layout) */
  positionOverrides?: Record<AgentId, { x: number; y: number }>;
  /** 'color' = circles only; 'named' = show semantic group name badges */
  groupLabel?: 'color' | 'named';
  /** Custom group names shown when groupLabel='named' */
  groupNames?: { A: string; B: string };
  /** Node visual style: circle (default), shape (hexagon/diamond), avatar (SVG face) */
  nodeIdentity?: 'circle' | 'shape' | 'avatar';
  /** How to indicate focal/opponent players: badge (large label), glow (pulsing aura + badge) */
  roleIdentity?: 'badge' | 'glow';
  /** The probability (0-100) of cooperating with the opponent */
  decision?: number;
  /** Callback for when the decision value is changed via interaction */
  onDecisionChange?: (value: number) => void;
}

/** Flat-top hexagon polygon points for radius r */
const hexPoints = (r: number): string =>
  Array.from({ length: 6 }, (_, i) => {
    const a = (i * 60 - 30) * Math.PI / 180;
    return `${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');

/** Diamond (rotated square) polygon points for radius r */
const diamondPoints = (r: number): string =>
  `0,${-r} ${r},0 0,${r} ${-r},0`;

const NetworkGraph: React.FC<NetworkGraphProps> = ({
  mode,
  setup,
  scenario,
  onEdgeClick,
  className = '',
  positionOverrides,
  groupLabel = 'color',
  groupNames = { A: 'KMT', B: 'DPP' },
  nodeIdentity = 'circle',
  roleIdentity = 'badge',
  decision = 50,
  onDecisionChange,
}) => {
  const [hoveredNode, setHoveredNode] = useState<AgentId | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHoveringDecision, setIsHoveringDecision] = useState(false);
  const [dragDirection, setDragDirection] = useState<'plus' | 'minus' | 'idle'>('idle');
  const [localDecision, setLocalDecision] = useState<number | null>(null);
  const svgRef = React.useRef<SVGSVGElement>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!onDecisionChange) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    setIsDragging(true);
    setLocalDecision(decision);
    handlePointerMove(e);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !onDecisionChange || !svgRef.current) return;

    const startNode = setup.decisionMaker;
    const endNode = setup.opponent;
    if (!startNode || !endNode) return;

    const start = positions[startNode];
    const end = positions[endNode];

    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const loc = pt.matrixTransform(svg.getScreenCTM()?.inverse());

    // Better Scrubbing logic: 
    // We calculate the projection of the pointer onto the line between start and end nodes.
    // This makes the scrubbing feel natural along the axis of the edge.
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const d2 = dx * dx + dy * dy;

    if (d2 === 0) return;

    // t is the projection factor on the infinite line
    let t = ((loc.x - start.x) * dx + (loc.y - start.y) * dy) / d2;
    // Clamp to 0-1
    t = Math.max(0, Math.min(1, t));

    const newDecision = Math.round(t * 100);

    setLocalDecision(newDecision);
    if (onDecisionChange && newDecision !== decision) {
      if (newDecision > decision) setDragDirection('plus');
      else if (newDecision < decision) setDragDirection('minus');
      onDecisionChange(newDecision);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    setLocalDecision(null);
    setDragDirection('idle');
  };

  const defaultPositions: Record<AgentId, { x: number; y: number }> = {
    HA: { x: 100, y: 100 },
    RA: { x: 300, y: 100 },
    HB: { x: 100, y: 300 },
    RB: { x: 300, y: 300 },
  };
  const positions: Record<AgentId, { x: number; y: number }> = positionOverrides
    ? { ...defaultPositions, ...positionOverrides }
    : defaultPositions;

  const getEdgeColor = (edgeId: string) => {
    if (mode === 'admin') {
      return setup.activeEdgeIds.includes(edgeId) ? COLORS.highlight : '#e5e7eb';
    }
    if (setup.activeEdgeIds.includes(edgeId) && scenario) {
      return scenario.edgeStates[edgeId] === 1 ? COLORS.coop : COLORS.defect;
    }
    return 'transparent';
  };

  const getEdgeOpacity = (edgeId: string) => {
    if (mode === 'admin') return 1;
    return setup.activeEdgeIds.includes(edgeId) ? 1 : 0;
  };

  // Helper to calculate arrow points for a Quadratic Bezier
  const getManualArrowPoints = (start: { x: number; y: number }, control: { x: number; y: number }, end: { x: number; y: number }, r: number) => {
    // For a quadratic bezier B(t), the derivative is B'(t) = 2(1-t)(P1-P0) + 2t(P2-P1)
    // At t=1 (the end), the tangent vector is 2(P2-P1), which is simply the direction from control to end.
    const dx = end.x - control.x;
    const dy = end.y - control.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / dist; // unit tangent x
    const uy = dy / dist; // unit tangent y

    // The tip should be exactly at the node perimeter
    // end - unitT * r
    const tipX = end.x - ux * r;
    const tipY = end.y - uy * r;

    // Arrow dimensions
    const headLen = 12;
    const headWidth = 10;

    // Normal vector for width
    const nx = -uy;
    const ny = ux;

    const p1 = `${tipX},${tipY}`;
    const p2 = `${tipX - ux * headLen + nx * (headWidth / 2)},${tipY - uy * headLen + ny * (headWidth / 2)}`;
    const p3 = `${tipX - ux * headLen - nx * (headWidth / 2)},${tipY - uy * headLen - ny * (headWidth / 2)}`;

    return `${p1} ${p2} ${p3}`;
  };

  const RADIUS = mode === 'survey' ? 28 : 24; // Larger nodes in survey/mobile mode

  // Determine group colors based on mode
  const isNamed = groupLabel === 'named';
  const groupAColor = isNamed ? COLORS.kmt : COLORS.groupA;
  const groupBColor = isNamed ? COLORS.dpp : COLORS.groupB;

  return (
    <svg
      ref={svgRef}
      className={`w-full h-full max-w-full lg:max-w-[440px] mx-auto ${className} touch-none select-none overflow-visible`}
      viewBox="-20 -40 440 480"
      preserveAspectRatio="xMidYMid meet"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <defs>
        {/* Glow filter for focal player */}
        <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        <filter id="soft-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Clip paths for avatar mode — positioned at actual node coordinates */}
        {nodeIdentity === 'avatar' && Object.values(AGENTS).map(agent => (
          <clipPath key={`aclip-${agent.id}`} id={`aclip-${agent.id}`}>
            <circle cx={positions[agent.id].x} cy={positions[agent.id].y} r={RADIUS} />
          </clipPath>
        ))}
      </defs>

      {/* ── Edges ─────────────────────────────────────────────────────── */}
      {ALL_EDGES.map(edge => {
        const start = positions[edge.source];
        const end = positions[edge.target];
        const isActive = setup.activeEdgeIds.includes(edge.id);
        const color = getEdgeColor(edge.id);
        const opacity = getEdgeOpacity(edge.id);

        const mx = (start.x + end.x) / 2;
        const my = (start.y + end.y) / 2;
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const offset = 40;
        const cx = mx - (dy / dist) * offset;
        const cy = my + (dx / dist) * offset;

        const pathData = `M ${start.x} ${start.y} Q ${cx} ${cy} ${end.x} ${end.y}`;
        const t = 0.5;
        const midX = (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * cx + t * t * end.x;
        const midY = (1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * cy + t * t * end.y;

        // Bubble implementation
        let showBubble = false;
        let bubbleLabel = '';
        let bubbleColor = 'transparent';
        if (isActive && mode === 'survey' && scenario) {
          const state = scenario.edgeStates[edge.id];
          const config = setup.edgeConfigs[edge.id];
          showBubble = true;
          bubbleLabel = state === 1 ? 'COOP' : 'DEFECT';
          bubbleColor = state === 1 ? COLORS.coop : COLORS.defect;
        }

        return (
          <g
            key={edge.id}
            onClick={() => mode === 'admin' && onEdgeClick?.(edge.id)}
            className={`${mode === 'admin' ? 'cursor-pointer hover:opacity-80' : ''} transition-all duration-300`}
            style={{ opacity }}
          >
            <path d={pathData} stroke="transparent" strokeWidth="20" fill="none" />
            <path d={pathData} stroke={color} strokeWidth={isActive ? 3 : 2} fill="none" />
            <polygon points={getManualArrowPoints(start, { x: cx, y: cy }, end, RADIUS)} fill={color} />
            {showBubble && (
              <g transform={`translate(${midX}, ${midY})`}>
                <rect
                  x="-22"
                  y="-8"
                  width="44"
                  height="16"
                  rx="8"
                  fill={bubbleColor}
                  stroke="white"
                  strokeWidth="1.5"
                />
                <text
                  textAnchor="middle"
                  y="4"
                  className="text-[8px] font-black fill-white uppercase tracking-tighter"
                >
                  {bubbleLabel}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* ── Decision Edge (Live) ────────────────────────────────────────── */}
      {mode === 'survey' && setup.decisionMaker && setup.opponent && (() => {
        const startNode = setup.decisionMaker;
        const endNode = setup.opponent;
        const start = positions[startNode];
        const end = positions[endNode];
        if (!start || !end) return null;

        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Match decision edge color to the subject node (YOU)
        const decisionColor = COLORS.highlight;

        // Simple straight-ish line with slight curve for the decision
        const mx = (start.x + end.x) / 2;
        const my = (start.y + end.y) / 2;
        const ox = -(dy / dist) * 15;
        const oy = (dx / dist) * 15;
        const ctrlX = mx + ox;
        const ctrlY = my + oy;

        const path = `M ${start.x} ${start.y} Q ${ctrlX} ${ctrlY} ${end.x} ${end.y}`;

        // Fixed position at the midpoint (t = 0.5)
        const tMid = 0.5;
        const bx = Math.pow(1 - tMid, 2) * start.x + 2 * (1 - tMid) * tMid * ctrlX + Math.pow(tMid, 2) * end.x;
        const by = Math.pow(1 - tMid, 2) * start.y + 2 * (1 - tMid) * tMid * ctrlY + Math.pow(tMid, 2) * end.y;

        // Use localDecision for visual rendering during drag to ensure smoothness
        const visualDecision = isDragging && localDecision !== null ? localDecision : decision;

        // Directional prompts logic
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        // Animation speed based on decision: 1s (0%) to 0.4s (100%)
        const dashSpeed = 1 - (decision / 100) * 0.6;

        return (
          <g style={{ transition: 'all 0.3s ease' }}>
            <path
              d={path}
              fill="none"
              stroke={decisionColor}
              strokeWidth="4"
              strokeDasharray="8 4"
              className="animate-[dash_var(--dash-speed)_linear_infinite]"
              style={{
                transition: 'stroke 0.3s ease',
                // @ts-ignore
                '--dash-speed': `${dashSpeed}s`
              }}
            />
            <polygon points={getManualArrowPoints(start, { x: ctrlX, y: ctrlY }, end, RADIUS)} fill={decisionColor} style={{ transition: 'fill 0.3s ease' }} />

            <g
              transform={`translate(${bx}, ${by})`}
              style={{
                transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                cursor: onDecisionChange ? (isDragging ? 'grabbing' : 'grab') : 'default'
              }}
              onPointerDown={handlePointerDown}
              onMouseEnter={() => onDecisionChange && setIsHoveringDecision(true)}
              onMouseLeave={() => setIsHoveringDecision(false)}
            >
              {/* Directional pulsing arrows and labels - moved to the bubble for better focus */}
              {onDecisionChange && (
                <g>
                  {/* To Defect (-) */}
                  {(!isDragging || dragDirection === 'minus') && (
                    <g>
                      {!isDragging && (
                        <>
                          <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.5s" repeatCount="indefinite" />
                          <animate attributeName="transform" values="translate(0,0); translate(-4,0); translate(0,0)" dur="1.5s" repeatCount="indefinite" additive="sum" />
                        </>
                      )}
                      <path
                        d="M -30 0 L -24 -4 L -24 4 Z"
                        fill={decisionColor}
                      />
                      <text
                        x="-34"
                        y="0"
                        textAnchor="end"
                        dominantBaseline="central"
                        className="text-[12px] font-black fill-red-600"
                      >
                        -
                      </text>
                    </g>
                  )}
                  {/* To Cooperate (+) */}
                  {(!isDragging || dragDirection === 'plus') && (
                    <g>
                      {!isDragging && (
                        <>
                          <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.5s" repeatCount="indefinite" />
                          <animate attributeName="transform" values="translate(0,0); translate(4,0); translate(0,0)" dur="1.5s" repeatCount="indefinite" additive="sum" />
                        </>
                      )}
                      <path
                        d="M 30 0 L 24 -4 L 24 4 Z"
                        fill={decisionColor}
                      />
                      <text
                        x="34"
                        y="0"
                        textAnchor="start"
                        dominantBaseline="central"
                        className="text-[12px] font-black fill-green-600"
                      >
                        +
                      </text>
                    </g>
                  )}
                </g>
              )}

              {/* Pulsing Halo (when idle or hovering) */}
              {onDecisionChange && !isDragging && (
                <circle
                  r={isHoveringDecision ? 28 : 24}
                  fill="none"
                  stroke={decisionColor}
                  strokeWidth="2"
                  strokeOpacity="0.4"
                  style={{ transition: 'all 0.2s ease' }}
                >
                  <animate attributeName="r" values={isHoveringDecision ? '28;32;28' : '24;28;24'} dur="2s" repeatCount="indefinite" />
                  <animate attributeName="stroke-opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
                </circle>
              )}

              {/* Large transparent hit area for easier grabbing */}
              <circle r="35" fill="transparent" className="cursor-pointer" />

              <circle
                r={isDragging ? 22 : isHoveringDecision ? 20 : 18}
                fill="white"
                stroke={decisionColor}
                strokeWidth={isDragging ? 4 : isHoveringDecision ? 3.5 : 2.5}
                className="shadow-md"
                style={{ transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
              />
              <text textAnchor="middle" y="4" className={`${isDragging ? 'text-[12px]' : isHoveringDecision ? 'text-[11px]' : 'text-[10px]'} font-black fill-gray-900 pointer-events-none`}>
                {visualDecision}%
              </text>

              {/* "Your Decision" label with background for better contrast against dash lines */}
              <g transform={`translate(0, ${isDragging ? -30 : isHoveringDecision ? -27 : -24})`}>
                <rect
                  x="-35"
                  y="-7"
                  width="70"
                  height="12"
                  rx="4"
                  fill="white"
                  style={{ transition: 'all 0.2s ease' }}
                />
                <text
                  textAnchor="middle"
                  y="2"
                  className={`${isDragging ? 'text-[10px]' : 'text-[8px]'} font-black uppercase tracking-tighter pointer-events-none`}
                  style={{
                    fill: decisionColor,
                    transition: 'all 0.2s ease',
                    opacity: isDragging || isHoveringDecision ? 1 : 0.8
                  }}
                >
                  {isDragging ? 'Adjusting...' : 'Cooperate Probability'}
                </text>
              </g>
            </g>
            <style>{`
              @keyframes dash {
                to { stroke-dashoffset: -12; }
              }
            `}</style>
          </g>
        );
      })()}

      {/* ── Nodes ─────────────────────────────────────────────────────── */}
      {Object.values(AGENTS).map(agent => {
        const pos = positions[agent.id];
        const isDecisionMaker = agent.id === setup.decisionMaker;
        const isOpponent = agent.id === setup.opponent;
        const groupColor = agent.group === 'A' ? groupAColor : groupBColor;
        const r = RADIUS;

        let strokeColor = nodeIdentity === 'avatar' ? groupColor : 'white';
        let strokeWidth = 2;

        if (mode === 'admin') {
          if (isDecisionMaker) { strokeColor = COLORS.highlight; strokeWidth = 4; }
          else if (isOpponent) { strokeColor = 'black'; strokeWidth = 4; }
        } else if (mode === 'survey') {
          if (roleIdentity === 'badge' || roleIdentity === 'glow') {
            if (isDecisionMaker) { strokeColor = COLORS.highlight; strokeWidth = 4; }
            else if (isOpponent) { strokeColor = '#374151'; strokeWidth = 4; }
          } else if (roleIdentity === 'circle') {
            if (isDecisionMaker) { strokeColor = '#fbbf24'; strokeWidth = 5; }
            else if (isOpponent) { strokeColor = '#374151'; strokeWidth = 5; }
          }
        }

        // ── Avatar body ──────────────────────────
        const isGroupA = agent.group === 'A';
        const clip = `url(#aclip-${agent.id})`;
        const ax = pos.x;
        const ay = pos.y;

        const avatarBody = nodeIdentity === 'avatar' && (
          <g>
            <circle cx={ax} cy={ay} r={r} fill={groupColor} clipPath={clip} />
            <rect x={ax - r} y={ay + 9} width={r * 2} height={r} fill={isGroupA ? '#00004d' : '#0a3a10'} clipPath={clip} />
            <path d={`M ${ax - 6} ${ay + 9} L ${ax - 2} ${ay + 5} L ${ax} ${ay + 7} L ${ax + 2} ${ay + 5} L ${ax + 6} ${ay + 9} Z`} fill="white" clipPath={clip} />
            <rect x={ax - 3} y={ay + 4} width={6} height={6} fill="#FDDCB5" clipPath={clip} />
            <circle cx={ax} cy={ay - 4} r={13} fill="#FDDCB5" clipPath={clip} />
            <circle cx={ax - 13} cy={ay - 3} r={2.5} fill="#F0C090" clipPath={clip} />
            <circle cx={ax + 13} cy={ay - 3} r={2.5} fill="#F0C090" clipPath={clip} />
            {isGroupA ? (
              <path d={`M ${ax - 13} ${ay - 8} Q ${ax - 8} ${ay - 22} ${ax} ${ay - 21} Q ${ax + 8} ${ay - 22} ${ax + 13} ${ay - 8} Q ${ax + 6} ${ay - 14} ${ax} ${ay - 16} Q ${ax - 6} ${ay - 14} ${ax - 13} ${ay - 8} Z`} fill="#1a1a6e" clipPath={clip} />
            ) : (
              <path d={`M ${ax - 13} ${ay - 8} Q ${ax - 11} ${ay - 23} ${ax - 4} ${ay - 22} Q ${ax} ${ay - 25} ${ax + 4} ${ay - 22} Q ${ax + 11} ${ay - 23} ${ax + 13} ${ay - 8} Q ${ax + 5} ${ay - 15} ${ax} ${ay - 17} Q ${ax - 5} ${ay - 15} ${ax - 13} ${ay - 8} Z`} fill="#0d2a0d" clipPath={clip} />
            )}
            <circle cx={ax - 4.5} cy={ay - 4.5} r={2} fill="#1a1a1a" clipPath={clip} />
            <circle cx={ax + 4.5} cy={ay - 4.5} r={2} fill="#1a1a1a" clipPath={clip} />
            <circle cx={ax - 3.8} cy={ay - 5.2} r={0.7} fill="white" clipPath={clip} />
            <circle cx={ax + 5.2} cy={ay - 5.2} r={0.7} fill="white" clipPath={clip} />
            <path d={`M ${ax - 3.5} ${ay - 0.5} Q ${ax} ${ay + 2} ${ax + 3.5} ${ay - 0.5}`} stroke="#aa6655" strokeWidth="1.2" fill="none" clipPath={clip} />
            {isGroupA && (
              <g clipPath={clip}>
                <rect x={ax - 8.5} y={ay - 7.5} width={6} height={4.5} rx={1.5} fill="none" stroke="#5566aa" strokeWidth="0.85" />
                <rect x={ax + 2.5} y={ay - 7.5} width={6} height={4.5} rx={1.5} fill="none" stroke="#5566aa" strokeWidth="0.85" />
                <line x1={ax - 2.5} y1={ay - 5.5} x2={ax + 2.5} y2={ay - 5.5} stroke="#5566aa" strokeWidth="0.85" />
              </g>
            )}
            <circle cx={ax} cy={ay} r={r} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
          </g>
        );

        return (
          <g
            key={agent.id}
            transform={`translate(${pos.x}, ${pos.y})`}
            className="transition-all duration-300"
            onMouseEnter={() => groupLabel === 'named' && setHoveredNode(agent.id)}
            onMouseLeave={() => setHoveredNode(null)}
          >
            {/* Glow Aura */}
            {roleIdentity === 'glow' && isDecisionMaker && mode === 'survey' && (
              <circle
                r={r + 4}
                fill="none"
                stroke={COLORS.highlight}
                strokeWidth="4"
                strokeOpacity="0.6"
                filter="url(#glow)"
              >
                <animate attributeName="stroke-opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" />
                <animate attributeName="r" values={`${r + 4};${r + 8};${r + 4}`} dur="2s" repeatCount="indefinite" />
              </circle>
            )}

            {roleIdentity === 'glow' && isOpponent && mode === 'survey' && (
              <circle
                r={r + 4}
                fill="none"
                stroke="#374151"
                strokeWidth="4"
                strokeOpacity="0.6"
                filter="url(#glow)"
              >
                <animate attributeName="stroke-opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" />
                <animate attributeName="r" values={`${r + 4};${r + 8};${r + 4}`} dur="2s" repeatCount="indefinite" />
              </circle>
            )}

            {/* ── Node Body ── */}
            {nodeIdentity === 'avatar' ? (
              <g transform={`translate(${-pos.x}, ${-pos.y})`}>
                {avatarBody}
              </g>
            ) : nodeIdentity === 'shape' ? (
              agent.group === 'A' ? (
                <polygon points={hexPoints(r)} fill={groupColor} stroke={strokeColor} strokeWidth={strokeWidth} filter={roleIdentity === 'glow' && (isDecisionMaker || isOpponent) ? 'url(#soft-glow)' : ''} />
              ) : (
                <polygon points={diamondPoints(r)} fill={groupColor} stroke={strokeColor} strokeWidth={strokeWidth} filter={roleIdentity === 'glow' && (isDecisionMaker || isOpponent) ? 'url(#soft-glow)' : ''} />
              )
            ) : (
              <circle r={r} fill={groupColor} stroke={strokeColor} strokeWidth={strokeWidth} className="shadow-xl" filter={roleIdentity === 'glow' && (isDecisionMaker || isOpponent) ? 'url(#soft-glow)' : ''} />
            )}

            {/* ── Center Label ── */}
            {nodeIdentity !== 'avatar' && (
              <text dy="5" textAnchor="middle" className="text-xs font-bold fill-white pointer-events-none uppercase" style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.4)' }}>
                {agent.label}
              </text>
            )}

            {/* ── Avatar mode: ID label below node ── */}
            {nodeIdentity === 'avatar' && (
              <text y={r + 13} textAnchor="middle" fontSize="9" fontWeight="700" fill="#555" className="pointer-events-none uppercase">
                {agent.label}
              </text>
            )}

            {/* ── YOU / OPPONENT indicator ── */}
            {isDecisionMaker && mode === 'survey' && (
              <g transform="translate(0, -38)">
                <rect x="-24" y="-10" width="48" height="20" rx={4} fill={COLORS.highlight} stroke="white" strokeWidth="2" />
                <text y="4" textAnchor="middle" className="text-[10px] font-bold fill-white uppercase tracking-wider">YOU</text>
                <path d="M -5 10 L 0 15 L 5 10 Z" fill={COLORS.highlight} />
              </g>
            )}

            {isOpponent && mode === 'survey' && (
              <g transform="translate(0, -38)">
                <rect x="-35" y="-10" width="70" height="20" rx={4} fill="#374151" stroke="white" strokeWidth="2" />
                <text y="4" textAnchor="middle" className="text-[10px] font-bold fill-white uppercase tracking-wider">Partner</text>
                <path d="M -5 10 L 0 15 L 5 10 Z" fill="#374151" />
              </g>
            )}

            {/* ── Named Group Badge ── */}
            {groupLabel === 'named' && (
              <g transform="translate(0, 34)">
                <rect x="-22" y="-9" width="44" height="18" rx="9" fill={groupColor} stroke="white" strokeWidth="1.5" opacity="0.92" />
                <text y="4" textAnchor="middle" fontSize="9" fontWeight="800" fill="white" className="pointer-events-none uppercase tracking-widest">
                  {agent.group === 'A' ? groupNames.A : groupNames.B}
                </text>
              </g>
            )}

            {/* ── Hover Tooltip ── */}
            {groupLabel === 'named' && hoveredNode === agent.id && (
              <foreignObject x="-60" y="-90" width="120" height="52" className="pointer-events-none overflow-visible">
                <div style={{ background: 'white', border: `2px solid ${groupColor}`, borderRadius: '10px', padding: '5px 8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: groupColor, whiteSpace: 'nowrap', lineHeight: 1.4 }}>
                  <div style={{ fontSize: '9px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Group</div>
                  <div>{agent.group === 'A' ? groupNames.A : groupNames.B}</div>
                </div>
                <svg style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)' }} width="12" height="6">
                  <polygon points="0,0 12,0 6,6" fill={groupColor} />
                </svg>
              </foreignObject>
            )}

            {/* ── Admin Labels ── */}
            {mode === 'admin' && isDecisionMaker && (
              <text y="45" textAnchor="middle" className="text-[10px] font-bold fill-amber-600 uppercase">SUBJECT</text>
            )}
            {mode === 'admin' && isOpponent && (
              <text y="45" textAnchor="middle" className="text-[10px] font-bold fill-gray-800 uppercase">OPPONENT</text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

export default NetworkGraph;