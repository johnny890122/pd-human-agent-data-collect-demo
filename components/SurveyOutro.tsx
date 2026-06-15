import React, { useState, useEffect, useMemo } from 'react';
import { SurveyResult } from '../types';
import { drawRealisedRound, fetchSubmission } from '../utils/graphqlClient';

export interface SurveyOutroProps {
  results: SurveyResult[];
  onBack: () => void;
  onComplete?: (entryId: string, results: SurveyResult[], demographics: { age: number, gender: string, education: string }) => void;
  entryId?: string;
}

const SurveyOutro: React.FC<SurveyOutroProps> = ({ results: resultsProp, onBack: _onBack, onComplete, entryId }) => {
  const [step, setStep] = useState(1);
  const [codeValue, setCodeValue] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRoundIdx, setSelectedRoundIdx] = useState<number | null>(null);
  const [results, setResults] = useState<SurveyResult[]>(resultsProp);
  const [opponentProbs, setOpponentProbs] = useState<number[]>([]);
  const randomDecisions = useMemo(() => Array.from({ length: results.length }, () => Math.random() > 0.5), [results.length]);

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
        if (sub?.realisedRoundIndex !== null && sub?.realisedRoundIndex !== undefined && sub?.opponentProbs?.length) {
          setSelectedRoundIdx(sub.realisedRoundIndex);
          setOpponentProbs(sub.opponentProbs);
          return;
        }
      } catch {
        // proceed to draw anyway
      }

      // First time: ask backend to generate and persist debrief data
      try {
        const debrief = await drawRealisedRound(entryId);
        setSelectedRoundIdx(debrief.realisedRoundIndex);
        setOpponentProbs(debrief.opponentProbs);
      } catch {
        // fallback: local random so the page isn't stuck
        setSelectedRoundIdx(Math.floor(Math.random() * Math.max(liveResults.length, 1)));
        setOpponentProbs(liveResults.map(() => Math.random()));
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

      setStep(4);
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
            <h2 className="text-2xl font-bold text-gray-900">實驗結果回顧</h2>
            <p className="text-gray-500 mt-1">以下是您每回合的決策記錄</p>
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
                  const myProb = r.cooperationProbability;
                  const myPct = Math.round(myProb * 100);
                  const myAtFifty = myProb === 0.5;
                  const myGive = myAtFifty ? randomDecisions[i] : myProb > 0.5;
                  const myLabel = myGive ? '合作' : '不合作';
                  const myLabelColor = myGive ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100';
                  const oppProb = opponentProbs[i];
                  const oppPct = Math.round(oppProb * 100);
                  const oppAtFifty = oppProb === 0.5;
                  const oppGive = oppAtFifty ? randomDecisions[i] : oppProb > 0.5;
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
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="font-semibold text-sm">{myPct}%</span>
                          {myAtFifty ? (
                            <span className="relative group inline-block">
                              <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full cursor-help ${myLabelColor}`}>
                                {myLabel} *
                              </span>
                              <span className="pointer-events-none absolute bottom-full left-0 mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-20 shadow-lg">
                                您選擇了 50%，由系統隨機決定為此結果
                              </span>
                            </span>
                          ) : (
                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${myLabelColor}`}>
                              {myLabel}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-gray-800">
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="font-semibold text-sm">{oppPct}%</span>
                          {oppAtFifty ? (
                            <span className="relative group inline-block">
                              <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full cursor-help ${oppLabelColor}`}>
                                {oppLabel} *
                              </span>
                              <span className="pointer-events-none absolute bottom-full left-0 mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-20 shadow-lg">
                                搭檔選擇了 50%，由系統隨機決定為此結果
                              </span>
                            </span>
                          ) : (
                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${oppLabelColor}`}>
                              {oppLabel}
                            </span>
                          )}
                        </div>
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
            const selOppProb = opponentProbs[selectedRoundIdx];
            const selMyProb = selResult?.cooperationProbability ?? 0;
            const selMyGive = selResult ? (selMyProb === 0.5 ? randomDecisions[selectedRoundIdx] : selMyProb > 0.5) : false;
            const selOppGive = selOppProb === 0.5 ? randomDecisions[selectedRoundIdx] : selOppProb > 0.5;
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
            onClick={() => setStep(3)}
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
