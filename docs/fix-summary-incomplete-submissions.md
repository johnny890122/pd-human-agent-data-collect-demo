# 修復總結：Incomplete Submissions Bug

## 問題描述

Session `f059e0a1-c3f1-4c5d-909c-2f21f4fe258a` 和其他所有 sessions 都存在同樣的系統性問題：用戶完成問卷並繳交，但 history 狀態顯示 incomplete。

## 根本原因

[`components/SurveyOutro.tsx`](../components/SurveyOutro.tsx) 從未呼叫 `completeSurvey` mutation。

### 問題流程（修復前）
```
用戶完成所有題目 
  → 答案保存到 results[] ✓
  → 進入 Outro 頁面 ✓
  → 填寫報名代碼和 email ✓
  → ❌ 沒有呼叫 completeSurvey()
  → isCompleted 保持為 false ❌
```

### 正確流程（修復後）
```
用戶完成所有題目 
  → 答案保存到 results[] ✓
  → 進入 Outro 頁面 ✓
  → 填寫報名代碼和 email ✓
  → ✅ 呼叫 completeSurvey(submissionId, demographics)
  → isCompleted 設為 true ✓
  → session.submissionCount + 1 ✓
```

## 已完成的修復

### 1. [`components/SurveyOutro.tsx`](../components/SurveyOutro.tsx)

**修改內容**：
- ✅ 添加 props：`onComplete` 和 `entryId`
- ✅ 創建 `handleFinalSubmit` 函數處理最終提交
- ✅ 添加 `isSubmitting` 狀態防止重複提交
- ✅ 在用戶提交 email 後呼叫 `completeSurvey`

**Demographics 數據結構**：
```typescript
{
  age: parseInt(codeValue) || 0,      // 報名代碼（數字）
  gender: 'unknown',                   // 預設值
  education: trimmedEmail              // 用戶 email
}
```

**關鍵代碼**：
```typescript
const handleFinalSubmit = async () => {
  if (!isEmailValid || isSubmitting) return;
  
  setIsSubmitting(true);
  
  try {
    const demographics = {
      age: parseInt(codeValue) || 0,
      gender: 'unknown',
      education: trimmedEmail
    };
    
    if (onComplete && entryId) {
      await onComplete(entryId, results, demographics);
    }
    
    setStep(3);
  } catch (error) {
    console.error('Failed to complete survey:', error);
    alert('提交失敗，請稍後再試');
  } finally {
    setIsSubmitting(false);
  }
};
```

### 2. [`components/SurveyView.tsx`](../components/SurveyView.tsx)

**修改內容**：
- ✅ 傳遞 `onComplete` 和 `entryId` 給 SurveyOutro

**修改代碼**：
```typescript
// 修復前
if (isOutroStep) {
  return <SurveyOutro results={results} onBack={onBack} />;
}

// 修復後
if (isOutroStep) {
  return <SurveyOutro results={results} onBack={onBack} onComplete={onComplete} entryId={entryId} />;
}
```

## 影響範圍

此 bug 影響**所有用戶**，包括：
- 所有 manual sessions
- 所有 batch sessions
- 所有 mixed mode sessions

## 測試建議

1. ✅ 創建新 session 並完成問卷流程
2. ✅ 確認在 Outro 提交 email 後，submission 狀態更新為 completed
3. ✅ 檢查 history table 顯示正確的完成狀態
4. ✅ 驗證 session.submissionCount 正確遞增

## 遺留問題：舊資料修復

對於在此修復之前已經完成但標記為 incomplete 的 submissions，有兩種處理方式：

### 方式 1：使用修復腳本（推薦）

已創建 [`scripts/fix-incomplete-submission.mjs`](../scripts/fix-incomplete-submission.mjs) 腳本。

**使用方式**：
```bash
# 檢查特定 session
node scripts/fix-incomplete-submission.mjs <sessionId>

# 應用修復
node scripts/fix-incomplete-submission.mjs <sessionId> --fix

# 檢查所有 incomplete submissions
node scripts/fix-incomplete-submission.mjs --check-all
```

**腳本功能**：
- 檢查 submission 是否有完整的 results
- 如果 results 數量等於 session 的 scenarios 數量，標記為可修復
- 執行修復：設定 `isCompleted: true` 並更新 `session.submissionCount`

### 方式 2：手動修復

如果需要針對特定 submission 手動修復：

```javascript
// 在 MongoDB shell 或 Node.js 腳本中
await SubmissionModel.findByIdAndUpdate(
  submissionId,
  {
    $set: {
      isCompleted: true,
      completedAt: new Date(),
    },
  }
);

await SessionModel.findByIdAndUpdate(
  sessionId,
  { $inc: { submissionCount: 1 } }
);
```

## 相關文件

- [`docs/bug-report-session-f059e0a1.md`](./bug-report-session-f059e0a1.md) - 詳細 bug 報告
- [`scripts/fix-incomplete-submission.mjs`](../scripts/fix-incomplete-submission.mjs) - 修復腳本

## 結論

✅ **系統性 bug 已修復**

新用戶從此刻起將正確完成問卷流程。舊的 incomplete submissions 需要使用修復腳本批次處理。

建議後續：
1. 運行修復腳本處理舊資料
2. 監控新的 submissions 確保正確完成
3. 考慮在 admin 界面添加批次修復功能
