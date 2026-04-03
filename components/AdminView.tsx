import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ExperimentSetup, AgentId } from '../types';
import { AGENTS } from '../constants';
import { generateDesignMatrix } from '../utils/math';
import { fetchAllExperimentSetups, clearDatabase } from '../utils/graphqlClient';
import HistoryTable from './HistoryTable';
import SetupPanel from './SetupPanel';

interface AdminViewProps {
  setup: ExperimentSetup;
  setSetup: React.Dispatch<React.SetStateAction<ExperimentSetup>>;
  onSave: (setupToSave: ExperimentSetup) => Promise<string | undefined>; // Returns the setup ID
}

const AdminView: React.FC<AdminViewProps> = ({ setup, setSetup, onSave }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab: 'setup' | 'history' = location.pathname === '/admin/history' ? 'history' : 'setup';
  const isReadOnly = location.state?.readOnly === true;
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [history, setHistory] = useState<ExperimentSetup[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (activeTab === 'history') {
      const loadHistory = async () => {
        try {
          const data = await fetchAllExperimentSetups();
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
    const isActive = setup.activeEdgeIds.includes(edgeId);
    let newActive = [...setup.activeEdgeIds];
    if (isActive) {
      newActive = newActive.filter((id) => id !== edgeId);
    } else {
      newActive.push(edgeId);
    }
    setSetup({ ...setup, activeEdgeIds: newActive });
  };

  const handleLoadHistorySetup = (selectedSetup: ExperimentSetup) => {
    setSetup(selectedSetup);
    setGeneratedUrl(null);
    navigate('/admin/setup', { state: { readOnly: true } });
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
    localStorage.removeItem('isAuthenticated');
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="w-full lg:w-56 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm h-fit">
            <h1 className="text-xl font-bold text-gray-800">Experiment</h1>
            <p className="mt-1 text-xs text-gray-500">Admin Navigation</p>

            <nav className="mt-4 space-y-2">
              <button
                type="button"
                onClick={() => navigate('/admin/setup')}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors ${activeTab === 'setup' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'text-gray-600 hover:bg-gray-50 border border-transparent'}`}
              >
                Setup
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/history')}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors ${activeTab === 'history' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'text-gray-600 hover:bg-gray-50 border border-transparent'}`}
              >
                Session
              </button>
              <button
                type="button"
                onClick={handleClearDatabase}
                className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-orange-600 transition-colors hover:bg-orange-50 border border-transparent"
              >
                Clear Database
              </button>
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
