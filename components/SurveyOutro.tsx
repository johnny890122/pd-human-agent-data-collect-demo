import React, { useState } from 'react';
import { SurveyResult } from '../types';

export interface SurveyOutroProps {
  results: SurveyResult[];
  onBack: () => void;
  onComplete?: (entryId: string, results: SurveyResult[], demographics: { age: number, gender: string, education: string }) => void;
  entryId?: string;
}

const SurveyOutro: React.FC<SurveyOutroProps> = ({ results, onBack, onComplete, entryId }) => {
  const [step, setStep] = useState(1);
  const [codeValue, setCodeValue] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const trimmedEmail = emailValue.trim();
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
  const showEmailError = trimmedEmail.length > 0 && !isEmailValid;

  const handleFinalSubmit = async () => {
    if (!isEmailValid || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // 構建 demographics 物件，包含報名代碼和 email
      const demographics = {
        age: parseInt(codeValue) || 0,
        gender: codeValue || 'unknown', // 將代碼也存入 gender，避免因代碼包含英文而使 parseInt(codeValue) 變成 NaN 導致資料遺失
        education: trimmedEmail
      };
      
      // 呼叫 completeSurvey
      if (onComplete && entryId) {
        await onComplete(entryId, results, demographics);
      }
      
      // 完成後進入下一步
      setStep(3);
    } catch (error) {
      console.error('Failed to complete survey:', error);
      alert('提交失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 md:p-8 text-center space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <h2 className="text-2xl font-bold text-gray-900">報名代碼確認</h2>
          <p className="text-gray-600">
            請將我們給您的報名代碼，輸入到以下空格中：
          </p>
          <input
            type="text"
            className="w-full p-4 border border-gray-200 rounded-xl text-center text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 focus:bg-white transition-colors"
            placeholder="請輸入代碼"
            value={codeValue}
            onChange={(e) => setCodeValue(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
          />
          <button
            onClick={() => setStep(2)}
            disabled={!codeValue.trim()}
            className={`w-full py-4 text-lg font-bold rounded-xl shadow-sm transition-all ${
              !codeValue.trim()
                ? 'bg-gray-300 text-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            下一步
          </button>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 md:p-8 text-center space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">實驗結束！</h2>
          <p className="text-gray-600 leading-relaxed">
            謝謝您的參與，請在以下空格填上您的email，我們將會盡快聯絡您，把現金禮券email給您！
          </p>
          <input
            type="email"
            className={`w-full p-4 border rounded-xl text-center text-lg focus:outline-none focus:ring-2 bg-gray-50 focus:bg-white transition-colors ${showEmailError ? 'border-red-300 focus:ring-red-400' : 'border-gray-200 focus:ring-indigo-500'}`}
            placeholder="您的 Email"
            value={emailValue}
            onChange={(e) => setEmailValue(e.target.value)}
          />
          {showEmailError && (
            <p className="text-sm text-red-600 text-left">請輸入正確的 Email 格式，例如：name@example.com</p>
          )}
          <button
            onClick={handleFinalSubmit}
            disabled={!isEmailValid || isSubmitting}
            className={`w-full py-4 text-lg font-bold rounded-xl shadow-sm transition-all ${
              !isEmailValid || isSubmitting
                ? 'bg-gray-300 text-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isSubmitting ? '提交中...' : '送出'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 md:p-8 text-center space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <h2 className="text-2xl font-bold text-gray-900">表單已完成</h2>
        <p className="text-gray-600">您的聯絡方式已送出，再次感謝您的參與！您可以安全關閉此頁面。</p>
      </div>
    </div>
  );
};

export default SurveyOutro;
