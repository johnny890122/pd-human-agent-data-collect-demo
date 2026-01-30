import React, { useState, useMemo } from 'react';
import { ExperimentSetup, Scenario, SurveyResult } from '../types';
import { AGENTS, COLORS } from '../constants';
import NetworkGraph from './NetworkGraph';
import { generateDesignMatrix } from '../utils/math';

interface SurveyViewProps {
  setup: ExperimentSetup;
  onComplete: (results: SurveyResult[]) => void;
  onBack: () => void;
}

const PayoffMatrix = ({ compact = false }: { compact?: boolean }) => (
  <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${compact ? 'text-xs' : 'text-sm'}`}>
    <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200 font-semibold text-center">
        <div className="p-2 flex items-center justify-center text-gray-400 italic">
            <span className="text-[10px]">YOU \ OPPONENT</span>
        </div>
        <div className="p-2 text-green-700">Cooperate</div>
        <div className="p-2 text-red-700">Defect</div>
    </div>
    
    {/* Row 1: You Cooperate */}
    <div className="grid grid-cols-3 border-b border-gray-100">
        <div className="p-2 font-bold text-green-700 bg-green-50 flex items-center justify-center">
            Cooperate
        </div>
        <div className="p-2 border-l border-gray-100 text-center flex flex-col justify-center">
            <span className="font-bold text-gray-800">2, 2</span>
            {!compact && <span className="text-gray-400 text-xs">Mutual Reward</span>}
        </div>
        <div className="p-2 border-l border-gray-100 text-center flex flex-col justify-center bg-red-50/30">
            <span className="font-bold text-red-600">-1, 5</span>
             {!compact && <span className="text-gray-400 text-xs">Sucker's Payoff</span>}
        </div>
    </div>

    {/* Row 2: You Defect */}
    <div className="grid grid-cols-3">
        <div className="p-2 font-bold text-red-700 bg-red-50 flex items-center justify-center">
            Defect
        </div>
         <div className="p-2 border-l border-gray-100 text-center flex flex-col justify-center bg-green-50/30">
            <span className="font-bold text-green-600">5, -1</span>
             {!compact && <span className="text-gray-400 text-xs">Temptation</span>}
        </div>
        <div className="p-2 border-l border-gray-100 text-center flex flex-col justify-center">
            <span className="font-bold text-gray-800">1, 1</span>
             {!compact && <span className="text-gray-400 text-xs">Mutual Punishment</span>}
        </div>
    </div>
  </div>
);

const SurveyView: React.FC<SurveyViewProps> = ({ setup, onComplete, onBack }) => {
  const [step, setStep] = useState<'intro' | 'scenarios' | 'outro'>('intro');
  const [currentScenarioIdx, setCurrentScenarioIdx] = useState(0);
  const [sliderValue, setSliderValue] = useState(50);
  const [results, setResults] = useState<SurveyResult[]>([]);

  // Generate matrix once
  const scenarios = useMemo(() => generateDesignMatrix(setup.activeEdgeIds), [setup.activeEdgeIds]);
  const currentScenario = scenarios[currentScenarioIdx];

  const handleNext = () => {
    // Save current result
    const newResults = [...results];
    newResults[currentScenarioIdx] = {
      scenarioId: currentScenario.id,
      cooperationProbability: sliderValue / 100,
    };
    setResults(newResults);

    // Advance
    if (currentScenarioIdx < scenarios.length - 1) {
      setCurrentScenarioIdx((prev) => prev + 1);
      setSliderValue(50); // Reset slider
    } else {
      setStep('outro');
      onComplete(newResults);
    }
  };

  const agentMe = AGENTS[setup.decisionMaker];
  const agentOpponent = AGENTS[setup.opponent];

  if (step === 'intro') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Experiment Instructions</h1>
            <div className="w-16 h-1 bg-indigo-500 mx-auto rounded-full"></div>
          </div>
          
          <div className="space-y-4 text-gray-600 leading-relaxed text-sm">
            <p>
              Welcome. In this experiment, you will be playing the role of <span className="font-bold text-indigo-600">{agentMe.label}</span>.
            </p>
            <p>
              You will interact with <span className="font-bold text-red-600">{agentOpponent.label}</span> in a series of scenarios.
            </p>
            <p className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-blue-900">
              <strong>Your Goal:</strong> For each scenario, we will show you a "History Report". 
              Based on this history, you must decide the <strong>probability</strong> that you will <strong>Cooperate</strong> with your opponent to maximize your points.
            </p>
            
            <div className="mt-4">
               <h3 className="font-bold text-gray-700 mb-2">Game Payoffs (You, Opponent):</h3>
               <PayoffMatrix />
            </div>

            <p>
                There are <strong>{scenarios.length}</strong> unique scenarios in total.
            </p>
          </div>

          <button
            onClick={() => setStep('scenarios')}
            className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-transform active:scale-95"
          >
            I Understand, Begin &rarr;
          </button>
           <button onClick={onBack} className="w-full text-sm text-gray-400 hover:text-gray-600 mt-2">Back to Config</button>
        </div>
      </div>
    );
  }

  if (step === 'outro') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Survey Complete</h2>
          <p className="text-gray-600">Thank you for your participation. Your responses have been recorded.</p>
          
          <div className="bg-gray-100 p-4 rounded-lg text-left text-xs font-mono overflow-auto max-h-60">
            {JSON.stringify(results, null, 2)}
          </div>
          
           <button onClick={onBack} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Start New Session</button>
        </div>
      </div>
    );
  }

  // Helper to generate narrative
  const activeConfigs = setup.activeEdgeIds.map(id => ({
      id,
      state: currentScenario.edgeStates[id],
      config: setup.edgeConfigs[id]
  }));

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 md:p-8">
      {/* Progress Bar */}
      <div className="w-full max-w-5xl mb-6">
         <div className="flex justify-between text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
             <span>Scenario {currentScenarioIdx + 1} of {scenarios.length}</span>
             <span>Progress: {Math.round(((currentScenarioIdx) / scenarios.length) * 100)}%</span>
         </div>
         <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden">
             <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((currentScenarioIdx + 1) / scenarios.length) * 100}%` }}
             ></div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-5xl">
        
        {/* Left: Stimulus & Context */}
        <div className="space-y-6">
             {/* Graph Card */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
                <div className="bg-gray-50 border-b border-gray-100 p-4">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider text-center">Network History</h3>
                </div>
                <div className="p-6 flex-1 flex items-center justify-center bg-white">
                    <NetworkGraph mode="survey" setup={setup} scenario={currentScenario} />
                </div>
                {/* Narrative Legend */}
                <div className="p-6 bg-gray-50 border-t border-gray-100 space-y-3">
                    {activeConfigs.map(({ id, state, config }) => {
                        return (
                            <div key={id} className="flex items-center text-sm">
                                <div className={`w-3 h-3 rounded-full mr-3 shrink-0 ${state === 1 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className="text-gray-600 flex-1">
                                    <span className="font-semibold text-gray-800">{config.label}:</span> {state === 1 ? config.high : config.low}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Payoff Matrix Reference */}
            <div className="bg-white rounded-xl shadow-lg p-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 text-center">Payoff Rules</h4>
                <PayoffMatrix compact={true} />
            </div>
        </div>

        {/* Right: The Response (Slider) */}
        <div className="flex flex-col justify-start">
             <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8 sticky top-6">
                <div className="text-center space-y-2">
                    <h3 className="text-xl font-medium text-gray-800">
                        Will you cooperate with <span className="font-bold text-indigo-600">{agentOpponent.label}</span>?
                    </h3>
                    <p className="text-sm text-gray-500">Drag the slider to indicate your probability.</p>
                </div>

                <div className="space-y-6">
                    <div className="relative pt-6 pb-2">
                         {/* Slider Value Tooltip */}
                         <div 
                            className="absolute -top-2 transform -translate-x-1/2 bg-gray-900 text-white text-xs font-bold px-2 py-1 rounded transition-all"
                            style={{ left: `${sliderValue}%` }}
                         >
                             {sliderValue}%
                         </div>
                         <input
                            type="range"
                            min="0"
                            max="100"
                            value={sliderValue}
                            onChange={(e) => setSliderValue(Number(e.target.value))}
                            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                         />
                         <div className="flex justify-between text-xs font-bold text-gray-400 mt-2 uppercase">
                             <span>Definitely Defect</span>
                             <span>Unsure</span>
                             <span>Definitely Cooperate</span>
                         </div>
                    </div>

                    {/* Gamification / Feedback Visual */}
                    <div className="flex justify-center">
                        <div className={`
                            transition-all duration-300 text-4xl p-4 rounded-full shadow-inner border-4
                            ${sliderValue > 60 ? 'bg-green-100 border-green-200' : sliderValue < 40 ? 'bg-red-100 border-red-200' : 'bg-gray-100 border-gray-200'}
                        `}>
                             {sliderValue > 60 ? '🤝' : sliderValue < 40 ? '🛑' : '🤔'}
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleNext}
                    className="w-full py-4 bg-gray-900 text-white text-lg font-bold rounded-xl shadow-xl hover:bg-black transition-all transform hover:-translate-y-1 active:translate-y-0"
                >
                    {currentScenarioIdx === scenarios.length - 1 ? 'Submit Results' : 'Confirm & Next'}
                </button>
             </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyView;