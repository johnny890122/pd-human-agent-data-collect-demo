import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Session, AgentId } from '../types';
import { AGENTS } from '../constants';
import { generateDesignMatrix } from '../utils/math';
import { fetchAllSessions, clearDatabase } from '../utils/graphqlClient';
import HistoryTable from './HistoryTable';
import SetupPanel from './SetupPanel';
import GroupsTable from './GroupsTable';
import GroupDetailView from './GroupDetailView';

interface AdminViewProps {
  setup: Session;
  setSetup: React.Dispatch<React.SetStateAction<Session>>;
  onSave: (setupToSave: Session) => Promise<string | undefined>; // Returns the setup ID
}

const AdminView: React.FC<AdminViewProps> = ({ setup, setSetup, onSave }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab: 'setup' | 'history' | 'groups' =
    location.pathname === '/admin/history' ? 'history' :
    location.pathname.startsWith('/admin/groups') ? 'groups' :
    location.pathname.startsWith('/admin/setup') ? 'setup' :
    'setup';
  const isReadOnly = location.state?.readOnly === true;
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [history, setHistory] = useState<Session[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (activeTab === 'history') {
      const loadHistory = async () => {
        try {
          // Fetch from NEW API (sessions collection) with populated scenarios
          const sessions = await fetchAllSessions(true);  // excludeGroupSessions = true
          
          // Convert to Session format for compatibility
          const data = sessions.map(session => ({
            _id: session._id,
            id: session._id,
            scenarioIds: session.scenarioIds,
            scenarios: session.scenarios || [],
            focalNode: session.focalNode,
            opponentNode: session.opponentNode,
            // Use activeEdgeIds from backend resolver (BUG-003 fix)
            activeEdgeIds: session.activeEdgeIds || [],
            sampleSize: session.sampleSize,
            submissionCount: session.submissionCount,
            groupId: session.groupId,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
          }));
          
          setHistory(data);
          setHistoryPage(1);
        } catch (error) {
          console.error("Failed to load history", error);
        }
      };
      loadHistory();
    }
  }, [activeTab]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(history.length / pageSize));
    if (historyPage > totalPages) {
      setHistoryPage(totalPages);
    }
  }, [history, historyPage]);

  const handleNodeInteraction = (nodeId: AgentId) => {
    if (nodeId === setup.focalNode) {
      setSetup(prev => ({
        ...prev,
        focalNode: prev.opponentNode,
        opponentNode: prev.focalNode
      }));
    } else {
      setSetup(prev => ({
        ...prev,
        opponentNode: nodeId
      }));
    }
  };

  const toggleEdge = (edgeId: string) => {
    const currentEdges = setup.activeEdgeIds || [];
    const isActive = currentEdges.includes(edgeId);
    let newActive = [...currentEdges];
    if (isActive) {
      newActive = newActive.filter((id) => id !== edgeId);
    } else {
      newActive.push(edgeId);
    }
    setSetup({ ...setup, activeEdgeIds: newActive });
  };

  const handleLoadHistorySetup = (selectedSetup: Session) => {
    setSetup(selectedSetup);
    setGeneratedUrl(null);
    navigate('/admin/setup/manual', { state: { readOnly: true } });
  };

  const handleBackFromReadOnly = () => {
    navigate('/admin/history');
  };

  const handleClearDatabase = async () => {
    if (window.confirm("WARNING: You are about to delete ALL experiment setups, sessions, and submissions. This action cannot be undone.\\n\\nAre you sure you want to clean the database?")) {
      const success = await clearDatabase();
      if (success) {
        setHistory([]);
        setHistoryPage(1);
        alert("Database cleaned successfully.");
      } else {
        alert("Failed to clean database. Check console for details.");
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="w-full lg:w-56 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm h-fit">
            <h1 className="text-xl font-bold text-gray-800">Admin View</h1>

            <nav className="mt-4 space-y-2">
              <button
                type="button"
                onClick={() => navigate('/admin/setup/manual')}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors ${activeTab === 'setup' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'text-gray-600 hover:bg-gray-50 border border-transparent'}`}
              >
                Setup
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/history')}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors ${activeTab === 'history' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'text-gray-600 hover:bg-gray-50 border border-transparent'}`}
              >
                View Single Session
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/groups')}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors ${activeTab === 'groups' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'text-gray-600 hover:bg-gray-50 border border-transparent'}`}
              >
                View Session Batchs 
              </button>
              {import.meta.env.DEV && (
                <button
                  type="button"
                  onClick={handleClearDatabase}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-orange-600 transition-colors hover:bg-orange-50 border border-transparent"
                >
                  Clear Database
                </button>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 border border-transparent"
              >
                Logout
              </button>
            </nav>

          </aside>

          <div className="flex-1 min-w-0">
            {activeTab === 'history' ? (
              <HistoryTable
                history={history}
                historyPage={historyPage}
                pageSize={pageSize}
                onPageChange={setHistoryPage}
                onLoadSetup={handleLoadHistorySetup}
              />
            ) : activeTab === 'groups' ? (
              location.pathname.includes('/admin/groups/') ? (
                <GroupDetailView />
              ) : (
                <GroupsTable />
              )
            ) : (
              <SetupPanel
                setup={setup}
                setSetup={setSetup}
                generatedUrl={generatedUrl}
                setGeneratedUrl={setGeneratedUrl}
                isSaving={isSaving}
                setIsSaving={setIsSaving}
                onSave={onSave}
                onNodeInteraction={handleNodeInteraction}
                onEdgeToggle={toggleEdge}
                readOnly={isReadOnly}
                onBack={handleBackFromReadOnly}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminView;
