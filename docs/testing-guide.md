# Testing Guide - New Data Model

這份文件說明如何測試新的 Scenario-Centric 資料模型和 API。

## 前置條件

1. **MongoDB 必須正在運行**
   ```bash
   # 確認 MongoDB 狀態
   mongosh --eval "db.adminCommand('ping')"
   ```

2. **環境變數設定**
   ```bash
   # 確保 .env 或 .env.local 包含
   MONGODB_URI=mongodb://localhost:27017/pd-dev
   ```

## 執行單元測試

### 執行所有後端測試
```bash
npm test
```

### 執行特定測試檔案
```bash
npm test backend/__tests__/new-data-model.test.js
```

### 執行測試並顯示詳細輸出
```bash
npm test -- --reporter=verbose
```

## 測試涵蓋範圍

### 1. Scenario Model Tests
- ✓ UUID 主鍵生成
- ✓ Virtual field (completionRate) 計算
- ✓ 原子操作 (atomic responseCount increment)

### 2. Session Model Tests
- ✓ 作為 Scenario Container 的建立
- ✓ Virtual populate scenarios

### 3. Manual Mode Integration
- ✓ createManualSession 完整流程
- ✓ 不同 edge count 的處理 (k=1, k=2, k=3)

### 4. Batch Mode Integration
- ✓ createBatchSessions 完整流程
- ✓ SessionGroup 建立和管理
- ✓ Mode 偵測 (batch vs manual)

### 5. Unified Survey Flow
- ✓ startSurvey: 建立 submission
- ✓ saveSurveyAnswer: 儲存答案 + 更新 responseCount
- ✓ completeSurvey: 完成調查 + 更新 submissionCount
- ✓ Session full gate 檢查

### 6. Updated Submission Schema
- ✓ scenarioId 為 String UUID
- ✓ participantId 支援 (Mixed Mode)

## 手動測試 GraphQL API

### 1. 啟動開發伺服器
```bash
npm run dev:server
```

### 2. 開啟 GraphQL Playground
訪問: `http://localhost:3001/graphql`

### 3. 清空資料庫 (開發環境)
```graphql
mutation {
  clearDatabase
}
```

### 4. 測試 Manual Mode

#### 建立 Manual Session
```graphql
mutation {
  createManualSession(input: {
    activeEdgeIds: ["A1-A2", "A2-B3"]
    focalNode: "A1"
    opponentNode: "B3"
    sampleSize: 20
  }) {
    session {
      _id
      scenarioIds
      focalNode
      opponentNode
      sampleSize
      metadata {
        createdFor
      }
    }
    scenariosCreated
  }
}
```

#### 查詢 Session (with scenarios)
```graphql
query {
  session(id: "<session-id>") {
    _id
    scenarios {
      _id
      edgeStates
      scenarioIndex
      status
    }
    submissionCount
  }
}
```

### 5. 測試 Batch Mode

#### 建立 Batch Sessions
```graphql
mutation {
  createBatchSessions(
    input: {
      edgeCount: 2
      focalNode: "A1"
      opponentNode: "B3"
      sampleSize: 20
    }
    name: "Test Batch Group"
    description: "Testing batch mode with k=2"
  ) {
    groupId
    sessionsCreated
    sessionIds
  }
}
```

#### 查詢 SessionGroup
```graphql
query {
  sessionGroup(id: "<group-id>") {
    _id
    name
    config {
      edgeCount
      focalNode
      opponentNode
      sampleSize
    }
    totalSessions
    totalScenarios
    mode
    status
  }
}
```

#### 查詢 Group 的 Sessions
```graphql
query {
  sessionsByGroup(groupId: "<group-id>") {
    _id
    scenarioIds
    scenarios {
      _id
      activeEdgeIds
      edgeStates
    }
    submissionCount
  }
}
```

### 6. 測試 Unified Survey Flow

#### 開始調查 (需要 Turnstile cookie)
```graphql
mutation {
  startSurvey(sessionId: "<session-id>") {
    _id
    sessionId
    results {
      scenarioId
      cooperationProbability
    }
    isCompleted
  }
}
```

#### 儲存答案
```graphql
mutation {
  saveSurveyAnswer(
    submissionId: "<submission-id>"
    scenarioId: "<scenario-id>"
    cooperationProbability: 0.75
  ) {
    _id
    results {
      scenarioId
      cooperationProbability
      answeredAt
    }
  }
}
```

#### 完成調查
```graphql
mutation {
  completeSurvey(
    submissionId: "<submission-id>"
    demographics: {
      age: 25
      gender: "male"
      education: "bachelor"
    }
  ) {
    _id
    isCompleted
    completedAt
    demographics {
      age
      gender
      education
    }
  }
}
```

#### 查詢 Scenario 的 responseCount
```graphql
query {
  scenario(id: "<scenario-id>") {
    _id
    responseCount
    targetSize
    completionRate
    status
  }
}
```

### 7. 測試 Scenario Queries

#### 查詢特定 Group 的所有 Scenarios
```graphql
query {
  scenarios(groupId: "<group-id>", status: "active") {
    _id
    activeEdgeIds
    edgeStates
    responseCount
    targetSize
    completionRate
  }
}
```

## 預期結果

### Manual Mode (k=2)
- 應建立 4 個 scenarios (2^2 = 4)
- 1 個 session 引用這 4 個 scenarios
- `metadata.createdFor` = `"manual"`

### Batch Mode (k=2)
- 應建立 66 個 sessions (C(12,2) = 66)
- 每個 session 有 4 個 scenarios (2^2 = 4)
- 總共 264 個 scenarios (66 × 4 = 264)
- SessionGroup `mode` = `"batch"`

### Survey Flow
- 每個答案儲存後，對應 Scenario 的 `responseCount` 應 +1
- 調查完成後，Session 的 `submissionCount` 應 +1
- `completionRate` = `responseCount / targetSize`

## 除錯技巧

### 檢查 MongoDB 資料
```bash
# 連接到資料庫
mongosh

# 切換到開發資料庫
use pd-dev

# 查看 collections
show collections

# 查看 scenarios
db.scenarios.find().pretty()

# 查看 sessions
db.sessions.find().pretty()

# 統計 scenarios 數量
db.scenarios.countDocuments()

# 依 groupId 統計
db.scenarios.countDocuments({ groupId: "<group-id>" })
```

### 測試失敗排查
1. **Connection Error**: 確認 MongoDB 正在運行
2. **Schema Error**: 確認所有 models 已正確匯入
3. **Timeout**: 增加 `vitest.config.ts` 中的 `testTimeout`
4. **Assertion Error**: 檢查預期值是否符合新的資料結構

## 下一步

完成測試後，進行前端重構：
1. Phase 14: Utils 層更新
2. Phase 15: Admin UI 組件更新
3. Phase 16: Survey Flow 組件更新
