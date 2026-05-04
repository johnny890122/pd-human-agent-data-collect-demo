# Legacy API 完全移除 - 遷移報告

**日期**: 2026-04-29  
**版本**: v2.0 (Scenario-Centric Architecture)  
**狀態**: ✅ 完成  

---

## 🎯 目標達成

✅ **Manual Mode 完全使用新 API**  
✅ **所有 setupId 引用已移除**  
✅ **僅支援 sessionId 格式**  
✅ **~500 行 legacy code 移除**  
✅ **後端測試 15/15 通過**  
✅ **API 集成測試全部通過**  

---

## 📊 變更總結

### 後端架構 (完全淘汰舊 API)

#### 移除的 GraphQL API
```graphql
# ❌ 移除的 Types
type SessionSetup
type SurveyAnswer  
type Demographic
input DemographicInput

# ❌ 移除的 Queries
activeSessionSetup: SessionSetup
sessionSetup(id: ID!): SessionSetup
allSessionSetups(excludeBatchSessions: Boolean): [SessionSetup!]!

# ❌ 移除的 Mutations
saveSessionSetup(setup: SessionInput!): SessionSetup!
startSurveyEntry(sessionId: String!, edgeId: String!): Submission!
saveSurveyAnswerLegacy(entryId: ID!, answer: SurveyAnswerInput!): Submission!
completeSurveyEntry(entryId: ID!, demographics: DemographicInput!): Submission!
submitSurvey(...): Submission!
```

#### 保留的新 API
```graphql
# ✅ 新架構 Types
type Session          # 輕量容器，引用 Scenario IDs
type Scenario         # 原子單位，獨立 collection
type Submission       # 使用 Scenario UUID references

# ✅ 新 Queries
session(id: ID!): Session
allSessions(excludeGroupSessions: Boolean): [Session!]!
sessionsByGroup(groupId: ID!): [Session!]!
scenario(id: ID!): Scenario
scenarios(groupId: ID, status: String, limit: Int): [Scenario!]!

# ✅ 新 Mutations
createManualSession(input: SessionInput!): ManualSessionResult!
createBatchSessions(input: GroupConfigInput!, name: String!): BatchLaunchResult!
startSurvey(sessionId: ID!): Submission!
saveSurveyAnswer(submissionId: ID!, scenarioId: ID!, cooperationProbability: Float!): Submission!
completeSurvey(submissionId: ID!, demographics: DemographicsInput!): Submission!
```

### 前端變更 (完全移除 setupId)

#### URL 格式變更
```bash
# ❌ 舊格式 (已不支援)
/survey/welcome?setupId=<uuid>
/survey/intro/0?setupId=<uuid>
/survey/scenarios/0?setupId=<uuid>

# ✅ 新格式 (唯一支援)
/survey/welcome?sessionId=<uuid>
/survey/intro/0?sessionId=<uuid>
/survey/scenarios/0?sessionId=<uuid>
```

#### 更新的檔案列表
1. ✅ [`App.tsx`](../App.tsx) - 移除所有 setupId 邏輯，簡化 200+ 行
2. ✅ [`components/SetupPanel.tsx`](../components/SetupPanel.tsx) - 使用 createManualSession
3. ✅ [`components/GroupDetailView.tsx`](../components/GroupDetailView.tsx) - URL 生成改為 sessionId
4. ✅ [`components/HistoryTable.tsx`](../components/HistoryTable.tsx) - URL 生成改為 sessionId
5. ✅ [`components/SurveyWelcome.tsx`](../components/SurveyWelcome.tsx) - 參數改為 sessionId
6. ✅ [`components/SurveyView.tsx`](../components/SurveyView.tsx) - 全面改為 sessionId
7. ✅ [`utils/graphqlClient.ts`](../utils/graphqlClient.ts) - 移除所有 legacy 函數
8. ✅ [`utils/surveySession.ts`](../utils/surveySession.ts) - 已使用 sessionId (無需修改)

---

## 🧪 測試驗證

### 後端單元測試
```bash
✅ 15/15 tests passing
   - Scenario model 創建和查詢
   - Session model 創建和 populate
   - Manual mode 完整流程
   - Batch mode 完整流程
   - Unified survey flow
```

### API 集成測試
```bash
✅ scripts/test-manual-mode-no-turnstile.mjs
   TEST 1: createManualSession ✅
   TEST 2: fetchSession (with populate) ✅
   TEST 3: fetchAllSessions ✅
   TEST 4: fetchScenarios ✅
   TEST 5: Scenario properties ✅
```

### 實際測試結果
```
Session ID: ea4feba4-a9e4-4c8a-a9ab-bfe6b144088a
Scenarios created: 4
Sample size: 5
Scenario IDs: [4 UUIDs]
URL: /survey/welcome?sessionId=ea4feba4-a9e4-4c8a-a9ab-bfe6b144088a
```

---

## 📦 數據庫變更

### 新架構 Collections
```javascript
// ✅ scenarios - 獨立 collection, 原子單位
{
  _id: String (UUID),
  focalNode, opponentNode,
  activeEdgeIds: [String],
  edgeStates: Map<String, String>,
  scenarioIndex: Number,
  groupId: String | null,
  targetSize, responseCount,
  status: 'active' | 'completed' | 'paused'
}

// ✅ sessions - 輕量容器, 引用 scenario IDs
{
  _id: String (UUID),
  scenarioIds: [String],  // References to Scenario._id
  focalNode, opponentNode,
  sampleSize, submissionCount,
  groupId: String | null,
  metadata: { participantId, createdFor }
}

// ✅ submissions - 使用 Scenario UUID references
{
  sessionId: String,
  participantId: String,
  results: [{
    scenarioId: String,  // UUID reference (was: Number index)
    cooperationProbability: Number,
    responseTime: Number,
    answeredAt: Date
  }]
}
```

### 舊的 Collections (不再使用)
```javascript
// ❌ sessionsetups - 已淘汰
// 內嵌 scenarios array, session-centric 設計
```

---

## 🚀 部署指南

### 前置條件
- ✅ 所有代碼已更新
- ✅ 測試通過
- ✅ 文檔已更新

### 部署步驟

#### 1. 重建數據庫 (必要!)
```bash
# 方法 A: 使用 admin UI
# 訪問 /admin/setup → Click "Clear Database" (dev only)

# 方法 B: 直接連接 MongoDB
mongosh
> use pd-data-collect
> db.dropDatabase()
> exit
```

#### 2. 重啟服務器
```bash
# 確保使用新代碼
pkill -f "node server.js"
npm run dev:server
```

#### 3. 驗證部署
```bash
# A. 測試 API
node scripts/test-manual-mode-no-turnstile.mjs

# B. 測試 UI (手動)
# 1. 訪問 http://localhost:5173/admin/setup
# 2. 登入 admin
# 3. 配置並創建 manual session
# 4. 驗證生成的 URL 格式為 ?sessionId=<uuid>
# 5. 在新視窗打開 URL
# 6. 完成 survey 流程
# 7. 返回 admin 確認 submission count 更新
```

---

## ⚠️ 破壞性變更

### 不相容的舊 URLs
所有以下格式的 URL **將無法工作**:
- `/survey/welcome?setupId=...`
- `/survey/intro/0?setupId=...`
- `/survey/scenarios/*?setupId=...`

### 解決方案
由於確認可以重建數據庫，舊 URLs 不需要支持。

---

## 🎉 成果展示

### 代碼簡化
- 後端: 移除 ~220 行 legacy code
- 前端: 移除 ~280 行 legacy code
- **總計**: ~500 行代碼簡化

### 架構改善
- ✅ **統一數據模型**: Session/Scenario 適用於所有 modes
- ✅ **消除分支邏輯**: 不再需要判斷 legacy vs new API
- ✅ **提升可維護性**: 單一代碼路徑，更易理解
- ✅ **為 Mixed Mode 鋪路**: 新架構天生支持動態 scenario 組合

### 測試覆蓋
- ✅ 15 個後端單元測試
- ✅ 5 個 API 集成測試
- ✅ 新增測試腳本用於自動驗證

---

## 📝 更新的文檔

1. ✅ [`docs/tasks.md`](../docs/tasks.md) - Phase 15-16 標記完成
2. ✅ [`docs/requirements.md`](../docs/requirements.md) - 更新 change log
3. ✅ [`docs/legacy-api-removal-summary.md`](../docs/legacy-api-removal-summary.md) - 詳細移除報告
4. ✅ [`docs/MIGRATION-2026-04-29.md`](../docs/MIGRATION-2026-04-29.md) - 本文件

---

## 🔍 後續行動

### 建議的清理任務 (可選)
- [x] 重命名 `backend/models/SessionSetup.js` → `Submission.js` ✅ **COMPLETED 2026-05-04**
- [ ] 審查 `types.ts` 移除不需要的 legacy types
- [ ] 更新前端測試以使用新 API

### 下一階段開發
- [ ] 驗證 Batch Mode 完全遷移
- [ ] 開始實現 Mixed Mode (Phase 17)

---

## ✅ 驗收確認

### 功能驗收
- [x] Manual Mode 可以創建 session
- [x] 生成的 URL 是 sessionId 格式
- [x] API 測試全部通過
- [ ] UI 端到端測試 (需人工驗證)

### 技術驗收
- [x] 無 TypeScript 編譯錯誤
- [x] 無 GraphQL schema 錯誤
- [x] 後端測試通過
- [x] API 集成測試通過

### 文檔驗收
- [x] tasks.md 已更新
- [x] requirements.md 已更新
- [x] 遷移文檔已創建

---

## 🎊 結論

**Manual Mode 已成功完全遷移到新的 Scenario-Centric API！**

所有舊的 setupId-based API 已被淘汰，系統現在僅使用新的 sessionId/Session/Scenario 架構。這為未來的 Mixed Mode 實現奠定了堅實的基礎。

**準備就緒**: 可以重建數據庫並開始使用新系統！

---

**批准人**: _________________  
**日期**: _________________  
