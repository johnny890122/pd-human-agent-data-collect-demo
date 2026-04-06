import React, { useEffect, useState } from 'react';
import { Navigate, Routes, Route, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AdminView from './components/AdminView';
import SurveyView from './components/SurveyView';
import Login from './components/Login';
import NotFound from './components/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import { SessionSetup, SurveyResult } from './types';
import {
  completeSurveyEntry,
  fetchActiveSessionSetup,
  fetchSessionSetup,
  saveSurveyAnswer,
  saveSessionSetup,
  startSurveyEntry,
} from './utils/graphqlClient';
import { loadSession, saveSession, clearSession } from './utils/surveySession';
import { INITIAL_SETUP, TOAST_DURATION_MS } from './constants';
import { SessionRecorder } from './components/SessionRecorder';
import { SessionPlayback } from './components/SessionPlayback';

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const setupIdFromUrl = searchParams.get('setupId');
  const [backendNotice, setBackendNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSetupId, setActiveSetupId] = useState<string | null>(null);
  const [restoredEntryId, setRestoredEntryId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  
  // Initial Setup State
  const [setup, setSetup] = useState<SessionSetup>(INITIAL_SETUP);

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
          persistedSetup = await fetchSessionSetup(setupIdFromUrl);
        } else {
          persistedSetup = await fetchActiveSessionSetup();
        }

        if (persistedSetup) {
          setSetup(persistedSetup);
          
          // Check for existing session
          const setupId = setupIdFromUrl || persistedSetup.id;
          if (setupId) {
            // Check if explicitly trying to restart the survey
            const isRestarting = location.pathname.startsWith('/survey/intro');
            if (isRestarting) {
              clearSession(setupId);
              setRestoredEntryId(undefined);
            }

            let session = isRestarting ? null : loadSession(setupId);
            
            // If the user's current URL is quite different from the session's path, 
            // they probably manually navigated or reloaded with a new URL. Let them continue.
            if (session && location.pathname.startsWith('/survey/scenarios') && location.pathname !== session.path.split('?')[0]) {
               console.warn("Session path mismatch, ignoring stored session cookie.");
               session = null; 
            }

            if (session) {
              setRestoredEntryId(session.entryId);
              // Only redirect if the path is different
              const fullSessionPath = session.path;
              const currentFullPath = location.pathname + location.search;
              if (currentFullPath !== fullSessionPath) {
                navigate(fullSessionPath, { replace: true });
              }
            } else if (location.pathname.startsWith('/survey') && !location.pathname.includes('/outro') && !location.pathname.startsWith('/survey/intro')) {
              try {
                const edgeId = `${persistedSetup.focalNode}-${persistedSetup.opponentNode}`;
                const entryId = await startSurveyEntry(setupId, edgeId);
                setRestoredEntryId(entryId);
                saveSession(setupId, entryId, location.pathname + location.search);
              } catch (e) {
                console.error("Failed to eagerly create survey session", e);
              }
            }
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        setBackendNotice(`Backend unavailable: ${message}`);
      } finally {
        setIsLoading(false);
      }
    };

    hydrateSetup();
  }, [setupIdFromUrl, navigate]);

  const handleSaveSetup = async (setupToSave: SessionSetup) => {
    try {
      const savedSetup = await saveSessionSetup(setupToSave);
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
      const setupSessionId = setupIdFromUrl || activeSetupId || setup.id;

      if (!setupSessionId) {
        throw new Error('Missing setupId. Please start from an admin-generated survey URL.');
      }

      if (restoredEntryId) {
        const path = `/survey/scenarios/0${setupIdFromUrl ? `?setupId=${setupIdFromUrl}` : ''}`;
        saveSession(setupSessionId, restoredEntryId, path);
        return restoredEntryId;
      }

      const edgeId = `${setup.focalNode}-${setup.opponentNode}`;
      const entryId = await startSurveyEntry(setupSessionId, edgeId);
      setRestoredEntryId(entryId);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isSurveyRoute = location.pathname.startsWith('/survey') && !location.pathname.startsWith('/survey/outro');
  const isSessionFull = setup.submissionCount >= setup.sampleSize;

  if (isSurveyRoute && isSessionFull && !restoredEntryId) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8 text-center">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Session Full</h2>
          <p className="text-gray-600">
            The session is full. Thank you for your interest!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="antialiased text-gray-900">
      {(location.pathname.startsWith('/survey') && restoredEntryId) && <SessionRecorder sessionId={restoredEntryId} />}
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
          path="/admin/replay/:sessionId"
          element={
            <ProtectedRoute>
              <SessionPlayback />
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
