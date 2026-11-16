import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Session } from '../types';
import { clearDatabase } from '../utils/graphqlClient';
import SetupPanel from './SetupPanel';
import GroupsTable from './GroupsTable';
import GroupDetailView from './GroupDetailView';

interface AdminViewProps {
  setup: Session;
  setSetup: React.Dispatch<React.SetStateAction<Session>>;
}

const AdminView: React.FC<AdminViewProps> = ({ setup, setSetup }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab: 'setup' | 'groups' = location.pathname.startsWith('/admin/view/batch') ? 'groups' : 'setup';

  const handleClearDatabase = async () => {
    if (window.confirm("WARNING: You are about to delete ALL experiment setups, sessions, and submissions. This action cannot be undone.\\n\\nAre you sure you want to clean the database?")) {
      const success = await clearDatabase();
      if (success) {
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
                onClick={() => navigate('/admin/setup/mixed')}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors ${activeTab === 'setup' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'text-gray-600 hover:bg-gray-50 border border-transparent'}`}
              >
                Setup
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/view/batch')}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors ${activeTab === 'groups' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'text-gray-600 hover:bg-gray-50 border border-transparent'}`}
              >
                View Sessions
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
            {activeTab === 'groups' ? (
              location.pathname.includes('/admin/view/batch/') ? (
                <GroupDetailView />
              ) : (
                <GroupsTable />
              )
            ) : (
              <SetupPanel setup={setup} setSetup={setSetup} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminView;
