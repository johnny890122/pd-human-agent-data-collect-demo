import React, { useEffect, useState } from 'react';
import { Navigate, Routes, Route, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AdminView from './components/AdminView';
import SurveyView from './components/SurveyView';
import Login from './components/Login';
import NotFound from './components/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import { ExperimentSetup, SurveyResult } from './types';
import {
  completeSurveyEntry,
  fetchActiveExperimentSetup,
  fetchExperimentSetup,
  saveSurveyAnswer,
  saveExperimentSetup,
  startSurveyEntry,
} from './utils/graphqlClient';
import { loadSession, saveSession, clearSession } from './utils/surveySession';
import { INITIAL_SETUP, TOAST_DURATION_MS } from './constants';

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const setupIdFromUrl = searchParams.get('setupId');
  const [backendNotice, setBackendNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSetupId, setActiveSetupId] = useState<string | null>(null);
  const [restoredEntryId, setRestoredEntryId] = useState<string | undefined>(undefined);
  
  // Initial Setup State
  const [setup, setSetup] = useState<ExperimentSetup>(INITIAL_SETUP);

  useEffect(() => {
    if (location.pathname.startsWith('/admin')) {
      document.title = 'Admin Setup';
      return;
    }

    if (location.pathname.startsWith('/survey')) {
      document.title = 'Experiment';
      return;
    }

    document.title = 'Experiment';
  }, [location.pathname]);


  useEffect(() => {
    const hydrateSetup = async () => {
      try {
        let persistedSetup;
        if (setupIdFromUrl) {
          persistedSetup = await fetchExperimentSetup(setupIdFromUrl);
        } else {
          persistedSetup = await fetchActiveExperimentSetup();
        }

        if (persistedSetup) {
          setSetup(persistedSetup);
          
          // Check for existing session
          const setupId = setupIdFromUrl || persistedSetup.id;
          if (setupId) {
            const session = loadSession(setupId);
            if (session) {
              setRestoredEntryId(session.entryId);
              navigate(session.path, { replace: true });
            }
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        setBackendNotice(`Backend unavailable: ${message}`);
      }
    };

    hydrateSetup();
  }, [setupIdFromUrl, navigate]);

  const handleSaveSetup = async (setupToSave: ExperimentSetup) => {
    try {
      const savedSetup = await saveExperimentSetup(setupToSave);
      const id = savedSetup.id;
      setActiveSetupId(id ?? null);
      return id;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setBackendNotice(`Could not persist setup: ${message}`);
      return undefined;
    }
  };

  const handleSurveyStart = async (): Promise<string | undefined> => {
    try {
      const edgeId = `${setup.focalNode}-${setup.opponentNode}`;
      const setupSessionId = setupIdFromUrl || activeSetupId || setup.id;

      if (!setupSessionId) {
        throw new Error('Missing setupId. Please start from an admin-generated survey URL.');
      }

      const entryId = await startSurveyEntry(setupSessionId, edgeId);
      setBackendNotice(null);
      
      const path = `/survey/scenarios/0${setupIdFromUrl ? `?setupId=${setupIdFromUrl}` : ''}`;
      saveSession(setupSessionId, entryId, path);
      
      return entryId;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setBackendNotice(`Could not start survey session: ${message}`);
      return undefined;
    }
  };

  const handleSaveAnswer = async (entryId: string, answer: SurveyResult): Promise<boolean> => {
    try {
      await saveSurveyAnswer(entryId, answer);
      setBackendNotice(null);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setBackendNotice(`Could not save answer: ${message}`);
      return false;
    }
  };

  const handleSurveyComplete = async (entryId: string, _results: SurveyResult[], demographics: { age: number, gender: string, education: string }) => {
    setIsSubmitting(true);
    console.log('Survey Completed');

    try {
      await completeSurveyEntry(entryId, demographics);
      setBackendNotice(null);
      clearSession(setupIdFromUrl || setup.id || '');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setBackendNotice(`Could not persist survey results: ${message}`);
    }

    setIsSubmitting(false);
    navigate(setupIdFromUrl ? `/survey/outro?setupId=${setupIdFromUrl}` : '/survey/outro', { replace: true });
  };

  const handleBackToAdmin = () => {
      navigate('/admin/setup');
  };

  return (
    <div className="antialiased text-gray-900">
      <Toaster position="top-center" toastOptions={{ duration: TOAST_DURATION_MS }} />
      {backendNotice && (
        <div className="mx-auto max-w-5xl mt-4 px-4">
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {backendNotice}
          </div>
        </div>
      )}
      {isSubmitting && (
        <div className="mx-auto max-w-5xl mt-4 px-4">
          <div className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            Saving survey results...
          </div>
        </div>
      )}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/admin/setup" replace />} />
        <Route
          path="/admin/setup"
          element={
            <ProtectedRoute>
              <AdminView setup={setup} setSetup={setSetup} onSave={handleSaveSetup} />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/admin/history"
          element={
            <ProtectedRoute>
              <AdminView setup={setup} setSetup={setSetup} onSave={handleSaveSetup} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute>
              <NotFound />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/survey/intro/:introStep" 
          element={
            <SurveyView 
              setup={setup} 
              onStartSurvey={handleSurveyStart}
              onSaveAnswer={handleSaveAnswer}
              onComplete={handleSurveyComplete} 
              onBack={handleBackToAdmin}
              initialEntryId={restoredEntryId}
            />
          } 
        />
        <Route 
          path="/survey/scenarios/:scenarioIdx" 
          element={
            <SurveyView 
              setup={setup} 
              onStartSurvey={handleSurveyStart}
              onSaveAnswer={handleSaveAnswer}
              onComplete={handleSurveyComplete} 
              onBack={handleBackToAdmin}
              initialEntryId={restoredEntryId}
            />
          } 
        />
        <Route 
          path="/survey/outro" 
          element={
            <SurveyView 
              setup={setup} 
              onStartSurvey={handleSurveyStart}
              onSaveAnswer={handleSaveAnswer}
              onComplete={handleSurveyComplete} 
              onBack={handleBackToAdmin}
              initialEntryId={restoredEntryId}
            />
          } 
        />
        <Route 
          path="/survey/demographics" 
          element={
            <SurveyView 
              setup={setup} 
              onStartSurvey={handleSurveyStart}
              onSaveAnswer={handleSaveAnswer}
              onComplete={handleSurveyComplete} 
              onBack={handleBackToAdmin}
              initialEntryId={restoredEntryId}
            />
          } 
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

export default App;
