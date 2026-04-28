# Mixed Mode 實施計劃 v2 - Scenario-Centric 架構重構

## 概述

基於 scenario-centric 架構思想的底層重構方案。將 **Scenario** 作為最小數據單位，**Session** 作為 Scenarios 的容器,實現統一的數據模型來優雅地處理三種 launch modes。

**創建日期**: 2026-04-28  
**版本**: v2 (架構重構版)  
**狀態**: 草案 - 待審核

---

## 核心架構思想

### 統一抽象

```
Scenario = 原子單位 (一個具體的實驗情境)
Session = Scenario 的容器 (參與者體驗的單位)
Submission = 對 Session 內 Scenarios 的回應集合
```

**關鍵洞察**: 

> 參與者永遠是「完成一個 Session」,無論哪種 mode。差異僅在於 Session 如何組織其包含的 Scenarios。

### 三種 Modes 的統一視圖

| Mode | Session 組成邏輯 | Scenario 來源 |
|------|-----------------|--------------|
| **Mode 1 (Manual)** | 固定 edges → 完整 design matrix | 單個 edge configuration 的所有情境 |
| **Mode 2 (Batch)** | 每個 edge combination → 獨立 session | C(12,k) 個 sessions,每個有完整 design matrix |
| **Mode 3 (Mixed)** | 隨機採樣 S 個 scenarios | 從多個 edge combinations 混合採樣 |

**無需 `launchMode` 欄位** - 從數據結構自然體現差異。

---

## 新的數據模型

### 1. Scenario (新模型 - 原子單位)

```javascript
// backend/models/Scenario.js (新檔案)
const ScenarioSchema = new mongoose.Schema({
  _id: { type: String, default: () => randomUUID() },
  
  // 實驗配置 (定義這個 scenario 的參數)
  focalNode: { type: String, required: true },
  opponentNode: { type: String, required: true },
  activeEdgeIds: [String],  // 這個 scenario 使用的 edges
  
  // Design matrix - 這個 scenario 的具體狀態
  edgeStates: {
    type: Map,
    of: String  // edgeId -> 'low' | 'high'
  },
  
  // 元數據
  scenarioIndex: Number,  // 在原始 design matrix 中的位置 (可選)
  
  // 所屬關係
  groupId: { type: String, index: true },  // 屬於哪個 SessionGroup (batch/mixed)
  setupId: { type: String, index: true },  // 來自哪個原始 SessionSetup (batch mode)
  
  // 數據收集目標 (scenario-level tracking)
  targetSize: { type: Number, default: 0 },  // 這個 scenario 需要多少份回應
  responseCount: { type: Number, default: 0 },  // 已收集的回應數
  
  status: {
    type: String,
    enum: ['active', 'completed', 'paused'],
    default: 'active'
  },
  
  createdAt: Date,
  updatedAt: Date
}, { timestamps: true });

// 複合索引
ScenarioSchema.index({ groupId: 1, status: 1, responseCount: 1 });
ScenarioSchema.index({ setupId: 1, scenarioIndex: 1 });
```

**設計要點**:
- 每個 Scenario 是自包含的: 包含完整的實驗參數和當前狀態
- `groupId` + `setupId`: 支援追溯來源 (batch mode 時有用)
- `targetSize` vs `responseCount`: 支援 scenario-level 的數據收集目標 (Mixed Mode 核心)

### 2. Session (重構後)

```javascript
// backend/models/Session.js (重構 SessionSetup.js)
const SessionSchema = new mongoose.Schema({
  _id: { type: String, default: () => randomUUID() },
  
  // Session 包含的 scenarios (核心!)
  scenarioIds: [String],  // 引用 Scenario._id, 保持順序
  
  // Session 層級配置
  focalNode: String,      // 主要是為了向後兼容和 UI 顯示
  opponentNode: String,
  sampleSize: { type: Number, default: 20 },  // 這個 session 需要多少"完整提交"
  
  // 所屬關係
  groupId: { type: String, index: true },  // 屬於哪個 SessionGroup (可選)
  
  // 統計 (快取,避免重複查詢)
  submissionCount: { type: Number, default: 0 },  // 完成這個 session 的人數
  
  // 元數據
  createdAt: Date,
  updatedAt: Date
}, { timestamps: true });

SessionSchema.index({ groupId: 1 });
SessionSchema.index({ createdAt: -1 });

// Virtual: 動態載入 scenarios
SessionSchema.virtual('scenarios', {
  ref: 'Scenario',
  localField: 'scenarioIds',
  foreignField: '_id'
});
```

**重大變化**:
- 不再內嵌 `scenarios` 陣列! → 改為引用 `scenarioIds`
- `activeEdgeIds` 移到 Scenario 層級
- Session 變成「薄容器」
- 保留 `focalNode` / `opponentNode` 用於 UI 顯示和過濾

### 3. Submission (輕微調整)

```javascript
// backend/models/Submission.js (修改 SessionSetup.js 內的)
const SubmissionSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId },
  
  sessionId: { type: String, required: true, index: true },
  
  // 參與者識別
  participantId: String,  // Mixed Mode 時防重複提交
  
  // 回應 (現在引用 Scenario IDs)
  results: [{
    scenarioId: { type: String, required: true },  // 引用 Scenario._id
    cooperationProbability: { type: Number, min: 0, max: 1 },
    responseTime: Number,  // 毫秒
    answeredAt: Date
  }],
  
  demographics: {
    age: Number,
    gender: String,
    education: String
  },
  
  isCompleted: { type: Boolean, default: false },
  completedAt: Date,
  
  createdAt: Date,
  updatedAt: Date
}, { timestamps: true });

SubmissionSchema.index({ sessionId: 1 });
SubmissionSchema.index({ sessionId: 1, participantId: 1 }, { sparse: true });
```

**變化**:
- `results[].scenarioId`: 從 Number (index) 改為 String (UUID 引用)
- 添加 `participantId`: Mixed Mode 防重複
- 添加 `responseTime`: 更細緻的行為追踪

### 4. SessionGroup (簡化)

```javascript
// backend/models/SessionGroup.js (簡化版)
const SessionGroupSchema = new mongoose.Schema({
  _id: { type: String, default: () => randomUUID() },
  
  name: { type: String, required: true },
  description: String,
  
  // 配置參數
  config: {
    // Batch Mode 參數
    edgeCount: Number,  // k 值
    
    // Mixed Mode 參數
    maxK: Number,  // 最大 k 值
    scenariosPerSession: Number,  // S: 每個 session 包含幾個 scenarios
    targetSizePerScenario: Number,  // 每個 scenario 的目標回應數
    
    // 通用參數
    focalNode: String,
    opponentNode: String,
    sampleSize: Number  // 每個 session 的目標完成數 (Batch mode)
  },
  
  // 統計 (快取)
  totalSessions: { type: Number, default: 0 },
  totalScenarios: { type: Number, default: 0 },
  
  status: {
    type: String,
    enum: ['creating', 'active', 'completed', 'archived'],
    default: 'creating'
  },
  
  createdAt: Date,
  updatedAt: Date
}, { timestamps: true });

SessionGroupSchema.index({ status: 1 });
SessionGroupSchema.index({ createdAt: -1 });
```

**簡化點**:
- 移除 `launchMode` - 從 `config` 的哪些欄位有值來判斷
- `config` 包含所有可能的參數,按需使用

---

## 三種 Modes 的實現邏輯

### Mode 1: Manual (單一 Session)

**創建流程**:
```javascript
// 1. Admin 配置: focalNode, opponentNode, activeEdgeIds, sampleSize

// 2. 生成 scenarios
const designMatrix = generateDesignMatrix(activeEdgeIds);
const scenarios = await Scenario.insertMany(
  designMatrix.map((edgeStates, index) => ({
    focalNode,
    opponentNode,
    activeEdgeIds,
    edgeStates,
    scenarioIndex: index,
    groupId: null,
    setupId: null,
    targetSize: 0  // Manual mode 不追踪 scenario-level
  }))
);

// 3. 創建 session
const session = await Session.create({
  scenarioIds: scenarios.map(s => s._id),
  focalNode,
  opponentNode,
  sampleSize,
  groupId: null
});

// 4. URL: /survey/welcome?sessionId=<session._id>
```

**參與者流程**: 標準不變,完成 session 的所有 scenarios。

### Mode 2: Batch (多個 Sessions, 每個是一個 edge combination)

**創建流程**:
```javascript
// 1. Admin 配置: name, k, focalNode, opponentNode, sampleSize

// 2. 創建 group
const group = await SessionGroup.create({
  name,
  config: { edgeCount: k, focalNode, opponentNode, sampleSize }
});

// 3. 生成所有 edge combinations
const combinations = generateCombinations(ALL_EDGES, k);

// 4. 為每個 combination 創建 scenarios + session
for (const combo of combinations) {
  const designMatrix = generateDesignMatrix(combo);
  
  // 創建 scenarios
  const scenarios = await Scenario.insertMany(
    designMatrix.map((edgeStates, index) => ({
      focalNode,
      opponentNode,
      activeEdgeIds: combo,
      edgeStates,
      scenarioIndex: index,
      groupId: group._id,
      setupId: null,  // Batch mode 可選:為每個 combo 創建虛擬 setupId
      targetSize: 0
    }))
  );
  
  // 創建 session
  await Session.create({
    scenarioIds: scenarios.map(s => s._id),
    focalNode,
    opponentNode,
    sampleSize,
    groupId: group._id
  });
}

// 5. URLs: 每個 session 有獨立 URL
```

**參與者流程**: 與 Mode 1 相同,完成一個 session 的所有 scenarios。

### Mode 3: Mixed (動態組合 Sessions)

**創建流程**:
```javascript
// 1. Admin 配置: name, maxK, scenariosPerSession (S), targetSizePerScenario

// 2. 創建 group
const group = await SessionGroup.create({
  name,
  config: {
    maxK,
    scenariosPerSession: S,
    targetSizePerScenario,
    focalNode,
    opponentNode
  }
});

// 3. 生成 scenarios pool (所有 k=1..maxK 的 combinations)
const scenariosPool = [];

for (let k = 1; k <= maxK; k++) {
  const combinations = generateCombinations(ALL_EDGES, k);
  
  for (const combo of combinations) {
    const designMatrix = generateDesignMatrix(combo);
    
    for (const [index, edgeStates] of designMatrix.entries()) {
      scenariosPool.push({
        focalNode,
        opponentNode,
        activeEdgeIds: combo,
        edgeStates,
        scenarioIndex: index,
        groupId: group._id,
        targetSize: targetSizePerScenario,
        responseCount: 0
      });
    }
  }
}

// 4. 批量創建 scenarios
await Scenario.insertMany(scenariosPool);

// 5. 更新 group 統計
group.totalScenarios = scenariosPool.length;
group.status = 'active';
await group.save();

// 6. URL: /survey/welcome?groupId=<group._id>&mode=mixed
//    (不預先創建 sessions,而是在參與者開始時動態創建)
```

**參與者流程 (動態創建 Session)**:
```javascript
// 1. 參與者打開 URL: ?groupId=X&mode=mixed

// 2. Backend: startMixedSurvey(groupId, participantId)
async function startMixedSurvey(groupId, participantId) {
  const group = await SessionGroup.findById(groupId);
  const S = group.config.scenariosPerSession;
  
  // 檢查是否已有 session (resume)
  let session = await Session.findOne({ 
    groupId, 
    'metadata.participantId': participantId  // 見下方 metadata 設計
  });
  
  if (!session) {
    // 選擇 S 個 scenarios (balanced strategy)
    const scenarios = await Scenario
      .find({ groupId, status: 'active' })
      .sort({ responseCount: 1 })  // 優先選回應少的
      .limit(S * 2);  // 多抓一些候選
    
    // 隨機選 S 個 (或完全用排序的前 S 個,根據策略)
    const selectedIds = _.sampleSize(scenarios, S).map(s => s._id);
    
    // 創建個人 session
    session = await Session.create({
      scenarioIds: selectedIds,
      focalNode: group.config.focalNode,
      opponentNode: group.config.opponentNode,
      sampleSize: 1,  // Mixed mode 下每個 session 只有一個參與者
      groupId,
      metadata: { participantId, createdFor: 'mixed' }  // 見下方
    });
  }
  
  return session;
}

// 3. 參與者完成 session (標準流程)

// 4. 每保存一個 scenario 回應時:
await Scenario.findByIdAndUpdate(scenarioId, { $inc: { responseCount: 1 } });

// 5. Session 完成時:
//    檢查 group 是否所有 scenarios 都達到 targetSize
const incomplete = await Scenario.countDocuments({
  groupId,
  responseCount: { $lt: group.config.targetSizePerScenario }
});

if (incomplete === 0) {
  group.status = 'completed';
  await group.save();
}
```

**Session 模型添加 metadata**:
```javascript
// Session schema 添加
metadata: {
  participantId: String,  // Mixed mode 時記錄為誰創建
  createdFor: String  // 'mixed' | null
}
```

---

## 架構優勢

### 1. 統一的程式邏輯

```javascript
// 參與者流程 (所有 modes 通用!)
async function completeSurvey(sessionId, responses, demographics) {
  const session = await Session.findById(sessionId).populate('scenarios');
  
  // 驗證回應完整性
  const responseMap = new Map(responses.map(r => [r.scenarioId, r]));
  for (const scenarioId of session.scenarioIds) {
    if (!responseMap.has(scenarioId)) {
      throw new Error(`Missing response for scenario ${scenarioId}`);
    }
  }
  
  // 創建 submission
  const submission = await Submission.create({
    sessionId,
    results: responses,
    demographics,
    isCompleted: true
  });
  
  // 更新統計
  session.submissionCount += 1;
  await session.save();
  
  // 更新每個 scenario 的 responseCount
  for (const scenarioId of session.scenarioIds) {
    await Scenario.findByIdAndUpdate(scenarioId, {
      $inc: { responseCount: 1 }
    });
  }
  
  return submission;
}
```

**無需檢查 mode** - 所有邏輯自然統一!

### 2. 靈活的查詢能力

```javascript
// Admin 查詢: 某個 group 的所有 scenarios 完成狀態
const scenarioStats = await Scenario.aggregate([
  { $match: { groupId } },
  { $group: {
    _id: '$status',
    count: { $sum: 1 },
    avgResponse: { $avg: '$responseCount' }
  }}
]);

// Admin 查詢: 哪些 scenarios 回應不足
const undersampled = await Scenario.find({
  groupId,
  status: 'active',
  $expr: { $lt: ['$responseCount', '$targetSize'] }
});

// Admin 查詢: 某個 edge combination 的數據收集情況
const edgeStats = await Scenario.aggregate([
  { $match: { groupId } },
  { $group: {
    _id: '$activeEdgeIds',  // 按 edge 組合分組
    totalScenarios: { $sum: 1 },
    totalResponses: { $sum: '$responseCount' }
  }}
]);
```

### 3. 易於擴展

**未來可能的新 modes**:
- **Mode 4: Adaptive** - 根據中期結果動態調整 scenarios 分配
- **Mode 5: Longitudinal** - 同一參與者多次完成不同 sessions
- **Mode 6: A/B Testing** - 同一 scenario 不同 UI 呈現

所有這些只需改變「如何組 session」,底層模型不變!

---

## 數據遷移策略

### 從現有模型到新模型

```javascript
// Migration script: backend/migrations/001-scenario-centric.js

async function migrate() {
  // 1. 為每個現有 SessionSetup 拆解 scenarios
  const setups = await SessionSetupModel.find({});
  
  for (const setup of setups) {
    const scenarios = [];
    
    // 從內嵌的 scenarios 陣列創建獨立文檔
    for (const [index, scenario] of setup.scenarios.entries()) {
      scenarios.push({
        _id: randomUUID(),
        focalNode: setup.focalNode,
        opponentNode: setup.opponentNode,
        activeEdgeIds: setup.activeEdgeIds,
        edgeStates: scenario.edgeStates,
        scenarioIndex: index,
        groupId: setup.groupId,
        setupId: setup._id,
        targetSize: 0,
        responseCount: 0,
        status: 'active'
      });
    }
    
    // 批量插入
    const inserted = await Scenario.insertMany(scenarios);
    
    // 創建新的 Session 文檔
    await Session.create({
      _id: setup._id,  // 保持 ID 不變,避免破壞 URLs
      scenarioIds: inserted.map(s => s._id),
      focalNode: setup.focalNode,
      opponentNode: setup.opponentNode,
      sampleSize: setup.sampleSize,
      groupId: setup.groupId,
      submissionCount: 0,  // 需要重新計算
      createdAt: setup.createdAt,
      updatedAt: setup.updatedAt
    });
  }
  
  // 2. 更新 Submission 文檔的 results
  const submissions = await SubmissionModel.find({});
  
  for (const submission of submissions) {
    const session = await Session.findById(submission.sessionId);
    if (!session) continue;
    
    // 將 scenarioId (數字 index) 轉換為 UUID
    const updatedResults = submission.results.map(result => {
      const scenario = session.scenarioIds[result.scenarioId];  // index -> UUID
      return {
        ...result,
        scenarioId: scenario
      };
    });
    
    submission.results = updatedResults;
    await submission.save();
    
    // 更新 session 的 submissionCount
    if (submission.isCompleted) {
      session.submissionCount += 1;
      await session.save();
    }
  }
  
  // 3. 備份舊的 SessionSetup collection
  await mongoose.connection.db.collection('sessionsetups')
    .rename('sessionsetups_backup_20260428');
  
  console.log('Migration completed!');
}
```

**遷移安全性**:
- 保持 Session `_id` 不變 → 現有 URLs 仍可用
- 備份舊 collection → 可回滾
- 分步驟:先創建新文檔,驗證後再刪除舊的

---

## GraphQL API 重構

### 新的 Schema

```graphql
# 新增 Scenario type
type Scenario {
  _id: ID!
  focalNode: String!
  opponentNode: String!
  activeEdgeIds: [String!]!
  edgeStates: JSON!
  scenarioIndex: Int
  groupId: ID
  setupId: ID
  targetSize: Int!
  responseCount: Int!
  status: String!
  completionRate: Float!  # computed: responseCount / targetSize
  createdAt: String!
}

# 重構 Session type (原 SessionSetup)
type Session {
  _id: ID!
  scenarioIds: [ID!]!
  scenarios: [Scenario!]!  # populated
  focalNode: String!
  opponentNode: String!
  sampleSize: Int!
  groupId: ID
  submissionCount: Int!
  createdAt: String!
  updatedAt: String!
}

# Submission 輕微調整
type Submission {
  _id: ID!
  sessionId: ID!
  participantId: String
  results: [ScenarioResponse!]!
  demographics: Demographics
  isCompleted: Boolean!
  createdAt: String!
}

type ScenarioResponse {
  scenarioId: ID!  # 改為 ID (原為 Int)
  cooperationProbability: Float!
  responseTime: Int
  answeredAt: String
}
```

### 新的 Queries

```graphql
extend type Query {
  # Session queries (重命名 + 行為不變)
  session(id: ID!): Session  # 原 sessionSetup
  allSessions(excludeGroupSessions: Boolean): [Session!]!  # 原 allSessionSetups
  sessionsByGroup(groupId: ID!): [Session!]!
  
  # 新增 Scenario queries
  scenario(id: ID!): Scenario
  scenarios(groupId: ID, status: String): [Scenario!]!
  scenarioStats(groupId: ID!): ScenarioStats!
  
  # Group queries (不變)
  sessionGroup(id: ID!): SessionGroup
  allSessionGroups: [SessionGroup!]!
}

type ScenarioStats {
  total: Int!
  byStatus: [StatusCount!]!
  completionDistribution: [Int!]!  # histogram: responseCount 分佈
  undersampled: [Scenario!]!  # responseCount < targetSize
}

type StatusCount {
  status: String!
  count: Int!
}
```

### 新的 Mutations

```graphql
extend type Mutation {
  # Mode 1: Manual (行為類似原 saveSessionSetup)
  createManualSession(input: ManualSessionInput!): Session!
  
  # Mode 2: Batch (行為類似原 createBatchSessions)
  createBatchSessions(input: BatchSessionInput!): BatchResult!
  
  # Mode 3: Mixed (新增)
  createMixedGroup(input: MixedGroupInput!): MixedGroupResult!
  startMixedSession(groupId: ID!, participantId: String): Session!
  
  # Survey flow (統一所有 modes)
  startSurvey(sessionId: ID!): Submission!
  saveSurveyAnswer(submissionId: ID!, scenarioId: ID!, probability: Float!): Submission!
  completeSurvey(submissionId: ID!, demographics: DemographicsInput!): Submission!
  
  # Admin controls
  updateScenarioStatus(scenarioId: ID!, status: String!): Scenario!
  pauseGroup(groupId: ID!): SessionGroup!
  resumeGroup(groupId: ID!): SessionGroup!
}

input MixedGroupInput {
  name: String!
  description: String
  maxK: Int!  # 1-12
  scenariosPerSession: Int!  # S
  targetSizePerScenario: Int!
  focalNode: String!
  opponentNode: String!
}

type MixedGroupResult {
  groupId: ID!
  totalScenarios: Int!
  estimatedSessions: Int!  # (totalScenarios × targetSize) / S
  masterUrl: String!
}
```

---

## 前端變更

### 1. Admin UI 調整

#### 統一的 Session/Group 列表
```typescript
// components/SessionsTable.tsx (重命名自 HistoryTable)
// 顯示 mode icon 根據判斷
function getModeIcon(session: Session) {
  if (!session.groupId) return '🔧 Manual';
  const group = useSessionGroup(session.groupId);
  if (group.config.maxK) return '🎲 Mixed';
  return '📦 Batch';
}
```

#### Mixed Mode 配置面板
```typescript
// components/MixedModeConfig.tsx
function MixedModeConfig() {
  const [maxK, setMaxK] = useState(3);
  const [scenariosPerSession, setScenariosPerSession] = useState(20);
  const [targetSize, setTargetSize] = useState(30);
  
  const estimatedScenarios = useMemo(() => {
    let total = 0;
    for (let k = 1; k <= maxK; k++) {
      const combinations = binomialCoefficient(12, k);
      const scenariosPerCombo = 2 ** k;  // 簡化估算
      total += combinations * scenariosPerCombo;
    }
    return total;
  }, [maxK]);
  
  const estimatedParticipants = Math.ceil(
    (estimatedScenarios * targetSize) / scenariosPerSession
  );
  
  return (
    <div>
      <NumberInput label="Max K" value={maxK} onChange={setMaxK} />
      <NumberInput label="Scenarios per Session" value={scenariosPerSession} />
      <NumberInput label="Target Size per Scenario" value={targetSize} />
      
      <Alert>
        Will generate {estimatedScenarios} scenarios.
        Estimated {estimatedParticipants} participants needed.
      </Alert>
    </div>
  );
}
```

#### Group Detail View 增強
```typescript
// components/GroupDetailView.tsx
function GroupDetailView({ groupId }) {
  const group = useSessionGroup(groupId);
  const scenarios = useScenarios({ groupId });
  const isMixed = !!group.config.maxK;
  
  if (isMixed) {
    return (
      <div>
        <h2>{group.name} (Mixed Mode)</h2>
        
        {/* Master URL */}
        <CopyableUrl url={`/survey/welcome?groupId=${groupId}&mode=mixed`} />
        
        {/* Scenario completion heatmap */}
        <ScenarioHeatmap scenarios={scenarios} />
        
        {/* Sessions (動態生成的個人 sessions) */}
        <SessionsList sessions={useSessionsByGroup(groupId)} />
      </div>
    );
  } else {
    // Batch mode view (不變)
    return <BatchGroupView group={group} />;
  }
}
```

### 2. Survey Flow 輕微調整

```typescript
// App.tsx - 路由檢測
function App() {
  const searchParams = new URLSearchParams(location.search);
  const sessionId = searchParams.get('sessionId');
  const groupId = searchParams.get('groupId');
  const mode = searchParams.get('mode');
  
  // 決定 session
  const actualSessionId = useMemo(async () => {
    if (sessionId) return sessionId;
    
    if (groupId && mode === 'mixed') {
      // Mixed mode: 創建或恢復 session
      const { session } = await startMixedSession(groupId, getParticipantId());
      return session._id;
    }
    
    throw new Error('Invalid URL parameters');
  }, [sessionId, groupId, mode]);
  
  return (
    <SurveyView sessionId={actualSessionId} />
  );
}

// SurveyView.tsx - 統一流程 (無需修改核心邏輯!)
function SurveyView({ sessionId }) {
  const session = useSession(sessionId);  // 自動 populate scenarios
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // 渲染當前 scenario (從 session.scenarios[currentIndex] 獲取)
  const scenario = session.scenarios[currentIndex];
  
  return (
    <div>
      <Progress current={currentIndex + 1} total={session.scenarios.length} />
      <ScenarioView scenario={scenario} onAnswer={handleAnswer} />
    </div>
  );
}
```

**關鍵**: Survey Flow 幾乎不需要改! Session 對象已包含完整的 scenarios 陣列 (populated)。

---

## 實施任務清單

### Phase 12: 數據模型重構 (核心)

- [ ] **TASK-1201**: 創建 `backend/models/Scenario.js` 新模型,定義 schema 和索引
- [ ] **TASK-1202**: 重構 `backend/models/SessionSetup.js` → `Session.js`:
  - 移除內嵌 `scenarios` 陣列
  - 添加 `scenarioIds` 引用陣列
  - 添加 `metadata` 欄位
  - 配置 virtual populate
- [ ] **TASK-1203**: 修改 `backend/models/SessionSetup.js` 中的 `Submission` schema:
  - `results[].scenarioId` 類型改為 String
  - 添加 `participantId` 欄位
- [ ] **TASK-1204**: 簡化 `backend/models/SessionGroup.js`:
  - 移除 `batchMode`, `completedSessions`
  - 統一為 `config` 物件
  - 添加 `totalScenarios` 欄位
- [ ] **TASK-1205**: 編寫數據遷移腳本 `backend/migrations/001-scenario-centric.js`
- [ ] **TASK-1206**: 在測試資料庫執行遷移,驗證數據完整性

### Phase 13: GraphQL API 重構

- [ ] **TASK-1301**: 更新 `typeDefs.js`:
  - 添加 `Scenario` type
  - 重命名 `SessionSetup` → `Session`
  - 更新 `Submission` type
  - 添加新的 queries/mutations
- [ ] **TASK-1302**: 重構 resolvers - Mode 1 (Manual):
  - `createManualSession`: 生成 Scenarios → 創建 Session
- [ ] **TASK-1303**: 重構 resolvers - Mode 2 (Batch):
  - `createBatchSessions`: 維持邏輯,但創建獨立 Scenarios
- [ ] **TASK-1304**: 實現 resolvers - Mode 3 (Mixed):
  - `createMixedGroup`: 生成 scenarios pool
  - `startMixedSession`: balanced selection + 創建個人 Session
- [ ] **TASK-1305**: 統一 survey flow resolvers:
  - `startSurvey`, `saveSurveyAnswer`, `completeSurvey`
  - 確保與 scenarioId (UUID) 相容
  - 添加 Scenario.responseCount 更新邏輯
- [ ] **TASK-1306**: 實現 Scenario queries:
  - `scenario`, `scenarios`, `scenarioStats`
- [ ] **TASK-1307**: 實現 admin control mutations:
  - `updateScenarioStatus`, `pauseGroup`, `resumeGroup`
- [ ] **TASK-1308**: 添加 field resolvers:
  - `Session.scenarios` (populate)
  - `Scenario.completionRate` (computed)

### Phase 14: Utils 和 Helpers 重構

- [ ] **TASK-1401**: 修改 `utils/mathBackend.js`:
  - `generateDesignMatrix` 返回格式調整 (為 Scenario 模型準備)
  - 添加 `calculateTotalScenarios(maxK)` helper
- [ ] **TASK-1402**: 修改 `utils/combinations.js`:
  - 確保與新模型相容
- [ ] **TASK-1403**: 添加 `utils/scenarioSelection.js`:
  - `balancedSelect(scenarios, count)`: 實現 balanced strategy
  - `randomSelect(scenarios, count)`: 實現 random strategy
- [ ] **TASK-1404**: 修改 `utils/graphqlClient.ts`:
  - 更新 TypeScript types (Session, Scenario)
  - 移除 legacy edge ID 處理邏輯 (如果還有)

### Phase 15: 前端重構

- [ ] **TASK-1501**: 重構 `components/SetupPanel.tsx` (Mode 1):
  - 調用 `createManualSession` (原 `saveSessionSetup`)
  - UI 保持不變
- [ ] **TASK-1502**: 重構 `components/BatchModeConfig.tsx` (Mode 2):
  - 調用 `createBatchSessions`
  - UI 保持不變
- [ ] **TASK-1503**: 創建 `components/MixedModeConfig.tsx` (Mode 3):
  - 配置表單: maxK, scenariosPerSession, targetSize
  - 估算預覽
  - 調用 `createMixedGroup`
- [ ] **TASK-1504**: 修改 `components/AdminView.tsx`:
  - "Mixed Mode" tab
  - 統一的 mode 圖標邏輯
- [ ] **TASK-1505**: 重構 `components/GroupDetailView.tsx`:
  - 檢測 Mixed vs Batch
  - Mixed: master URL, heatmap, sessions list
  - Batch: 現有 view
- [ ] **TASK-1506**: 創建 `components/ScenarioHeatmap.tsx`:
  - D3 visualization: scenario completion status
- [ ] **TASK-1507**: 輕微調整 `App.tsx` 路由:
  - 檢測 `?groupId=X&mode=mixed`
  - 調用 `startMixedSession`
  - 其餘邏輯不變
- [ ] **TASK-1508**: 驗證 `components/SurveyView.tsx`:
  - 確認使用 `session.scenarios` (populated) 正常工作
  - 無需修改核心邏輯
- [ ] **TASK-1509**: 更新 `utils/surveySession.ts`:
  - 如果有 sessionId 相關邏輯需調整

### Phase 16: 測試

- [ ] **TASK-1601**: 單元測試 - Scenario 模型:
  - Schema validation
  - Index queries
- [ ] **TASK-1602**: 單元測試 - Session 模型:
  - Virtual populate
  - Scenario references
- [ ] **TASK-1603**: 單元測試 - scenarioSelection helpers:
  - Balanced strategy 公平性
  - Random strategy 覆蓋率
- [ ] **TASK-1604**: Integration 測試 - Mode 1 (Manual):
  - `createManualSession` → survey flow → completion
- [ ] **TASK-1605**: Integration 測試 - Mode 2 (Batch):
  - `createBatchSessions` → 多個 sessions
  - 驗證 scenario count 正確
- [ ] **TASK-1606**: Integration 測試 - Mode 3 (Mixed):
  - `createMixedGroup` → scenarios pool
  - `startMixedSession` → balanced selection
  - 多個參與者 → 驗證 responseCount 更新
  - Group completion detection
- [ ] **TASK-1607**: E2E 測試 - 完整 Mixed Mode flow:
  - Admin 創建 mixed group
  - 多個參與者完成 sessions
  - 驗證 scenario-level 統計
  - Group 標記為 completed
- [ ] **TASK-1608**: E2E 測試 - 數據遷移:
  - 在 test DB 運行遷移腳本
  - 驗證舊 URLs 仍可用
  - 驗證數據完整性

### Phase 17: 文檔與部署

- [ ] **TASK-1701**: 更新 `requirements.md`:
  - 添加 REQ-305..REQ-309 (Mixed Mode requirements)
  - 更新架構說明
- [ ] **TASK-1702**: 更新 `design.md`:
  - 新的數據模型圖
  - 三種 modes 的統一視圖
  - 數據流程圖
- [ ] **TASK-1703**: 更新 `tasks.md`:
  - 標記 Phase 12-17 任務
- [ ] **TASK-1704**: 更新 `README.md`:
  - 三種 launch modes 使用指南
  - 數據遷移說明
- [ ] **TASK-1705**: 創建 `docs/migration-guide.md`:
  - 詳細遷移步驟
  - 回滾方案
  - 常見問題
- [ ] **TASK-1706**: 生產環境遷移:
  - 備份資料庫
  - 執行遷移腳本
  - 驗證現有 sessions 正常工作
  - 部署新版本
- [ ] **TASK-1707**: 監控與驗證:
  - 驗證現有 URLs 正常
  - 測試 Mixed Mode 創建
  - 檢查資料庫效能 (索引)

---

## 時程估算 (修訂版)

| Phase | 任務數 | 估算工時 | 依賴 | 風險 |
|-------|--------|----------|------|------|
| Phase 12: 數據模型 | 6 | 4 天 | - | 高 (核心) |
| Phase 13: GraphQL API | 8 | 5 天 | Phase 12 | 高 |
| Phase 14: Utils | 4 | 2 天 | Phase 13 | 低 |
| Phase 15: 前端 | 9 | 4 天 | Phase 13 | 中 |
| Phase 16: 測試 | 8 | 4 天 | Phase 14, 15 | 中 |
| Phase 17: 文檔與部署 | 7 | 3 天 | Phase 16 | 低 |
| **總計** | **42** | **22 天** (~4.5 週) | | |

**里程碑**:
- Week 1: 數據模型 + 遷移腳本完成,在 test DB 驗證
- Week 2: GraphQL API 完成,可用 Postman 測試三種 modes
- Week 3: 前端重構完成,可手動測試完整流程
- Week 4: 測試覆蓋完成,準備部署
- Week 5 (前半): 文檔完成,生產遷移

---

## 風險與緩解 (修訂版)

| 風險 | 影響 | 機率 | 緩解措施 |
|------|------|------|----------|
| **數據遷移失敗** | 極高 | 低 | 在多個 test DB 反覆測試;保留完整備份;準備回滾腳本 |
| **效能下降** (Scenario populate) | 中 | 中 | 測量 populate 耗時;考慮添加 cache layer;優化索引 |
| **現有功能回歸** | 高 | 中 | 嚴格的 integration 測試;手動測試現有 sessions |
| **Balanced selection 不公平** | 中 | 低 | 單元測試覆蓋;模擬 1000 次分配,驗證分佈 |
| **MongoDB 文檔數爆炸** | 中 | 低 | Mixed Mode 估算:maxK=3 → ~1000 scenarios → 可接受 |
| **URL 破壞** | 高 | 低 | 遷移保持 Session `_id` 不變;測試舊 URLs |

---

## 關鍵技術決策

### 決策 1: Session ID 保持不變
**決定**: 遷移時保持現有 SessionSetup 的 `_id` 作為新 Session 的 `_id`。

**理由**: 保證現有分享的 survey URLs 繼續有效,避免中斷進行中的實驗。

### 決策 2: Scenario 使用 UUID
**決定**: Scenario `_id` 使用 UUID 而非 ObjectId。

**理由**:
- 與 Session 保持一致
- 便於前端處理 (字串比較,無需 ObjectId 轉換)
- 分佈式生成友好 (未來可能的 sharding)

### 決策 3: Submission.results 保持陣列
**決定**: 不將 results 提升為獨立 collection。

**理由**:
- 一個 submission 的 results 是原子單位 (一起讀寫)
- 避免過度 normalization
- 保持與現有資料庫設計一致

如果未來需要 scenario-level 分析,可用 aggregation pipeline。

### 決策 4: Mixed Mode 動態創建 Sessions
**決定**: Mixed Mode 不預先創建所有可能的 sessions,而是在參與者開始時動態創建個人 session。

**理由**:
- 避免創建大量空 sessions (浪費資源)
- 靈活:可實時調整 scenario selection strategy
- 符合 Mixed Mode 的"個人化"概念

### 決策 5: responseCount 使用原子操作
**決定**: 使用 `$inc` 操作更新 Scenario.responseCount。

**理由**:
- 保證並發安全
- 避免 race condition (多個參與者同時提交)
- MongoDB 原子操作效率高

---

## 下一步行動

### 立即行動
1. **審核本計劃 v2**:
   - 確認 scenario-centric 架構符合預期
   - 確認數據遷移方案可接受
   - 確認關鍵技術決策

2. **準備環境**:
   - 建立測試資料庫 (複製生產資料)
   - 創建 feature branch: `feature/scenario-centric-refactor`

3. **Spike (推薦)**:
   - 2 天 spike: 在測試 DB 手動執行遷移邏輯
   - 驗證 populate 效能 (1000+ scenarios)
   - 驗證 balanced selection 演算法

### 審核問題

請回答:

1. **架構確認**: Scenario-centric 架構是否符合您的設想?

2. **Mode 3 詳細需求**:
   - 每個 scenario 的 design matrix 包含多少行? (影響 totalScenarios 計算)
   - Balanced vs Random selection 偏好?
   - 是否需要防止同一參與者多次參與同一 Mixed Group?

3. **遷移時程**:
   - 生產環境可接受的維護窗口多長?
   - 是否需要零停機遷移方案? (Blue-Green deployment)

4. **簡化優先順序**:
   - 是否先實現 Mode 1/2 的重構,驗證穩定後再做 Mode 3?
   - 還是一起實現?

5. **資源**:
   - 預計投入幾位工程師? (影響平行任務)
   - 4.5 週時程是否可接受?

請提供反饋,我將據此更新實施計劃和時程安排。
