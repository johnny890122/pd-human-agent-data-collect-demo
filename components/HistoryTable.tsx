import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchRecentSubmissions, EdgeConfigEntry } from '../utils/graphqlClient';
import { ExperimentSetup } from '../types';

interface HistoryTableProps {
  history: ExperimentSetup[];
  historyPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onLoadSetup: (setup: ExperimentSetup) => void;
}

const HistoryTable: React.FC<HistoryTableProps> = ({
  history,
  historyPage,
  pageSize,
  onPageChange,
  onLoadSetup,
}) => {
  const navigate = useNavigate();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const totalPages = Math.max(1, Math.ceil(history.length / pageSize));
  const startIdx = (historyPage - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const pagedHistory = history.slice(startIdx, endIdx);

  const [submissions, setSubmissions] = useState<EdgeConfigEntry[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState<boolean>(false);

  useEffect(() => {
    async function load() {
      if (expandedRows.size === 0) return; // Only fetch if something is expanded
      try {
        setLoadingSubmissions(true);
        const data = await fetchRecentSubmissions();
        setSubmissions(data);
      } catch (e) {
        console.error('Failed to load submissions:', e);
      } finally {
        setLoadingSubmissions(false);
      }
    }
    load();
  }, [expandedRows]);

  return (
    <div className="rounded-2xl border border-indigo-100 bg-white shadow-sm">
      <div className="border-b border-indigo-100 px-4 py-4 md:px-6">
        <h2 className="text-sm font-semibold text-indigo-800 uppercase tracking-wider">
          Sessions & Progress
        </h2>
      </div>
      <div className="overflow-x-auto px-4 py-4 md:px-6">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-gray-400 border-b border-indigo-100">
              <th className="pb-3 w-8"></th>
              <th className="pb-3 font-bold uppercase">Date</th>
              <th className="pb-3 font-bold uppercase">Session ID</th>
              <th className="pb-3 font-bold uppercase">Roles</th>
              <th className="pb-3 font-bold uppercase">k + Active Edges</th>
              <th className="pb-3 font-bold uppercase">Progress</th>
              <th className="pb-3 font-bold uppercase">Study URL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-indigo-50">
            {pagedHistory.map((s) => {
              const submissionCount = s.submissionCount ?? 0;
              const progress = s.sampleSize > 0 ? Math.min(100, (submissionCount / s.sampleSize) * 100) : 0;
              const parsedDate = s.updatedAt ? new Date(s.updatedAt) : null;
              let displayDate = '-';
              if (parsedDate && !Number.isNaN(parsedDate.getTime())) {
                const year = parsedDate.getFullYear();
                const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
                const day = String(parsedDate.getDate()).padStart(2, '0');
                const hours = String(parsedDate.getHours()).padStart(2, '0');
                const minutes = String(parsedDate.getMinutes()).padStart(2, '0');
                displayDate = `${year}/${month}/${day} ${hours}:${minutes}`;
              }
              const activeEdges = s.activeEdgeIds.length > 0 ? s.activeEdgeIds.join(', ') : '-';
              const isExpanded = s.id ? expandedRows.has(s.id) : false;

              return (
                <React.Fragment key={s.id || Math.random()}>
                  <tr className="group hover:bg-indigo-50/40 transition-colors">
                    <td className="py-3 pl-2 cursor-pointer" onClick={() => s.id && toggleRow(s.id)}>
                      <button className="text-gray-400 hover:text-indigo-600 focus:outline-none">
                        <svg className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </td>
                    <td className="py-3 text-gray-500 pr-2">
                    {displayDate}
                  </td>
                  <td className="py-3 pr-2 font-mono text-[11px]">
                    {s.id ? (
                      <button
                        type="button"
                        onClick={() => onLoadSetup(s)}
                        className="text-indigo-700 hover:text-indigo-900 hover:underline"
                      >
                        {s.id}
                      </button>
                    ) : (
                      <span className="text-gray-600">-</span>
                    )}
                  </td>
                  <td className="py-3 font-medium pr-2">
                    {s.focalNode} vs {s.opponentNode}
                  </td>
                  <td className="py-3 pr-2">
                    <span className="font-semibold text-gray-700">{s.activeEdgeIds.length}</span>
                    <span className="ml-2 text-gray-500">{activeEdges}</span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-indigo-600 whitespace-nowrap">{submissionCount}/{s.sampleSize}</span>
                      <div className="flex-1 min-w-[60px] bg-indigo-100 rounded-full h-1.5">
                        <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-2">
                    {s.id ? (
                      <button
                        type="button"
                        onClick={() => window.open(`/survey/intro/0?setupId=${s.id}`, '_blank')}
                        className="text-green-600 hover:text-green-800 hover:underline font-medium text-[11px]"
                      >
                        Open Study
                      </button>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
                {isExpanded && (
                  <tr className="bg-indigo-50/20">
                    <td colSpan={7} className="px-4 py-4 border-b border-indigo-50">
                      {loadingSubmissions ? (
                        <div className="text-gray-500 text-xs text-center">Loading submissions...</div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <span className="font-semibold text-gray-700 text-xs mb-2">Participant Submissions:</span>
                          {submissions.filter(sub => sub.sessionId === s.id).length > 0 ? (
                            <table className="w-full text-left text-xs bg-white rounded-md border border-indigo-100 overflow-hidden">
                              <thead className="bg-indigo-50">
                                <tr>
                                  <th className="px-3 py-2 font-medium text-gray-600">ID</th>
                                  <th className="px-3 py-2 font-medium text-gray-600">Status</th>
                                  <th className="px-3 py-2 font-medium text-gray-600">Start Time</th>
                                  <th className="px-3 py-2 font-medium text-gray-600">End Time</th>
                                  <th className="px-3 py-2 font-medium text-gray-600">Replay</th>
                                </tr>
                              </thead>
                              <tbody>
                                {submissions
                                  .filter((sub) => sub.sessionId === s.id)
                                  .map((sub) => (
                                    <tr key={sub.id} className="border-t border-indigo-50 hover:bg-slate-50">
                                      <td className="px-3 py-2 font-mono text-[10px] text-gray-500">{sub.id}</td>
                                      <td className="px-3 py-2">
                                        {sub.isCompleted ? (
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800">
                                            Completed
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800">
                                            Incomplete
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-3 py-2 text-gray-500">
                                        {new Date(sub.createdAt).toLocaleString()}
                                      </td>
                                      <td className="px-3 py-2 text-gray-500">
                                        {sub.updatedAt ? new Date(sub.updatedAt).toLocaleString() : '-'}
                                      </td>
                                      <td className="px-3 py-2">
                                        <button
                                          type="button"
                                          onClick={() => navigate(`/admin/replay/${sub.id}`)}
                                          className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 hover:underline font-medium px-2 py-1 bg-indigo-50 rounded border border-indigo-100 transition-colors"
                                        >
                                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                          View Replay
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
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
            {history.length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-gray-400 italic">No session found</td>
              </tr>
            )}
          </tbody>
        </table>

        {history.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-xs text-gray-600">
            <span>
              {startIdx + 1}-{Math.min(endIdx, history.length)} of {history.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onPageChange(Math.max(1, historyPage - 1))}
                disabled={historyPage === 1}
                className={`rounded-md px-3 py-1 border ${historyPage === 1 ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'text-indigo-700 border-indigo-200 hover:bg-indigo-50'}`}
              >
                Previous
              </button>
              <span>
                Page {historyPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => onPageChange(Math.min(totalPages, historyPage + 1))}
                disabled={historyPage === totalPages}
                className={`rounded-md px-3 py-1 border ${historyPage === totalPages ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'text-indigo-700 border-indigo-200 hover:bg-indigo-50'}`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryTable;
