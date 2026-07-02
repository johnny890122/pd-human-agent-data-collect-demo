import React, { useState, useEffect } from 'react';
import { SurveyResult } from '../types';
import { drawRealisedRound, fetchSubmission } from '../utils/graphqlClient';

export interface SurveyOutroProps {
  results: SurveyResult[];
  onBack: () => void;
  onComplete?: (entryId: string, results: SurveyResult[], demographics: { age: number, gender: string, education: string }) => void;
  entryId?: string;
  /** Which of the 4 debrief sub-pages to render (1: code confirm, 2: debrief, 3: email, 4: done). Sourced from the URL so refreshing stays on the same page. */
  currentStep: number;
  /** Navigate to a different debrief sub-page (updates the URL via the parent). */
  onNavigateStep: (step: number) => void;
}

const SurveyOutro: React.FC<SurveyOutroProps> = ({ results: resultsProp, onBack: _onBack, onComplete, entryId, currentStep: step, onNavigateStep }) => {
  const [codeValue, setCodeValue] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRoundIdx, setSelectedRoundIdx] = useState<number | null>(null);
  const [results, setResults] = useState<SurveyResult[]>(resultsProp);
  const [myDecisions, setMyDecisions] = useState<boolean[]>([]);
  const [opponentDecisions, setOpponentDecisions] = useState<boolean[]>([]);

  useEffect(() => {
    if (step !== 2) return;

    const load = async () => {
      if (!entryId) return;

      // Fetch submission for results (page-refresh case) and any already-persisted debrief data
      let liveResults = results;
      try {
        const sub = await fetchSubmission(entryId);
        if (sub?.results?.length) {
          liveResults = sub.results;
          setResults(liveResults);
        }
        // If debrief data already generated, reuse it (idempotent)
        if (
          sub?.realisedRoundIndex !== null && sub?.realisedRoundIndex !== undefined &&
          sub?.opponentProbs?.length && sub?.myDecisions?.length && sub?.opponentDecisions?.length
        ) {
          setSelectedRoundIdx(sub.realisedRoundIndex);
          setMyDecisions(sub.myDecisions);
          setOpponentDecisions(sub.opponentDecisions);
          return;
        }
      } catch {
        // proceed to draw anyway
      }

      // First time (or legacy submission missing the persisted draws): ask backend
      // to generate and persist debrief data. The resolver is idempotent, so this
      // is also how pre-existing realisedRoundIndex/opponentProbs get migrated.
      try {
        const debrief = await drawRealisedRound(entryId);
        setSelectedRoundIdx(debrief.realisedRoundIndex);
        setMyDecisions(debrief.myDecisions);
        setOpponentDecisions(debrief.opponentDecisions);
      } catch {
        // fallback: local random so the page isn't stuck
        const idx = Math.floor(Math.random() * Math.max(liveResults.length, 1));
        const probs = liveResults.map(() => Math.random());
        setSelectedRoundIdx(idx);
        setMyDecisions(liveResults.map(r => Math.random() < r.cooperationProbability));
        setOpponentDecisions(probs.map(p => Math.random() < p));
      }
    };

    load();
  }, [step]);

  const trimmedEmail = emailValue.trim();
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
  const showEmailError = trimmedEmail.length > 0 && !isEmailValid;

  const handleFinalSubmit = async () => {
    if (!isEmailValid || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const demographics = {
        age: parseInt(codeValue) || 0,
        gender: codeValue || 'unknown',
        education: trimmedEmail
      };

      if (onComplete && entryId) {
        await onComplete(entryId, results, demographics);
      }

      onNavigateStep(4);
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
            onClick={() => onNavigateStep(2)}
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
    if (selectedRoundIdx === null) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-400 text-sm">載入中...</div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-start justify-center p-4 pt-8">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-6 md:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">結果回顧</h2>
            <p className="text-gray-500 mt-1">以下是系統根據您決策的機率值，隨機決定的結果。</p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 w-16">回合</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">您</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">搭檔</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600 w-20">點數</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => {
                  const isSelected = i === selectedRoundIdx;
                  const myGive = myDecisions[i];
                  const myLabel = myGive ? '合作' : '不合作';
                  const myLabelColor = myGive ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100';
                  const oppGive = opponentDecisions[i];
                  const oppLabel = oppGive ? '合作' : '不合作';
                  const oppLabelColor = oppGive ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100';
                  const points = myGive && oppGive ? 2 : !myGive && oppGive ? 3 : myGive && !oppGive ? 0 : 1;
                  return (
                    <tr
                      key={r.scenarioId}
                      className={`border-b border-gray-100 last:border-0 ${isSelected ? 'bg-amber-50 border-l-4 border-l-amber-400' : ''}`}
                    >
                      <td className="px-3 py-3 font-medium text-gray-700 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {i + 1}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-gray-800">
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${myLabelColor}`}>
                          {myLabel}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-gray-800">
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${oppLabelColor}`}>
                          {oppLabel}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-gray-800">{points}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {(() => {
            const selResult = results[selectedRoundIdx];
            const selMyGive = selResult ? myDecisions[selectedRoundIdx] : false;
            const selOppGive = opponentDecisions[selectedRoundIdx];
            const selPoints = selResult
              ? (selMyGive && selOppGive ? 2 : !selMyGive && selOppGive ? 3 : selMyGive && !selOppGive ? 0 : 1)
              : null;
            const reward = selPoints !== null ? selPoints * 100 : null;
            return (
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 space-y-3">
                <h3 className="font-bold text-indigo-900 text-base">您的獎勵</h3>
                <div className="space-y-1 text-sm text-indigo-800">
                  <div className="flex justify-between">
                    <span className="text-gray-600">抽中回合</span>
                    <span className="font-semibold">第 {selectedRoundIdx + 1} 回合</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">點數</span>
                    <span className="font-semibold">{selPoints ?? '—'} 點</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-indigo-200 text-base">
                    <span className="font-semibold text-indigo-900">獎勵金額</span>
                    <span className="font-bold text-indigo-900">
                      <span className="text-lg">{reward ?? '—'} 元</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          <button
            onClick={() => onNavigateStep(3)}
            className="w-full py-4 text-lg font-bold rounded-xl shadow-sm transition-all bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            繼續
          </button>
        </div>
      </div>
    );
  }

  if (step === 3) {
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
        <p className="text-gray-600">您的填答已送出，再次感謝您的參與！您可以安全關閉此頁面。</p>
      </div>
    </div>
  );
};

export default SurveyOutro;
