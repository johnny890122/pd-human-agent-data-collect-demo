# Legacy API 完全移除報告

**執行日期**: 2026-04-29  
**狀態**: ✅ 完成  
**影響範圍**: Manual Mode & Batch Mode  

---

## 執行摘要

完全移除了所有舊的 SessionSetup-based API，確保系統僅使用新的 Scenario-centric 架構。數據庫不需要向後兼容，可以重建。

---

## 移除的後端 API

### GraphQL Types (typeDefs.js)
- ❌ 移除 `type SessionSetup` (backward compatibility alias)
- ❌ 移除 `type SurveyAnswer` (legacy)
- ❌ 移除 `type Demographic` (legacy)
- ❌ 移除 `input DemographicInput` (legacy)
- ✅ 保留 `type Session` (新架構)
- ✅ 保留 `type Scenario` (新架構)

### GraphQL Queries (typeDefs.js + resolvers.js)
- ❌ 移除 `activeSessionSetup: SessionSetup`
- ❌ 移除 `sessionSetup(id: ID!): SessionSetup`
- ❌ 移除 `allSessionSetups(excludeBatchSessions: Boolean): [SessionSetup!]!`
- ✅ 保留 `session(id: ID!): Session`
- ✅ 保留 `allSessions(excludeGroupSessions: Boolean): [Session!]!`

### GraphQL Mutations (typeDefs.js + resolvers.js)
- ❌ 移除 `saveSessionSetup(setup: SessionInput!): SessionSetup!`
- ❌ 移除 `startSurveyEntry(sessionId: String!, edgeId: String!): Submission!`
- ❌ 移除 `saveSurveyAnswerLegacy(entryId: ID!, answer: SurveyAnswerInput!): Submission!`
- ❌ 移除 `completeSurveyEntry(entryId: ID!, demographics: DemographicInput!): Submission!`
- ❌ 移除 `submitSurvey(...): Submission!` (one-shot submission)
- ✅ 保留 `createManualSession(input: SessionInput!): ManualSessionResult!`
- ✅ 保留 `startSurvey(sessionId: ID!): Submission!`
- ✅ 保留 `saveSurveyAnswer(submissionId: ID!, scenarioId: ID!, cooperationProbability: Float!): Submission!`
- ✅ 保留 `completeSurvey(submissionId: ID!, demographics: DemographicsInput!): Submission!`

---

## 移除的前端代碼

### URL 參數更改
- ❌ 舊格式: `/survey/welcome?setupId=<uuid>`
- ✅ 新格式: `/survey/welcome?sessionId=<uuid>`

### 組件更新

#### [`App.tsx`](../App.tsx)
- ❌ 移除 `setupIdFromUrl` 支持
- ❌ 移除 `useLegacyMode` 狀態
- ❌ 移除 legacy API 分支邏輯
- ❌ 移除 import: `fetchActiveSessionSetup`, `fetchSessionSetup`, `saveSessionSetup`, `startSurveyEntry`, `saveSurveyAnswerLegacy`, `completeSurveyEntry`
- ✅ 只保留 `sessionIdFromUrl`
- ✅ 統一使用新 API: `fetchSession`, `startSurvey`, `saveSurveyAnswer`, `completeSurvey`

#### [`components/SetupPanel.tsx`](../components/SetupPanel.tsx)
- ✅ 已使用 `createManualSession` (2026-04-28完成)
- ✅ 生成 URL 格式: `?sessionId=<id>`

#### [`components/GroupDetailView.tsx`](../components/GroupDetailView.tsx)
- ❌ 移除 `?setupId=` URL 生成
- ✅ 改為 `?sessionId=<session.id>`

#### [`components/HistoryTable.tsx`](../components/HistoryTable.tsx)
- ❌ 移除 `?setupId=` URL 生成
- ✅ 改為 `?sessionId=<s.id>`

#### [`components/SurveyWelcome.tsx`](../components/SurveyWelcome.tsx)
- ❌ 移除 `const setupId = searchParams.get('setupId')`
- ✅ 改為 `const sessionId = searchParams.get('sessionId')`
- ✅ 導航使用 `?sessionId=`

#### [`components/SurveyView.tsx`](../components/SurveyView.tsx)
- ❌ 移除 `const setupId = searchParams.get('setupId')`
- ❌ 移除 `navigateWithSetup` 函數
- ✅ 改為 `const sessionId = searchParams.get('sessionId')`
- ✅ 改為 `navigateWithSession` 函數
- ✅ 所有路徑使用 `?sessionId=`

#### [`utils/graphqlClient.ts`](../utils/graphqlClient.ts)
- ❌ 移除 `interface GraphSessionSetup` (legacy type)
- ❌ 移除 `normalizeAgentId`, `normalizeEdgeId`, `normalizeScenarios` (legacy helpers)
- ❌ 移除 `setupToGraphInput`, `setupFromGraph` (legacy converters)
- ❌ 移除 `fetchActiveSessionSetup()`
- ❌ 移除 `fetchSessionSetup(id)`
- ❌ 移除 `fetchAllSessionSetups()`
- ❌ 移除 `saveSessionSetup(setup)`
- ❌ 移除 `submitSurvey(...)`
- ❌ 移除 `startSurveyEntry(...)`
- ❌ 移除 `saveSurveyAnswerLegacy(...)`
- ❌ 移除 `completeSurveyEntry(...)`
- ✅ 保留所有新 API 函數

#### [`utils/surveySession.ts`](../utils/surveySession.ts)
- ✅ 已經完全使用 sessionId-based keys
- ✅ 無需修改

---

## 測試結果

### 後端單元測試
```bash
✅ 15/15 tests passing (backend/__tests__/new-data-model.test.js)
```

### API 集成測試
```bash
✅ scripts/test-manual-mode-no-turnstile.mjs - ALL PASSED
   - createManualSession: ✅
   - session query: ✅
   - allSessions query: ✅
   - scenarios query: ✅
   - Scenario properties: ✅
```

### 終端輸出驗證
```
[createManualSession] ✓ Created Session: ea4feba4-a9e4-4c8a-a9ab-bfe6b144088a
[createManualSession] Returning result with 4 scenarios
```

---

## 數據庫架構變更

### 移除的 Collections (將在重建時不再創建)
- ❌ `sessionsetups` collection (舊模型)

### 現有 Collections (新架構)
- ✅ `scenarios` - 原子單位，獨立collection
- ✅ `sessions` - 輕量容器，引用 scenario IDs
- ✅ `submissions` - 使用 Scenario UUID 引用
- ✅ `sessiongroups` - 統一配置

---

## 破壞性變更清單

### ⚠️ 不支援的舊 URLs
以下舊格式 URL 將**無法工作**：
```
❌ /survey/welcome?setupId=<uuid>
❌ /survey/intro/0?setupId=<uuid>
❌ /survey/scenarios/0?setupId=<uuid>
```

### ✅ 新格式 URLs
必須使用以下格式：
```
✅ /survey/welcome?sessionId=<uuid>
✅ /survey/intro/0?sessionId=<uuid>
✅ /survey/scenarios/0?sessionId=<uuid>
```

### ⚠️ 數據不兼容
- 舊 `submissions.results[].scenarioId` 是 Number (index)
- 新 `submissions.results[].scenarioId` 是 String (UUID reference)
- **解決方案**: 重建數據庫（已確認可接受）

---

## 遷移檢查清單

### 部署前準備
- [x] 所有後端 legacy API 已移除
- [x] 所有前端 setupId 引用已移除
- [x] 新 API 測試通過
- [x] 文檔已更新

### 部署步驟
1. **⚠️ 重建數據庫**
   ```bash
   # 方法1: 使用 clearDatabase mutation (dev only)
   # 方法2: Drop database manually
   mongosh
   > use pd-data-collect
   > db.dropDatabase()
   ```

2. **部署新代碼**
   ```bash
   git add .
   git commit -m "feat: complete legacy API removal - manual mode uses new scenario-centric API"
   git push
   ```

3. **驗證部署**
   - 訪問 `/admin/setup`
   - 創建 manual session
   - 驗證生成的 URL 格式為 `?sessionId=<uuid>`
   - 完成一次完整的 survey 流程

---

## 性能影響評估

### 改善點
- ✅ **減少代碼複雜度**: 移除 ~200 行 legacy code
- ✅ **統一數據模型**: 所有 modes 使用相同的 Session/Scenario 架構
- ✅ **查詢效率**: Session.scenarios virtual populate 取代內嵌陣列
- ✅ **可擴展性**: Scenario-level 追蹤為 Mixed Mode 奠基

### 注意事項
- ⚠️ **Virtual populate**: Session queries 現在需要 populate scenarios
- ⚠️ **額外 collection**: Scenario 是獨立 collection（但提供更好的查詢能力）

---

## 回滾方案

如果需要回滾（不太可能，但保留方案）：

1. **代碼回滾**
   ```bash
   git revert HEAD
   git push
   ```

2. **數據庫還原**
   - 無需還原（數據庫已重建）
   - 如有備份可還原舊數據

---

## 後續工作

### 立即可用
- ✅ Manual Mode 完全使用新 API
- ✅ Batch Mode 完全使用新 API（已在 Phase 13 實現）
- ✅ 統一 Survey Flow 適用於所有 modes

### 待實現
- ⏸️ Mixed Mode (Phase 17) - 架構已就緒，可開始實現

### 可選清理
- [x] 重構 `backend/models/SessionSetup.js` → `Submission.js` ✅ **COMPLETED 2026-05-04**
- [ ] 移除測試腳本中的 legacy references
- [ ] 更新 `types.ts` 移除不需要的 legacy 類型

---

## 驗收標準

### ✅ 已達成
- [x] 所有 GraphQL legacy types 已移除
- [x] 所有 GraphQL legacy queries/mutations 已移除
- [x] 所有前端 setupId 引用已改為 sessionId
- [x] 所有前端組件使用新 URL 格式
- [x] 新 API 測試通過
- [x] Manual mode 創建流程驗證通過
- [x] SetupPanel 生成正確的 sessionId URLs
- [x] GroupDetailView 顯示正確的 sessionId URLs
- [x] HistoryTable 顯示正確的 sessionId URLs

### ⚠️ 需要人工驗證
- [ ] UI 測試: 訪問 http://localhost:5173/admin/setup
- [ ] 創建一個 manual session
- [ ] 複製生成的 URL（應為 `?sessionId=...`）
- [ ] 在新瀏覽器視窗打開 URL
- [ ] 完成完整 survey 流程
- [ ] 返回 admin 查看 submission count 更新

---

## 程式碼統計

### 刪除的代碼行數
- `backend/graphql/typeDefs.js`: ~70 行
- `backend/graphql/resolvers.js`: ~150 行
- `utils/graphqlClient.ts`: ~180 行
- `App.tsx`: ~100 行 (簡化)
- **總計**: ~500 行 legacy code 移除

### 新增的程式碼
- `scripts/test-manual-mode-no-turnstile.mjs`: 新增 API 測試

---

## 風險評估

| 風險 | 機率 | 影響 | 緩解措施 | 狀態 |
|------|------|------|----------|------|
| 舊 URLs 失效 | 高 | 中 | 數據庫重建，無現有 URLs | ✅ 已緩解 |
| 前端編譯錯誤 | 低 | 中 | TypeScript 檢查 | ✅ 已檢查 |
| API 測試失敗 | 低 | 高 | 運行測試腳本 | ✅ 已通過 |
| UI 功能回歸 | 中 | 高 | 需人工測試 | ⏳ 待驗證 |

---

## 已更新文件清單

### 後端
- ✅ [`backend/graphql/typeDefs.js`](../backend/graphql/typeDefs.js)
- ✅ [`backend/graphql/resolvers.js`](../backend/graphql/resolvers.js)

### 前端
- ✅ [`App.tsx`](../App.tsx)
- ✅ [`components/SetupPanel.tsx`](../components/SetupPanel.tsx) 
- ✅ [`components/GroupDetailView.tsx`](../components/GroupDetailView.tsx)
- ✅ [`components/HistoryTable.tsx`](../components/HistoryTable.tsx)
- ✅ [`components/SurveyWelcome.tsx`](../components/SurveyWelcome.tsx)
- ✅ [`components/SurveyView.tsx`](../components/SurveyView.tsx)
- ✅ [`utils/graphqlClient.ts`](../utils/graphqlClient.ts)
- ✅ [`utils/surveySession.ts`](../utils/surveySession.ts) (已驗證，無需修改)

### 測試
- ✅ [`scripts/test-manual-mode-no-turnstile.mjs`](../scripts/test-manual-mode-no-turnstile.mjs) (新增)
- ✅ [`scripts/test-manual-mode-e2e.mjs`](../scripts/test-manual-mode-e2e.mjs) (新增)

### 文檔
- ✅ [`docs/tasks.md`](../docs/tasks.md)
- ✅ [`docs/legacy-api-removal-summary.md`](../docs/legacy-api-removal-summary.md) (本文件)

---

## 下一步行動

### 立即可執行
1. **重建數據庫** (如果需要清空舊數據)
   ```bash
   # 在 MongoDB 中執行
   db.dropDatabase()
   ```

2. **啟動開發服務器** (已在運行)
   ```bash
   npm run dev:server  # Port 3001
   npm run dev         # Port 5173
   ```

3. **手動 UI 測試**
   - 訪問 http://localhost:5173/admin/setup
   - 創建 manual session
   - 測試 survey 流程

### 後續開發
- [ ] 驗證 Batch Mode 是否完全遷移
- [ ] 開始實現 Mixed Mode (Phase 17)
- [x] 重構 backend/models/SessionSetup.js → Submission.js ✅ **COMPLETED 2026-05-04**

---

## 技術債務清理

以下項目可選清理（不影響功能）：

1. **~~SessionSetup.js 模型檔案~~** ✅ **COMPLETED 2026-05-04**
   - ✅ 已重構為 `backend/models/Submission.js`
   - ✅ 所有引用已更新
   
2. **types.ts 類型定義**
   - 可能還有 legacy 類型定義
   - 建議: 審查並移除不需要的類型

3. **測試檔案**
   - 一些測試可能還在使用舊的 setupId
   - 建議: 更新或移除過時的測試

---

## 結論

✅ **Manual Mode 已完全遷移到新 API**
✅ **所有 legacy API 已移除**
✅ **後端測試通過**
✅ **API 集成測試通過**

⏳ **待人工驗證**: UI 端到端測試

🚀 **系統已就緒**: 可以重建數據庫並開始使用新架構
