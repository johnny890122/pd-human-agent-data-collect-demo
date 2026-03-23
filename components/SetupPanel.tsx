import React from 'react';
import { toast } from 'react-hot-toast';
import { ExperimentSetup, AgentId } from '../types';
import { AGENTS } from '../constants';
import NetworkGraph from './NetworkGraph';
import { generateDesignMatrix } from '../utils/math';

interface SetupPanelProps {
  setup: ExperimentSetup;
  setSetup: React.Dispatch<React.SetStateAction<ExperimentSetup>>;
  generatedUrl: string | null;
  setGeneratedUrl: React.Dispatch<React.SetStateAction<string | null>>;
  isSaving: boolean;
  setIsSaving: React.Dispatch<React.SetStateAction<boolean>>;
  onSave: (setupToSave: ExperimentSetup) => Promise<string | undefined>;
  onNodeInteraction: (nodeId: AgentId) => void;
  onEdgeToggle: (edgeId: string) => void;
  readOnly?: boolean;
  onBack?: () => void;
}

const SetupPanel: React.FC<SetupPanelProps> = ({
  setup,
  setSetup,
  generatedUrl,
  setGeneratedUrl,
  isSaving,
  setIsSaving,
  onSave,
  onNodeInteraction,
  onEdgeToggle,
  readOnly = false,
  onBack,
}) => {
  const k = setup.activeEdgeIds.length;
  const scenariosCount = Math.pow(2, k);
  const isHighLoad = k > 4;
  const agentOptions = Object.values(AGENTS);

  const getFallbackAgent = (excludeId: string): string => {
    const fallback = agentOptions.find((agent) => agent.id !== excludeId);
    return fallback ? fallback.id : excludeId;
  };

  const handleFocalNodeChange = (value: string) => {
    setSetup((prev) => ({
      ...prev,
      focalNode: value,
      opponentNode: prev.opponentNode === value ? getFallbackAgent(value) : prev.opponentNode,
    }));
  };

  const handleOpponentNodeChange = (value: string) => {
    setSetup((prev) => ({
      ...prev,
      opponentNode: value,
      focalNode: prev.focalNode === value ? getFallbackAgent(value) : prev.focalNode,
    }));
  };

  const handleGenerateUrl = async () => {
    setIsSaving(true);
    const scenarios = generateDesignMatrix(setup.activeEdgeIds);
    const updatedSetup = { ...setup, scenarios };
    setSetup(updatedSetup);
    const id = await onSave(updatedSetup);
    if (id) {
      const url = `${window.location.origin}/survey/intro/0?setupId=${id}`;
      setGeneratedUrl(url);
    }
    setIsSaving(false);
  };

  return (
    <div className="flex flex-col xl:flex-row xl:h-[calc(100vh-9rem)] bg-white shadow-xl xl:overflow-hidden rounded-2xl border border-gray-200">
      <div className="w-full xl:w-1/3 p-4 md:p-6 xl:overflow-y-auto z-10 flex flex-col border-b xl:border-b-0 xl:border-r border-gray-200">
        <div className="space-y-6 flex-1">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Session Configuration
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">YOU Node</label>
                  <select
                    value={setup.focalNode}
                    onChange={(e) => handleFocalNodeChange(e.target.value)}
                    disabled={readOnly}
                    className={`w-full p-2 border rounded-md bg-white text-sm ${readOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                  >
                    {agentOptions.map((agent) => (
                      <option
                        key={`focal-${agent.id}`}
                        value={agent.id}
                        disabled={agent.id === setup.opponentNode}
                      >
                        {agent.id} ({agent.label})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Partner Node</label>
                  <select
                    value={setup.opponentNode}
                    onChange={(e) => handleOpponentNodeChange(e.target.value)}
                    disabled={readOnly}
                    className={`w-full p-2 border rounded-md bg-white text-sm ${readOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                  >
                    {agentOptions.map((agent) => (
                      <option
                        key={`opponent-${agent.id}`}
                        value={agent.id}
                        disabled={agent.id === setup.focalNode}
                      >
                        {agent.id} ({agent.label})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <label className="block text-xs text-gray-500 mb-1">Target Sample Size</label>
              <input
                type="number"
                min="1"
                value={setup.sampleSize}
                onChange={(e) => setSetup({ ...setup, sampleSize: parseInt(e.target.value, 10) || 20 })}
                disabled={readOnly}
                className={`w-full p-2 border rounded-md bg-white text-sm ${readOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
              />
              <p className="text-[10px] text-gray-400 mt-2">
                Participants per scenario-set. Total entries expected: {setup.sampleSize}
              </p>
            </div>
          </div>

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
                <span className="mr-2">!</span>
                Cognitive Load Alert: {scenariosCount} scenarios may be too fatiguing for a single session.
              </div>
            )}
          </div>
        </div>

        <div className="py-6 mt-6 border-t border-gray-100">
          {readOnly ? (
            <button
              onClick={onBack}
              className="w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] bg-gray-600 text-white hover:bg-gray-700 shadow-gray-200"
            >
              Back
            </button>
          ) : !generatedUrl ? (
            <button
              onClick={handleGenerateUrl}
              disabled={k === 0 || isSaving}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] ${k === 0 || isSaving
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                }`}
            >
              {isSaving ? 'Generating...' : 'Generate Session URL'}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs font-bold text-green-800 mb-1">Session Live!</p>
                <input
                  readOnly
                  value={generatedUrl}
                  className="w-full p-2 text-[10px] font-mono bg-white border rounded border-green-200 mb-2 truncate"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedUrl);
                    toast.success('URL copied to clipboard!');
                  }}
                  className="w-full py-2 bg-green-600 text-white rounded-md text-xs font-bold hover:bg-green-700 transition-colors"
                >
                  Copy URL
                </button>
              </div>
              <button
                onClick={() => setGeneratedUrl(null)}
                className="w-full py-2 text-indigo-600 text-xs font-medium hover:underline"
              >
                Create New Setup
              </button>
            </div>
          )}

          {!readOnly && k === 0 && !generatedUrl && <p className="text-center text-xs text-gray-400 mt-2">Select at least one edge on the graph to begin.</p>}
        </div>
      </div>

      <div className="flex-1 bg-gray-100 relative flex items-center justify-center p-4 md:p-8 overflow-hidden">
        {!readOnly ? (
          <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none z-10">
            <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm text-[10px] md:text-xs font-medium text-gray-600 pointer-events-auto border border-gray-200">
              Click nodes to view roles. Click edges to see factors.
            </div>
          </div>
        ) : null}

        <div className="w-full max-w-full md:max-w-2xl bg-white rounded-2xl shadow-2xl p-4 md:p-8 aspect-square flex items-center justify-center overflow-hidden">
          <NetworkGraph
            mode="admin"
            setup={setup}
            onEdgeClick={readOnly ? () => {} : onEdgeToggle}
            onNodeClick={readOnly ? () => {} : onNodeInteraction}
          />
        </div>
      </div>
    </div>
  );
};

export default SetupPanel;
