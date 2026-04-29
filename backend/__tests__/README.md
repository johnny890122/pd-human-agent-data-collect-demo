# Backend Tests

這個目錄包含後端 API 的單元測試和集成測試。

## 執行測試

```bash
# 執行所有測試
npm test

# 執行特定測試文件
npm test backend/__tests__/new-data-model.test.js

# 執行測試並顯示覆蓋率
npm test -- --coverage
```

## 測試檔案

### `new-data-model.test.js`

測試新的 Scenario-Centric 資料模型和 API：

- **Scenario Model Tests**: 測試 UUID 主鍵、virtual fields、原子操作
- **Session Model Tests**: 測試容器模式、virtual populate
- **Manual Mode Tests**: 測試 `createManualSession` 流程
- **Batch Mode Tests**: 測試 `createBatchSessions` 流程
- **Unified Survey Flow Tests**: 測試統一的 survey 完成流程
- **Submission Schema Tests**: 測試更新的 schema (UUID scenarioId、participantId)

## 環境設定

測試使用獨立的 MongoDB 測試資料庫。設定環境變數：

```bash
# .env.test
MONGODB_URI=mongodb://localhost:27017/pd-test
```

或使用預設的本地測試資料庫：`mongodb://localhost:27017/pd-test`

## 測試結構

每個測試套件：
1. `beforeAll`: 連接測試資料庫
2. `beforeEach`: 清空測試資料
3. 個別測試案例
4. `afterAll`: 關閉資料庫連接

## 注意事項

- 測試會自動清空資料，不會影響開發或生產資料庫
- 確保 MongoDB 在執行測試前已啟動
- 測試使用真實的 Mongoose models，確保與實際行為一致
