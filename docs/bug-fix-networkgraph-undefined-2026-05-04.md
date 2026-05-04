# Bug Fix: NetworkGraph TypeError - Cannot read properties of undefined

**Date**: 2026-05-04  
**Component**: [`NetworkGraph.tsx`](../components/NetworkGraph.tsx)  
**Severity**: High (Runtime crash)  
**Status**: Fixed ✅

---

## Problem

應用程式在渲染 NetworkGraph 元件時出現以下錯誤：

```
Uncaught TypeError: Cannot read properties of undefined (reading 'includes')
    at NetworkGraph.tsx:283:38
```

---

## Root Cause

在 [`NetworkGraph.tsx`](../components/NetworkGraph.tsx) 的多個位置中，`activeEdges` 變數可能被賦值為 `undefined`，導致在調用 `.includes()` 方法時拋出 TypeError。

問題出現在以下邏輯表達式中：

```typescript
// 原始程式碼（有問題）
const activeEdges = mode === 'survey' && scenario?.activeEdgeIds 
  ? scenario.activeEdgeIds 
  : (setup.activeEdgeIds || []);
```

當 `mode !== 'survey'` 且 `setup.activeEdgeIds` 為 `undefined` 時，`activeEdges` 會是 `undefined`。

---

## Solution

修改邏輯表達式，確保 `activeEdges` 在所有情況下都是一個陣列：

```typescript
// 修復後的程式碼
const activeEdges = (mode === 'survey' && scenario?.activeEdgeIds) 
  || setup?.activeEdgeIds 
  || [];
```

同時為 `setup` 對象添加可選鏈操作符 (`?.`)，以防禦 `setup` 本身為 `undefined` 的情況。

---

## Changes Made

修復了以下四個位置：

1. **Line 115**: `getEdgeColor` 函數中的 admin 模式檢查
   - 添加 `setup?.activeEdgeIds` 防禦性檢查

2. **Line 118**: `getEdgeColor` 函數中的 survey 模式邏輯
   - 改為 `scenario?.activeEdgeIds || setup?.activeEdgeIds || []`

3. **Line 128**: `getEdgeOpacity` 函數中的邏輯
   - 改為 `scenario?.activeEdgeIds || setup?.activeEdgeIds || []`

4. **Line 282**: 邊渲染（第 1 層：路徑）
   - 改為 `(mode === 'survey' && scenario?.activeEdgeIds) || setup?.activeEdgeIds || []`

5. **Line 415**: 邊渲染（第 3 層：氣泡）
   - 改為 `(mode === 'survey' && scenario?.activeEdgeIds) || setup?.activeEdgeIds || []`

---

## Impact

- **Before**: 應用程式在某些條件下會崩潰（當 `setup.activeEdgeIds` 為 `undefined` 時）
- **After**: 所有情況下都能正常渲染，`activeEdges` 保證是一個陣列

---

## Testing Recommendations

建議測試以下場景：

1. ✅ Manual Mode: `setup.activeEdgeIds` 存在
2. ✅ Mixed Mode: `scenario.activeEdgeIds` 存在
3. ✅ Edge Case: `setup.activeEdgeIds` 為 `undefined`
4. ✅ Edge Case: `scenario` 為 `undefined`
5. ✅ Edge Case: 兩者都為 `undefined`

---

## Related Files

- [`components/NetworkGraph.tsx`](../components/NetworkGraph.tsx)
- [`types.ts`](../types.ts) - Session 和 Scenario 類型定義
