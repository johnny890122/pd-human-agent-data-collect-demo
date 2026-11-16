import React from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Session, AgentId } from '../types';
import { AGENTS } from '../constants';
import { createMixedGroup } from '../utils/graphqlClient';
import { getFocalGroupLabel, getPartnerGroupLabel } from '../utils/nodeDisplay';
import MixedModeConfig from './MixedModeConfig';
import { combinationCount } from '../utils/combinations';
import { MIN_TOTAL_NTD, MAX_TOTAL_NTD } from '../utils/payment.js';
import katex from 'katex';
import 'katex/dist/katex.min.css';

import AgentAvatar from './AgentAvatar';

interface SetupPanelProps {
  setup: Session;
  setSetup: React.Dispatch<React.SetStateAction<Session>>;
}

const SetupPanel: React.FC<SetupPanelProps> = ({
  setup,
  setSetup,
}) => {
  // Batch (Mixed Mode) is the only launch mode (REQ-207).
  const navigate = useNavigate();
  const [groupName, setGroupName] = React.useState('');
  const [groupDescription, setGroupDescription] = React.useState('');
  const [showBatchConfirmModal, setShowBatchConfirmModal] = React.useState(false);
  
  // Mixed mode state
  const [maxK, setMaxK] = React.useState(2);
  const [scenariosPerSession, setScenariosPerSession] = React.useState(20);
  const [targetSizePerScenario, setTargetSizePerScenario] = React.useState(30);
  const [isMixedCreating, setIsMixedCreating] = React.useState(false);

  // Calculate mixed mode statistics
  const calculateMixedStats = () => {
    let total = 0;
    for (let k = 1; k <= maxK; k++) {
      const combinations = combinationCount(9, k); // 扣除3條 focal node 向外的邊
      const scenariosPerCombo = Math.pow(2, k);
      total += combinations * scenariosPerCombo;
    }
    const estimated = Math.ceil((total * targetSizePerScenario) / scenariosPerSession);
    return {
      totalScenarios: total,
      estimatedParticipants: estimated,
      minCost: estimated * MIN_TOTAL_NTD,
      maxCost: estimated * MAX_TOTAL_NTD,
    };
  };
  
  const mixedStats = calculateMixedStats();
  

  const handleFocalGroupChange = (group: string) => {
    setSetup((prev) => ({
      ...prev,
      focalNode: group === 'KMT' ? 'KMT1' : 'DPP3',
    }));
  };

  const handleOpponentGroupChange = (group: string) => {
    setSetup((prev) => ({
      ...prev,
      opponentNode: group === 'KMT' ? 'KMT2' : 'DPP4',
    }));
  };



  const handleMixedLaunch = async () => {
    setIsMixedCreating(true);
    
    try {
      const finalGroupName = groupName || `Mixed k≤${maxK} (${new Date().toLocaleDateString('en-US')})`;
      
      const result = await createMixedGroup(
        finalGroupName,
        maxK,
        scenariosPerSession,
        targetSizePerScenario,
        setup.focalNode,
        setup.opponentNode,
        groupDescription || undefined
      );
      
      toast.success(
        `✅ Created Mixed Mode group with ${result.totalScenarios} scenarios!`,
        { duration: 5000 }
      );
      
      // Navigate to group details page
      navigate(`/admin/view/batch/${result.groupId}`);
      
      // Reset parameters
      setGroupName('');
      setGroupDescription('');
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Mixed Mode creation failed: ${message}`);
    } finally {
      setIsMixedCreating(false);
    }
  };

  return (
    <div className="flex flex-col xl:flex-row xl:h-[calc(100vh-9rem)] bg-white shadow-xl xl:overflow-hidden rounded-2xl border border-gray-200 p-4 xl:p-6 gap-6">
      
      {/* Column 1 (Left): Configuration */}
      <div className="w-full xl:w-1/2 flex flex-col gap-4 xl:overflow-y-auto pr-2">
        
        
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-500 tracking-wider mb-3 uppercase">
            {'Configuration'}
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Focal Node</label>
                <div className={`grid grid-cols-2 gap-1.5`}>
                  {['KMT', 'DPP'].map((group) => {
                    const isSelected = AGENTS[setup.focalNode as AgentId].group === group;
                    const representativeAgent = AGENTS[group === 'KMT' ? 'KMT1' : 'DPP3'];
                    return (
                      <button
                        key={`focal-group-${group}`}
                        onClick={() => handleFocalGroupChange(group)}
                        type="button"
                        className={`flex flex-col items-center gap-1 p-2 border rounded-lg transition-colors
                          ${isSelected ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-500' : 'border-gray-200 bg-white hover:bg-gray-50'}
                        `}
                      >
                        <AgentAvatar agent={representativeAgent} size={28} />
                        <span className={`text-xs font-semibold ${isSelected ? 'text-amber-800' : 'text-gray-600'}`}>{group === 'KMT' ? '國民黨' : '民進黨'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Partner Node</label>
                <div className={`grid grid-cols-2 gap-1.5`}>
                   {['KMT', 'DPP'].map((group) => {
                    const isSelected = AGENTS[setup.opponentNode as AgentId].group === group;
                    const representativeAgent = AGENTS[group === 'KMT' ? 'KMT2' : 'DPP4'];
                    return (
                      <button
                        key={`opponent-group-${group}`}
                        onClick={() => handleOpponentGroupChange(group)}
                        type="button"
                        className={`flex flex-col items-center gap-1 p-2 border rounded-lg transition-colors
                          ${isSelected ? 'border-gray-600 bg-gray-50 ring-1 ring-gray-600' : 'border-gray-200 bg-white hover:bg-gray-50'}
                        `}
                      >
                        <AgentAvatar agent={representativeAgent} size={28} />
                        <span className={`text-xs font-semibold ${isSelected ? 'text-gray-800' : 'text-gray-600'}`}>{group === 'KMT' ? '國民黨' : '民進黨'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        </div>

        <MixedModeConfig
            maxK={maxK}
            setMaxK={setMaxK}
            scenariosPerSession={scenariosPerSession}
            setScenariosPerSession={setScenariosPerSession}
            targetSizePerScenario={targetSizePerScenario}
            setTargetSizePerScenario={setTargetSizePerScenario}
          />

      </div>

      {/* Column 2 (Right): Setting Preview & Launch Button */}
      <div className="w-full xl:w-1/2 flex flex-col gap-6 xl:overflow-y-auto pr-2 xl:border-l border-gray-200 xl:px-6">
        {/* Setting Preview */}
          <div className="p-5 bg-gradient-to-br from-purple-50 to-indigo-100 rounded-xl border border-purple-100 shadow-inner">
            <h3 className="text-sm font-semibold text-purple-800 uppercase tracking-wider mb-4">
              Setting Preview
            </h3>
            <div className="w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                <div className="flex flex-col bg-white/70 px-4 py-3 rounded-xl border border-purple-200/80 shadow-sm justify-center">
                  <span className="text-xs text-purple-800 font-semibold tracking-wider mb-1">Total Scenarios</span>
                  <span className="text-4xl font-black text-purple-600">{mixedStats.totalScenarios}</span>
                  <span
                    className="text-purple-600 mt-1"
                    dangerouslySetInnerHTML={{
                      __html: katex.renderToString(`= \\sum_{k=1}^{${maxK}} \\binom{9}{k} \\cdot 2^k`, {
                        throwOnError: false,
                        displayMode: false,
                        output: 'html'
                      })
                    }}
                  />
                </div>
                <div className="flex flex-col bg-white/70 px-4 py-3 rounded-xl border border-purple-200/80 shadow-sm justify-center">
                  <span className="text-xs text-purple-800 font-semibold tracking-wider mb-1">Est. Participants</span>
                  <span className="text-4xl font-black text-purple-600">~{mixedStats.estimatedParticipants}</span>
                  <span
                    className="text-purple-600 mt-1"
                    dangerouslySetInnerHTML={{
                      __html: katex.renderToString(`= \\left\\lceil \\frac{\\text{Total} \\times ${targetSizePerScenario}}{${scenariosPerSession}} \\right\\rceil`, {
                        throwOnError: false,
                        displayMode: false,
                        output: 'html'
                      })
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-col bg-white/70 px-4 py-3 rounded-xl border border-purple-200/80 shadow-sm mt-3">
                <span className="text-xs text-purple-800 font-semibold tracking-wider mb-1">Est. Cost</span>
                <span className="text-4xl font-black text-purple-600">≤ NT$ {mixedStats.maxCost.toLocaleString()}</span>
                <span
                  className="text-purple-600 mt-1"
                  dangerouslySetInnerHTML={{
                    __html: katex.renderToString(`= ${mixedStats.estimatedParticipants} \\times \\text{NT\\$}\\,${MAX_TOTAL_NTD}`, {
                      throwOnError: false,
                      displayMode: false,
                      output: 'html'
                    })
                  }}
                />
                <span className="text-sm text-purple-700 mt-1">
                  Range NT$ {mixedStats.minCost.toLocaleString()} – {mixedStats.maxCost.toLocaleString()} (NT$ {MIN_TOTAL_NTD}–{MAX_TOTAL_NTD} per participant)
                </span>
                <span className="text-xs text-purple-500 mt-1">
                  Estimate only: participants still in progress when the group closes, and replacements for invalidated submissions, add to it.
                </span>
              </div>

              <div className="flex flex-col bg-white/70 px-4 py-3 rounded-xl border border-purple-200/80 shadow-sm mt-3">
                <span className="text-xs text-purple-800 font-semibold tracking-wider mb-2">Configuration</span>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-purple-700">Maximum # of Edge</span>
                    <span className="text-sm font-bold text-purple-900 bg-white px-2 py-0.5 rounded shadow-sm">
                      {maxK}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-purple-700">Scenarios/Participant:</span>
                    <span className="text-sm font-bold text-purple-900 bg-white px-2 py-0.5 rounded shadow-sm">
                      {scenariosPerSession}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-purple-700">Target Response/Scenario:</span>
                    <span className="text-sm font-bold text-purple-900 bg-white px-2 py-0.5 rounded shadow-sm">
                      {targetSizePerScenario}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col bg-white/70 px-4 py-3 rounded-xl border border-purple-200/80 shadow-sm mt-3">
                <span className="text-xs text-purple-800 font-semibold tracking-wider mb-1.5">Role Assignment</span>
                <div className="flex flex-col gap-2 mt-auto">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-purple-700">Focal Node:</span>
                    <span className="flex items-center gap-1.5 text-sm font-bold text-purple-900 bg-white px-2 py-0.5 rounded shadow-sm">
                      <AgentAvatar agent={AGENTS[setup.focalNode as AgentId]} size={16} />
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-purple-700">Partner Node:</span>
                    <span className="flex items-center gap-1.5 text-sm font-bold text-purple-900 bg-white px-2 py-0.5 rounded shadow-sm">
                      <AgentAvatar agent={AGENTS[setup.opponentNode as AgentId]} size={16} />
                    </span>
                  </div>
                </div>
              </div>

              {/* Group Name */}
              <div className="flex flex-col bg-white/70 px-4 py-3 rounded-xl border border-purple-200/80 shadow-sm mt-3">
                <label className="text-xs text-purple-800 font-semibold tracking-wider mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder={`k≤${maxK}, Focal: ${getFocalGroupLabel(setup.focalNode)}, Target: ${getPartnerGroupLabel(setup.opponentNode)} (${new Date().toLocaleDateString('zh-TW')})`}
                  className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white"
                />
              </div>

              {/* Description */}
              <div className="flex flex-col bg-white/70 px-4 py-3 rounded-xl border border-purple-200/80 shadow-sm mt-3">
                <label className="text-xs text-purple-800 font-semibold tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder={`${scenariosPerSession} scenarios/participant, ${targetSizePerScenario} responses/scenario, Est. ${mixedStats.estimatedParticipants} participants`}
                  rows={2}
                  className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm resize-none bg-white"
                />
              </div>
            </div>
          </div>

      <div className="pt-2 mt-auto">
            <>
              <button
                onClick={() => setShowBatchConfirmModal(true)}
                disabled={isMixedCreating}
                className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
                  isMixedCreating
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700 shadow-purple-200'
                }`}
              >
                {isMixedCreating ? 'Creating Mixed Group...' : 'Launch Batch Sessions'}
              </button>

              {showBatchConfirmModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 transition-all opacity-100 visible">
                  <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative p-6 border border-gray-200">
                    <h3 className="text-xl font-extrabold text-gray-900 mb-3">Confirm Batch Sessions</h3>
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                      You are about to launch batch sessions with:
                    </p>
                    <ul className="text-sm text-gray-700 mb-6 space-y-1.5 bg-purple-50 rounded-xl p-4 border border-purple-100">
                      <li>Max k: <strong className="text-purple-700">{maxK}</strong></li>
                      <li>Scenarios per participant: <strong className="text-purple-700">{scenariosPerSession}</strong></li>
                      <li>Estimated participants: <strong className="text-purple-700">{mixedStats.estimatedParticipants}</strong></li>
                      <li>Estimated cost: <strong className="text-purple-700">NT$ {mixedStats.minCost.toLocaleString()} – {mixedStats.maxCost.toLocaleString()}</strong></li>
                    </ul>
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => setShowBatchConfirmModal(false)}
                        className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          setShowBatchConfirmModal(false);
                          handleMixedLaunch();
                        }}
                        className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors shadow-sm shadow-purple-200"
                      >
                        Yes, Launch
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
        </div>
      </div>
    </div>
  );
};

export default SetupPanel;
