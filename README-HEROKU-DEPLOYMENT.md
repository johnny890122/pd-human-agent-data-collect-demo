# 🚀 Heroku 快速部署清單

## 部署前檢查

- [ ] 已安裝 Heroku CLI：`heroku --version`
- [ ] 已登入 Heroku：`heroku login`
- [ ] 已創建 Heroku app：`heroku create your-app-name`
- [ ] MongoDB Atlas 已設置網路存取 (0.0.0.0/0)

## 必需環境變數（4 個）

```bash
# 1. 設置為生產模式
heroku config:set NODE_ENV="production"

# 2. MongoDB 連接字串（從您的 MongoDB Atlas 獲取）
heroku config:set MONGODB_URI="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority"

# 3. JWT 密鑰（生成一個安全的隨機字串）
heroku config:set JWT_SECRET="$(openssl rand -hex 32)"

# 4. Admin 密碼（設置一個強密碼）
heroku config:set ADMIN_PASSWORD="your-strong-password"
```

## 驗證配置

```bash
# 執行驗證腳本
node scripts/verify-heroku-config.mjs

# 或手動檢查
heroku config
```

## 部署

```bash
# 推送到 Heroku
git push heroku main

# 查看部署日誌
heroku logs --tail

# 打開應用
heroku open
```

## 快速參考

| 需要做什麼 | 命令 |
|-----------|------|
| 查看所有環境變數 | `heroku config` |
| 設置環境變數 | `heroku config:set KEY="value"` |
| 刪除環境變數 | `heroku config:unset KEY` |
| 查看日誌 | `heroku logs --tail` |
| 重啟應用 | `heroku restart` |
| 打開應用 | `heroku open` |

## 可選環境變數

如果需要 Cloudflare Turnstile 驗證碼（生產環境）：

```bash
heroku config:set TURNSTILE_SECRET_KEY="your-secret"
heroku config:set VITE_TURNSTILE_SITE_KEY="your-site-key"
```

## 問題排查

### 應用無法啟動
```bash
heroku logs --tail
```
檢查是否有錯誤訊息

### MongoDB 連接失敗
1. 檢查 MongoDB Atlas 網路存取設置
2. 確認連接字串格式正確
3. 確認使用者名稱和密碼正確

### 無法登入 Admin
1. 確認 `ADMIN_PASSWORD` 已設置
2. 確認 `JWT_SECRET` 已設置
3. 清除瀏覽器快取重試

## 詳細文檔

- 📖 完整部署指南：[`HEROKU_DEPLOYMENT.md`](HEROKU_DEPLOYMENT.md)
- 🔧 環境變數範例：[`.env.production.example`](.env.production.example)
- 🔧 開發環境範例：[`.env.example`](.env.example)
- 📝 設置腳本：[`heroku-env-setup.sh`](heroku-env-setup.sh)
- ✅ 驗證腳本：[`scripts/verify-heroku-config.mjs`](scripts/verify-heroku-config.mjs)

## 當前專案配置狀態

您的專案已經包含：
- ✅ [`Procfile`](Procfile:1) - Heroku 啟動配置
- ✅ [`package.json`](package.json:13) - `heroku-postbuild` 自動構建
- ✅ [`server.js`](server.js:18) - 使用 `process.env.PORT`
- ✅ [`.gitignore`](.gitignore:29) - 排除 `.env` 檔案
- ✅ Node.js 版本指定 (20.x)

## 生成 JWT 密鑰

```bash
# 方法 1: 使用 OpenSSL
openssl rand -hex 32

# 方法 2: 使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 方法 3: 直接設置到 Heroku
heroku config:set JWT_SECRET="$(openssl rand -hex 32)"
```

## 下一步

1. 複製上方的環境變數設置命令
2. 替換為您的真實值
3. 執行設置命令
4. 執行驗證腳本
5. 部署到 Heroku
6. 查看日誌確認成功

🎉 祝部署順利！
