import React, { useMemo } from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { combinationCount } from '../utils/combinations';

interface MixedModeConfigProps {
  maxK: number;
  setMaxK: (value: number) => void;
  scenariosPerSession: number;
  setScenariosPerSession: (value: number) => void;
  targetSizePerScenario: number;
  setTargetSizePerScenario: (value: number) => void;
  groupName: string;
  setGroupName: (value: string) => void;
  groupDescription: string;
  setGroupDescription: (value: string) => void;
}

const MixedModeConfig: React.FC<MixedModeConfigProps> = ({
  maxK,
  setMaxK,
  scenariosPerSession,
  setScenariosPerSession,
  targetSizePerScenario,
  setTargetSizePerScenario,
  groupName,
  setGroupName,
  groupDescription,
  setGroupDescription,
}) => {
  // 計算 total scenarios: sum of all k=1..maxK combinations × design matrix size
  const { totalScenarios, estimatedParticipants } = useMemo(() => {
    let total = 0;
    for (let k = 1; k <= maxK; k++) {
      const combinations = combinationCount(12, k);
      const scenariosPerCombo = Math.pow(2, k); // 2^k design matrix size
      total += combinations * scenariosPerCombo;
    }

    const estimated = Math.ceil((total * targetSizePerScenario) / scenariosPerSession);
    
    return { totalScenarios: total, estimatedParticipants: estimated };
  }, [maxK, scenariosPerSession, targetSizePerScenario]);

  const isHighLoad = totalScenarios > 500;

  return (
    <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
      <h3 className="text-sm font-semibold text-teal-900 mb-3 uppercase">Mixed Mode Configuration</h3>
      
      {/* Max K */}
      <div className="mb-4">
        <label className="block text-xs text-gray-600 mb-2 font-semibold">
          Maximum Edge Count (maxK) <span className="text-teal-600">*</span>
        </label>
        <div className="flex items-center gap-3">
          <div className="flex-1 mx-2 flex items-center h-full pt-[2px]">
            <Slider
              min={1}
              max={4}
              value={maxK}
              onChange={(val) => setMaxK(val as number)}
              trackStyle={{ backgroundColor: '#14b8a6', height: 8 }}
              handleStyle={{ borderColor: '#14b8a6', height: 18, width: 18, marginTop: -5, backgroundColor: '#fff' }}
              railStyle={{ backgroundColor: '#ccfbf1', height: 8 }}
            />
          </div>
          <span className="text-lg font-bold text-teal-700 min-w-[28px]">
            {maxK}
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Generate scenarios for all k=1 through k={maxK}
        </div>
      </div>

      {/* Scenarios Per Session */}
      <div className="mb-4">
        <label className="block text-xs text-gray-600 mb-2 font-semibold">
          Scenarios Per Session (S) <span className="text-teal-600">*</span>
        </label>
        <div className="flex items-center gap-3">
          <div className="flex-1 mx-2 flex items-center h-full pt-[2px]">
            <Slider
              min={5}
              max={30}
              step={5}
              value={scenariosPerSession}
              onChange={(val) => setScenariosPerSession(val as number)}
              trackStyle={{ backgroundColor: '#14b8a6', height: 8 }}
              handleStyle={{ borderColor: '#14b8a6', height: 18, width: 18, marginTop: -5, backgroundColor: '#fff' }}
              railStyle={{ backgroundColor: '#ccfbf1', height: 8 }}
            />
          </div>
          <span className="text-lg font-bold text-teal-700 min-w-[28px]">
            {scenariosPerSession}
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Each participant completes {scenariosPerSession} scenarios
        </div>
      </div>

      {/* Target Size Per Scenario */}
      <div className="mb-4">
        <label className="block text-xs text-gray-600 mb-2 font-semibold">
          Target Size Per Scenario <span className="text-teal-600">*</span>
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={100}
            value={targetSizePerScenario}
            onChange={(e) => setTargetSizePerScenario(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-24 px-3 py-2 border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
          />
          <span className="text-xs text-gray-500">
            responses needed per scenario
          </span>
        </div>
      </div>

      {/* Estimates */}
      <div className="mb-4 p-3 bg-white rounded border border-teal-100">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-gray-600">Total Scenarios:</span>
          <span className="font-mono font-bold text-teal-700 text-xl">
            {totalScenarios}
          </span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-gray-600">Estimated Participants:</span>
          <span className="font-mono font-bold text-teal-700 text-lg">
            ~{estimatedParticipants}
          </span>
        </div>
        <div className="text-xs text-gray-400 mt-2">
          = ({totalScenarios} scenarios × {targetSizePerScenario} responses) ÷ {scenariosPerSession} per session
        </div>
        
        {isHighLoad && (
          <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex items-start gap-2">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>
              <strong>Warning:</strong> Large scenario pool ({totalScenarios}), creation may take 1-2 minutes.
            </span>
          </div>
        )}
      </div>
      
      {/* Group Name */}
      <div className="mb-4">
        <label className="block text-xs text-gray-600 mb-2 font-semibold">
          Group Name
        </label>
        <input
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder={`Mixed k≤${maxK} (${new Date().toLocaleDateString('zh-TW')})`}
          className="w-full px-3 py-2 border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
        />
      </div>
      
      {/* Description */}
      <div className="mb-3">
        <label className="block text-xs text-gray-600 mb-2 font-semibold">
          Description (Optional)
        </label>
        <textarea
          value={groupDescription}
          onChange={(e) => setGroupDescription(e.target.value)}
          placeholder="e.g., Cross-k sampling with balanced scenario distribution"
          rows={2}
          className="w-full px-3 py-2 border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm resize-none"
        />
      </div>

      {/* Info Box */}
      <div className="p-3 bg-teal-100 rounded-lg text-xs text-teal-900">
        <div className="font-semibold mb-1">ℹ️ Mixed Mode Benefits:</div>
        <ul className="list-disc list-inside space-y-1 text-teal-800">
          <li>Each participant sees {scenariosPerSession} scenarios (manageable time commitment)</li>
          <li>Balanced selection ensures even data distribution</li>
          <li>Single master URL for all participants</li>
          <li>Automatic completion when all scenarios reach target size</li>
        </ul>
      </div>
    </div>
  );
};

export default MixedModeConfig;
