import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchSessionGroup, fetchSessionsByGroup, SessionGroup } from '../utils/graphqlClient';
import { SessionSetup } from '../types';
import { toast } from 'react-hot-toast';
import { AGENTS, ALL_EDGES } from '../constants';
import { getEdgeDisplayName, getFocalGroupLabel, getPartnerGroupLabel } from '../utils/nodeDisplay';

const GroupDetailView: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<SessionGroup | null>(null);
  const [sessions, setSessions] = useState<SessionSetup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) {
      navigate('/admin/groups');
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
        navigate('/admin/groups');
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

  const handleExportCSV = () => {
    if (!group || sessions.length === 0) return;

    const headers = ['#', 'Session ID', 'Focal Node Group', 'Partner Node Group', 'Active Edges', 'Progress', 'Study URL'];
    const focalLabel = getFocalGroupLabel(group.focalNode);
    const partnerLabel = getPartnerGroupLabel(group.opponentNode);
    const rows = sessions.map((session, index) => [
      index + 1,
      session.id || '',
      focalLabel,
      partnerLabel,
      session.activeEdgeIds.map(eid => getEdgeDisplayName(eid, group.focalNode, group.opponentNode)).join(' | '),
      `${session.submissionCount || 0}/${session.sampleSize}`,
      `${window.location.origin}/survey/welcome?setupId=${session.id}`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${group.name.replace(/[^a-z0-9]/gi, '_')}_sessions.csv`;
    link.click();
    
    toast.success('CSV exported');
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
            onClick={() => navigate('/admin/groups')}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Back to Groups
          </button>
        </div>
      </div>
    );
  }

  const progress = group.totalSessions > 0 
    ? (group.completedSessions / group.totalSessions) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Back Button */}
        <button
          onClick={() => navigate('/admin/groups')}
          className="mb-4 flex items-center gap-2 text-purple-600 hover:text-purple-800 font-semibold"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Groups
        </button>

        {/* Group Info Card */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-200 p-6 mb-6 shadow-sm">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-purple-900 mb-2">
              {group.name}
            </h1>
            {group.description && (
              <p className="text-sm text-gray-600">{group.description}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-xs text-gray-500 mb-1">Focal Group</div>
              <div className="text-lg font-bold text-purple-700">{getFocalGroupLabel(group.focalNode)}</div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-xs text-gray-500 mb-1">Partner Group</div>
              <div className="text-lg font-bold text-purple-700">{getPartnerGroupLabel(group.opponentNode)}</div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-xs text-gray-500 mb-1">Edge Count (k)</div>
              <div className="text-2xl font-bold text-purple-700">{group.edgeCount}</div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-xs text-gray-500 mb-1">Total Sessions</div>
              <div className="text-2xl font-bold text-purple-700">{group.totalSessions}</div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-xs text-gray-500 mb-1">Sample Size</div>
              <div className="text-2xl font-bold text-purple-700">{group.sampleSize}</div>
            </div>
          </div>

        </div>
        
        {/* Sessions List */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">
              All Sessions ({sessions.length})
            </h2>
            <button
              onClick={handleExportCSV}
              disabled={sessions.length === 0}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
          </div>
          
          <div className="overflow-x-auto px-6 py-4">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200">
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
                  
                  return (
                    <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 text-gray-500">{index + 1}</td>
                      <td className="py-3 font-mono text-xs text-purple-700">
                        <div className="truncate max-w-[200px]" title={session.id}>
                          {session.id}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1">
                          {session.activeEdgeIds.map(edgeId => (
                            <span
                              key={edgeId}
                              className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium"
                            >
                              {group ? getEdgeDisplayName(edgeId, group.focalNode, group.opponentNode) : edgeId}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 font-bold text-gray-700">
                        {session.scenarios.length}
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
                          onClick={() => window.open(`/survey/welcome?setupId=${session.id}`, '_blank')}
                          className="text-purple-600 hover:text-purple-800 hover:underline font-medium flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Open
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupDetailView;
