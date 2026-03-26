import React from 'react';
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
  const totalPages = Math.max(1, Math.ceil(history.length / pageSize));
  const startIdx = (historyPage - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const pagedHistory = history.slice(startIdx, endIdx);

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

              return (
                <tr key={s.id} className="group hover:bg-indigo-50/40 transition-colors">
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
              );
            })}
            {history.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-gray-400 italic">No session found</td>
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
