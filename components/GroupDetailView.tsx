import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchSessionGroup, fetchSessionsByGroup, SessionGroup, fetchRecentSubmissions, invalidateSubmission, Submission, fetchScenariosByIds } from '../utils/graphqlClient';
import { Session } from '../types';
import { toast } from 'react-hot-toast';
import { AGENTS, ALL_EDGES } from '../constants';
import { getEdgeDisplayName, getFocalGroupLabel, getPartnerGroupLabel } from '../utils/nodeDisplay';
import ConfirmationModal from './ConfirmationModal';

// Helper function to determine submission stage and progress
interface StageInfo {
  stage: 'completed' | 'demographics' | 'answering';
  label: string;
  color: 'green' | 'amber' | 'red';
  progress?: number;  // 0-1
}


function getSubmissionStage(
  submission: Submission,
  totalScenarios: number,
  actualAnsweredCount?: number
): StageInfo {
  // Handle edge case: no scenarios
  if (totalScenarios === 0) {
    return {
      stage: 'answering',
      label: 'N/A',
      color: 'red',
      progress: 0
    };
  }

  // Completed submission
  if (submission.isCompleted) {
    return {
      stage: 'completed',
      label: 'Completed',
      color: 'green'
    };
  }

  // Use provided actualAnsweredCount if available, otherwise fall back to results length
  const answeredCount = actualAnsweredCount !== undefined ? actualAnsweredCount : (submission.results?.length || 0);
  // Cap at 100% in case of data inconsistency
  const progress = Math.min(answeredCount / totalScenarios, 1);
  const hasAllAnswers = answeredCount >= totalScenarios;
  const hasDemographics = submission.demographics !== null && submission.demographics !== undefined;

  // Demographics stage: finished all questions but not submitted final completion
  if (hasDemographics || hasAllAnswers) {
    return {
      stage: 'demographics',
      label: 'Demographics',
      color: 'amber',
      progress
    };
  }

  // Answering stage: still working on questions
  return {
    stage: 'answering',
    label: `Scenarios (${answeredCount}/${totalScenarios})`,
    color: progress >= 0.5 ? 'amber' : 'red',
    progress
  };
}

interface ConfirmModalState {
  isOpen: boolean;
  submissionId: string | null;
  action: 'invalidate' | 'restore';
}

const GroupDetailView: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<SessionGroup | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [expandedMixedRows, setExpandedMixedRows] = useState<Set<string>>(new Set());
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState<boolean>(false);
  const [showInvalid, setShowInvalid] = useState(false);
  const [invalidatingId, setInvalidatingId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    submissionId: null,
    action: 'invalidate'
  });

  const openConfirmModal = (submissionId: string, action: 'invalidate' | 'restore') => {
    setConfirmModal({ isOpen: true, submissionId, action });
  };

  const closeConfirmModal = () => {
    setConfirmModal({ isOpen: false, submissionId: null, action: 'invalidate' });
  };

  const handleConfirmAction = async () => {
    if (!confirmModal.submissionId) return;
    const newIsInvalid = confirmModal.action === 'invalidate';
    await handleInvalidate(confirmModal.submissionId, newIsInvalid);
    closeConfirmModal();
  };

  useEffect(() => {
    if (!groupId) {
      navigate('/admin/view/batch');
      return;
    }
    loadData();
  }, [groupId]);

  const loadData = async () => {
    if (!groupId) return;
    
    setLoading(true);
    try {
      const [groupData, sessionsData] = await Promise.all([
        fetchSessionGroup(groupId),
        fetchSessionsByGroup(groupId),
      ]);
      
      if (!groupData) {
        toast.error('Group not found');
        navigate('/admin/view/batch');
        return;
      }
      
      setGroup(groupData);
      setSessions(sessionsData);
    } catch (error) {
      console.error('Failed to load group details:', error);
      toast.error('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (sessionId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
    }
    setExpandedRows(newExpanded);
  };

  const toggleMixedRow = (sessionId: string) => {
    const newExpanded = new Set(expandedMixedRows);
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
    }
    setExpandedMixedRows(newExpanded);
  };

  // Load submissions for batch mode when rows are expanded
  useEffect(() => {
    async function loadSubmissions(showLoading = false) {
      if (expandedRows.size === 0) return;

      try {
        if (showLoading) {
          setLoadingSubmissions(true);
        }
        const data = await fetchRecentSubmissions();
        setSubmissions(data);
      } catch (e) {
        console.error('Failed to load submissions:', e);
      } finally {
        if (showLoading) {
          setLoadingSubmissions(false);
        }
      }
    }

    if (expandedRows.size > 0) {
      loadSubmissions(true);
    }

    let intervalId: NodeJS.Timeout | null = null;
    if (expandedRows.size > 0) {
      intervalId = setInterval(() => loadSubmissions(false), 5000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [expandedRows]);

  // Load submissions for mixed mode on mount and auto-refresh
  // (mixed mode shows status in the main table, not inside expanded rows)
  useEffect(() => {
    if (group?.mode !== 'mixed') return;

    async function loadMixedSubmissions() {
      try {
        const data = await fetchRecentSubmissions();
        setSubmissions(data);
      } catch (e) {
        console.error('Failed to load submissions:', e);
      }
    }

    loadMixedSubmissions();
    const intervalId = setInterval(loadMixedSubmissions, 5000);
    return () => clearInterval(intervalId);
  }, [group?.mode]);

  const handleInvalidate = async (submissionId: string, nextInvalid: boolean) => {
    setInvalidatingId(submissionId);
    try {
      const updated = await invalidateSubmission(submissionId, nextInvalid);
      setSubmissions(prev =>
        prev.map(s => s._id === submissionId ? { ...s, isInvalid: updated.isInvalid } : s)
      );
      // Reload sessions so the submissionCount on the session row stays accurate
      const sessionsData = await fetchSessionsByGroup(groupId!);
      setSessions(sessionsData);
      toast.success(nextInvalid ? 'Marked as invalid' : 'Restored');
    } catch (e) {
      toast.error('Action failed');
    } finally {
      setInvalidatingId(null);
    }
  };

  /**
   * Export complete submission data as CSV
   *
   * Format: Row-per-answer (long format) with 22 columns
   * - Each row = one participant's response to one scenario
   * - Includes full scenario configuration, demographics, timestamps
   * - Handles empty submissions and deleted scenarios
   *
   * Columns (22 total):
   * Group Name, Group ID, Session ID, Submission ID, Participant ID,
   * Scenario ID, Scenario Index, Focal Node, Opponent Node, Active Edges,
   * Edge Count (k), Edge States (JSON), Cooperation Probability,
   * Response Time (ms), Answered At, Age, Gender, Education,
   * Submission Completed, Submission Invalid, Submission Created At, Submission Completed At
   */
  const handleExportCSV = async () => {
    if (!group || sessions.length === 0 || submissions.length === 0) {
      toast.error('No submission data to export');
      return;
    }

    try {
      toast.loading('Generating CSV...', { id: 'csv-export' });

      // Step 1: Collect all unique scenario IDs from submissions
      const scenarioIds = new Set<string>();
      submissions.forEach(sub => {
        sub.results?.forEach(result => {
          scenarioIds.add(result.scenarioId);
        });
      });

      // Step 2: Fetch all scenarios
      const scenarios = await fetchScenariosByIds(Array.from(scenarioIds));
      const scenariosMap = new Map(scenarios.map(s => [s._id, s]));

      // Step 3: Generate CSV rows (one row per answer)
      const groupName = group.name || "Standalone Session";
      const groupId = group._id || "";

      // CSV Helper: Escape cell values
      const escapeCSV = (value: any): string => {
        if (value === null || value === undefined) return '';
        const str = String(value);
        // Escape if contains comma, quote, or newline
        if (/[",\n\r]/.test(str)) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const rows: string[][] = [];

      // Step 4: For each submission, generate rows
      for (const submission of submissions) {
        // Handle empty submissions (no answers yet)
        if (!submission.results || submission.results.length === 0) {
          rows.push([
            groupName,
            groupId,
            submission.sessionId || '',
            submission._id || '',
            submission.participantId || '',
            '', // Scenario ID
            '', // Scenario Index
            '', // Focal Node
            '', // Opponent Node
            '', // Active Edges
            '', // Edge Count
            '', // Edge States
            '', // Cooperation Probability
            '', // Response Time
            '', // Answered At
            submission.demographics?.age?.toString() || '',
            submission.demographics?.gender || '',
            submission.demographics?.education || '',
            submission.isCompleted ? 'true' : 'false',
            submission.isInvalid ? 'true' : 'false',
            submission.createdAt || '',
            submission.completedAt || ''
          ]);
          continue;
        }

        // Generate one row per answer
        for (const result of submission.results) {
          const scenario = scenariosMap.get(result.scenarioId);

          if (!scenario) {
            // Handle deleted scenario
            console.warn(`Scenario ${result.scenarioId} referenced but not found`);
            rows.push([
              groupName,
              groupId,
              submission.sessionId || '',
              submission._id || '',
              submission.participantId || '',
              result.scenarioId,
              'DELETED',
              'DELETED',
              'DELETED',
              'DELETED',
              'DELETED',
              'DELETED',
              result.cooperationProbability?.toString() || '',
              result.responseTime?.toString() || '',
              result.answeredAt || '',
              submission.demographics?.age?.toString() || '',
              submission.demographics?.gender || '',
              submission.demographics?.education || '',
              submission.isCompleted ? 'true' : 'false',
              submission.isInvalid ? 'true' : 'false',
              submission.createdAt || '',
              submission.completedAt || ''
            ]);
            continue;
          }

          // Normal case: scenario found
          rows.push([
            groupName,
            groupId,
            submission.sessionId || '',
            submission._id || '',
            submission.participantId || '',
            scenario._id,
            scenario.scenarioIndex?.toString() || '',
            scenario.focalNode || '',
            scenario.opponentNode || '',
            scenario.activeEdgeIds?.join('; ') || '',
            scenario.activeEdgeIds?.length?.toString() || '0',
            JSON.stringify(scenario.edgeStates || {}),
            result.cooperationProbability?.toString() || '',
            result.responseTime?.toString() || '',
            result.answeredAt || '',
            submission.demographics?.age?.toString() || '',
            submission.demographics?.gender || '',
            submission.demographics?.education || '',
            submission.isCompleted ? 'true' : 'false',
            submission.isInvalid ? 'true' : 'false',
            submission.createdAt || '',
            submission.completedAt || ''
          ]);
        }
      }

      // Step 5: Generate CSV content
      const headers = [
        'Group Name',
        'Group ID',
        'Session ID',
        'Submission ID',
        'Participant ID',
        'Scenario ID',
        'Scenario Index',
        'Focal Node',
        'Opponent Node',
        'Active Edges',
        'Edge Count (k)',
        'Edge States (JSON)',
        'Cooperation Probability',
        'Response Time (ms)',
        'Answered At',
        'Age',
        'Gender',
        'Education',
        'Submission Completed',
        'Submission Invalid',
        'Submission Created At',
        'Submission Completed At'
      ];

      const csvContent = [
        headers.map(escapeCSV).join(','),
        ...rows.map(row => row.map(escapeCSV).join(','))
      ].join('\n');

      // Step 6: Generate filename with timestamp
      const now = new Date();
      const timestamp = now.toISOString()
        .replace(/[-:]/g, '')
        .replace(/T/, '_')
        .replace(/\..+/, '')
        .slice(0, 15); // YYYYMMDD_HHmmss
      const safeName = group.name.replace(/[^a-z0-9\u4e00-\u9fa5_-]/gi, '_');
      const filename = `${safeName}_submissions_${timestamp}.csv`;

      // Step 7: Create and download blob with UTF-8 BOM
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      
      // Cleanup
      URL.revokeObjectURL(link.href);

      toast.success(`CSV 已匯出: ${filename}`, { id: 'csv-export' });
    } catch (error) {
      console.error('Failed to export CSV:', error);
      toast.error('CSV 匯出失敗', { id: 'csv-export' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Group Not Found</h2>
          <button
            onClick={() => navigate('/admin/view/batch')}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  const progress = group.totalSessions > 0 && group.completionPercentage != null
    ? group.completionPercentage
    : 0;

  const isMixedMode = group.mode === 'mixed';
  const masterUrl = isMixedMode ? `${window.location.origin}/survey/welcome?groupId=${groupId}&mode=mixed` : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Back Button */}
        <button
          onClick={() => navigate('/admin/view/batch')}
          className="mb-4 flex items-center gap-2 text-purple-600 hover:text-purple-800 font-semibold"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Group Info Card */}
        <div className="p-5 bg-gradient-to-br from-purple-50 to-indigo-100 rounded-xl border border-purple-100 shadow-inner">
          <div className="mb-4">
            <h1 className="text-sm font-semibold text-purple-800 uppercase tracking-wider mb-3">
              {group.name}
            </h1>
            {group.description && (
              <p className="text-sm text-purple-700 bg-white/60 px-3 py-2 rounded-lg border border-purple-200/50">{group.description}</p>
            )}
          </div>
          
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
            {isMixedMode && (
              <>
                <div className="flex flex-col bg-white/70 px-4 py-3 rounded-xl border border-purple-200/80 shadow-sm justify-center">
                  <span className="text-xs text-purple-800 font-semibold tracking-wider mb-1">Total Scenarios</span>
                  <span className="text-4xl font-black text-purple-600">{group.totalScenarios}</span>
                </div>
                <div className="flex flex-col bg-white/70 px-4 py-3 rounded-xl border border-purple-200/80 shadow-sm justify-center">
                  <span className="text-xs text-purple-800 font-semibold tracking-wider mb-1">Est. Participants</span>
                  <span className="text-4xl font-black text-purple-600">
                    ~{Math.ceil((group.totalScenarios * (group.config.targetSizePerScenario || 1)) / (group.config.scenariosPerSession || 1))}
                  </span>
                </div>
              </>
            )}
            {!isMixedMode && (
              <>
                <div className="flex flex-col bg-white/70 px-4 py-3 rounded-xl border border-purple-200/80 shadow-sm justify-center">
                  <span className="text-xs text-purple-800 font-semibold tracking-wider mb-1">Total Sessions</span>
                  <span className="text-4xl font-black text-purple-600">{group.totalSessions}</span>
                </div>
                <div className="flex flex-col bg-white/70 px-4 py-3 rounded-xl border border-purple-200/80 shadow-sm justify-center">
                  <span className="text-xs text-purple-800 font-semibold tracking-wider mb-1">Completion</span>
                  <span className="text-4xl font-black text-purple-600">{Math.round(progress)}%</span>
                </div>
              </>
            )}
          </div>

          {/* Configuration Card */}
          <div className="flex flex-col bg-white/70 px-4 py-3 rounded-xl border border-purple-200/80 shadow-sm mb-3">
            <span className="text-xs text-purple-800 font-semibold tracking-wider mb-2">Configuration</span>
            <div className="space-y-2">
              {isMixedMode && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-purple-700">Maximum # of Edge:</span>
                    <span className="text-sm font-bold text-purple-900 bg-white px-2 py-0.5 rounded shadow-sm">
                      {group.config.maxK}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-purple-700">Scenarios/Participant:</span>
                    <span className="text-sm font-bold text-purple-900 bg-white px-2 py-0.5 rounded shadow-sm">
                      {group.config.scenariosPerSession}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-purple-700">Target Response/Scenario:</span>
                    <span className="text-sm font-bold text-purple-900 bg-white px-2 py-0.5 rounded shadow-sm">
                      {group.config.targetSizePerScenario}
                    </span>
                  </div>
                </>
              )}
              {!isMixedMode && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-purple-700">Sample Size per Session:</span>
                  <span className="text-sm font-bold text-purple-900 bg-white px-2 py-0.5 rounded shadow-sm">
                    {group.config.sampleSize}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Role Assignment Card */}
          <div className="flex flex-col bg-white/70 px-4 py-3 rounded-xl border border-purple-200/80 shadow-sm">
            <span className="text-xs text-purple-800 font-semibold tracking-wider mb-2">Role Assignment</span>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-purple-700">Focal Node:</span>
                <span className="text-sm font-bold text-purple-900 bg-white px-2 py-0.5 rounded shadow-sm">
                  {getFocalGroupLabel(group.config.focalNode)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-purple-700">Partner Node:</span>
                <span className="text-sm font-bold text-purple-900 bg-white px-2 py-0.5 rounded shadow-sm">
                  {getPartnerGroupLabel(group.config.opponentNode)}
                </span>
              </div>
            </div>
          </div>

          {/* Master URL for Mixed Mode */}
          {isMixedMode && (
            <div className="flex flex-col bg-white/70 px-4 py-3 rounded-xl border border-purple-200/80 shadow-sm mt-3">
              <span className="text-xs text-purple-800 font-semibold tracking-wider mb-2">Public URL</span>
              <p className="text-xs text-purple-700 mb-2">
                Share this URL with all participants. Each will receive {group.config.scenariosPerSession} balanced scenarios.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={`${window.location.origin}/survey/welcome?groupId=${groupId}&mode=mixed`}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white border border-purple-300 rounded-lg text-xs font-mono"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/survey/welcome?groupId=${groupId}&mode=mixed`);
                    toast.success('URL copied!');
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 transition-colors whitespace-nowrap"
                >
                  Copy
                </button>
              </div>
            </div>
          )}

        </div>
        
        {/* Sessions List */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">
              All Submission ({sessions.length})
            </h2>
            <button
              onClick={handleExportCSV}
              disabled={sessions.length === 0 || submissions.length === 0}
              className={`px-4 py-2 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${'bg-purple-600 hover:bg-purple-700'}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
          </div>
          
          {/* Tab-based view selector */}
          <div className="border-b border-gray-200 px-6 py-3">
            <div className="flex gap-6">
              <button
                onClick={() => setShowInvalid(false)}
                className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${
                  !showInvalid
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Valid ({submissions.filter(s => !s.isInvalid).length})
              </button>
              <button
                onClick={() => setShowInvalid(true)}
                className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${
                  showInvalid
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Invalid ({submissions.filter(s => s.isInvalid).length})
              </button>
            </div>
          </div>
          
          {sessions.length === 0 && group.mode === 'mixed' ? (
            <div className="px-6 py-12 text-center">
              <div className="text-purple-600 text-sm font-medium mb-2">Sessions Created Dynamically</div>
              <p className="text-gray-500 text-xs mb-1">
                When participants open the URL, the system will automatically create a personal session for them
              </p>
              <p className="text-gray-400 text-xs">
                Scenario Pool: {group.totalScenarios} scenarios
              </p>
            </div>
          ) : (
            <>
              {/* Empty state for Invalid tab with no invalid submissions */}
              {showInvalid && submissions.filter(s => s.isInvalid).length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-500 text-sm">No invalid submissions</p>
                </div>
              ) : (
                <div className="overflow-x-auto px-6 py-4">
                  {isMixedMode ? (
                /* Mixed Mode Table: Direct display of participant info (1 session = 1 participant) */
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="pb-3 font-bold text-gray-600 w-12">#</th>
                      <th className="pb-3 font-bold text-gray-600 w-48">Participant ID</th>
                      <th className="pb-3 font-bold text-gray-600 w-40">Scenarios</th>
                      <th className="pb-3 font-bold text-gray-600 w-32">Status</th>
                      <th className="pb-3 font-bold text-gray-600">Progress</th>
                      <th className="pb-3 font-bold text-gray-600 w-20"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sessions.map((session, index) => {
                     const submission = submissions.find(sub => sub.sessionId === session._id);
                     if (showInvalid) {
                       if (!submission?.isInvalid) return null;
                     } else {
                       if (submission?.isInvalid) return null;
                     }
                     const totalScenarios = session.scenarios?.length || session.scenarioIds?.length || 0;

                     const answeredCount = submission?.results ?
                       session.scenarios?.filter(scenario =>
                         submission.results.some(r => r.scenarioId === scenario._id)
                       ).length || 0
                       : 0;

                     const stageInfo = submission ? getSubmissionStage(submission, totalScenarios, answeredCount) : null;
                     const isExpanded = expandedMixedRows.has(session._id);

                      return (
                        <React.Fragment key={session._id}>
                          <tr className={`hover:bg-gray-50 transition-colors ${submission?.isInvalid ? 'opacity-40' : ''}`}>
                            <td className="py-3 text-gray-500">{index + 1}</td>
                            <td className="py-3 font-mono text-xs text-purple-700">
                              <div className="truncate max-w-[150px]" title={submission?.participantId || session._id}>
                                {submission?.participantId || session._id}
                              </div>
                            </td>
                            <td className="py-3">
                              <button
                                onClick={() => toggleMixedRow(session._id)}
                                className="text-purple-600 hover:text-purple-800 hover:underline font-medium text-xs flex items-center gap-1"
                              >
                                <svg className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                View {totalScenarios} Scenario{totalScenarios !== 1 ? 's' : ''}
                              </button>
                            </td>
                            <td className="py-3">
                              {submission?.isInvalid ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700">
                                  Invalid
                                </span>
                              ) : submission ? (
                                submission.isCompleted ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800">
                                    Completed
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800">
                                    In Progress
                                  </span>
                                )
                              ) : (
                                <span className="text-gray-400 text-xs">Not Started</span>
                              )}
                            </td>
                            <td className="py-3">
                              {submission && stageInfo ? (
                                <div className="flex flex-col gap-1">
                                  <span className="text-[10px] font-medium text-gray-700">
                                    {stageInfo.label}
                                  </span>
                                  {!submission.isCompleted && stageInfo.progress !== undefined && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-gray-500 whitespace-nowrap">
                                        {answeredCount}/{totalScenarios}
                                      </span>
                                      <div className="w-16 bg-gray-200 rounded-full h-1">
                                        <div
                                          className={`h-1 rounded-full transition-all ${
                                            stageInfo.color === 'amber' ? 'bg-amber-500' : stageInfo.color === 'green' ? 'bg-green-500' : 'bg-red-500'
                                          }`}
                                          style={{ width: `${(stageInfo.progress * 100).toFixed(0)}%` }}
                                        />
                                      </div>
                                      <span className="text-[10px] text-gray-500 whitespace-nowrap">
                                        {(stageInfo.progress * 100).toFixed(0)}%
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400 text-xs">-</span>
                              )}
                            </td>
                            <td className="py-3">
                              {submission && !submission.isInvalid && (
                                <button
                                  onClick={() => openConfirmModal(submission._id, 'invalidate')}
                                  disabled={invalidatingId === submission._id}
                                  title="Mark as invalid"
                                  className="w-8 h-8 flex items-center justify-center rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors disabled:opacity-50"
                                >
                                  {invalidatingId === submission._id ? (
                                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                  ) : (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  )}
                                </button>
                              )}
                              {submission && submission.isInvalid && (
                                <button
                                  onClick={() => openConfirmModal(submission._id, 'restore')}
                                  disabled={invalidatingId === submission._id}
                                  title="Restore to valid"
                                  className="w-8 h-8 flex items-center justify-center rounded-lg text-green-600 hover:bg-green-50 hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-colors disabled:opacity-50"
                                >
                                  {invalidatingId === submission._id ? (
                                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                  ) : (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                  )}
                                </button>
                              )}
                            </td>
                          </tr>
                          
                          {/* Expanded Row: Show Scenarios Details */}
                          {isExpanded && (
                            <tr className={`bg-purple-50/20 ${submission?.isInvalid ? 'opacity-40' : ''}`}>
                              <td colSpan={6} className="px-4 py-3 border-b border-gray-100">
                                {session.scenarios && session.scenarios.length > 0 ? (
                                  <table className="w-full text-left text-xs bg-white rounded-md border border-purple-100 overflow-hidden">
                                    <thead className="bg-purple-50">
                                      <tr>
                                        <th className="px-3 py-2 font-medium text-gray-500">#</th>
                                        <th className="px-3 py-2 font-medium text-gray-500">k</th>
                                        <th className="px-3 py-2 font-medium text-gray-500">Edge Details</th>
                                        <th className="px-3 py-2 font-medium text-gray-500">Status</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {session.scenarios.map((scenario, idx) => {
                                        const scenarioResult = submission?.results?.find(r => r.scenarioId === scenario._id);
                                        const isAnswered = !!scenarioResult;

                                        return (
                                          <tr key={scenario._id} className="border-t border-purple-50 hover:bg-slate-50">
                                            <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                                            <td className="px-3 py-2 text-purple-600 font-semibold">
                                              {scenario.activeEdgeIds?.length || 0}
                                            </td>
                                            <td className="px-3 py-2">
                                              <div className="flex flex-wrap gap-2">
                                                {scenario.activeEdgeIds?.map(edgeId => {
                                                  const edgeState = scenario.edgeStates?.[edgeId];
                                                  const isGiven = edgeState === 'give';
                                                  return (
                                                    <div
                                                      key={edgeId}
                                                      className={`flex flex-col px-2 py-1 rounded border text-[10px] ${
                                                        isGiven
                                                          ? 'bg-green-50 border-green-200'
                                                          : 'bg-red-50 border-red-200'
                                                      }`}
                                                    >
                                                      <span className="text-gray-700">
                                                        {getEdgeDisplayName(edgeId, group.config.focalNode, group.config.opponentNode)}
                                                      </span>
                                                      <span className={`font-semibold ${isGiven ? 'text-green-700' : 'text-red-700'}`}>
                                                        ({isGiven ? '給予' : '不給予'})
                                                      </span>
                                                    </div>
                                                  );
                                                }) || <span className="text-gray-400">-</span>}
                                              </div>
                                            </td>
                                            <td className="px-3 py-2">
                                              {isAnswered ? (
                                                <div className="flex items-center gap-2">
                                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800">
                                                    Answered
                                                  </span>
                                                  <span className="text-[10px] text-gray-500">
                                                    ({scenarioResult.cooperationProbability * 100}%)
                                                  </span>
                                                </div>
                                              ) : (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                                                  Not Answered
                                                </span>
                                              )}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                ) : (
                                  <div className="text-gray-400 text-xs italic">No scenarios found for this session.</div>
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                /* Batch Mode Table: Expandable rows (1 session = multiple participants) */
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="pb-3 w-8"></th>
                      <th className="pb-3 font-bold text-gray-600">#</th>
                      <th className="pb-3 font-bold text-gray-600">Session ID</th>
                      <th className="pb-3 font-bold text-gray-600">Active Edges</th>
                      <th className="pb-3 font-bold text-gray-600">Scenarios</th>
                      <th className="pb-3 font-bold text-gray-600">Progress</th>
                      <th className="pb-3 font-bold text-gray-600">Study URL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sessions.map((session, index) => {
                      const subProgress = session.sampleSize > 0
                        ? ((session.submissionCount || 0) / session.sampleSize) * 100
                        : 0;
                      const isExpanded = expandedRows.has(session._id);
                      
                      return (
                        <React.Fragment key={session._id}>
                          <tr className="hover:bg-gray-50 transition-colors">
                            <td className="py-3 pl-2 cursor-pointer" onClick={() => toggleRow(session._id)}>
                              <button className="text-gray-400 hover:text-purple-600 focus:outline-none">
                                <svg className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </td>
                            <td className="py-3 text-gray-500">{index + 1}</td>
                            <td className="py-3 font-mono text-xs text-purple-700">
                              <div className="truncate max-w-[200px]" title={session._id}>
                                {session._id}
                              </div>
                            </td>
                            <td className="py-3">
                              <div className="flex flex-wrap gap-1">
                                {session.scenarios?.[0]?.activeEdgeIds?.map(edgeId => (
                                  <span
                                    key={edgeId}
                                    className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium"
                                  >
                                    {getEdgeDisplayName(edgeId, group.config.focalNode, group.config.opponentNode)}
                                  </span>
                                )) || <span className="text-gray-400 text-xs">Loading...</span>}
                              </div>
                            </td>
                            <td className="py-3 font-bold text-gray-700">
                              {session.scenarios?.length || session.scenarioIds?.length || 0}
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold whitespace-nowrap">
                                  {session.submissionCount || 0}/{session.sampleSize}
                                </span>
                                <div className="w-20 bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className="bg-green-500 h-1.5 rounded-full transition-all"
                                    style={{ width: `${subProgress}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-3">
                              <button
                                onClick={() => window.open(`/survey/welcome?sessionId=${session._id}`, '_blank')}
                                className="text-purple-600 hover:text-purple-800 hover:underline font-medium flex items-center gap-1"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                Open
                              </button>
                            </td>
                          </tr>
                          
                          {/* Expanded Row: Show Submissions */}
                          {isExpanded && (
                            <tr className="bg-purple-50/20">
                              <td colSpan={7} className="px-4 py-4 border-b border-gray-100">
                                {loadingSubmissions ? (
                                  <div className="text-gray-500 text-xs text-center">Loading submissions...</div>
                                ) : (
                                  <div className="flex flex-col gap-2">
                                    <span className="font-semibold text-gray-700 text-xs mb-2">Participant Submissions:</span>
                                    {submissions.filter(sub => sub.sessionId === session._id).length > 0 ? (
                                      <table className="w-full text-left text-xs bg-white rounded-md border border-purple-100 overflow-hidden">
                                        <thead className="bg-purple-50">
                                          <tr>
                                            <th className="px-3 py-2 font-medium text-gray-600">Participant ID</th>
                                            <th className="px-3 py-2 font-medium text-gray-600">Status</th>
                                            <th className="px-3 py-2 font-medium text-gray-600">Progress</th>
                                            <th className="px-3 py-2 font-medium text-gray-600">Start Time</th>
                                            <th className="px-3 py-2 font-medium text-gray-600">End Time</th>
                                            <th className="px-3 py-2 font-medium text-gray-600"></th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {submissions
                                            .filter((sub) => sub.sessionId === session._id && (showInvalid || !sub.isInvalid))
                                            .map((sub) => {
                                              const totalScenarios = session.scenarios?.length || session.scenarioIds?.length || 0;

                                              const answeredCount = sub.results ?
                                                session.scenarios?.filter(scenario =>
                                                  sub.results.some(r => r.scenarioId === scenario._id)
                                                ).length || 0
                                                : 0;

                                              const stageInfo = getSubmissionStage(sub, totalScenarios, answeredCount);

                                              return (
                                                <tr key={sub._id} className={`border-t border-purple-50 hover:bg-slate-50 ${sub.isInvalid ? 'opacity-40' : ''}`}>
                                                  <td className="px-3 py-2 font-mono text-[10px] text-gray-500">{sub.participantId || sub._id}</td>
                                                  <td className="px-3 py-2">
                                                    {sub.isInvalid ? (
                                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700">
                                                        Invalid
                                                      </span>
                                                    ) : sub.isCompleted ? (
                                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800">
                                                        Completed
                                                      </span>
                                                    ) : (
                                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800">
                                                        Incomplete
                                                      </span>
                                                    )}
                                                  </td>

                                                  <td className="px-3 py-2">
                                                    <div className="flex flex-col gap-1">
                                                      <span className="text-[10px] font-medium text-gray-700">
                                                        {stageInfo.label}
                                                      </span>
                                                      {!sub.isCompleted && stageInfo.progress !== undefined && (
                                                        <div className="flex items-center gap-2">
                                                          <span className="text-[10px] text-gray-500 whitespace-nowrap">
                                                            {answeredCount}/{totalScenarios}
                                                          </span>
                                                          <div className="flex-1 min-w-[60px] bg-gray-200 rounded-full h-1">
                                                            <div
                                                              className={`h-1 rounded-full transition-all duration-500 ease-out ${
                                                                stageInfo.color === 'amber' ? 'bg-amber-500' : 'bg-red-500'
                                                              }`}
                                                              style={{ width: `${(stageInfo.progress * 100).toFixed(0)}%` }}
                                                            />
                                                          </div>
                                                          <span className="text-[10px] text-gray-500 whitespace-nowrap">
                                                            {(stageInfo.progress * 100).toFixed(0)}%
                                                          </span>
                                                        </div>
                                                      )}
                                                    </div>
                                                  </td>

                                                  <td className="px-3 py-2 text-gray-500">
                                                    {new Date(sub.createdAt).toLocaleString()}
                                                  </td>
                                                  <td className="px-3 py-2 text-gray-500">
                                                    {sub.updatedAt ? new Date(sub.updatedAt).toLocaleString() : '-'}
                                                  </td>
                                                  <td className="px-3 py-2">
                                                    {!sub.isInvalid && (
                                                      <button
                                                        onClick={() => openConfirmModal(sub._id, 'invalidate')}
                                                        disabled={invalidatingId === sub._id}
                                                        title="Mark as invalid"
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors disabled:opacity-50"
                                                      >
                                                        {invalidatingId === sub._id ? (
                                                          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                          </svg>
                                                        ) : (
                                                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                          </svg>
                                                        )}
                                                      </button>
                                                    )}
                                                    {sub.isInvalid && (
                                                      <button
                                                        onClick={() => openConfirmModal(sub._id, 'restore')}
                                                        disabled={invalidatingId === sub._id}
                                                        title="Restore to valid"
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg text-green-600 hover:bg-green-50 hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-colors disabled:opacity-50"
                                                      >
                                                        {invalidatingId === sub._id ? (
                                                          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                          </svg>
                                                        ) : (
                                                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                          </svg>
                                                        )}
                                                      </button>
                                                    )}
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                        </tbody>
                                      </table>
                                    ) : (
                                      <div className="text-gray-400 text-xs italic">No submissions for this session yet.</div>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={handleConfirmAction}
        title={confirmModal.action === 'invalidate' ? 'Mark Submission as Invalid?' : 'Restore Submission?'}
        message={
          confirmModal.action === 'invalidate'
            ? 'This will exclude this submission from all counts and free the participant slot. This action is reversible.'
            : 'This will include this submission in counts again. Make sure this is a legitimate response.'
        }
        confirmText={confirmModal.action === 'invalidate' ? 'Mark Invalid' : 'Restore'}
        cancelText="Cancel"
        confirmColor={confirmModal.action === 'invalidate' ? 'red' : 'green'}
      />
    </div>
  );
};

export default GroupDetailView;
