import React from 'react';
import { SurveyResult } from '../types';

export interface SurveyOutroProps {
  results: SurveyResult[];
  onBack: () => void;
}

const SurveyOutro: React.FC<SurveyOutroProps> = ({ results, onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 md:p-8 text-center space-y-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Survey Complete</h2>
        <p className="text-gray-600">Thank you for your participation. Your responses have been recorded.</p>

      </div>
    </div>
  );
};

export default SurveyOutro;
