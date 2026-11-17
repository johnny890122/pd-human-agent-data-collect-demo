import React, { useState, useEffect } from 'react';
import { Submission, SurveyResult, QuestionnaireAnswer } from '../types';
import { DebriefResult, drawRealisedRound, fetchSubmission } from '../utils/graphqlClient';
import { PAYMENT_METHOD_TEXT, PAYMENT_TIMELINE_TEXT, POINT_TO_NTD, payoffPoints, pointPayoutNtd } from '../utils/payment.js';
import { QUESTIONNAIRE } from '../utils/questionnaire.js';

// The persisted debrief, if this submission already has a complete one (including its payout)
function persistedDebrief(sub: Submission | null): DebriefResult | null {
  if (
    sub?.realisedRoundIndex == null || !sub.myDecisions?.length || !sub.opponentDecisions?.length ||
    sub.realisedPoints == null || sub.payoutNtd == null
  ) {
    return null;
  }
  return {
    realisedRoundIndex: sub.realisedRoundIndex,
    opponentProbs: sub.opponentProbs ?? [],
    myDecisions: sub.myDecisions,
    opponentDecisions: sub.opponentDecisions,
    realisedPoints: sub.realisedPoints,
    payoutNtd: sub.payoutNtd,
  };
}

// The registration code must survive a refresh on steps 2–3 (REQ-403.1, BUG-009). Storage can
// be unavailable (private mode, blocked site data); then the code simply lives in memory.
const codeKey = (entryId: string) => `survey_code_${entryId}`;

function readStoredCode(entryId?: string): string {
  if (!entryId) return '';
  try {
    return localStorage.getItem(codeKey(entryId)) ?? '';
  } catch {
    return '';
  }
}

function writeStoredCode(entryId: string | undefined, code: string | null) {
  if (!entryId) return;
  try {
    if (code) localStorage.setItem(codeKey(entryId), code);
    else localStorage.removeItem(codeKey(entryId));
  } catch {
    // storage unavailable — keep the in-memory value only
  }
}

// Questionnaire answers (REQ-416) survive a refresh until the survey is submitted. sessionStorage, not
// localStorage: political opinions of someone who leaves unsubmitted must not stay on a shared device.
type Answers = Record<string, string>;
const answersKey = (entryId: string) => `survey_questionnaire_${entryId}`;

function readStoredAnswers(entryId?: string): Answers {
  if (!entryId) return {};
  try {
    return JSON.parse(sessionStorage.getItem(answersKey(entryId)) ?? '{}') ?? {};
  } catch {
    return {};
  }
}

function writeStoredAnswers(entryId: string | undefined, answers: Answers | null) {
  if (!entryId) return;
  try {
    if (answers) sessionStorage.setItem(answersKey(entryId), JSON.stringify(answers));
    else sessionStorage.removeItem(answersKey(entryId));
  } catch {
    // storage unavailable — keep the in-memory answers only
  }
}

export interface SurveyOutroProps {
  results: SurveyResult[];
  onBack: () => void;
  onComplete?: (entryId: string, results: SurveyResult[], demographics: { age: number, gender: string, education: string }, questionnaire: QuestionnaireAnswer[]) => void;
  entryId?: string;
  /** Which of the 5 debrief sub-pages to render (1: code confirm, 2: debrief, 3: questionnaire, 4: email, 5: done). Sourced from the URL so refreshing stays on the same page. */
  currentStep: number;
  /** Navigate to a different debrief sub-page (updates the URL via the parent). */
  onNavigateStep: (step: number) => void;
}

const SurveyOutro: React.FC<SurveyOutroProps> = ({ results: resultsProp, onBack: _onBack, onComplete, entryId, currentStep: step, onNavigateStep }) => {
  const [codeValue, setCodeValue] = useState(() => readStoredCode(entryId));
  const [answers, setAnswers] = useState<Answers>(() => readStoredAnswers(entryId));
  const [emailValue, setEmailValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<SurveyResult[]>(resultsProp);
  const [debrief, setDebrief] = useState<DebriefResult | null>(null);
  const [debriefStatus, setDebriefStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadAttempt, setLoadAttempt] = useState(0);

  // entryId can arrive after mount (restored asynchronously on a refresh)
  useEffect(() => {
    if (!codeValue) setCodeValue(readStoredCode(entryId));
    if (!Object.keys(answers).length) setAnswers(readStoredAnswers(entryId));
  }, [entryId]);

  const answer = (questionId: string, value: string) => {
    const next = { ...answers, [questionId]: value };
    setAnswers(next);
    writeStoredAnswers(entryId, next);
  };
  const answeredCount = QUESTIONNAIRE.filter((q) => answers[q.id]).length;
  const allAnswered = answeredCount === QUESTIONNAIRE.length;

  const updateCode = (value: string) => {
    setCodeValue(value);
    writeStoredCode(entryId, value);
  };

  // Steps 2 (debrief) and 4 (email) both show the saved result, so both load it
  useEffect(() => {
    if (step !== 2 && step !== 4) return;
    // Already loaded on an earlier step (2 → 4): keep showing the same result
    if (!entryId || debrief) return;
    let cancelled = false;

    const load = async () => {
      setDebriefStatus('loading');

      // Fetch submission for results (page-refresh case) and any already-persisted debrief data
      let saved: DebriefResult | null = null;
      try {
        const sub = await fetchSubmission(entryId);
        if (sub?.results?.length && !cancelled) setResults(sub.results);
        saved = persistedDebrief(sub);
      } catch {
        // proceed to draw anyway
      }

      try {
        // First time (or a submission drawn before the payout was persisted): the resolver is
        // idempotent, so it draws once and otherwise returns / backfills the saved result.
        const result = saved ?? await drawRealisedRound(entryId);
        if (cancelled) return;
        setDebrief(result);
        setDebriefStatus('ready');
      } catch {
        // Never fall back to a locally drawn result: its amount would not match what the
        // researcher pays (REQ-408.6)
        if (!cancelled) setDebriefStatus('error');
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [step, entryId, loadAttempt]);

  const trimmedEmail = emailValue.trim();
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
  const showEmailError = trimmedEmail.length > 0 && !isEmailValid;

  const handleFinalSubmit = async () => {
    if (!isEmailValid || isSubmitting) return;
    // Without the code the payment can't be matched to the participant: ask for it again
    if (!codeValue.trim()) {
      onNavigateStep(1);
      return;
    }
    // The questionnaire is required (REQ-416): e.g. reached step 4 by URL
    if (!allAnswered) {
      onNavigateStep(3);
      return;
    }

    setIsSubmitting(true);

    try {
      const demographics = {
        age: parseInt(codeValue) || 0,
        gender: codeValue,
        education: trimmedEmail
      };

      const questionnaire = QUESTIONNAIRE.map((q) => ({ questionId: q.id, answer: answers[q.id] }));
      if (onComplete && entryId) {
        await onComplete(entryId, results, demographics, questionnaire);
        writeStoredCode(entryId, null);
        writeStoredAnswers(entryId, null);
      }

      onNavigateStep(5);
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
            onChange={(e) => updateCode(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
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
    if (debriefStatus === 'error') {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 md:p-8 text-center space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">讀取結果失敗</h2>
            <p className="text-gray-600 leading-relaxed">
              目前無法取得您的實驗結果。您的作答已經保存，請確認網路連線後再試一次。
            </p>
            <button
              onClick={() => setLoadAttempt(attempt => attempt + 1)}
              className="w-full py-4 text-lg font-bold rounded-xl shadow-sm transition-all bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              重試
            </button>
          </div>
        </div>
      );
    }

    if (debriefStatus !== 'ready' || !debrief) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-400 text-sm">載入中...</div>
        </div>
      );
    }

    const { realisedRoundIndex, myDecisions, opponentDecisions, realisedPoints, payoutNtd } = debrief;
    const pointPayout = pointPayoutNtd(realisedPoints);
    // Derived from the persisted total, so it always matches the amount that is paid
    const participationFee = payoutNtd - pointPayout;

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
                {myDecisions.map((myGive, i) => {
                  const isSelected = i === realisedRoundIndex;
                  const myLabel = myGive ? '合作' : '不合作';
                  const myLabelColor = myGive ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100';
                  const oppGive = opponentDecisions[i];
                  const oppLabel = oppGive ? '合作' : '不合作';
                  const oppLabelColor = oppGive ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100';
                  const points = payoffPoints(myGive, oppGive);
                  return (
                    <tr
                      key={results[i]?.scenarioId ?? i}
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

          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 space-y-3">
            <h3 className="font-bold text-indigo-900 text-base">您的獎勵</h3>
            <div className="space-y-1 text-sm text-indigo-800">
              <div className="flex justify-between">
                <span className="text-gray-600">抽中回合</span>
                <span className="font-semibold">第 {realisedRoundIndex + 1} 回合</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">點數</span>
                <span className="font-semibold">{realisedPoints} 點</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-600">點數報酬</span>
                <span className="font-semibold text-right">{realisedPoints} 點 × {POINT_TO_NTD} = 新台幣 {pointPayout} 元</span>
              </div>
              {participationFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">參與費</span>
                  <span className="font-semibold">新台幣 {participationFee} 元</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-indigo-200 text-base">
                <span className="font-semibold text-indigo-900">合計</span>
                <span className="font-bold text-indigo-900">
                  <span className="text-lg">新台幣 {payoutNtd} 元</span>
                </span>
              </div>
            </div>
            <p className="text-xs text-indigo-700 leading-relaxed">
              報酬將以{PAYMENT_METHOD_TEXT}的形式，於{PAYMENT_TIMELINE_TEXT}寄送到您稍後填寫的 Email。
            </p>
          </div>

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

  // REQ-416: post-survey questionnaire, all eight required — styled like the 理解測試 quiz (intro step 6)
  if (step === 3) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-0 md:p-4">
        <div className="max-w-2xl md:max-w-5xl w-full bg-white md:rounded-[2rem] shadow-none md:shadow-2xl p-4 sm:p-6 md:p-12 flex flex-col min-h-screen md:min-h-[600px] border-none md:border border-gray-100">
          <div className="text-center space-y-3 mb-10">
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">問卷</h1>
            <div className="w-20 h-1.5 bg-indigo-500 mx-auto rounded-full" />
          </div>

          <div className="flex-1 flex flex-col justify-center max-w-lg md:max-w-4xl mx-auto w-full">
            <div className="space-y-6 text-gray-600 leading-relaxed text-base animate-in fade-in slide-in-from-bottom-2 duration-500 w-full max-w-3xl mx-auto">
              <div className="bg-amber-50/50 md:bg-amber-50 border-none md:border border-amber-200 p-2 sm:p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-none md:shadow-sm">
                <p className="text-center text-amber-800 mb-8">請依照您的看法回答以下問題，答案沒有對錯。</p>

                <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-5 border-none md:border border-amber-100 shadow-none md:shadow-sm divide-y divide-amber-100">
                  {QUESTIONNAIRE.map((q) => (
                    // Options right of the text on ≥ 640px, below it on a phone
                    <div
                      key={q.id}
                      role="radiogroup"
                      aria-labelledby={`${q.id}-text`}
                      className="py-4 first:pt-0 last:pb-0 sm:flex sm:items-center sm:gap-6"
                    >
                      <p id={`${q.id}-text`} className="text-sm font-bold text-gray-800 leading-loose sm:flex-1">
                        {q.id.slice(1)}. {q.text}
                      </p>
                      <div className="mt-2 sm:mt-0 grid grid-cols-2 gap-2 sm:w-48 sm:shrink-0">
                        {q.options.map((option) => {
                          const checked = answers[q.id] === option;
                          return (
                            <label
                              key={option}
                              className={`flex items-center justify-center gap-1.5 px-2 py-1.5 text-sm font-bold border rounded cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-amber-500 ${
                                checked ? 'border-amber-500 bg-amber-50 text-amber-800' : 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-white'
                              }`}
                            >
                              <input
                                type="radio"
                                name={q.id}
                                value={option}
                                checked={checked}
                                onChange={() => answer(q.id, option)}
                                className="accent-amber-500"
                              />
                              {option}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 space-y-4 max-w-lg md:max-w-4xl mx-auto w-full">
            <p className="text-sm text-gray-500 text-center">已回答 {answeredCount} / {QUESTIONNAIRE.length}</p>
            <button
              onClick={() => onNavigateStep(4)}
              disabled={!allAnswered}
              className={`w-full py-4 text-base font-bold rounded-2xl shadow-lg transition-all active:scale-95 ${
                !allAnswered ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none transform-none' : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              下一步<span aria-hidden="true"> →</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 4) {
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
            謝謝您的參與！請在以下空格填上您的 Email，我們將於{PAYMENT_TIMELINE_TEXT}，
            {debriefStatus === 'ready' && debrief
              ? <>把<strong className="text-gray-900">新台幣 {debrief.payoutNtd} 元</strong>的{PAYMENT_METHOD_TEXT}</>
              : <>把您的報酬以{PAYMENT_METHOD_TEXT}</>}
            寄送到這個 Email。
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
