#!/usr/bin/env node

/**
 * Heroku 環境變數驗證腳本
 * 用途：在部署前檢查所有必需的環境變數是否已設置
 * 使用方式：node scripts/verify-heroku-config.mjs
 */

import { execSync } from 'child_process';

const REQUIRED_VARS = [
  'NODE_ENV',
  'MONGODB_URI',
  'JWT_SECRET',
  'ADMIN_PASSWORD',
];

const OPTIONAL_VARS = [
  'TURNSTILE_SECRET_KEY',
  'VITE_TURNSTILE_SITE_KEY',
  'GEMINI_API_KEY',
];

const SECURITY_CHECKS = {
  JWT_SECRET: {
    minLength: 32,
    description: 'JWT 密鑰長度應至少 32 字元',
  },
  ADMIN_PASSWORD: {
    minLength: 8,
    description: 'Admin 密碼長度應至少 8 字元',
  },
};

console.log('🔍 檢查 Heroku 環境變數配置...\n');

let allGood = true;

try {
  // 取得 Heroku config
  const configOutput = execSync('heroku config', { encoding: 'utf-8' });
  const configLines = configOutput.split('\n');
  
  // 解析環境變數
  const envVars = {};
  configLines.forEach(line => {
    const match = line.match(/^([A-Z_]+):\s*(.*)$/);
    if (match) {
      envVars[match[1]] = match[2];
    }
  });

  console.log('📋 必需變數檢查：\n');
  
  REQUIRED_VARS.forEach(varName => {
    const value = envVars[varName];
    if (!value || value.trim() === '') {
      console.log(`❌ ${varName}: 未設置`);
      allGood = false;
    } else {
      // 檢查安全性要求
      if (SECURITY_CHECKS[varName]) {
        const check = SECURITY_CHECKS[varName];
        if (value.length < check.minLength) {
          console.log(`⚠️  ${varName}: 已設置，但${check.description}`);
          allGood = false;
        } else {
          console.log(`✅ ${varName}: 已設置`);
        }
      } else {
        console.log(`✅ ${varName}: 已設置`);
      }
    }
  });

  console.log('\n📋 可選變數檢查：\n');
  
  OPTIONAL_VARS.forEach(varName => {
    const value = envVars[varName];
    if (!value || value.trim() === '') {
      console.log(`⚪ ${varName}: 未設置（可選）`);
    } else {
      console.log(`✅ ${varName}: 已設置`);
    }
  });

  // 特定檢查
  console.log('\n🔐 安全性檢查：\n');
  
  // NODE_ENV 檢查
  if (envVars.NODE_ENV !== 'production') {
    console.log(`⚠️  NODE_ENV 應設置為 'production'，當前為: ${envVars.NODE_ENV || '未設置'}`);
    allGood = false;
  } else {
    console.log(`✅ NODE_ENV 正確設置為 production`);
  }

  // MongoDB URI 檢查
  if (envVars.MONGODB_URI) {
    if (envVars.MONGODB_URI.includes('<user>') || 
        envVars.MONGODB_URI.includes('<password>') || 
        envVars.MONGODB_URI.includes('<cluster>')) {
      console.log(`❌ MONGODB_URI 包含佔位符，請替換為實際值`);
      allGood = false;
    } else if (!envVars.MONGODB_URI.startsWith('mongodb://') && 
               !envVars.MONGODB_URI.startsWith('mongodb+srv://')) {
      console.log(`⚠️  MONGODB_URI 格式可能不正確`);
      allGood = false;
    } else {
      console.log(`✅ MONGODB_URI 格式正確`);
    }
  }

  // JWT_SECRET 檢查
  if (envVars.JWT_SECRET && (
      envVars.JWT_SECRET.includes('your-') || 
      envVars.JWT_SECRET === 'fallback_secret')) {
    console.log(`❌ JWT_SECRET 使用了示例值，請使用真實的隨機字串`);
    allGood = false;
  } else if (envVars.JWT_SECRET) {
    console.log(`✅ JWT_SECRET 看起來是有效的`);
  }

  // ADMIN_PASSWORD 檢查
  if (envVars.ADMIN_PASSWORD && 
      (envVars.ADMIN_PASSWORD === 'admin123' || 
       envVars.ADMIN_PASSWORD === 'password')) {
    console.log(`⚠️  ADMIN_PASSWORD 使用了弱密碼，建議更改`);
  } else if (envVars.ADMIN_PASSWORD) {
    console.log(`✅ ADMIN_PASSWORD 已設置`);
  }

  // PORT 檢查
  if (envVars.PORT) {
    console.log(`ℹ️  PORT 由 Heroku 自動設置: ${envVars.PORT}`);
  }

  console.log('\n' + '='.repeat(50));
  
  if (allGood) {
    console.log('\n✅ 所有必需的環境變數配置正確！');
    console.log('\n下一步：');
    console.log('  git push heroku main');
    process.exit(0);
  } else {
    console.log('\n❌ 環境變數配置有問題，請修正後再部署');
    console.log('\n設置範例：');
    console.log('  heroku config:set VARIABLE_NAME="value"');
    console.log('\n詳細說明：');
    console.log('  請參考 HEROKU_DEPLOYMENT.md');
    process.exit(1);
  }

} catch (error) {
  if (error.message.includes('heroku')) {
    console.error('\n❌ 錯誤：無法執行 heroku 命令');
    console.error('請確認：');
    console.error('  1. 已安裝 Heroku CLI');
    console.error('  2. 已登入：heroku login');
    console.error('  3. 在正確的專案目錄中');
    console.error('  4. 已連接到 Heroku app：heroku git:remote -a your-app-name');
  } else {
    console.error('\n❌ 發生錯誤：', error.message);
  }
  process.exit(1);
}
