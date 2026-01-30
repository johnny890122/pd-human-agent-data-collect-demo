import React, { useState } from 'react';
import AdminView from './components/AdminView';
import SurveyView from './components/SurveyView';
import { ExperimentSetup, SurveyResult } from './types';
import { DEFAULT_EDGE_CONFIG } from './constants';

const App: React.FC = () => {
  const [mode, setMode] = useState<'admin' | 'survey'>('admin');
  
  // Initial Setup State
  const [setup, setSetup] = useState<ExperimentSetup>({
    activeEdgeIds: [],
    edgeConfigs: {}, // Populated as edges are selected
    decisionMaker: 'HB',
    opponent: 'RA',
  });

  const handleStartSurvey = () => {
    setMode('survey');
  };

  const handleSurveyComplete = (results: SurveyResult[]) => {
    console.log('Survey Completed:', results);
    // In a real app, send to backend here.
  };

  const handleBackToAdmin = () => {
      setMode('admin');
  };

  return (
    <div className="antialiased text-gray-900">
      {mode === 'admin' ? (
        <AdminView setup={setup} setSetup={setSetup} onStart={handleStartSurvey} />
      ) : (
        <SurveyView setup={setup} onComplete={handleSurveyComplete} onBack={handleBackToAdmin} />
      )}
    </div>
  );
};

export default App;
