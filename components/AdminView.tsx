import React, { useState } from 'react';
import { ExperimentSetup, EdgeConfig, AgentId } from '../types';
import { AGENTS, DEFAULT_EDGE_CONFIG } from '../constants';
import NetworkGraph from './NetworkGraph';

interface AdminViewProps {
  setup: ExperimentSetup;
  setSetup: React.Dispatch<React.SetStateAction<ExperimentSetup>>;
  onStart: () => void;
}

const AdminView: React.FC<AdminViewProps> = ({ setup, setSetup, onStart }) => {
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);

  const toggleEdge = (edgeId: string) => {
    const isActive = setup.activeEdgeIds.includes(edgeId);
    let newActive = [...setup.activeEdgeIds];
    let newConfigs = { ...setup.edgeConfigs };

    if (isActive) {
      newActive = newActive.filter((id) => id !== edgeId);
      delete newConfigs[edgeId];
    } else {
      newActive.push(edgeId);
      newConfigs[edgeId] = { ...DEFAULT_EDGE_CONFIG };
      setEditingEdgeId(edgeId); // Auto-open config
    }

    setSetup({ ...setup, activeEdgeIds: newActive, edgeConfigs: newConfigs });
  };

  const updateEdgeConfig = (edgeId: string, updates: Partial<EdgeConfig>) => {
    setSetup((prev) => ({
      ...prev,
      edgeConfigs: {
        ...prev.edgeConfigs,
        [edgeId]: { ...prev.edgeConfigs[edgeId], ...updates },
      },
    }));
  };

  const k = setup.activeEdgeIds.length;
  const scenariosCount = Math.pow(2, k);
  const isHighLoad = k > 4;

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar Controls */}
      <div className="w-full lg:w-1/3 p-6 bg-white shadow-xl overflow-y-auto z-10 flex flex-col">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Experiment Setup</h1>

        <div className="space-y-6 flex-1">
          {/* Role Assignment */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Role Assignment
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Decision Maker (Subject)</label>
                <select
                  value={setup.decisionMaker}
                  onChange={(e) =>
                    setSetup({ ...setup, decisionMaker: e.target.value as AgentId })
                  }
                  className="w-full p-2 border rounded-md bg-white text-sm"
                >
                  {Object.values(AGENTS).map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label} ({a.id})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Opponent</label>
                <select
                  value={setup.opponent}
                  onChange={(e) =>
                    setSetup({ ...setup, opponent: e.target.value as AgentId })
                  }
                  className="w-full p-2 border rounded-md bg-white text-sm"
                >
                  {Object.values(AGENTS).map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label} ({a.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Complexity Monitor */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h3 className="text-sm font-semibold text-blue-800 uppercase tracking-wider mb-2">
              Complexity Check
            </h3>
            <div className="flex justify-between items-center text-sm mb-1">
              <span>Active Factors (k):</span>
              <span className="font-mono font-bold">{k}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>Total Scenarios (2^k):</span>
              <span className="font-mono font-bold">{scenariosCount}</span>
            </div>
            {isHighLoad && (
              <div className="mt-3 p-2 bg-red-100 text-red-700 text-xs rounded border border-red-200 flex items-start">
                <span className="mr-2">⚠️</span>
                Cognitive Load Alert: {scenariosCount} scenarios may be too fatiguing for a single session.
              </div>
            )}
          </div>

          {/* Edge Configuration Panel */}
          {editingEdgeId && setup.edgeConfigs[editingEdgeId] && (
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 animate-fadeIn">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-amber-800 uppercase tracking-wider">
                  Configuring {editingEdgeId}
                </h3>
                <button
                  onClick={() => setEditingEdgeId(null)}
                  className="text-amber-600 hover:text-amber-800 text-xs"
                >
                  Close
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-amber-700 mb-1">Semantic Label</label>
                  <input
                    type="text"
                    value={setup.edgeConfigs[editingEdgeId].label}
                    onChange={(e) => updateEdgeConfig(editingEdgeId, { label: e.target.value })}
                    className="w-full p-2 border border-amber-200 rounded text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-red-600 mb-1">Low (0) Meaning</label>
                    <input
                      type="text"
                      value={setup.edgeConfigs[editingEdgeId].low}
                      onChange={(e) => updateEdgeConfig(editingEdgeId, { low: e.target.value })}
                      className="w-full p-2 border border-red-200 rounded text-sm bg-red-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-green-600 mb-1">High (1) Meaning</label>
                    <input
                      type="text"
                      value={setup.edgeConfigs[editingEdgeId].high}
                      onChange={(e) => updateEdgeConfig(editingEdgeId, { high: e.target.value })}
                      className="w-full p-2 border border-green-200 rounded text-sm bg-green-50"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-6 mt-6 border-t border-gray-100">
            <button
            onClick={onStart}
            disabled={k === 0}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
                k === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
            }`}
            >
            Generate & Start Survey
            </button>
            {k === 0 && <p className="text-center text-xs text-gray-400 mt-2">Select at least one edge on the graph to begin.</p>}
        </div>
      </div>

      {/* Main Graph Area */}
      <div className="flex-1 bg-gray-100 relative flex items-center justify-center p-8">
        <div className="absolute top-6 left-6 right-6 flex justify-between pointer-events-none">
             <div className="bg-white/80 backdrop-blur px-4 py-2 rounded-lg shadow text-xs font-medium text-gray-600 pointer-events-auto">
                Select edges to include them as factors.
             </div>
        </div>
        
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8 aspect-square flex items-center justify-center">
             <NetworkGraph 
                mode="admin" 
                setup={setup} 
                onEdgeClick={toggleEdge}
             />
        </div>
      </div>
    </div>
  );
};

export default AdminView;
