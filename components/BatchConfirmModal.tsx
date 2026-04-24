import React from 'react';
import { combinationCount } from '../utils/combinations';

interface BatchConfirmModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  batchEdgeCount: number;
  groupName: string;
  sampleSize: number;
  focalNode: string;
  opponentNode: string;
  isBatchCreating: boolean;
  batchProgress?: { current: number; total: number };
}

const BatchConfirmModal: React.FC<BatchConfirmModalProps> = ({
  show,
  onClose,
  onConfirm,
  batchEdgeCount,
  groupName,
  sampleSize,
  focalNode,
  opponentNode,
  isBatchCreating,
  batchProgress,
}) => {
  if (!show) return null;

  const totalCombinations = combinationCount(12, batchEdgeCount);
  const displayName = groupName || `Batch k=${batchEdgeCount} (${new Date().toLocaleDateString('zh-TW')})`;

  if (isBatchCreating) {
    const progress = batchProgress 
      ? (batchProgress.current / batchProgress.total) * 100 
      : 0;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/70 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
          <h3 className="text-xl font-bold text-purple-900 mb-4">Batch Creation in Progress...</h3>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Progress</span>
              {batchProgress && (
                <span className="font-bold text-purple-700">
                  {batchProgress.current} / {batchProgress.total}
                </span>
              )}
            </div>
            <div className="w-full bg-purple-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-purple-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          
          <p className="text-xs text-gray-500 text-center">
            Creating sessions, please wait...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-xl font-extrabold text-purple-900 mb-3">
          Confirm Batch Launch
        </h3>
        
        <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Mode:</span>
              <span className="font-bold text-purple-700">Auto Enumeration</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Edge Count (k):</span>
              <span className="font-bold text-purple-700">{batchEdgeCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Sessions to Create:</span>
              <span className="font-bold text-purple-700 text-xl">
                {totalCombinations}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Sample Size Each:</span>
              <span className="font-bold text-purple-700">{sampleSize}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Focal Node:</span>
              <span className="font-bold text-gray-700">{focalNode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Opponent Node:</span>
              <span className="font-bold text-gray-700">{opponentNode}</span>
            </div>
            <div className="border-t border-purple-200 my-2 pt-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Group Name:</span>
                <span className="font-bold text-purple-700 truncate max-w-[200px]" title={displayName}>
                  {displayName}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
          <strong>Note:</strong> Batch creation may take several seconds to minutes (depending on combination count). You will be automatically redirected to the group details page when complete.
        </div>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-sm transition-colors"
          >
            Confirm Launch
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchConfirmModal;
