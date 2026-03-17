import React, { useEffect, useMemo, useState } from 'react';
import AdminView from './components/AdminView';
import SurveyView from './components/SurveyView';
import { ExperimentSetup, SurveyResult } from './types';
import {
  fetchActiveExperimentSetup,
  saveExperimentSetup,
  submitSurvey,
} from './utils/graphqlClient';

const App: React.FC = () => {
  const [mode, setMode] = useState<'admin' | 'survey'>('admin');
  const [backendNotice, setBackendNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const surveySessionId = useMemo(() => crypto.randomUUID(), []);
  
  // Initial Setup State
  const [setup, setSetup] = useState<ExperimentSetup>({
    activeEdgeIds: [],
    edgeConfigs: {}, // Populated as edges are selected
    decisionMaker: 'HB',
    opponent: 'RA',
  });

  useEffect(() => {
    if (import.meta.env.MODE === 'test') {
      return;
    }

    const hydrateSetup = async () => {
      try {
        const persistedSetup = await fetchActiveExperimentSetup();
        if (persistedSetup) {
          setSetup(persistedSetup);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        setBackendNotice(`Backend unavailable: ${message}`);
      }
    };

    hydrateSetup();
  }, []);

  const handleStartSurvey = async () => {
    if (import.meta.env.MODE !== 'test') {
      try {
        await saveExperimentSetup(setup);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        setBackendNotice(`Could not persist setup: ${message}`);
      }
    }
    setMode('survey');
  };

  const handleSurveyComplete = async (results: SurveyResult[]) => {
    setIsSubmitting(true);
    console.log('Survey Completed:', results);

    if (import.meta.env.MODE !== 'test') {
      try {
        await submitSurvey(surveySessionId, setup, results);
        setBackendNotice(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        setBackendNotice(`Could not persist survey results: ${message}`);
      }
    }

    setIsSubmitting(false);
  };

  const handleBackToAdmin = () => {
      setMode('admin');
  };

  return (
    <div className="antialiased text-gray-900">
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
      {mode === 'admin' ? (
        <AdminView setup={setup} setSetup={setSetup} onStart={handleStartSurvey} />
      ) : (
        <SurveyView setup={setup} onComplete={handleSurveyComplete} onBack={handleBackToAdmin} />
      )}
    </div>
  );
};

export default App;
