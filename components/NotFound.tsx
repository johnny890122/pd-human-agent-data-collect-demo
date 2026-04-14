import React from 'react';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold tracking-wide text-indigo-700">404</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">找不到頁面</h1>
        <p className="mt-3 text-sm text-gray-600">
          您所輸入的網址不存在或已被移除。
        </p>
      </div>
    </div>
  );
};

export default NotFound;
