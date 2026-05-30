import React, { useEffect, useState } from 'react';
import { Navigate, Routes, Route, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AdminView from './components/AdminView';
import SurveyView from './components/SurveyView';
import Login from './components/Login';
import NotFound from './components/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import SurveyWelcome from './components/SurveyWelcome';
import { Session, SurveyResult } from './types';
import {
  completeSurvey,
  fetchSession,
  fetchSessionGroup,
  saveSurveyAnswer,
  startSurvey,
  startMixedSession,
  findUserSession,
} from './utils/graphqlClient';
import { loadSession, saveSession, clearSession } from './utils/surveySession';
import { getParticipantId } from './utils/participantId';
import { INITIAL_SETUP, TOAST_DURATION_MS } from './constants';

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // URL params: sessionId for Manual/Batch, groupId+mode for Mixed (before session creation)
  const sessionIdFromUrl = searchParams.get('sessionId');
  const groupIdFromUrl = searchParams.get('groupId');
  const modeFromUrl = searchParams.get('mode');
  
  const [backendNotice, setBackendNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [pendingMixedGroupId, setPendingMixedGroupId] = useState<string | null>(null);
  const [mixedModeScenariosPerSession, setMixedModeScenariosPerSession] = useState<number | null>(null);
  const [restoredSubmissionId, setRestoredSubmissionId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isTurnstileVerified, setIsTurnstileVerified] = useState(false);
  const [isTurnstileStatusLoading, setIsTurnstileStatusLoading] = useState(true);
  
  // Setup state (converted from Session for UI compatibility)
  const [setup, setSetup] = useState<Session>(INITIAL_SETUP);
  
  // Session with scenarios
  const [session, setSession] = useState<any>(null);

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
    const hydrateTurnstileStatus = async () => {
      try {
        const response = await fetch('/api/turnstile/status', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          setIsTurnstileVerified(false);
          return;
        }

        const body = await response.json();
        setIsTurnstileVerified(body?.verified === true);
      } catch {
        setIsTurnstileVerified(false);
      } finally {
        setIsTurnstileStatusLoading(false);
      }
    };

    hydrateTurnstileStatus();
  }, []);

  useEffect(() => {
    const hydrateSession = async () => {
      try {
        // Mixed Mode: Check if user already has a session for this group
        if (groupIdFromUrl && modeFromUrl === 'mixed') {
          console.log('[App] Mixed Mode URL detected:', groupIdFromUrl);
          
          // Get participant ID to check for existing session
          try {
            const participantId = await getParticipantId();
            console.log('[App] Checking for existing session with participantId:', participantId);
            
            const existingSession = await findUserSession(groupIdFromUrl, participantId);
            
            if (existingSession) {
              // User already has a session - skip intro and resume
              console.log('[App] Found existing Mixed Mode session:', existingSession._id);
              
              setSession(existingSession);
              setActiveSessionId(existingSession._id);
              
              // Convert to setup format
              const compatSetup: Session = {
                _id: existingSession._id,
                scenarioIds: existingSession.scenarioIds,
                focalNode: existingSession.focalNode,
                opponentNode: existingSession.opponentNode,
                activeEdgeIds: existingSession.scenarios?.[0]?.activeEdgeIds || [],
                scenarios: existingSession.scenarios || [],
                sampleSize: existingSession.sampleSize,
                submissionCount: existingSession.submissionCount,
                createdAt: existingSession.createdAt,
                updatedAt: existingSession.updatedAt,
              };
              setSetup(compatSetup);
              
              // Get submission to check progress
              const submission = await startSurvey(existingSession._id, participantId);
              setRestoredSubmissionId(submission._id);
              
              const answeredCount = submission.results?.length || 0;
              const totalScenarios = existingSession.scenarios?.length || 0;
              const nextScenarioIndex = Math.min(answeredCount, totalScenarios - 1);
              
              console.log(`[App] Resume Mixed Mode: 已答 ${answeredCount}/${totalScenarios} 題，導航到第 ${nextScenarioIndex + 1} 題`);
              
              // Update URL to sessionId and navigate to correct scenario
              setSearchParams({ sessionId: existingSession._id });
              const resumePath = `/survey/scenarios/${nextScenarioIndex}?sessionId=${existingSession._id}`;
              saveSession(existingSession._id, submission._id, resumePath);
              navigate(resumePath, { replace: true });
              
              setIsLoading(false);
              return;
            } else {
              // No existing session - defer creation until after intro
              console.log('[App] No existing session found, deferring session creation');
              setPendingMixedGroupId(groupIdFromUrl);
              
              // Fetch group info to get scenariosPerSession for display in intro
              try {
                const groupInfo = await fetchSessionGroup(groupIdFromUrl);
                if (groupInfo?.config?.scenariosPerSession) {
                  setMixedModeScenariosPerSession(groupInfo.config.scenariosPerSession);
                }
              } catch (error) {
                console.error('[App] Failed to fetch group info:', error);
              }
              
              setIsLoading(false);
              return;
            }
          } catch (error) {
            console.error('[App] Error checking for existing session:', error);
            // Fallback to deferred creation
            setPendingMixedGroupId(groupIdFromUrl);
            setIsLoading(false);
            return;
          }
        }
        
        if (sessionIdFromUrl) {
          // Fetch session with populated scenarios
          const fetchedSession = await fetchSession(sessionIdFromUrl);
          if (fetchedSession) {
            setSession(fetchedSession);
            setActiveSessionId(sessionIdFromUrl);
            
            // Convert session to setup format for UI compatibility
            const compatSetup: Session = {
              _id: fetchedSession._id,
              scenarioIds: fetchedSession.scenarioIds,
              focalNode: fetchedSession.focalNode,
              opponentNode: fetchedSession.opponentNode,
              activeEdgeIds: fetchedSession.scenarios?.[0]?.activeEdgeIds || [],
              scenarios: fetchedSession.scenarios || [],  // Populated Scenario objects with _id
              sampleSize: fetchedSession.sampleSize,
              submissionCount: fetchedSession.submissionCount,
              createdAt: fetchedSession.createdAt,
              updatedAt: fetchedSession.updatedAt,
            };
            setSetup(compatSetup);
            
            // Check for session restoration
            const isRestarting = location.pathname.startsWith('/survey/welcome') || location.pathname.startsWith('/survey/intro');
            if (isRestarting) {
              clearSession(sessionIdFromUrl);
              setRestoredSubmissionId(undefined);
            }

            let storedSession = isRestarting ? null : loadSession(sessionIdFromUrl);
            
            if (storedSession && location.pathname.startsWith('/survey/scenarios') && location.pathname !== storedSession.path.split('?')[0]) {
              console.warn("Session path mismatch, ignoring stored session cookie.");
              storedSession = null;
            }

            if (storedSession) {
              setRestoredSubmissionId(storedSession.submissionId);
              const fullSessionPath = storedSession.path;
              const currentFullPath = location.pathname + location.search;
              if (currentFullPath !== fullSessionPath) {
                navigate(fullSessionPath, { replace: true });
              }
            } else if (location.pathname.startsWith('/survey') && !location.pathname.includes('/outro') && !location.pathname.startsWith('/survey/intro') && !location.pathname.startsWith('/survey/welcome')) {
              try {
                const pid = await getParticipantId();
                const submission = await startSurvey(sessionIdFromUrl, pid);
                setRestoredSubmissionId(submission._id);
                saveSession(sessionIdFromUrl, submission._id, location.pathname + location.search);
              } catch (e) {
                console.error("Failed to eagerly create survey submission", e);
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

    hydrateSession();
  }, [sessionIdFromUrl, groupIdFromUrl, modeFromUrl, navigate, location.pathname, location.search]);

  // Auto-refresh submissionCount while the participant is on survey pages
  // (mirrors the 5-second interval used in GroupDetailView for mixed mode)
  useEffect(() => {
    const sessionId = sessionIdFromUrl || activeSessionId;
    if (!sessionId) return;
    if (!location.pathname.startsWith('/survey') || location.pathname.startsWith('/survey/outro')) return;

    async function refreshSubmissionCount() {
      try {
        const refreshed = await fetchSession(sessionId!);
        if (refreshed) {
          setSetup(prev => ({ ...prev, submissionCount: refreshed.submissionCount }));
        }
      } catch {
        // silent — don't surface transient errors during background refresh
      }
    }

    const intervalId = setInterval(refreshSubmissionCount, 5000);
    return () => clearInterval(intervalId);
  }, [sessionIdFromUrl, activeSessionId, location.pathname]);

  const handleSurveyStart = async (): Promise<string | undefined> => {
    try {
      // Mixed Mode: Create session now (after intro completion)
      if (pendingMixedGroupId && !sessionIdFromUrl) {
        console.log('[App] Creating Mixed Mode session for group:', pendingMixedGroupId);
        
        const participantId = await getParticipantId();
        const result = await startMixedSession(pendingMixedGroupId, participantId);
        console.log('[App] Mixed session created:', result.sessionId);
        
        // Update URL to use sessionId (unified flow)
        setSearchParams({ sessionId: result.sessionId });
        setActiveSessionId(result.sessionId);
        setPendingMixedGroupId(null);
        
        // Fetch the newly created session
        const fetchedSession = await fetchSession(result.sessionId);
        if (fetchedSession) {
          setSession(fetchedSession);
          const compatSetup: Session = {
            _id: fetchedSession._id,
            scenarioIds: fetchedSession.scenarioIds,
            focalNode: fetchedSession.focalNode,
            opponentNode: fetchedSession.opponentNode,
            activeEdgeIds: fetchedSession.scenarios?.[0]?.activeEdgeIds || [],
            scenarios: fetchedSession.scenarios || [],
            sampleSize: fetchedSession.sampleSize,
            submissionCount: fetchedSession.submissionCount,
            createdAt: fetchedSession.createdAt,
            updatedAt: fetchedSession.updatedAt,
          };
          setSetup(compatSetup);
        }
        
        // Create submission (or get existing one for resume)
        const submission = await startSurvey(result.sessionId, participantId);
        setRestoredSubmissionId(submission._id);
        setBackendNotice(null);
        
        // Resume: Calculate progress from existing results
        const answeredCount = submission.results?.length || 0;
        const totalScenarios = fetchedSession?.scenarios?.length || 0;
        const nextScenarioIndex = Math.min(answeredCount, totalScenarios - 1);
        
        if (answeredCount > 0) {
          console.log(`[Resume] Mixed Mode: 已答 ${answeredCount}/${totalScenarios} 題，繼續從第 ${nextScenarioIndex + 1} 題`);
        }
        
        const path = `/survey/scenarios/${nextScenarioIndex}?sessionId=${result.sessionId}`;
        saveSession(result.sessionId, submission._id, path);
        
        return submission._id;
      }
      
      // Manual/Batch Mode: Normal flow
      const currentId = sessionIdFromUrl || activeSessionId || setup._id;

      if (!currentId) {
        throw new Error('Missing session ID. Please start from an admin-generated survey URL.');
      }

      // If already have restored submission, reuse it
      if (restoredSubmissionId) {
        // Still need to check progress for resume
        const pid = await getParticipantId();
        const submission = await startSurvey(currentId, pid);
        const answeredCount = submission.results?.length || 0;
        const totalScenarios = setup.scenarios?.length || 0;
        const nextScenarioIndex = Math.min(answeredCount, totalScenarios - 1);
        
        if (answeredCount > 0) {
          console.log(`[Resume] 已答 ${answeredCount}/${totalScenarios} 題，繼續從第 ${nextScenarioIndex + 1} 題`);
        }
        
        const path = `/survey/scenarios/${nextScenarioIndex}?sessionId=${currentId}`;
        saveSession(currentId, restoredSubmissionId, path);
        return restoredSubmissionId;
      }

      // Unified survey flow
      console.log('[NEW API] Starting survey with sessionId:', currentId);
      const pid = await getParticipantId();
      const submission = await startSurvey(currentId, pid);
      setRestoredSubmissionId(submission._id);
      setBackendNotice(null);
      
      // Resume: Calculate progress from existing results
      const answeredCount = submission.results?.length || 0;
      const totalScenarios = setup.scenarios?.length || 0;
      const nextScenarioIndex = Math.min(answeredCount, totalScenarios - 1);
      
      if (answeredCount > 0) {
        console.log(`[Resume] 偵測到既有進度：已答 ${answeredCount}/${totalScenarios} 題，繼續從第 ${nextScenarioIndex + 1} 題`);
      }
      
      const path = `/survey/scenarios/${nextScenarioIndex}?sessionId=${currentId}`;
      saveSession(currentId, submission._id, path);
      
      return submission._id;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setBackendNotice(`Could not start survey session: ${message}`);
      return undefined;
    }
  };

  const handleSaveAnswer = async (submissionId: string, answer: SurveyResult): Promise<boolean> => {
    try {
      // Unified survey flow with Scenario UUID references
      console.log('[NEW API] Saving answer for scenario:', answer.scenarioId);
      await saveSurveyAnswer(submissionId, answer.scenarioId, answer.cooperationProbability);
      setBackendNotice(null);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setBackendNotice(`Could not save answer: ${message}`);
      return false;
    }
  };

  const handleSurveyComplete = async (submissionId: string, _results: SurveyResult[], demographics: { age: number, gender: string, education: string }) => {
    setIsSubmitting(true);
    console.log('Survey Completed');

    try {
      const currentId = sessionIdFromUrl || setup._id || '';
      
      // Unified survey flow
      console.log('[NEW API] Completing survey with unified API');
      await completeSurvey(submissionId, demographics);
      
      setBackendNotice(null);
      clearSession(currentId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setBackendNotice(`Could not persist survey results: ${message}`);
    }

    setIsSubmitting(false);
    const urlSuffix = sessionIdFromUrl ? `?sessionId=${sessionIdFromUrl}` : '';
    navigate(`/survey/outro${urlSuffix}`, { replace: true });
  };

  const handleBackToAdmin = () => {
    navigate('/admin/setup');
  };

  if (isLoading || isTurnstileStatusLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isSurveyRoute = location.pathname.startsWith('/survey') && !location.pathname.startsWith('/survey/outro');
  const isSessionFull = (setup.submissionCount || 0) >= setup.sampleSize;

  if (isSurveyRoute && isSessionFull && !restoredSubmissionId) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8 text-center">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">無法參與實驗</h2>
          <p className="text-gray-600">
            抱歉，此實驗人數可能已經額滿，或者是您先前已經參與過本次實驗。
          </p>
        </div>
      </div>
    );
  }

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
            正在儲存您的結果...
          </div>
        </div>
      )}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/admin/setup/manual" replace />} />
        <Route path="/admin/setup" element={<Navigate to="/admin/setup/manual" replace />} />
        <Route
          path="/admin/setup/manual"
          element={
            <ProtectedRoute>
              <AdminView setup={setup} setSetup={setSetup} onSave={async () => undefined} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/setup/mixed"
          element={
            <ProtectedRoute>
              <AdminView setup={setup} setSetup={setSetup} onSave={async () => undefined} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/view/manual"
          element={
            <ProtectedRoute>
              <AdminView setup={setup} setSetup={setSetup} onSave={async () => undefined} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/view/batch"
          element={
            <ProtectedRoute>
              <AdminView setup={setup} setSetup={setSetup} onSave={async () => undefined} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/view/batch/:groupId"
          element={
            <ProtectedRoute>
              <AdminView setup={setup} setSetup={setSetup} onSave={async () => undefined} />
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
        <Route path="/survey/welcome" element={<SurveyWelcome />} />
        <Route
          path="/survey/intro/:introStep"
          element={
            <SurveyView
              setup={setup}
              onStartSurvey={handleSurveyStart}
              onSaveAnswer={handleSaveAnswer}
              onComplete={handleSurveyComplete}
              onBack={handleBackToAdmin}
              initialEntryId={restoredSubmissionId}
              isTurnstileVerified={isTurnstileVerified}
              onTurnstileVerified={() => setIsTurnstileVerified(true)}
              mixedModeScenariosPerSession={mixedModeScenariosPerSession}
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
              initialEntryId={restoredSubmissionId}
              isTurnstileVerified={isTurnstileVerified}
              onTurnstileVerified={() => setIsTurnstileVerified(true)}
              mixedModeScenariosPerSession={mixedModeScenariosPerSession}
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
              initialEntryId={restoredSubmissionId}
              isTurnstileVerified={isTurnstileVerified}
              onTurnstileVerified={() => setIsTurnstileVerified(true)}
            />
          } 
        />
        <Route 
          path="/survey/demographics" 
          element={<NotFound />} 
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

export default App;
