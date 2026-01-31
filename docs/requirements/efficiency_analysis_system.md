# 效率分析系統需求規格

## 概述
本系統為抽樣計畫分析工具提供全面的效率評比和改進建議功能，確保使用者能夠選擇最優的抽樣策略。

## 1. 核心功能需求

### 1.1 效率評比系統
- **統一評級標準**：
  - 🌟 Excellent (95%+)
  - ✅ Very Good (85-95%)
  - 👍 Good (75-85%)
  - ⚠️ Fair (65-75%)
  - ❌ Poor (50-65%)
  - 🚫 Very Poor (<50%)

### 1.2 效率計算方法
#### 1.2.1 AQL-LTPD精確計算（適用於有完整風險數據的計畫）
```javascript
function calculatePlanEfficiency(plan, idealPaAql, idealPaLtpd, alpha, beta) {
    const aqlDeviation = Math.abs(plan.paAql - idealPaAql);
    const ltpdDeviation = Math.abs(plan.paLtpd - idealPaLtpd);
    
    let constraintPenalty = 0;
    if (plan.actualAlpha > alpha) {
        constraintPenalty += (plan.actualAlpha - alpha) * 2;
    }
    if (plan.actualBeta > beta) {
        constraintPenalty += (plan.actualBeta - beta) * 2;
    }
    
    const totalDeviation = aqlDeviation + ltpdDeviation + constraintPenalty;
    const efficiency = Math.max(0, 1 - totalDeviation);
    
    return efficiency;
}
```

#### 1.2.2 通用效率指標（適用於基本計畫）
```javascript
function calculateBasicEfficiency(plan, aql = null) {
    const sampleEfficiency = 1 / (1 + plan.n / 100);
    const discriminationPower = calculateDiscriminationPower(plan);
    const riskBalance = calculateRiskBalance(plan, aql);
    
    const efficiency = (sampleEfficiency * 0.4 + discriminationPower * 0.4 + riskBalance * 0.2);
    
    return { efficiency, sampleEfficiency, discriminationPower, riskBalance };
}
```

### 1.3 智能效率計算
- **自動檢測**：系統自動檢測計畫是否包含AQL-LTPD數據
- **方法選擇**：根據數據完整性選擇適當的計算方法
- **一致性保證**：確保相同計畫在不同頁面中獲得相同的效率評比

## 2. 使用者介面需求

### 2.1 AQL-LTPD頁面效率面板
- **效率評比顯示** (`#aql_ltpd_efficiency_rating`)：
  - 顯示視覺化評級（表情符號 + 百分比）
  - 即時更新，反映當前計畫的效率
- **改進建議區域** (`#aql_ltpd_improvements`)：
  - 多行文字區域，顯示AI生成的改進建議
  - 可滾動，支援長文本顯示
  - 即時更新，根據計畫參數動態生成建議

### 2.2 Multiple Plan Comparison頁面效率分析（已移除）
**注意：效率分析功能已從Multiple Plan Comparison頁面移除，專注於OC、AOQ、ATI曲線比較功能。**

#### 2.2.1 移除原因
- **功能簡化**：專注於曲線比較，減少複雜度
- **效能提升**：移除效率計算，提升頁面響應速度
- **用戶體驗**：避免功能重複，提供更清晰的界面

#### 2.2.2 替代方案
- **AQL-LTPD頁面**：保留完整的效率分析功能
- **曲線比較**：透過OC、AOQ、ATI曲線進行視覺化比較
- **跨頁整合**：從其他頁面匯出計畫進行比較

## 3. 改進建議生成系統

### 3.1 樣本數分析
```javascript
// 樣本數過大警告
if (plan.n > 200) {
    suggestions.push("• Consider reducing sample size: Current n=" + plan.n + " is quite large. Try adjusting AQL/LTPD values or risk constraints.");
}

// 樣本數過小警告
if (plan.n < 20) {
    suggestions.push("• Sample size is very small (n=" + plan.n + "). Consider increasing for better statistical power.");
}
```

### 3.2 風險約束分析
```javascript
// 生產者風險過高
if (plan.actualAlpha > alpha * 1.2) {
    suggestions.push("• Producer's risk is high (" + (plan.actualAlpha * 100).toFixed(1) + "% vs target " + (alpha * 100) + "%). Consider increasing sample size or adjusting AQL.");
}

// 消費者風險過高
if (plan.actualBeta > beta * 1.2) {
    suggestions.push("• Consumer's risk is high (" + (plan.actualBeta * 100).toFixed(1) + "% vs target " + (beta * 100) + "%). Consider increasing sample size or adjusting LTPD.");
}
```

### 3.3 分佈模型建議
```javascript
// 小批次建議
if (lotSize < 1000) {
    suggestions.push("• For small lots (N=" + lotSize + "), consider using Hypergeometric distribution for more accurate results.");
}

// 大批次建議
if (lotSize > 10000) {
    suggestions.push("• For large lots (N=" + lotSize + "), Binomial or Poisson distributions are appropriate.");
}
```

### 3.4 AQL-LTPD比例分析
```javascript
const ratio = ltpd / aql;
if (ratio < 3) {
    suggestions.push("• AQL-LTPD ratio is small (" + ratio.toFixed(1) + "). Consider wider separation for better discrimination.");
} else if (ratio > 10) {
    suggestions.push("• AQL-LTPD ratio is very large (" + ratio.toFixed(1) + "). This may require very large sample sizes.");
}
```

## 4. 跨頁數據一致性

### 4.1 數據匯出標準
所有頁面匯出計畫時必須包含以下效率計算數據：
```javascript
{
    n: number,
    c: number,
    aql: number,
    label: string,
    dist: string,
    N: number,
    source: string,
    // 效率計算數據
    paAql: number,        // AQL點的允收機率
    paLtpd: number,       // LTPD點的允收機率
    actualAlpha: number,  // 實際生產者風險
    actualBeta: number    // 實際消費者風險
}
```

### 4.2 智能回退機制
```javascript
function calculatePlanEfficiencyForComparison(plan, aql = null) {
    // 檢查是否包含AQL-LTPD數據
    if (plan.paAql !== undefined && plan.paLtpd !== undefined && 
        plan.actualAlpha !== undefined && plan.actualBeta !== undefined) {
        // 使用精確計算方法
        return calculatePreciseEfficiency(plan);
    } else {
        // 使用通用效率指標
        return calculateBasicEfficiency(plan, aql);
    }
}
```

## 5. 效能需求

### 5.1 計算速度
- **效率計算**：單一計畫效率計算應在 < 10ms 內完成
- **多計畫比較**：10個計畫的效率比較應在 < 100ms 內完成
- **建議生成**：改進建議生成應在 < 50ms 內完成

### 5.2 記憶體使用
- **數據結構**：每個計畫的效率數據不超過 1KB
- **快取機制**：已計算的效率數據應快取，避免重複計算
- **清理機制**：定期清理無用的效率數據

## 6. 錯誤處理

### 6.1 數據驗證
```javascript
function validateEfficiencyData(plan) {
    if (!plan || typeof plan.n !== 'number' || typeof plan.c !== 'number') {
        throw new Error('Invalid plan data: missing n or c');
    }
    
    if (plan.n <= 0 || plan.c < 0 || plan.c > plan.n) {
        throw new Error('Invalid plan parameters: n must be > 0, c must be >= 0 and <= n');
    }
    
    return true;
}
```

### 6.2 邊界情況處理
- **極端樣本數**：n > 1000 時顯示警告
- **無效風險值**：風險值超出合理範圍時使用預設值
- **計算錯誤**：統計計算失敗時回退到基本效率指標

## 7. 測試需求

### 7.1 單元測試
- 效率計算函數的正確性測試
- 改進建議生成的邏輯測試
- 數據驗證函數的邊界測試

### 7.2 整合測試
- 跨頁效率一致性測試
- 多計畫比較功能測試
- 數據匯出/匯入功能測試

### 7.3 效能測試
- 大量計畫的效率計算效能測試
- 記憶體使用量監控
- 使用者介面回應時間測試

## 8. 最新功能更新（2025-01）

### 8.1 效率公式動態化
- **動態公式顯示**：標籤更新為 `Plan Efficiency (E = 1 - |Pa_AQL - (1-α)| - |Pa_LTPD - β| - penalty)`
- **動態參數**：效率計算使用用戶設定的實際α和β值
- **公式解釋**：清楚說明效率計算的數學基礎

### 8.2 教學整合
- **教學內容**：效率分析概念整合到教學系統中
- **測驗題目**：新增效率相關測驗題目
- **實務應用**：提供具體的效率分析案例

### 8.3 功能精簡化
- **移除重複功能**：從Multiple Plan Comparison頁面移除效率分析
- **專注核心功能**：AQL-LTPD頁面保留完整的效率分析
- **提升效能**：減少不必要的計算和界面複雜度

## 9. 技術改進（2025-01）

### 9.1 計算優化
- **演算法改進**：優化效率計算演算法
- **記憶體管理**：改進數據結構和快取機制
- **數值穩定性**：提升極端值情況下的計算穩定性

### 9.2 用戶體驗
- **即時回饋**：改進效率計算的即時顯示
- **視覺化改進**：更好的效率評級顯示
- **錯誤處理**：更清晰的錯誤訊息和處理機制

## 10. 未來擴展

### 10.1 進階分析功能
- **成本效益分析**：整合檢驗成本和品質成本
- **敏感性分析**：分析參數變化對效率的影響
- **歷史追蹤**：記錄效率改善的歷史趨勢

### 10.2 機器學習整合
- **智能建議**：基於歷史數據提供更精準的建議
- **模式識別**：自動識別低效率計畫的共同特徵
- **預測分析**：預測計畫在不同條件下的表現

### 10.3 視覺化增強
- **效率熱力圖**：視覺化顯示不同參數組合的效率
- **趨勢圖表**：顯示效率改善的趨勢
- **比較儀表板**：提供更豐富的比較視覺化

---

*本需求規格確保效率分析系統能夠提供準確、一致且實用的抽樣計畫評估功能，並反映最新的功能改進和教學整合。*
