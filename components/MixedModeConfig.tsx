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
          <div className="flex-1 mx-2 flex items-center h-full pt-[2px]">
            <Slider
              min={1}
              max={100}
              value={targetSizePerScenario}
              onChange={(val) => setTargetSizePerScenario(val as number)}
              trackStyle={{ backgroundColor: '#14b8a6', height: 8 }}
              handleStyle={{ borderColor: '#14b8a6', height: 18, width: 18, marginTop: -5, backgroundColor: '#fff' }}
              railStyle={{ backgroundColor: '#ccfbf1', height: 8 }}
            />
          </div>
          <span className="text-lg font-bold text-teal-700 min-w-[28px]">
            {targetSizePerScenario}
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Responses needed per scenario
        </div>
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
    </div>
  );
};

export default MixedModeConfig;
