import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllSessionGroups, SessionGroup, deleteSessionGroup } from '../utils/graphqlClient';
import { toast } from 'react-hot-toast';
import { getFocalGroupLabel, getPartnerGroupLabel } from '../utils/nodeDisplay';

const GroupsTable: React.FC = () => {
  const [groups, setGroups] = useState<SessionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const data = await fetchAllSessionGroups();
      setGroups(data);
    } catch (error) {
      console.error('Failed to load groups:', error);
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (groupId: string, groupName: string) => {
    if (!window.confirm(`Are you sure you want to delete group "${groupName}"?\n\nThis will delete all sessions and submissions in this group. This action cannot be undone!`)) {
      return;
    }

    setDeletingId(groupId);
    try {
      const success = await deleteSessionGroup(groupId);
      if (success) {
        toast.success('Group deleted');
        setGroups(groups.filter(g => g._id !== groupId));
      } else {
        toast.error('Failed to delete');
      }
    } catch (error) {
      console.error('Failed to delete group:', error);
      toast.error('Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-purple-100 bg-white shadow-sm p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-purple-100 bg-white shadow-sm">
      <div className="border-b border-purple-100 px-6 py-4 flex justify-between items-center">
        <h2 className="text-sm font-semibold text-purple-800 uppercase tracking-wider">
          Batch & Progress
        </h2>
        <button
          onClick={loadGroups}
          className="px-3 py-1 text-sm font-semibold text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors"
        >
          Reload
        </button>
      </div>

      <div className="overflow-x-auto px-6 py-4">
        {groups.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No Batch Groups Yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Groups will appear here after launching studies in batch mode
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-gray-400 border-b border-purple-100">
                <th className="pb-3 font-bold uppercase">Name</th>
                <th className="pb-3 font-bold uppercase">Focal</th>
                <th className="pb-3 font-bold uppercase">Partner</th>
                <th className="pb-3 font-bold uppercase">Est. N</th>
                <th className="pb-3 font-bold uppercase">Max k</th>
                <th className="pb-3 font-bold uppercase">Progress</th>
                <th className="pb-3 font-bold uppercase">Created</th>
                <th className="pb-3 font-bold uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-50">
              {groups.map(group => {
                // Calculate completion based on completionPercentage if available
                const progress = group.completionPercentage ?? 0;
                
                // Calculate estimated participants for mixed mode
                const isMixedMode = group.mode === 'mixed';
                const estParticipants = isMixedMode
                  ? Math.ceil((group.totalScenarios * (group.config.targetSizePerScenario || 1)) / (group.config.scenariosPerSession || 1))
                  : null;
                
                return (
                  <tr key={group._id} className="hover:bg-purple-50/40 transition-colors">
                    <td className="py-3 font-medium text-gray-900 max-w-xs">
                      <div className="truncate" title={group.name}>
                        {group.name}
                      </div>
                      {group.description && (
                        <div className="text-xs text-gray-500 truncate mt-0.5" title={group.description}>
                          {group.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3">
                      <span className="inline-flex px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-medium">
                        {getFocalGroupLabel(group.config.focalNode)}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="inline-flex px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-medium">
                        {getPartnerGroupLabel(group.config.opponentNode)}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="font-bold text-gray-700 text-sm">
                        {estParticipants !== null ? `~${estParticipants}` : '-'}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-purple-700 font-bold text-base">
                      {group.config.maxK || '-'}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <span className="text-xs font-bold text-purple-600 whitespace-nowrap">
                          {Math.round(progress)}%
                        </span>
                        <div className="flex-1 min-w-[60px] bg-purple-100 rounded-full h-2">
                          <div
                            className="bg-purple-500 h-2 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-gray-500 whitespace-nowrap">
                      {new Date(group.createdAt).toLocaleString('zh-TW', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/admin/view/batch/${group._id}`)}
                          className="text-purple-600 hover:text-purple-800 hover:underline font-medium"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default GroupsTable;
