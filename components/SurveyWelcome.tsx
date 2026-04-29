import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const SurveyWelcome: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  const handleStart = () => {
    if (sessionId) {
      navigate(`/survey/intro/0?sessionId=${sessionId}`);
    } else {
      navigate('/survey/intro/0');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
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
              整個過程大約需要 5 到 10 分鐘。您的所有回答都將匿名處理，並僅供學術研究用途，請安心作答。
            </p>
            <p>
              準備好後，請點擊下方按鈕以進入實驗說明階段。
            </p>
          </div>

          <div className="pt-4 flex justify-center">
            <button
              onClick={handleStart}
              className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
            >
              開始實驗
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyWelcome;
