import React from 'react';
import { AGENTS, ALL_EDGES, COLORS } from '../constants';
import { AgentId, ExperimentSetup, Scenario } from '../types';

interface NetworkGraphProps {
  mode: 'admin' | 'survey';
  setup: ExperimentSetup;
  scenario?: Scenario;
  onEdgeClick?: (edgeId: string) => void;
  className?: string;
}

const NetworkGraph: React.FC<NetworkGraphProps> = ({
  mode,
  setup,
  scenario,
  onEdgeClick,
  className = '',
}) => {
  // Layout coordinates (Square/Diamond)
  // 0,0 is top left. ViewBox 0 0 400 400
  const positions: Record<AgentId, { x: number; y: number }> = {
    HA: { x: 100, y: 100 }, // Top Left
    RA: { x: 300, y: 100 }, // Top Right
    HB: { x: 100, y: 300 }, // Bottom Left
    RB: { x: 300, y: 300 }, // Bottom Right
  };

  const getEdgeColor = (edgeId: string) => {
    // ADMIN MODE
    if (mode === 'admin') {
      if (setup.activeEdgeIds.includes(edgeId)) return COLORS.highlight;
      return '#e5e7eb'; // very light gray
    }

    // SURVEY MODE
    if (setup.activeEdgeIds.includes(edgeId) && scenario) {
      const state = scenario.edgeStates[edgeId];
      return state === 1 ? COLORS.coop : COLORS.defect;
    }
    
    // Inactive edges in survey mode
    return 'transparent'; 
  };

  const getEdgeOpacity = (edgeId: string) => {
    if (mode === 'admin') return 1;
    if (setup.activeEdgeIds.includes(edgeId)) return 1;
    return 0; // Hide inactive edges in survey
  };

  const renderArrowhead = (id: string, color: string) => (
    <marker
      id={`arrow-${id}`}
      markerWidth="10"
      markerHeight="7"
      refX="26" // Offset to not overlap with node (radius 24 + border)
      refY="3.5"
      orient="auto"
    >
      <polygon points="0 0, 10 3.5, 0 7" fill={color} />
    </marker>
  );

  return (
    <svg className={`w-full h-full max-w-md mx-auto ${className}`} viewBox="0 0 400 400">
      <defs>
        {ALL_EDGES.map((edge) => {
            const color = getEdgeColor(edge.id);
            return renderArrowhead(edge.id, color);
        })}
        {/* Glow filter for active nodes */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Edges */}
      {ALL_EDGES.map((edge) => {
        const start = positions[edge.source];
        const end = positions[edge.target];
        const isActive = setup.activeEdgeIds.includes(edge.id);
        const color = getEdgeColor(edge.id);
        const opacity = getEdgeOpacity(edge.id);

        // Calculate quadratic bezier curve control point to curve the edge
        // Midpoint
        const mx = (start.x + end.x) / 2;
        const my = (start.y + end.y) / 2;
        
        // Offset for curvature. 
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const offset = 40; // Curvature amount
        
        // Perpendicular vector (-dy, dx) normalized
        const cx = mx - (dy / dist) * offset;
        const cy = my + (dx / dist) * offset;

        const pathData = `M ${start.x} ${start.y} Q ${cx} ${cy} ${end.x} ${end.y}`;

        // Calculate Midpoint of the Bezier Curve (t=0.5) for text placement
        // B(t) = (1-t)^2 P0 + 2(1-t)t P1 + t^2 P2
        const t = 0.5;
        const midX = (1-t)*(1-t)*start.x + 2*(1-t)*t*cx + t*t*end.x;
        const midY = (1-t)*(1-t)*start.y + 2*(1-t)*t*cy + t*t*end.y;

        // Determine Label Content
        let labelText = '';
        let labelColor = 'transparent';
        
        if (isActive && mode === 'survey' && scenario) {
           const state = scenario.edgeStates[edge.id];
           const config = setup.edgeConfigs[edge.id];
           labelText = state === 1 ? config.high : config.low;
           labelColor = state === 1 ? COLORS.coop : COLORS.defect;
        }

        return (
          <g
            key={edge.id}
            onClick={() => mode === 'admin' && onEdgeClick?.(edge.id)}
            className={`${mode === 'admin' ? 'cursor-pointer hover:opacity-80' : ''} transition-all duration-300`}
            style={{ opacity }}
          >
            {/* Hit area */}
            <path d={pathData} stroke="transparent" strokeWidth="20" fill="none" />
            {/* Visible Line */}
            <path
              d={pathData}
              stroke={color}
              strokeWidth={isActive ? 3 : 2}
              fill="none"
              markerEnd={`url(#arrow-${edge.id})`}
            />
            {/* Edge Label on Graph */}
            {labelText && (
              <g transform={`translate(${midX}, ${midY})`}>
                 <rect 
                    x="-40" y="-10" width="80" height="20" rx="4" 
                    fill="white" stroke={labelColor} strokeWidth="1"
                    className="shadow-sm opacity-90"
                 />
                 <text 
                    x="0" y="4" 
                    textAnchor="middle" 
                    className="text-[10px] font-bold uppercase"
                    fill={labelColor}
                 >
                    {labelText}
                 </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Nodes */}
      {Object.values(AGENTS).map((agent) => {
        const pos = positions[agent.id];
        const isDecisionMaker = agent.id === setup.decisionMaker;
        const isOpponent = agent.id === setup.opponent;

        // Base styles
        let strokeColor = 'white';
        let strokeWidth = 2;
        let radius = 24;
        
        if (mode === 'admin') {
            if (isDecisionMaker) { strokeColor = COLORS.highlight; strokeWidth = 4; }
            else if (isOpponent) { strokeColor = 'black'; strokeWidth = 4; }
        } else {
             // Survey mode: Highlight YOU and OPPONENT
             if (isDecisionMaker) { strokeColor = '#fbbf24'; strokeWidth = 5; } // amber-400
             if (isOpponent) { strokeColor = '#374151'; strokeWidth = 5; } // gray-700
        }

        return (
          <g key={agent.id} transform={`translate(${pos.x}, ${pos.y})`} className="transition-all duration-300">
            {/* Main Circle */}
            <circle
              r={radius}
              fill={agent.group === 'A' ? COLORS.groupA : COLORS.groupB}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              className="shadow-xl"
              filter={isDecisionMaker && mode === 'survey' ? "url(#glow)" : ""}
            />
            
            {/* Center Label (ID only, no Human/Robot text) */}
            <text
              dy="5"
              textAnchor="middle"
              className="text-xs font-bold fill-white pointer-events-none uppercase"
              style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.3)' }}
            >
              {agent.label}
            </text>

            {/* Role Indicators (Badges) */}
            {isDecisionMaker && mode === 'survey' && (
                <g transform="translate(0, -38)">
                    <rect x="-24" y="-10" width="48" height="20" rx="10" fill="#fbbf24" stroke="white" strokeWidth="2" className="shadow-md" />
                    <text y="4" textAnchor="middle" className="text-[10px] font-black fill-white uppercase tracking-wider">YOU</text>
                </g>
            )}
            
             {isOpponent && mode === 'survey' && (
                <g transform="translate(0, -38)">
                    <rect x="-35" y="-10" width="70" height="20" rx="10" fill="#374151" stroke="white" strokeWidth="2" className="shadow-md" />
                    <text y="4" textAnchor="middle" className="text-[10px] font-black fill-white uppercase tracking-wider">OPPONENT</text>
                </g>
            )}

            {/* Admin Labels */}
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