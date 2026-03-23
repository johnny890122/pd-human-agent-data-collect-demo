import React, { useState } from 'react';
import * as d3 from 'd3';
import { AGENTS, ALL_EDGES, COLORS } from '../constants';
import { AgentId, ExperimentSetup, Scenario } from '../types';

interface NetworkGraphProps {
  mode: 'admin' | 'survey';
  setup: ExperimentSetup;
  scenario?: Scenario;
  onEdgeClick?: (edgeId: string) => void;
  onNodeClick?: (agentId: AgentId) => void;
  className?: string;
  /** Optional override for node positions (randomized layout) */
  positionOverrides?: Record<AgentId, { x: number; y: number }>;
  /** 'color' = circles only; 'named' = show semantic group name badges */
  groupLabel?: 'color' | 'named';
  /** Custom group names shown when groupLabel='named' */
  groupNames?: { A: string; B: string };
  /** Node visual style: circle (default), shape (hexagon/diamond), avatar (SVG face) */
  nodeIdentity?: 'circle' | 'shape' | 'avatar';
  /** How to indicate focal/opponent players */
  roleIdentity?: 'badge' | 'glow';
  /** The probability (0-100) of cooperating with the opponent */
  decision?: number;
  /** Callback for when the decision value is changed via interaction */
  onDecisionChange?: (value: number) => void;
  /** Gradual reveal: set of edge IDs the user has already clicked to reveal */
  revealedEdgeIds?: Set<string>;
  /** Gradual reveal: called when user clicks an unrevealed edge */
  onEdgeReveal?: (edgeId: string) => void;
  /** If true, suppresses the decision edge rendering entirely */
  hideDecisionEdge?: boolean;
  /** Called when user finishes interacting with the decision slider/bubble */
  onInteraction?: () => void;
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

/** Quadratic Bezier B(t) helper */
const getBezierPoint = (t: number, p0: { x: number, y: number }, p1: { x: number, y: number }, p2: { x: number, y: number }) => ({
  x: (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x,
  y: (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y
});

const NetworkGraph: React.FC<NetworkGraphProps> = ({
  mode,
  setup,
  scenario,
  onEdgeClick,
  onNodeClick,
  className = '',
  positionOverrides,
  groupLabel = 'color',
  groupNames = { A: 'KMT', B: 'DPP' },
  nodeIdentity = 'circle',
  roleIdentity = 'badge',
  decision = 50,
  onDecisionChange,
  revealedEdgeIds,
  onEdgeReveal,
  hideDecisionEdge = false,
  onInteraction,
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

    const startNode = setup.focalNode;
    const endNode = setup.opponentNode;

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
    if (isDragging && onInteraction) onInteraction();
    setIsDragging(false);
    setLocalDecision(null);
    setDragDirection('idle');
  };

  const positions = React.useMemo(() => {
    const defaultPositions: Record<AgentId, { x: number; y: number }> = {
      HA: { x: 100, y: 100 },
      RA: { x: 300, y: 100 },
      HB: { x: 100, y: 300 },
      RB: { x: 300, y: 300 },
    };
    return positionOverrides
      ? { ...defaultPositions, ...positionOverrides }
      : defaultPositions;
  }, [positionOverrides]);

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

  const RADIUS = 42; // Larger nodes for better visibility

  // Determine group colors based on mode
  const isNamed = groupLabel === 'named';
  const groupAColor = isNamed ? COLORS.kmt : COLORS.groupA;
  const groupBColor = isNamed ? COLORS.dpp : COLORS.groupB;

  // Precompute uncollided control points for edges
  const edgeControlPoints = React.useMemo(() => {
    // 1. Define nodes for simulation (one for each possible edge, plus fixed nodes)
    const simNodes = ALL_EDGES.map(edge => {
      const start = positions[edge.source];
      const end = positions[edge.target];
      const mx = (start.x + end.x) / 2;
      const my = (start.y + end.y) / 2;
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;

      // Starting "Label center" position (midpoint of a default arc)
      // If control point offset is 45, curve midpoint offset is 22.5
      const offset = 22.5;
      const initLx = mx - (dy / dist) * offset;
      const initLy = my + (dx / dist) * offset;

      return {
        id: edge.id,
        isControl: true,
        x: initLx,
        y: initLy,
        initLx, initLy,
        mx, my, // store midpoint for back-calculation
        vx: 0, vy: 0,
      };
    });

    if (setup.focalNode && setup.opponentNode) {
      const start = positions[setup.focalNode];
      const end = positions[setup.opponentNode];
      if (start && end) {
        const mx = (start.x + end.x) / 2;
        const my = (start.y + end.y) / 2;
        simNodes.push({
          id: 'decision-edge',
          isControl: true,
          x: mx,
          y: my,
          initLx: mx,
          initLy: my,
          mx, my,
          vx: 0, vy: 0,
        });
      }
    }


    const fixedNodes = (Object.keys(positions) as AgentId[]).map(id => {
      const pos = positions[id];
      return {
        id,
        isControl: false,
        x: pos.x,
        y: pos.y,
        fx: pos.x,
        fy: pos.y,
        initLx: pos.x,
        initLy: pos.y,
      };
    });

    const allNodes = [...simNodes, ...fixedNodes] as any[];

    // 2. Setup simulation
    // - Force labels to stay relatively close to their default (initLx, initLy)
    // - Force them to repel each other heavily to avoid overlap
    const simulation = d3.forceSimulation(allNodes)
      .force("x", d3.forceX((d: any) => d.initLx).strength((d: any) => d.isControl ? 0.3 : 1))
      .force("y", d3.forceY((d: any) => d.initLy).strength((d: any) => d.isControl ? 0.3 : 1))
      .force("collide", d3.forceCollide((d: any) => d.isControl ? 35 : RADIUS + 25).iterations(3))
      .stop();

    // 3. Fast-forward the simulation to final steady state
    simulation.tick(300);

    // 4. Extract results
    const results: Record<string, { x: number, y: number }> = {};
    simNodes.forEach((node: any) => {
      // P1 = 2*Label - Midpoint
      results[node.id] = {
        x: 2 * node.x - node.mx,
        y: 2 * node.y - node.my
      };
    });

    return results;
  }, [positions, RADIUS]);

  return (
    <svg
      ref={svgRef}
      className={`w-full h-full max-w-full lg:max-w-[440px] mx-auto ${className} touch-none select-none overflow-visible`}
      viewBox="-20 -20 460 480"
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

        {/* ── Arrow Markers ──────────────────────────────────────────────── */}
        {['#e5e7eb', COLORS.highlight, COLORS.coop, COLORS.defect, '#9ca3af', 'transparent'].map((color, i) => (
          <marker
            key={`marker-${color.replace('#', '')}`}
            id={`arrow-${color.replace('#', '')}`}
            viewBox="0 -5 10 10"
            refX="0"
            refY="0"
            markerUnits="userSpaceOnUse"
            markerWidth="10"
            markerHeight="10"
            orient="auto"
          >
            <path d="M0,-5L10,0L0,5" fill={color} />
          </marker>
        ))}
      </defs>

      {/* ── Edges (Layer 1: Paths) ────────────────────────────────────── */}
      {ALL_EDGES.map(edge => {
        const start = positions[edge.source];
        const end = positions[edge.target];
        const isActive = setup.activeEdgeIds.includes(edge.id);
        const color = getEdgeColor(edge.id);
        const opacity = getEdgeOpacity(edge.id);

        const cp = edgeControlPoints[edge.id];
        const cx = cp.x;
        const cy = cp.y;

        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        const tStart = RADIUS / (dist * 1.15);
        const tEnd = 1 - (RADIUS + 12) / (dist * 1.15);

        const pStart = getBezierPoint(Math.max(0, tStart), start, { x: cx, y: cy }, end);
        const pEnd = getBezierPoint(Math.min(1, tEnd), start, { x: cx, y: cy }, end);

        const pathData = `M ${pStart.x} ${pStart.y} Q ${cx} ${cy} ${pEnd.x} ${pEnd.y}`;

        const isGradualMode = revealedEdgeIds !== undefined;
        const isRevealed = isGradualMode ? revealedEdgeIds!.has(edge.id) : true;
        const isUnrevealedActive = isActive && isGradualMode && !isRevealed;

        const edgeStroke = isUnrevealedActive ? '#9ca3af' : color;
        const arrowFill = isUnrevealedActive ? '#9ca3af' : color;

        return (
          <g
            key={`path-${edge.id}`}
            onClick={() => {
              if (mode === 'admin') {
                onEdgeClick?.(edge.id);
              } else if (isUnrevealedActive && onEdgeReveal) {
                onEdgeReveal(edge.id);
              }
            }}
            className={`${mode === 'admin'
              ? 'cursor-pointer hover:opacity-80'
              : isUnrevealedActive
                ? 'cursor-pointer'
                : ''
              } transition-all duration-300`}
            style={{ opacity }}
          >
            {/* Wide transparent hit area for easier clicking */}
            <path d={pathData} stroke="transparent" strokeWidth="20" fill="none" />
            <path
              d={pathData}
              stroke={edgeStroke}
              strokeWidth={isActive ? 3 : 2}
              strokeDasharray={isUnrevealedActive ? '6 3' : undefined}
              fill="none"
              markerEnd={opacity > 0 && arrowFill !== 'transparent' ? `url(#arrow-${arrowFill.replace('#', '')})` : undefined}
            />
          </g>
        );
      })}

      {/* ── Decision Edge (Layer 2: Path) ──────────────────────────────── */}
      {!hideDecisionEdge && mode === 'survey' && setup.focalNode && setup.opponentNode && (() => {
        const startNode = setup.focalNode;
        const endNode = setup.opponentNode;

        const start = positions[startNode];
        const end = positions[endNode];
        if (!start || !end) return null;

        const visualDecision = isDragging && localDecision !== null ? localDecision : decision;

        let decisionColor: string;
        let edgeOpacity = 1;

        if (visualDecision > 50) {
          decisionColor = COLORS.coop;
          edgeOpacity = 0.4 + (0.6 * (visualDecision - 50) / 50);
        } else if (visualDecision < 50) {
          decisionColor = COLORS.defect;
          edgeOpacity = 0.4 + (0.6 * (50 - visualDecision) / 50);
        } else {
          decisionColor = COLORS.highlight;
          edgeOpacity = 0.5;
        }

        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (!Number.isFinite(dist) || dist <= 1e-6) return null;

        const mx = (start.x + end.x) / 2;
        const my = (start.y + end.y) / 2;

        const cp = edgeControlPoints['decision-edge'];
        const ctrlX = cp ? cp.x : mx;
        const ctrlY = cp ? cp.y : my;

        const tStartDecision = RADIUS / (dist * 1.15);
        const tEndDecision = 1 - (RADIUS + 13) / (dist * 1.15);
        const pStartDecision = getBezierPoint(Math.max(0, tStartDecision), start, { x: ctrlX, y: ctrlY }, end);
        const pEndDecision = getBezierPoint(Math.min(1, tEndDecision), start, { x: ctrlX, y: ctrlY }, end);

        const path = `M ${pStartDecision.x} ${pStartDecision.y} Q ${ctrlX} ${ctrlY} ${pEndDecision.x} ${pEndDecision.y}`;

        const dashSpeed = 1 - (decision / 100) * 0.6;

        return (
          <g style={{ transition: 'all 0.3s ease' }}>
            <path
              d={path}
              fill="none"
              stroke={decisionColor}
              strokeWidth="4"
              strokeDasharray="8 4"
              strokeOpacity={edgeOpacity}
              className="animate-[dash_var(--dash-speed)_linear_infinite]"
              markerEnd={`url(#arrow-${decisionColor.replace('#', '')})`}
              style={{
                transition: 'stroke 0.3s ease, stroke-opacity 0.3s ease',
                // @ts-ignore
                '--dash-speed': `${dashSpeed}s`
              }}
            />
            <style>{`
              @keyframes dash {
                to { stroke-dashoffset: -12; }
              }
            `}</style>
          </g>
        );
      })()}

      {/* ── Edges (Layer 3: Bubbles) ──────────────────────────────────── */}
      {ALL_EDGES.map(edge => {
        const start = positions[edge.source];
        const end = positions[edge.target];
        const isActive = setup.activeEdgeIds.includes(edge.id);
        const opacity = getEdgeOpacity(edge.id);

        const cp = edgeControlPoints[edge.id];
        const cx = cp.x;
        const cy = cp.y;

        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        const tStart = RADIUS / (dist * 1.15);
        const tEnd = 1 - (RADIUS + 12) / (dist * 1.15);

        const tMid = (tStart + tEnd) / 2;
        const midPoint = getBezierPoint(tMid, start, { x: cx, y: cy }, end);
        const midX = midPoint.x;
        const midY = midPoint.y;

        const isGradualMode = revealedEdgeIds !== undefined;
        const isRevealed = isGradualMode ? revealedEdgeIds!.has(edge.id) : true;
        const isUnrevealedActive = isActive && isGradualMode && !isRevealed;

        let showBubble = false;
        let bubbleLabel = '';
        let bubbleColor = 'transparent';
        if (isActive && mode === 'survey' && scenario && isRevealed) {
          const state = scenario.edgeStates[edge.id];
          showBubble = true;
          bubbleLabel = state === 1 ? 'GIVE' : 'NOT GIVE';
          bubbleColor = state === 1 ? COLORS.coop : COLORS.defect;
        }

        if (!showBubble && !isUnrevealedActive) return null;

        return (
          <g
            key={`bubble-${edge.id}`}
            onClick={() => {
              if (mode === 'admin') {
                onEdgeClick?.(edge.id);
              } else if (isUnrevealedActive && onEdgeReveal) {
                onEdgeReveal(edge.id);
              }
            }}
            className={`${mode === 'admin'
              ? 'cursor-pointer hover:opacity-80'
              : isUnrevealedActive
                ? 'cursor-pointer'
                : ''
              } transition-all duration-300`}
            style={{ opacity }}
          >
            {/* Revealed: COOP/DEFECT bubble */}
            {showBubble && (
              <g transform={`translate(${midX}, ${midY})`}>
                <rect x="-30" y="-12" width="60" height="24" rx="12" fill={bubbleColor} stroke="white" strokeWidth="1.5" />
                <text textAnchor="middle" y="5" className="text-[12px] md:text-[10px] font-black fill-black uppercase tracking-tighter">
                  {bubbleLabel}
                </text>
              </g>
            )}

            {/* Unrevealed active edge: pulsing '?' prompt */}
            {isUnrevealedActive && (
              <g transform={`translate(${midX}, ${midY})`}>
                {/* Outer Glow */}
                <circle r="16" fill="#3b82f6" fillOpacity="0.2">
                  <animate attributeName="r" values="14;18;14" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="fill-opacity" values="0.2;0.4;0.2" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle r="12" fill="white" stroke="#3b82f6" strokeWidth="2" className="shadow-lg">
                  <animate attributeName="stroke-width" values="2;3;2" dur="1.4s" repeatCount="indefinite" />
                </circle>
                <text textAnchor="middle" y="4" className="text-[14px] md:text-[12px] font-black fill-blue-600" style={{ filter: 'drop-shadow(0px 1px 1px rgba(0,0,0,0.1))' }}>?</text>
              </g>
            )}
          </g>
        );
      })}

      {/* ── Decision Edge (Layer 4: Bubble) ────────────────────────────── */}
      {!hideDecisionEdge && mode === 'survey' && setup.focalNode && setup.opponentNode && (() => {
        const startNode = setup.focalNode;
        const endNode = setup.opponentNode;

        const start = positions[startNode];
        const end = positions[endNode];
        if (!start || !end) return null;

        const visualDecision = isDragging && localDecision !== null ? localDecision : decision;
        let decisionColor: string;
        let edgeOpacity = 1;

        if (visualDecision > 50) {
          decisionColor = COLORS.coop;
          edgeOpacity = 0.4 + (0.6 * (visualDecision - 50) / 50);
        } else if (visualDecision < 50) {
          decisionColor = COLORS.defect;
          edgeOpacity = 0.4 + (0.6 * (50 - visualDecision) / 50);
        } else {
          decisionColor = COLORS.highlight;
          edgeOpacity = 0.5;
        }

        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (!Number.isFinite(dist) || dist <= 1e-6) return null;

        const mx = (start.x + end.x) / 2;
        const my = (start.y + end.y) / 2;

        const cp = edgeControlPoints['decision-edge'];
        const ctrlX = cp ? cp.x : mx;
        const ctrlY = cp ? cp.y : my;

        const tStartDecision = RADIUS / (dist * 1.15);
        const tEndDecision = 1 - (RADIUS + 13) / (dist * 1.15);
        const tMidDecision = (tStartDecision + tEndDecision) / 2;
        const midPoint = getBezierPoint(tMidDecision, start, { x: ctrlX, y: ctrlY }, end);
        const bx = midPoint.x;
        const by = midPoint.y;

        return (
          <g style={{ transition: 'all 0.3s ease' }}>
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
              {/* Directional pulsing arrows */}
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
                      <path d="M -30 0 L -24 -4 L -24 4 Z" fill={decisionColor} />
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
                      <path d="M 30 0 L 24 -4 L 24 4 Z" fill={decisionColor} />
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
              <circle r="40" fill="transparent" className="cursor-pointer" />

              {/* Main Bubble - Matches standard edge style */}
              <rect
                x="-35"
                y="-12"
                width="70"
                height="24"
                rx="12"
                fill={decisionColor} // Use solid color
                fillOpacity={edgeOpacity}
                stroke="white"
                strokeOpacity={edgeOpacity}
                strokeWidth={isDragging ? 3 : 2}
                className="shadow-md"
                style={{ transition: 'fill 0.3s ease, stroke-width 0.2s ease, fill-opacity 0.3s ease, stroke-opacity 0.3s ease' }}
              />

              <text
                textAnchor="middle"
                y="5"
                className="text-[12px] md:text-[10px] font-black fill-black pointer-events-none uppercase tracking-tighter"
                style={{ transition: 'all 0.2s ease' }}
              >
                {visualDecision > 50 ? 'GIVE' : visualDecision < 50 ? 'NOT GIVE' : '?'}
              </text>
            </g>
          </g>
        );
      })()}

      {/* ── Nodes ─────────────────────────────────────────────────────── */}
      {Object.values(AGENTS).map(agent => {
        const pos = positions[agent.id];
        const isDecisionMaker = agent.id === setup.focalNode;
        const isOpponent = agent.id === setup.opponentNode;

        const groupColor = agent.group === 'A' ? groupAColor : groupBColor;
        const r = RADIUS;

        let strokeColor = nodeIdentity === 'avatar' ? groupColor : 'white';
        let strokeWidth = 2;

        if (roleIdentity === 'badge' || roleIdentity === 'glow') {
          if (isDecisionMaker) { strokeColor = COLORS.highlight; strokeWidth = 4; }
          else if (isOpponent) { strokeColor = '#374151'; strokeWidth = 4; }
        }

        // ── Avatar body ──────────────────────────
        const isGroupA = agent.group === 'A';
        const clip = `url(#aclip-${agent.id})`;
        const ax = pos.x;
        const ay = pos.y;

        // Derive darker accent colors for avatar based on groupColor
        const getDarkerColor = (color: string): string => {
          // Predefined dark variants for better avatar appearance
          if (color === COLORS.kmt) return '#1a1a6e';      // KMT dark blue
          if (color === COLORS.dpp) return '#0d5a1f';      // DPP darker green
          if (color === COLORS.groupA) return '#1e3a8a';   // Darker variant of bright blue
          if (color === COLORS.groupB) return '#7c2d12';   // Darker variant of red
          return '#1a1a1a'; // fallback
        };
        const getClothColor = (color: string): string => {
          if (color === COLORS.kmt) return '#00004d';
          if (color === COLORS.dpp) return '#0a3a10';
          if (color === COLORS.groupA) return '#001a4d';
          if (color === COLORS.groupB) return '#4c1010';
          return '#1a1a1a';
        };
        const getGlassesColor = (color: string): string => {
          if ([COLORS.kmt, COLORS.groupA].includes(color)) return '#5566aa';
          return '#8b6b47';
        };

        const avatarHairColor = getDarkerColor(groupColor);
        const avatarClothColor = getClothColor(groupColor);
        const avatarGlassesColor = getGlassesColor(groupColor);

        const avatarBody = nodeIdentity === 'avatar' && (
          <g>
            <circle cx={ax} cy={ay} r={r} fill={groupColor} clipPath={clip} />
            <rect x={ax - r} y={ay + 9} width={r * 2} height={r} fill={avatarClothColor} clipPath={clip} />
            <path d={`M ${ax - 6} ${ay + 9} L ${ax - 2} ${ay + 5} L ${ax} ${ay + 7} L ${ax + 2} ${ay + 5} L ${ax + 6} ${ay + 9} Z`} fill="white" clipPath={clip} />
            <rect x={ax - 3} y={ay + 4} width={6} height={6} fill="#FDDCB5" clipPath={clip} />
            <circle cx={ax} cy={ay - 4} r={13} fill="#FDDCB5" clipPath={clip} />
            <circle cx={ax - 13} cy={ay - 3} r={2.5} fill="#F0C090" clipPath={clip} />
            <circle cx={ax + 13} cy={ay - 3} r={2.5} fill="#F0C090" clipPath={clip} />
            {isGroupA ? (
              <path d={`M ${ax - 13} ${ay - 8} Q ${ax - 8} ${ay - 22} ${ax} ${ay - 21} Q ${ax + 8} ${ay - 22} ${ax + 13} ${ay - 8} Q ${ax + 6} ${ay - 14} ${ax} ${ay - 16} Q ${ax - 6} ${ay - 14} ${ax - 13} ${ay - 8} Z`} fill={avatarHairColor} clipPath={clip} />
            ) : (
              <path d={`M ${ax - 13} ${ay - 8} Q ${ax - 11} ${ay - 23} ${ax - 4} ${ay - 22} Q ${ax} ${ay - 25} ${ax + 4} ${ay - 22} Q ${ax + 11} ${ay - 23} ${ax + 13} ${ay - 8} Q ${ax + 5} ${ay - 15} ${ax} ${ay - 17} Q ${ax - 5} ${ay - 15} ${ax - 13} ${ay - 8} Z`} fill={avatarHairColor} clipPath={clip} />
            )}
            <circle cx={ax - 4.5} cy={ay - 4.5} r={2} fill="#1a1a1a" clipPath={clip} />
            <circle cx={ax + 4.5} cy={ay - 4.5} r={2} fill="#1a1a1a" clipPath={clip} />
            <circle cx={ax - 3.8} cy={ay - 5.2} r={0.7} fill="white" clipPath={clip} />
            <circle cx={ax + 5.2} cy={ay - 5.2} r={0.7} fill="white" clipPath={clip} />
            <path d={`M ${ax - 3.5} ${ay - 0.5} Q ${ax} ${ay + 2} ${ax + 3.5} ${ay - 0.5}`} stroke="#aa6655" strokeWidth="1.2" fill="none" clipPath={clip} />
            {isGroupA && (
              <g clipPath={clip}>
                <rect x={ax - 8.5} y={ay - 7.5} width={6} height={4.5} rx={1.5} fill="none" stroke={avatarGlassesColor} strokeWidth="0.85" />
                <rect x={ax + 2.5} y={ay - 7.5} width={6} height={4.5} rx={1.5} fill="none" stroke={avatarGlassesColor} strokeWidth="0.85" />
                <line x1={ax - 2.5} y1={ay - 5.5} x2={ax + 2.5} y2={ay - 5.5} stroke={avatarGlassesColor} strokeWidth="0.85" />
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
            onClick={() => onNodeClick?.(agent.id)}
          >
            {/* Glow Aura */}
            {roleIdentity === 'glow' && isDecisionMaker && (
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

            {roleIdentity === 'glow' && isOpponent && (
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
            {nodeIdentity !== 'avatar' && groupLabel !== 'named' && (
              <text dy="5" textAnchor="middle" className="text-sm md:text-xs font-bold fill-white pointer-events-none uppercase" style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.4)' }}>
                {agent.label}
              </text>
            )}

            {/* ── Avatar mode: ID label inside node ── */}
            {nodeIdentity === 'avatar' && groupLabel !== 'named' && (
              <g transform={`translate(0, ${r - 8})`}>
                <rect x="-14" y="-6" width="28" height="12" rx="4" fill="rgba(255,255,255,0.85)" />
                <text y="3" textAnchor="middle" fontSize="10" className="md:text-[8px] font-[800] fill-[#333] pointer-events-none uppercase">
                  {agent.label}
                </text>
              </g>
            )}

            {/* ── YOU / OPPONENT indicator (when not named) ── */}
            {isDecisionMaker && groupLabel !== 'named' && (
              <g transform={`translate(0, ${-r + 8})`}>
                <rect x="-18" y="-7" width="36" height="14" rx="7" fill={COLORS.highlight} stroke="white" strokeWidth="1.5" />
                <text y="3" textAnchor="middle" className="text-[10px] md:text-[8px] font-bold fill-white uppercase tracking-wider">YOU</text>
              </g>
            )}

            {isOpponent && groupLabel !== 'named' && (
              <g transform={`translate(0, ${-r + 8})`}>
                <rect x="-26" y="-7" width="52" height="14" rx="7" fill="#374151" stroke="white" strokeWidth="1.5" />
                <text y="3" textAnchor="middle" className="text-[10px] md:text-[8px] font-bold fill-white uppercase tracking-wider">Partner</text>
              </g>
            )}

            {/* ── Named Group Badge (with Role if applicable) ── */}
            {groupLabel === 'named' && (() => {
              const baseName = agent.group === 'A' ? groupNames.A : groupNames.B;

              let roleTag = null;
              let roleFill = '';
              let badgeWidth = 44; // base width for just the group name

              if (isDecisionMaker) {
                roleTag = 'YOU';
                roleFill = COLORS.highlight; // yellow/amber
                badgeWidth = 75; // wider to accommodate 'YOU - GROUPNAME'
              } else if (isOpponent) {
                roleTag = 'Partner';
                roleFill = '#6b7280'; // gray-500
                badgeWidth = 90; // wider to accommodate 'Partner - GROUPNAME'
              }

              // Use white pill with colored text
              const badgeFill = 'white';
              const strokeColor = roleTag ? roleFill : groupColor; // Match border to role color if role exists

              return (
                <g transform={`translate(0, ${r - 2})`}>
                  <rect x={-badgeWidth / 2} y="-14" width={badgeWidth} height="16" rx="8" fill={badgeFill} stroke={strokeColor} strokeWidth="1.5" opacity="0.95" />
                  <text y="-2" textAnchor="middle" fontSize="10" className="font-[800] md:text-[8px] pointer-events-none" style={{ textTransform: roleTag ? 'none' : 'uppercase' }}>
                    {roleTag ? (
                      <>
                        <tspan className="uppercase tracking-wider font-black" fill={roleFill}>{roleTag}</tspan>
                        <tspan className="opacity-50 font-normal mx-1" fill="#9ca3af"> · </tspan>
                        <tspan className="uppercase tracking-widest" fill={groupColor}>{baseName}</tspan>
                      </>
                    ) : (
                      <tspan className="tracking-widest" fill={groupColor}>{baseName}</tspan>
                    )}
                  </text>
                </g>
              );
            })()}

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


          </g>
        );
      })}
    </svg>
  );
};

export default NetworkGraph;