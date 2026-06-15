import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const SurveyWelcome: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const groupId = searchParams.get('groupId');
  const mode = searchParams.get('mode');
  const [isChrome, setIsChrome] = useState<boolean>(true);

  useEffect(() => {
    const ua = navigator.userAgent;
    // CriOS is Chrome on iOS (iPhone/iPad); Chrome/ covers Android/Desktop Chrome
    setIsChrome((/Chrome\//.test(ua) || /CriOS\//.test(ua)) && !/Edg\//.test(ua) && !/OPR\//.test(ua));
  }, []);

  const handleStart = () => {
    // Mixed Mode: Preserve groupId + mode through intro
    if (groupId && mode === 'mixed') {
      navigate(`/survey/intro/0?groupId=${groupId}&mode=mixed`);
    } else if (sessionId) {
      navigate(`/survey/intro/0?sessionId=${sessionId}`);
    } else {
      navigate('/survey/intro/0');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      {!isChrome && (
        <div className="w-full max-w-3xl mb-4 bg-amber-50 border border-amber-300 rounded-xl px-6 py-4 flex items-start gap-3">
          <svg className="w-6 h-6 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.194-.833-2.964 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <p className="font-semibold text-amber-800">請使用 Google Chrome 瀏覽器</p>
            <p className="text-sm text-amber-700 mt-1">
              本實驗僅支援 Chrome，使用其他瀏覽器可能導致實驗無法正常運行。請複製網址並在 Chrome 中開啟。
            </p>
          </div>
        </div>
      )}
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-3xl overflow-hidden text-gray-800">
        <div className="p-8 sm:p-12 space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              歡迎參與本次實驗
            </h1>
            <p className="text-lg text-gray-500">
              請仔細閱讀以下說明並完成實驗
            </p>
          </div>

          <div className="space-y-6 text-lg text-gray-600 leading-relaxed bg-gray-50 p-6 sm:p-8 rounded-2xl border border-gray-100">
            <p>
              感謝您撥冗參與。在接下來的實驗中，您將會遇到數個互動情境，並需要根據提供的情境資訊做出相對應的決策。
            </p>
            <p>
              整個過程大約需要 20 分鐘。您的所有回答都將匿名處理，並僅供學術研究用途，請安心作答。
            </p>
            <p>
              準備好後，請點擊下方按鈕以進入實驗說明階段。
            </p>
          </div>

          <div className="pt-4 flex justify-center">
            <button
              onClick={handleStart}
              disabled={!isChrome}
              className={`px-10 py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg transition-all duration-200 ${
                isChrome
                  ? 'hover:bg-blue-700 hover:shadow-xl transform hover:-translate-y-1'
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              開始實驗
            </button>
          </div>

          {/* Privacy Notice - Subtle footer */}
          <div className="pt-6 pb-2 text-xs text-gray-400 leading-relaxed border-t border-gray-100">
            <p className="mb-1">
              本研究使用瀏覽器指紋技術防止重複提交，不收集個資。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyWelcome;
