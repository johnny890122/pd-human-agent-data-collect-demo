import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AdminView from './components/AdminView';
import SurveyView from './components/SurveyView';
import { ExperimentSetup, SurveyResult } from './types';
import {
  fetchActiveExperimentSetup,
  fetchExperimentSetup,
  saveExperimentSetup,
  submitSurvey,
} from './utils/graphqlClient';

const App: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setupIdFromUrl = searchParams.get('setupId');
  const [backendNotice, setBackendNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSetupId, setActiveSetupId] = useState<string | null>(null);
  
  // Initial Setup State
  const [setup, setSetup] = useState<ExperimentSetup>({
    activeEdgeIds: [],
    scenarios: [],
    focalNode: 'HB',
    opponentNode: 'RA',
    sampleSize: 20,
  });


  useEffect(() => {
    if (import.meta.env.MODE === 'test') {
      return;
    }

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
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        setBackendNotice(`Backend unavailable: ${message}`);
      }
    };

    hydrateSetup();
  }, [setupIdFromUrl]);

  const handleSaveSetup = async (setupToSave: ExperimentSetup) => {
    if (import.meta.env.MODE !== 'test') {
      try {
        const savedSetup = await saveExperimentSetup(setupToSave);
        // @ts-ignore - Assuming saveExperimentSetup returns the setup with ID now
        const id = savedSetup?.id;
        setActiveSetupId(id);
        return id;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        setBackendNotice(`Could not persist setup: ${message}`);
        return undefined;
      }
    }
    return 'test-id';
  };

  const handleSurveyComplete = async (results: SurveyResult[], demographics: { age: number, gender: string, education: string }) => {
    setIsSubmitting(true);
    console.log('Survey Completed:', results);

    if (import.meta.env.MODE !== 'test') {
      try {
        const edgeId = `${setup.focalNode}-${setup.opponentNode}`;
        const setupSessionId = setupIdFromUrl || activeSetupId || setup.id;

        if (!setupSessionId) {
          throw new Error('Missing setupId. Please start from an admin-generated survey URL.');
        }

        await submitSurvey(setupSessionId, edgeId, results, demographics);
        setBackendNotice(null);

      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        setBackendNotice(`Could not persist survey results: ${message}`);
      }
    }

    setIsSubmitting(false);
    navigate(setupIdFromUrl ? `/survey/outro?setupId=${setupIdFromUrl}` : '/survey/outro');
  };

  const handleBackToAdmin = () => {
      navigate('/admin/setup');
  };

  return (
    <div className="antialiased text-gray-900">
      <Toaster position="top-center" toastOptions={{ duration: 2000 }} />
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
        <Route path="/" element={<Navigate to="/admin/setup" replace />} />
        <Route
          path="/admin/setup"
          element={<AdminView setup={setup} setSetup={setSetup} onSave={handleSaveSetup} />}
        />
        <Route
          path="/admin/history"
          element={<AdminView setup={setup} setSetup={setSetup} onSave={handleSaveSetup} />}
        />
        <Route 
          path="/survey/intro/:introStep" 
          element={
            <SurveyView 
              setup={setup} 
              onComplete={handleSurveyComplete} 
              onBack={handleBackToAdmin}
            />
          } 
        />
        <Route 
          path="/survey/scenarios/:scenarioIdx" 
          element={
            <SurveyView 
              setup={setup} 
              onComplete={handleSurveyComplete} 
              onBack={handleBackToAdmin}
            />
          } 
        />
        <Route 
          path="/survey/outro" 
          element={
            <SurveyView 
              setup={setup} 
              onComplete={handleSurveyComplete} 
              onBack={handleBackToAdmin}
            />
          } 
        />
      </Routes>
    </div>
  );
};

export default App;
