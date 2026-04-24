import React from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { combinationCount } from '../utils/combinations';

interface BatchModeConfigProps {
  batchEdgeCount: number;
  setBatchEdgeCount: (value: number) => void;
  groupName: string;
  setGroupName: (value: string) => void;
  groupDescription: string;
  setGroupDescription: (value: string) => void;
  sampleSize: number;
}

const BatchModeConfig: React.FC<BatchModeConfigProps> = ({
  batchEdgeCount,
  setBatchEdgeCount,
  groupName,
  setGroupName,
  groupDescription,
  setGroupDescription,
  sampleSize,
}) => {
  const totalCombinations = combinationCount(12, batchEdgeCount);
  const isHighLoad = batchEdgeCount >= 5;

  return (
    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
      <h3 className="text-sm font-semibold text-purple-900 mb-3 uppercase">Batch Configuration</h3>
      
      {/* Edge Count k */}
      <div className="mb-4">
        <label className="block text-xs text-gray-600 mb-2 font-semibold">
          Edge Count (k) <span className="text-purple-600">*</span>
        </label>
        <div className="flex items-center gap-3">
          <div className="flex-1 mx-2 flex items-center h-full pt-[2px]">
            <Slider
              min={1}
              max={6}
              value={batchEdgeCount}
              onChange={(val) => setBatchEdgeCount(val as number)}
              trackStyle={{ backgroundColor: '#9333ea', height: 8 }}
              handleStyle={{ borderColor: '#9333ea', height: 18, width: 18, marginTop: -5, backgroundColor: '#fff' }}
              railStyle={{ backgroundColor: '#e9d5ff', height: 8 }}
            />
          </div>
          <span className="text-lg font-bold text-purple-700 min-w-[28px]">
            {batchEdgeCount}
          </span>
        </div>
        
        {/* Combination Count Info */}
        <div className="mt-3 p-3 bg-white rounded border border-purple-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-600">Sessions to be generated:</span>
            <span className="font-mono font-bold text-purple-700 text-xl">
              C(12,{batchEdgeCount}) = {totalCombinations}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            Each session contains 2^{batchEdgeCount} = {Math.pow(2, batchEdgeCount)} scenarios
          </div>
          {isHighLoad && (
            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex items-start gap-2">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>
                <strong>Warning:</strong> High combination count ({totalCombinations}), creation may take 30 seconds to 2 minutes.
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Batch Group Name */}
      <div className="mb-4">
        <label className="block text-xs text-gray-600 mb-2 font-semibold">
          Batch Group Name
        </label>
        <input
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder={`Batch k=${batchEdgeCount} (${new Date().toLocaleDateString('zh-TW')})`}
          className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
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
          placeholder="e.g., Testing effect of all 3-edge combinations"
          rows={2}
          className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm resize-none"
        />
      </div>

    </div>
  );
};

export default BatchModeConfig;
