# Bug Report: Session f059e0a1-c3f1-4c5d-909c-2f21f4fe258a 狀態問題

## 問題描述
用戶完成 survey 並繳交，但 history 狀態顯示 incomplete。

## 根本原因分析

### 問題定位
通過代碼審查，發現了問題所在：

1. **SurveyView.tsx 第 349 行**：
   ```typescript
   if (isOutroStep) {
     return <SurveyOutro results={results} onBack={onBack} />;
   }
   ```

2. **SurveyOutro.tsx**：
   - 接收的 props：`results` 和 `onBack`
   - **缺少**：`onComplete` prop
   - Outro 頁面有三個步驟：
     1. 輸入報名代碼
     2. 輸入 email  
     3. 顯示完成訊息
   - 但在這整個流程中，**從未呼叫 completeSurvey mutation**！

3. **預期流程 vs 實際流程**：
   
   **預期流程**：
   ```
   完成所有題目 → 進入 Outro → 填寫資料 → 呼叫 completeSurvey() → isCompleted = true
   ```
   
   **實際流程**：
   ```
   完成所有題目 → 進入 Outro → 填寫資料 → (沒有呼叫 completeSurvey) → isCompleted = false ❌
   ```

### 相關代碼

#### App.tsx (第 285-306 行)
```typescript
const handleSurveyComplete = async (submissionId: string, _results: SurveyResult[], demographics: { age: number, gender: string, education: string }) => {
  setIsSubmitting(true);
  console.log('Survey Completed');

  try {
    if (useLegacyMode || setupIdFromUrl) {
      await completeSurveyEntry(submissionId, demographics);
    } else {
      await completeSurvey(submissionId, demographics);
    }
    setBackendNotice(null);
    const currentId = sessionIdFromUrl || setupIdFromUrl || setup.id || '';
    clearSession(currentId);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    setBackendNotice(`Could not persist survey results: ${message}`);
  }

  setIsSubmitting(false);
  const urlSuffix = sessionIdFromUrl ? `?sessionId=${sessionIdFromUrl}` : setupIdFromUrl ? `?setupId=${setupIdFromUrl}` : '';
  navigate(`/survey/outro${urlSuffix}`, { replace: true });
};
```

#### backend/graphql/resolvers.js (第 541-568 行)
```javascript
completeSurvey: async (_, { submissionId, demographics }) => {
  requireDb();
  await connectToDatabase();
  
  const submission = await SubmissionModel.findByIdAndUpdate(
    submissionId,
    {
      $set: {
        demographics,
        isCompleted: true,        // ← 這裡設定完成狀態
        completedAt: new Date(),
      },
    },
    { new: true }
  );
  
  if (!submission) {
    throw new Error('Submission not found');
  }
  
  // 更新 session 的 submissionCount
  await SessionModel.findByIdAndUpdate(
    submission.sessionId,
    { $inc: { submissionCount: 1 } }
  );
  
  return toSubmissionGraph(submission);
},
```

## 解決方案

### 選項 1：在 Outro 最後步驟呼叫 completeSurvey（推薦）
修改 SurveyOutro 和 SurveyView，在用戶提交 email 後呼叫 `onComplete`。

**優點**：
- 用戶填寫完整資訊後才標記為完成
- 可以將 email 和代碼保存到 demographics

**缺點**：
- 需要修改 SurveyOutro 介面

### 選項 2：在進入 Outro 前就呼叫 completeSurvey
在 SurveyView 的 `handleNext` 中，當跳轉到 outro 時就呼叫 complete。

**優點**：
- 實作簡單
- 不需要修改 SurveyOutro

**缺點**：
- 用戶可能看到 outro 但沒有填寫資料就離開

### 選項 3：手動修復現有資料
為已經完成但狀態錯誤的 submission 手動更新狀態。

## 臨時修復方案（針對 session f059e0a1）

如果該 submission 已經有完整的 results（所有題目都回答了），可以手動標記為完成：

```javascript
// 手動修復腳本
import mongoose from 'mongoose';

const SubmissionModel = mongoose.model('Submission', submissionSchema, 'submissions');

async function fixSubmission(submissionId) {
  const submission = await SubmissionModel.findById(submissionId);
  
  // 檢查是否有完整的 results
  if (submission && submission.results && submission.results.length > 0) {
    // 更新為完成狀態
    await SubmissionModel.findByIdAndUpdate(
      submissionId,
      {
        $set: {
          isCompleted: true,
          completedAt: new Date(),
        },
      }
    );
    
    // 更新 session 的 submissionCount
    await SessionModel.findByIdAndUpdate(
      submission.sessionId,
      { $inc: { submissionCount: 1 } }
    );
    
    console.log(`Fixed submission ${submissionId}`);
  }
}
```

## 建議行動

1. **立即**：實作選項 1 或 2 來修復此問題
2. **後續**：檢查資料庫中是否有其他類似的 incomplete submissions
3. **測試**：確保修復後的流程正確觸發 completeSurvey

## 受影響的檔案

- [`components/SurveyView.tsx`](../components/SurveyView.tsx:349) - 需要傳遞 onComplete 到 SurveyOutro
- [`components/SurveyOutro.tsx`](../components/SurveyOutro.tsx) - 需要接收並呼叫 onComplete
- [`components/HistoryTable.tsx`](../components/HistoryTable.tsx:193-200) - 顯示狀態的地方
