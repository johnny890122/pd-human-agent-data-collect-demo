import React from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { Session, AgentId } from '../types';
import { AGENTS, ALL_EDGES } from '../constants';
import NetworkGraph from './NetworkGraph';
import { createManualSession, createMixedGroup } from '../utils/graphqlClient';
import { getNodeDisplayName, getFocalGroupLabel, getPartnerGroupLabel } from '../utils/nodeDisplay';
import MixedModeConfig from './MixedModeConfig';

import AgentAvatar from './AgentAvatar';

type LaunchMode = 'manual' | 'mixed';

interface SetupPanelProps {
  setup: Session;
  setSetup: React.Dispatch<React.SetStateAction<Session>>;
  generatedUrl: string | null;
  setGeneratedUrl: React.Dispatch<React.SetStateAction<string | null>>;
  isSaving: boolean;
  setIsSaving: React.Dispatch<React.SetStateAction<boolean>>;
  onSave: (setupToSave: Session) => Promise<string | undefined>;
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
  const navigate = useNavigate();
  const [showConfirmModal, setShowConfirmModal] = React.useState(false);
  
  // Batch mode state
  const [launchMode, setLaunchMode] = React.useState<LaunchMode>('manual');
  const [batchEdgeCount, setBatchEdgeCount] = React.useState(3);
  const [groupName, setGroupName] = React.useState('');
  const [groupDescription, setGroupDescription] = React.useState('');
  const [showBatchConfirmModal, setShowBatchConfirmModal] = React.useState(false);
  const [isBatchCreating, setIsBatchCreating] = React.useState(false);
  
  // Mixed mode state
  const [maxK, setMaxK] = React.useState(2);
  const [scenariosPerSession, setScenariosPerSession] = React.useState(20);
  const [targetSizePerScenario, setTargetSizePerScenario] = React.useState(30);
  const [isMixedCreating, setIsMixedCreating] = React.useState(false);

  const k = setup.activeEdgeIds?.length || 0;
  const scenariosCount = Math.pow(2, k);
  const isHighLoad = k > 4;
  

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

  const handleGenerateUrl = async () => {
    setIsSaving(true);
    try {
      // Use NEW API: createManualSession (Scenario-centric)
      const result = await createManualSession(
        setup.activeEdgeIds || [],
        setup.focalNode,
        setup.opponentNode,
        setup.sampleSize
      );
      
      // Update local state with returned session
      const updatedSetup = {
        ...setup,
        _id: result.session._id,
        id: result.session._id,
        scenarioIds: result.session.scenarioIds,
        scenarios: result.session.scenarios,
        submissionCount: result.session.submissionCount,
      };
      setSetup(updatedSetup);
      
      // Generate URL with sessionId (NEW format)
      const url = `${window.location.origin}/survey/welcome?sessionId=${result.session._id}`;
      setGeneratedUrl(url);
      
      toast.success(`✅ Created session with ${result.scenariosCreated} scenarios`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to create session: ${message}`);
      console.error('Create manual session error:', error);
    }
    setIsSaving(false);
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
      navigate(`/admin/groups/${result.groupId}`);
      
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

  const SummaryWidget = () => (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
        <div className="flex flex-col bg-white/70 px-4 py-3 rounded-xl border border-emerald-200/80 shadow-sm justify-center">
          <span className="text-xs text-emerald-800 font-semibold tracking-wider mb-1">Target Sample Size</span>
          <span className="text-4xl font-black text-emerald-600">{setup.sampleSize || 1}</span>
        </div>
        <div className="flex flex-col bg-white/70 px-4 py-3 rounded-xl border border-emerald-200/80 shadow-sm">
          <span className="text-xs text-emerald-800 font-semibold tracking-wider mb-1.5">Role Assignment</span>
          <div className="flex flex-col gap-2 mt-auto">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-emerald-700">Focal Node:</span>
              <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-900 bg-white px-2 py-0.5 rounded shadow-sm">
                <AgentAvatar agent={AGENTS[setup.focalNode as AgentId]} size={16} />
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-emerald-700">Partner Node:</span>
              <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-900 bg-white px-2 py-0.5 rounded shadow-sm">
                <AgentAvatar agent={AGENTS[setup.opponentNode as AgentId]} size={16} />
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col bg-white/70 px-4 py-3 rounded-xl border border-emerald-200/80 shadow-sm mt-3">
        <span className="text-xs text-emerald-800 font-semibold tracking-wider mb-2">Active Edges</span>
        <div className="flex flex-wrap gap-2">
          {(setup.activeEdgeIds?.length || 0) > 0 ? (
            setup.activeEdgeIds?.map(edgeId => {
              const edge = ALL_EDGES.find(e => e.id === edgeId);
              if (!edge) return null;
              return (
                <span key={edgeId} className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 bg-white px-2 py-1 rounded-md shadow-sm border border-emerald-100">
                  <AgentAvatar agent={AGENTS[edge.source as keyof typeof AGENTS]} size={14} />
                  {getNodeDisplayName(edge.source, setup.focalNode, setup.opponentNode)} <span className="text-emerald-500 font-bold mx-0.5">→</span>
                  <AgentAvatar agent={AGENTS[edge.target as keyof typeof AGENTS]} size={14} />
                  {getNodeDisplayName(edge.target, setup.focalNode, setup.opponentNode)}
                </span>
              );
            })
          ) : (
            <span className="text-xs font-medium text-emerald-600/80 italic">No active edges</span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col xl:flex-row xl:h-[calc(100vh-9rem)] bg-white shadow-xl xl:overflow-hidden rounded-2xl border border-gray-200 p-4 xl:p-6 gap-6">
      
      {/* Column 1 (Left): Session Configuration & Graph */}
      <div className="w-full xl:w-1/2 flex flex-col gap-4 xl:overflow-y-auto pr-2">
        
        {/* Launch Mode Selector */}
        {!readOnly && (
          <div className={`p-4 bg-gradient-to-r rounded-xl border ${
            launchMode === 'manual'
              ? 'from-green-50 to-emerald-50 border-green-200'
              : 'from-teal-50 to-cyan-50 border-teal-200'
          }`}>
            <label className={`block text-sm font-semibold mb-3 uppercase ${
              launchMode === 'manual' ? 'text-green-900' : 'text-teal-900'
            }`}>
              Launch Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLaunchMode('manual')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  launchMode === 'manual'
                    ? 'border-green-500 bg-green-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  <span className="font-bold text-sm">Manual</span>
                </div>
                <p className="text-xs text-gray-600">
                  Select edges, single session
                </p>
              </button>
              
              <button
                type="button"
                onClick={() => setLaunchMode('mixed')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  launchMode === 'mixed'
                    ? 'border-teal-500 bg-teal-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span className="font-bold text-sm">Mixed</span>
                </div>
                <p className="text-xs text-gray-600">
                  Cross-k balanced sampling
                </p>
              </button>
            </div>
          </div>
        )}
        
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-500 tracking-wider mb-3 uppercase">
            {'Configuration'}
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Focal Node</label>
                <div className={`grid grid-cols-2 gap-1.5 ${readOnly ? 'opacity-80 pointer-events-none' : ''}`}>
                  {['KMT', 'DPP'].map((group) => {
                    const isSelected = AGENTS[setup.focalNode as AgentId].group === group;
                    const representativeAgent = AGENTS[group === 'KMT' ? 'KMT1' : 'DPP3'];
                    return (
                      <button
                        key={`focal-group-${group}`}
                        onClick={() => handleFocalGroupChange(group)}
                        disabled={readOnly}
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
                <div className={`grid grid-cols-2 gap-1.5 ${readOnly ? 'opacity-80 pointer-events-none' : ''}`}>
                   {['KMT', 'DPP'].map((group) => {
                    const isSelected = AGENTS[setup.opponentNode as AgentId].group === group;
                    const representativeAgent = AGENTS[group === 'KMT' ? 'KMT2' : 'DPP4'];
                    return (
                      <button
                        key={`opponent-group-${group}`}
                        onClick={() => handleOpponentGroupChange(group)}
                        disabled={readOnly}
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

            <div>
              <label className="block text-xs text-gray-500 mb-1">Target Size</label>
              <div className="flex items-center gap-3">
                <div className={`flex-1 mx-2 flex items-center h-full pt-[2px] ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <Slider
                    min={1}
                    max={100}
                    value={setup.sampleSize || 1}
                    onChange={(val) => setSetup({ ...setup, sampleSize: val as number })}
                    disabled={readOnly}
                    trackStyle={{ backgroundColor: '#4f46e5', height: 8 }}
                    handleStyle={{ borderColor: '#4f46e5', height: 16, width: 16, marginTop: -4, backgroundColor: '#fff', opacity: readOnly ? 1 : undefined }}
                    railStyle={{ backgroundColor: '#e5e7eb', height: 8 }}
                  />
                </div>

                <span className="text-sm font-bold text-gray-700 min-w-[28px] text-right">
                  {setup.sampleSize || 1}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mixed Mode Configuration */}
        {launchMode === 'mixed' && !readOnly && (
          <MixedModeConfig
            maxK={maxK}
            setMaxK={setMaxK}
            scenariosPerSession={scenariosPerSession}
            setScenariosPerSession={setScenariosPerSession}
            targetSizePerScenario={targetSizePerScenario}
            setTargetSizePerScenario={setTargetSizePerScenario}
            groupName={groupName}
            setGroupName={setGroupName}
            groupDescription={groupDescription}
            setGroupDescription={setGroupDescription}
          />
        )}

        {/* Network Graph (Manual Mode Only) */}
        {launchMode === 'manual' && (
          <div className={`flex-1 bg-gray-100 rounded-2xl relative flex items-center justify-center p-4 overflow-hidden transition-all duration-300 min-h-[400px] border border-gray-200 shadow-inner ${generatedUrl ? 'blur-sm pointer-events-none' : ''}`}>
            <div className="w-full h-full bg-white rounded-2xl shadow-sm p-4 md:p-8 flex items-center justify-center overflow-hidden mx-auto">
              <NetworkGraph
                mode="admin"
                setup={setup}
                onEdgeClick={readOnly ? () => { } : onEdgeToggle}
                // Node click interactions disabled in admin mode as requested
              />
            </div>
          </div>
        )}
      </div>

      {/* Column 2 (Right): Summary Preview & Complexity Check & Generate Button */}
      <div className="w-full xl:w-1/2 flex flex-col gap-6 xl:overflow-y-auto pr-2 xl:border-l border-gray-200 xl:px-6">
        {/* Display Setting Preview in Manual Mode Only */}
        {launchMode === 'manual' && (
          <div className="p-5 bg-gradient-to-br from-emerald-50 to-green-100 rounded-xl border border-emerald-100 shadow-inner">
            <h3 className="text-sm font-semibold text-emerald-800 uppercase tracking-wider mb-4">
              Setting Preview
            </h3>
            <SummaryWidget />
          </div>
        )}

        {launchMode === 'manual' && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-100">
            <h3 className="text-sm font-semibold text-green-800 uppercase tracking-wider mb-2">
              Complexity Check
            </h3>
            <div className="flex justify-between items-center text-sm mb-1">
              <span># of Active Edges (k):</span>
              <span className="font-mono font-bold">{k}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span># of Total Scenarios (2^k):</span>
              <span className="font-mono font-bold">{scenariosCount}</span>
            </div>
            {isHighLoad && (
              <div className="mt-3 p-2 bg-red-100 text-red-700 text-xs rounded border border-red-200 flex items-start">
                <span className="mr-2">!</span>
                Cognitive Load Alert: {scenariosCount} scenarios may be too fatiguing for a single session.
              </div>
            )}
          </div>
        )}

      <div className="pt-2 mt-auto">
          {readOnly ? (
            <button
              onClick={onBack}
              className="w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] bg-gray-600 text-white hover:bg-gray-700 shadow-gray-200"
            >
              Back
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  if (launchMode === 'mixed') {
                    handleMixedLaunch();
                  } else {
                    setShowConfirmModal(true);
                  }
                }}
                disabled={
                  (launchMode === 'manual' && k === 0) ||
                  isSaving ||

                  isMixedCreating
                }
                className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
                  ((launchMode === 'manual' && k === 0) || isSaving || isMixedCreating)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : launchMode === 'mixed'
                    ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-teal-200'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                }`}
              >
                {isMixedCreating ? 'Creating Mixed Group...' :
                 isSaving ? 'Generating...' :
                 launchMode === 'mixed' ? 'Create Mixed Mode Group' :
                 'Launch Session'}
              </button>

              {showConfirmModal && !generatedUrl && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 transition-all opacity-100 visible">
                  <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative p-6 border border-gray-200">
                    <h3 className="text-xl font-extrabold text-gray-900 mb-3">Confirm Setup</h3>
                    <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                      You are about to generate a session with <strong className="text-indigo-600">{setup.sampleSize || 1}</strong> target participants and <strong className="text-indigo-600">{scenariosCount}</strong> scenarios. Do you want to proceed?
                    </p>
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => setShowConfirmModal(false)}
                        className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          setShowConfirmModal(false);
                          handleGenerateUrl();
                        }}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-sm shadow-indigo-200"
                      >
                        Yes, Generate
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              
              {generatedUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 transition-all opacity-100 visible">
                  <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative">
                    <button
                      onClick={() => setGeneratedUrl(null)}
                      className="absolute top-4 right-4 p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors z-10"
                      aria-label="Close modal"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <div className="p-6 bg-gradient-to-br from-emerald-50 to-green-100">
                      <div className="mb-6">
                        <p className="text-xl font-extrabold text-emerald-900 mb-4">Session is live and ready!</p>
                        <SummaryWidget />
                      </div>

                      <label className="block text-xs font-semibold text-emerald-800 mb-1.5">Session URL</label>
                      <div className="w-full p-3 bg-white border border-emerald-200 rounded-xl mb-4 shadow-sm">
                        <input
                          readOnly
                          value={generatedUrl}
                          onFocus={(e) => e.currentTarget.select()}
                          className="w-full text-sm font-mono text-emerald-900 bg-transparent outline-none"
                        />
                      </div>

                      <div className="mb-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(generatedUrl);
                            toast.success('URL copied to clipboard!');
                          }}
                          className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                        >
                          Copy URL
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {!readOnly && !generatedUrl && (
            launchMode === 'manual' && k === 0 ? (
              <p className="text-center text-xs text-gray-400 mt-2">
                Select at least one edge on the graph to begin.
              </p>
            ) : null
          )}
        </div>
      </div>
    </div>
  );
};

export default SetupPanel;
