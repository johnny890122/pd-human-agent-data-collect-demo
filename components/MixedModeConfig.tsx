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
}

const MixedModeConfig: React.FC<MixedModeConfigProps> = ({
  maxK,
  setMaxK,
  scenariosPerSession,
  setScenariosPerSession,
  targetSizePerScenario,
  setTargetSizePerScenario,
}) => {
  // 計算 total scenarios: sum of all k=1..maxK combinations × design matrix size
  const { totalScenarios, estimatedParticipants } = useMemo(() => {
    let total = 0;
    for (let k = 1; k <= maxK; k++) {
      const combinations = combinationCount(9, k); // 扣除3條 focal node 向外的邊
      total += combinations * Math.pow(2, k);
    }

    const estimated = Math.ceil((total * targetSizePerScenario) / scenariosPerSession);
    
    return { totalScenarios: total, estimatedParticipants: estimated };
  }, [maxK, scenariosPerSession, targetSizePerScenario]);

  const isHighLoad = totalScenarios > 500;

  return (
    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
      
      {/* Max K */}
      <div className="mb-4">
        <label className="block text-xs text-gray-600 mb-2 font-semibold">
          Maximum # of Edge
        </label>
        <div className="flex items-center gap-3">
          <div className="flex-1 mx-2 flex items-center h-full pt-[2px]">
            <Slider
              min={1}
              max={4}
              value={maxK}
              onChange={(val) => setMaxK(val as number)}
              trackStyle={{ backgroundColor: '#9333ea', height: 8 }}
              handleStyle={{ borderColor: '#9333ea', height: 18, width: 18, marginTop: -5, backgroundColor: '#fff' }}
              railStyle={{ backgroundColor: '#f3e8ff', height: 8 }}
            />
          </div>
          <span className="text-lg font-bold text-purple-700 min-w-[28px]">
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
          Scenarios Per Participant
        </label>
        <div className="flex items-center gap-3">
          <div className="flex-1 mx-2 flex items-center h-full pt-[2px]">
            <Slider
              min={5}
              max={30}
              step={5}
              value={scenariosPerSession}
              onChange={(val) => setScenariosPerSession(val as number)}
              trackStyle={{ backgroundColor: '#9333ea', height: 8 }}
              handleStyle={{ borderColor: '#9333ea', height: 18, width: 18, marginTop: -5, backgroundColor: '#fff' }}
              railStyle={{ backgroundColor: '#f3e8ff', height: 8 }}
            />
          </div>
          <span className="text-lg font-bold text-purple-700 min-w-[28px]">
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
          Target Response Per Scenario
        </label>
        <div className="flex items-center gap-3">
          <div className="flex-1 mx-2 flex items-center h-full pt-[2px]">
            <Slider
              min={1}
              max={100}
              value={targetSizePerScenario}
              onChange={(val) => setTargetSizePerScenario(val as number)}
              trackStyle={{ backgroundColor: '#9333ea', height: 8 }}
              handleStyle={{ borderColor: '#9333ea', height: 18, width: 18, marginTop: -5, backgroundColor: '#fff' }}
              railStyle={{ backgroundColor: '#f3e8ff', height: 8 }}
            />
          </div>
          <span className="text-lg font-bold text-purple-700 min-w-[28px]">
            {targetSizePerScenario}
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Responses needed per scenario
        </div>
      </div>
    </div>
  );
};

export default MixedModeConfig;
