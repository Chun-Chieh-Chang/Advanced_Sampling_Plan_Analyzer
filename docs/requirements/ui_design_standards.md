# UI Design Standards — 統一介面設計規範

本檔案記錄應用程式的統一UI設計標準，確保所有頁面保持一致的視覺效果和使用者體驗。

## 11. Language Policy (English-only for this release)

### 11.1 Scope
- All UI copy must be in English only: navigation, buttons, labels, inputs, helpers, tooltips, dialogs, chart legends/titles, exports, alerts, and tutorial content.
- In-app examples, quiz questions/answers, and instructional text must be English.
- No Chinese (Traditional/Simplified) words, punctuation, or mixed-language strings in the app UI.

### 11.2 Enforcement Standards
- Text resources authored or edited for this version must pass a language lint: English-only spell-check and style pass (no CJK range characters).
- When referencing standards (e.g., ANSI/ASQ Z1.4), use their official English names.
- Data exports (CSV filenames, column headers) must be English.

### 11.3 Acceptance Checklist
- [ ] UI labels and tooltips are English-only across all pages.
- [ ] Tutorial/learning content and quizzes are English-only.
- [ ] Alerts/validation/error messages are English-only.
- [ ] Chart titles/legends/axes and exported assets (PNG/CSV) are English-only.
- [ ] No mixed-language strings remain in source.

## 12. 最新功能UI標準（2025-01）

### 12.1 AOQ/ATI曲線按鈕設計
- **按鈕佈局**：三個曲線類型按鈕水平排列
- **狀態指示**：當前激活的按鈕使用primary樣式
- **標籤文字**：
  - "Show OC Curves" - 操作特性曲線
  - "Show AOQ Curves" - 平均出廠品質曲線
  - "Show ATI Curves" - 平均總檢驗數曲線

### 12.2 動態Y軸標籤
- **OC曲線**：`Acceptance Probability (Pa%)`
- **AOQ曲線**：`Average Outgoing Quality (AOQ%)`
- **ATI曲線**：`Average Total Inspection (ATI)`

### 12.3 游標與Tooltip一致性（新增 2025-10）
- 全站採用「雙游標」互動規範：
  - 游標A（Crosshair）：在圖表區域內顯示十字輔助線與動態數值標籤；文字內容必須與當前曲線類型/單位一致。
  - 游標B（Tooltip）：Chart.js 默認 tooltip，僅在靠近資料點時顯示；其內容格式必須與游標A一致。
- 曲線類型對應之標籤：
  - OC：`p=XX% , Pa=YY%`
  - AOQ：`p=XX% , AOQ=YY%`
  - ATI：`p=XX% , ATI=ZZ`
- 插件作用域：crosshair 一律以「實例範圍（instance‑scoped）」加入，禁止全域註冊以避免跨頁污染。

### 12.3 效率公式顯示
- **標籤格式**：`Plan Efficiency (E = 1 - |Pa_AQL - (1-α)| - |Pa_LTPD - β| - penalty)`
- **數學符號**：使用標準數學符號（α, β, | |）
- **可讀性**：確保公式在各種主題下清晰可讀

### 12.4 教學系統UI標準
- **教學步驟**：新增章節使用表情符號標識
- **測驗題目**：保持一致的問答格式
- **進度指示**：統一的進度條和步驟指示器

### 12.5 錯誤處理UI
- **空計畫檢查**：友好的錯誤提示訊息
- **狀態保持**：曲線類型切換時的狀態管理
- **視覺回饋**：按鈕狀態與圖表顯示同步

### 12.12 C=0 反向查詢UI標準（2025-11-29）
- **查詢模式切換**：
  - 使用 Radio Buttons 群組切換 "Find Sample Size (n)" 與 "Find AQL" 模式。
  - Radio Buttons 需水平排列，標籤與按鈕垂直置中對齊。
- **動態輸入欄位**：
  - 根據選擇的模式，動態顯示/隱藏對應的輸入欄位（AQL 選擇器 vs Sample Size 下拉選單）。
  - "Sample Size (n)" 在反向查詢模式下為下拉選單 (`select`)，而非文字輸入框。
  - 下拉選單內容需根據當前 Lot Size 動態更新，僅顯示有效的樣本數選項。
- **欄位連動**：
  - 修改 Lot Size 時，若處於 "Find AQL" 模式，需自動更新 Sample Size 下拉選單的選項。

## 1. 液態玻璃（Glassmorphism）按鈕設計

### 1.1 核心設計原則
- 所有按鈕統一使用透明液態玻璃效果
- 使用固定的模糊和透明度值確保一致的視覺效果
- 確保文字在透明背景上的可讀性

### 1.2 CSS變數定義
液態玻璃效果使用固定值實現，不依賴動態CSS變數：
- **模糊效果**：`backdrop-filter: blur(15px-20px)`
- **背景透明度**：`rgba(255,255,255,0.08-0.18)`
- **邊框顏色**：`rgba(255,255,255,0.2-0.3)`

### 1.3 按鈕樣式規範
- **背景效果**：雙層漸變 + backdrop-filter 模糊
- **邊框**：1px solid 半透明白色
- **圓角**：16px（一般按鈕）/ 20px（特殊按鈕）
- **陰影**：內外雙重陰影營造立體感
- **動畫**：0.3-0.4s cubic-bezier 緩動

### 1.4 文字對比度要求

#### 1.4.1 動態文字顏色系統
- **主要文字**：使用 `var(--text)` 根據主題動態調整
- **深色主題**：白色文字 `#ffffff`
- **淺色主題**：深色文字（根據主題配色）

#### 1.4.2 文字陰影規則
- **深色主題**：必須添加陰影增強可讀性
  - 一般按鈕：`text-shadow: 0 1px 2px rgba(0,0,0,0.3)`
  - 主要按鈕：`text-shadow: 0 1px 3px rgba(52, 152, 219, 0.8)`
  - 分佈按鈕：使用對應顏色陰影，如 `text-shadow: 0 1px 3px rgba(241, 196, 15, 0.8)`
- **淺色主題**：移除文字陰影或使用淺色陰影

## 2. 導航標籤優化

### 2.1 尺寸規範
- **字體大小**：`font-size: 0.9rem`
- **內距**：`padding: 10px 18px`（縮小高度）
- **文字顏色**：`color: var(--text)`（動態主題顏色）
- **文字陰影**：根據主題動態調整

### 2.2 狀態效果
- **預設狀態**：半透明玻璃效果
- **懸停狀態**：藍色漸變 + 向上位移 + 縮放
- **活動狀態**：更強的藍色漸變 + 底部指示線

## 3. Distribution Types 按鈕專用規範

### 3.1 排列要求
- **強制單行排列**：`flex-wrap: nowrap`
- **等寬分佈**：`flex: 1`
- **最小寬度**：`min-width: 0`

### 3.2 文字處理
- **字體大小**：`font-size: 0.85rem`
- **內距調整**：`padding: 10px 8px`
- **文字不換行**：`white-space: nowrap`
- **溢出處理**：`overflow: hidden; text-overflow: ellipsis`

### 3.3 文字縮寫規範
- **Hypergeometric** → **Hypergeo.**
- 保留 `title` 屬性顯示完整名稱
- **Binomial** 和 **Poisson** 保持原名

## 4. 按鈕分類與顏色主題

### 4.1 主要按鈕（.btn.primary）
- **背景**：藍色漸變 `rgba(52, 152, 219, 0.3-0.15)`
- **文字**：白色 + 藍色陰影
- **邊框**：藍色半透明

### 4.2 分佈按鈕（data-dist）

#### 4.2.1 活動狀態 (.primary)
- **Hypergeometric**：黃色主題 `rgba(241,196,15,*)`
- **Binomial**：綠色主題 `rgba(46,204,113,*)`
- **Poisson**：紅色主題 `rgba(231,76,60,*)`

#### 4.2.2 非活動狀態
- **所有分佈類型**：使用預設灰色樣式（與 Clear All 按鈕相同）
- **設計理念**：只有當前選中的分佈類型顯示彩色，未選中的保持中性色調

### 4.3 一般按鈕（.btn）
- **背景**：白色半透明漸變
- **文字**：白色 + 黑色陰影
- **邊框**：白色半透明

## 5. 響應式與可用性

### 5.1 觸控友好
- **最小點擊區域**：44px × 44px
- **間距**：按鈕間至少 8px 間隔

### 5.2 鍵盤導航
- **Tab順序**：邏輯順序訪問
- **焦點指示**：清晰的焦點環
- **Enter/Space**：激活按鈕功能

### 5.3 無障礙支援
- **對比度**：文字與背景對比度 ≥ 4.5:1
- **語義標記**：適當的 ARIA 標籤
- **替代文字**：圖標按鈕提供 title 或 aria-label

## 6. 動畫與過渡效果

### 6.1 懸停效果
- **位移**：`transform: translateY(-2px to -4px)`
- **縮放**：`scale(1.01 to 1.05)`
- **陰影增強**：更深的外陰影

### 6.2 點擊效果
- **下壓**：`transform: translateY(1px)`
- **持續時間**：150ms 快速回饋

### 6.3 光澤動畫
- **掃光效果**：從左到右的高光掃過
- **觸發**：懸停時激活
- **持續時間**：0.6s

## 7. 實施指南

### 7.1 新按鈕檢查清單
- [ ] 使用 `.btn` 基礎類別
- [ ] 添加適當的功能類別（`.primary`, `[data-dist]` 等）
- [ ] 確保文字顏色為白色
- [ ] 添加適當的文字陰影
- [ ] 測試在不同背景下的可讀性

### 7.2 品質保證
- [ ] 在不同螢幕尺寸下測試
- [ ] 驗證鍵盤導航功能
- [ ] 檢查顏色對比度
- [ ] 測試觸控設備上的使用體驗

## 8. 特殊功能按鈕

### 8.1 教學按鈕佈局
- **位置**：放置在左側參數功能區的獨立面板中
- **面板標題**：「Learning」
- **按鈕樣式**：使用 `.btn.primary.glass-button` 類別
- **寬度**：`width: 100%` 填滿面板寬度
- **圖標**：🎓 表示學習功能

### 8.2 設計理念
- 將教學功能整合到參數控制區，提升功能發現性
- 獨立面板設計，避免與其他控制項混淆
- 全寬按鈕設計，增強視覺重要性

## 8.3 版權信息樣式
- **字體大小**：`font-size: 0.75rem`（比標準文字小）
- **顏色**：`color: #7a8a9a`（柔和的灰藍色）
- **透明度**：`opacity: 0.7`（降低視覺重量）
- **字間距**：`letter-spacing: 0.3px`（提升可讀性）
- **設計理念**：低調呈現，不干擾主要內容，但保持可讀性

## 9. 色彩對比度綁定關係與管理原則

### 9.1 核心設計原則：色彩與對比度綁定關係

#### 9.1.1 強制綁定原則
**任何主題色彩或按鈕背景色的變更，必須同時考慮並執行相應的文字對比度調整。這是不可分離的綁定關係。**

#### 9.1.2 綁定關係實例
- **背景色變更** → **文字色必須相應調整**
- **按鈕主題色變更** → **按鈕文字色與陰影必須重新計算**
- **面板背景變更** → **面板內所有文字元素的顏色需要驗證**
- **主題切換** → **所有相關聯的文字元素對比度需要同步更新**

#### 9.1.3 對比度標準要求
- **主要文字**：與背景對比度 ≥ 4.5:1 (WCAG AA)
- **輔助文字**：與背景對比度 ≥ 3:1 (WCAG AA Large Text)
- **互動元素**：按鈕、連結等與背景對比度 ≥ 4.5:1
- **狀態指示**：錯誤、警告、成功等狀態文字 ≥ 4.5:1

### 9.2 實施流程與檢查機制

#### 9.2.1 設計階段強制檢查
每當進行色彩調整時，必須執行以下檢查：
1. **識別受影響的文字元素**：列出所有在該背景上的文字
2. **計算對比度**：使用工具驗證新的對比度數值
3. **調整文字顏色**：確保符合對比度標準
4. **測試極端情況**：驗證在不同螢幕亮度下的可讀性
5. **記錄變更**：文檔化對比度調整的原因與數值

#### 9.2.2 自動化驗證要求
建議實施以下自動化檢查：
```css
/* 範例：主題感知的對比度自動調整 */
.theme-aware-text {
    color: var(--adaptive-text);
    /* 根據背景亮度自動選擇深色或淺色文字 */
}

/* 深色背景 → 淺色文字 */
[data-theme="dark-teal"] .theme-aware-text,
[data-theme="dark-gray"] .theme-aware-text,
[data-theme="dark-blue"] .theme-aware-text {
    color: var(--light-contrast-text);
    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

/* 淺色背景 → 深色文字 */
[data-theme="light"] .theme-aware-text,
[data-theme="light-blue"] .theme-aware-text,
[data-theme="light-yellow"] .theme-aware-text,
[data-theme="light-pink"] .theme-aware-text {
    color: var(--dark-contrast-text);
    text-shadow: none;
}
```

### 9.3 常見綁定錯誤與預防

#### 9.3.1 典型錯誤案例
1. **錯誤**：只修改按鈕背景色，忘記調整文字色
   - **後果**：文字在新背景上無法辨識
   - **預防**：建立CSS變數綁定機制

2. **錯誤**：使用固定的 `var(--muted)` 在不同背景上
   - **後果**：在某些主題下對比度不足
   - **預防**：使用主題感知的顏色變數

3. **錯誤**：主題切換時未同步更新圖表文字顏色
   - **後果**：圖表文字在新主題下不可讀
   - **預防**：實施 `getThemeColors()` 函數

4. **錯誤**：Distribution Types 按鈕和 Glass Button 在淺色主題下文字顏色未調整
   - **後果**：白色文字在淺色背景上對比度不足，嚴重影響可讀性
   - **預防**：為特殊按鈕類別建立淺色主題文字覆蓋樣式

5. **錯誤**：圖表區「Defect Rate Max (%)」標籤和輸入框使用硬編碼顏色
   - **後果**：`color:#c7cacf` 和 `background:#2b3a47` 在淺色主題下對比度嚴重不足
   - **預防**：所有圖表工具列元素必須使用主題感知的CSS變數

#### 9.3.2 預防措施
- **禁止硬編碼顏色**：所有顏色必須使用CSS變數
- **建立顏色配對表**：每個背景色對應其最佳文字色
- **實施自動測試**：定期檢查所有主題的對比度合規性
- **設計審查**：每次色彩變更都需要進行對比度審查

#### 9.3.3 特殊按鈕類別的文字對比度標準
**針對 Distribution Types 按鈕和 Glass Button 的淺色主題修正**：

```css
/* 淺色主題特殊按鈕文字對比度修正 */
[data-theme="light"] .btn[data-dist].primary,
[data-theme="light-blue"] .btn[data-dist].primary,
[data-theme="light-yellow"] .btn[data-dist].primary,
[data-theme="light-pink"] .btn[data-dist].primary {
    color: var(--text) !important;
    text-shadow: none !important;
}

[data-theme="light"] .glass-button,
[data-theme="light-blue"] .glass-button,
[data-theme="light-yellow"] .glass-button,
[data-theme="light-pink"] .glass-button {
    color: var(--text) !important;
    text-shadow: none !important;
}
```

**設計原則**：
- 深色主題：使用白色文字 + 陰影增強可讀性
- 淺色主題：使用 `var(--text)` 深色文字 + 移除陰影
- 使用 `!important` 確保覆蓋原有的白色文字設定

#### 9.3.5 按鈕類別對比度規格表
**完整的新按鈕類別對比度實施規格**：

| 按鈕類別 | 深色主題文字色 | 淺色主題文字色 | 覆蓋規則位置 | 檢查要點 |
|---------|-------------|-------------|-------------|---------|
| `.btn.primary` | `color: #ffffff` + `text-shadow` | `color: var(--text) !important` + `text-shadow: none !important` | 9.3.3節 | ✅ 已在需求檔案中 |
| `.btn[data-dist].primary` | `color: #ffffff` + `text-shadow` | `color: var(--text) !important` + `text-shadow: none !important` | 9.3.3節 | ✅ 已在需求檔案中 |
| `.glass-button` | `color: #ffffff` + `text-shadow` | `color: var(--text) !important` + `text-shadow: none !important` | 9.3.3節 | ✅ 已在需求檔案中 |
| `.btn.secondary` | `color: var(--text)` | `color: var(--text)` | CSS變數系統 | 使用CSS變數自動 |
| `.chart-toolbar` 元素 | `color: var(--text)` | `color: var(--text)` | 9.3.4節 | ✅ 已在需求檔案中 |

**新增按鈕類別檢查清單**：
- [ ] 為新按鈕類別定義對應的淺色主題文字覆蓋規則
- [ ] 更新此規格表，記錄新按鈕類別的正確實施方式
- [ ] 確保新按鈕在所有7種主題下符合WCAG AA標準

#### 9.3.4 圖表工具列元素對比度標準

**針對圖表區域 (Chart Toolbar) 的文字和輸入框修正**：

```css
/* 圖表標籤文字 */
.chart-toolbar label {
    color: var(--text);
}

/* 圖表輸入框 */
.chart-toolbar input {
    background: var(--panel);
    color: var(--text);
    border: 1px solid var(--border);
}
```

**修正要點**：
- **標籤文字**：從 `color:#c7cacf` 改為 `color:var(--text)`
- **輸入框背景**：從 `background:#2b3a47` 改為 `background:var(--panel)`
- **輸入框文字**：從 `color:#e6e9ee` 改為 `color:var(--text)`
- **邊框處理**：從 `border:0` 改為 `border:1px solid var(--border)` 提升視覺層次

### 9.4 對比度管理檢查清單

#### 9.4.1 開發階段必檢項目
- [ ] **主題色彩變更時**：
  - [ ] 識別所有受影響的文字元素
  - [ ] 計算新的對比度數值
  - [ ] 調整文字顏色符合WCAG標準
  - [ ] 測試文字陰影的必要性
  - [ ] 驗證不同螢幕亮度下的可讀性

- [ ] **按鈕樣式調整時**：
  - [ ] 確認按鈕文字顏色與背景對比度 ≥ 4.5:1
  - [ ] 調整懸停狀態的文字顏色
  - [ ] 檢查禁用狀態的對比度
  - [ ] 驗證按鈕內圖標的可見性

- [ ] **新增UI元素時**：
  - [ ] 所有文字使用主題感知的CSS變數
  - [ ] 避免使用固定顏色值
  - [ ] 測試在所有7種主題下的顯示效果
  - [ ] 確認無障礙標準合規性

#### 9.4.2 測試驗證要求
- [ ] **自動化測試**：使用對比度檢測工具
- [ ] **視覺測試**：在不同主題間切換驗證
- [ ] **極端測試**：高對比度模式、色盲模擬
- [ ] **設備測試**：不同螢幕亮度和類型

#### 9.4.3 持續監控與品質控制機制
- [ ] **每次修改CSS顏色時**：
  - [ ] 檢查修改是否引入新的硬編碼顏色值
  - [ ] 驗證所有按鈕類別的對比度覆蓋規則完整性
  - [ ] 確認淺色主題文字顏色覆蓋規則包含新元素
- [ ] **定期全站對比度審查**（建議每季度）：
  - [ ] 檢查所有7種主題的按鈕可讀性
  - [ ] 驗證圖表工具列元素的顏色一致性
  - [ ] 測試新增功能在不同主題下的顯示效果
- [ ] **新功能上線前**：
  - [ ] 強制執行"7主題測試"：逐一切換所有主題驗證
  - [ ] 記錄任何新發現的對比度問題及其解決方案

## 10. 標題欄與頁面標題卡統一標準

### 10.1 標題區域設計原則

#### 10.1.1 主標題區域 (header)
- **位置**：頁面頂部，包含應用程式名稱和版權信息
- **背景**：無特定背景色，繼承 body 的主題漸層背景
- **文字顏色**：使用 `var(--text)` 和 `var(--muted)`
- **對齊方式**：置中對齊

#### 9.1.2 頁面標題卡 (.page-header)
- **功能**：每個頁面的功能說明與標題
- **位置**：導航標籤下方，主內容區上方
- **結構**：包含 h2 主標題和描述文字

### 9.2 深色主題標題卡一致性標準

#### 9.2.1 強制統一規範
**所有深色主題 (Dark Teal, Dark Gray, Dark Blue) 的標題卡必須使用相同的視覺風格：**

- **背景色**：統一使用 `#ecf0f1`（淺灰白色）
- **文字色**：統一使用 `#2c3e50`（深灰藍色）
- **設計理念**：參考墨綠主題標準，在深色背景中提供明亮的信息焦點

#### 9.2.2 CSS變數標準化
```css
/* 深色主題標題卡統一標準 */
[data-theme="dark-teal"],
[data-theme="dark-gray"], 
[data-theme="dark-blue"] {
    --card: #ecf0f1;
    --card-text: #2c3e50;
}

/* 標題卡內文字對比度修正 */
.page-header p { 
    color: var(--card-text); 
    opacity: 0.7; 
}
/* 文字置中顯示 */
.page-header { text-align: center; }
```

#### 9.2.3 對比度修正重點
**重要修正**：頁面標題卡的描述文字不可使用 `var(--muted)`，因為：
- 深色主題的 `--muted` 值為淺色 (#9fb0bf, #a0a0a0, #95a5a6)
- 在白色標題卡背景上會造成對比度不足，影響可讀性
- **解決方案**：使用 `var(--card-text)` 搭配 `opacity: 0.7` 來達到層次感

#### 9.2.4 淺色主題差異化
淺色主題保持各自的特色標題卡配色：
- **白色主題**：白色背景 + 深色文字
- **淺藍主題**：白色背景 + 藍色文字  
- **淡黃主題**：白色背景 + 棕色文字
- **粉紅主題**：白色背景 + 紫色文字

### 9.3 實施要求

#### 9.3.1 一致性檢查清單
- [ ] 所有深色主題的 `--card` 變數設為 `#ecf0f1`
- [ ] 所有深色主題的 `--card-text` 變數設為 `#2c3e50`
- [ ] 標題卡在深色主題下呈現相同的白色外觀
- [ ] 文字對比度符合可讀性標準

#### 9.3.2 品質驗證
- **視覺測試**：切換深色主題時標題卡外觀保持一致
- **對比度測試**：白色背景 + 深色文字的對比度 ≥ 4.5:1
- **跨主題測試**：確保深色主題間無視覺差異

## 10. 多主題色系與動態配色

### 10.1 主題系統架構
- **主題選擇器位置**：在 Probability Distribution 頁面左側參數區最上方
- **主題數量**：7種不同漸層色系主題
- **主題切換**：實時切換，支援平滑過渡動畫
- **持久化**：使用 localStorage 記住用戶選擇

### 9.2 支援的主題列表
1. **墨綠 (Dark Teal)**：深色主題，原始預設
2. **白色 (Light)**：明亮白色系主題
3. **深灰 (Dark Gray)**：現代深灰色主題
4. **深青 (Dark Blue)**：專業深藍色主題
5. **淺藍 (Light Blue)**：清爽淺藍色主題
6. **淡黃 (Light Yellow)**：溫暖淡黃色主題
7. **粉紅 (Light Pink)**：柔和粉紅色主題

### 9.3 CSS變數系統
每個主題定義完整的顏色變數集：
- `--bg`, `--panel`, `--panel-2`：背景色系
- `--border`：邊框顏色
- `--text`, `--muted`：文字顏色系統
- `--primary`, `--primary-2`：主色調
- `--bg-gradient-1`, `--bg-gradient-2`：漸層背景
- `--panel-gradient-1`, `--panel-gradient-2`：面板漸層

### 10.4 深色與淺色主題對比度標準

#### 10.4.1 深色主題 (Dark Teal, Dark Gray, Dark Blue)
- **主要文字**：淺色 (#c7cacf, #e0e0e0, #ecf0f1)
- **輔助文字**：中等透明度淺色
- **按鈕文字**：白色 + 陰影效果
- **圖表文字**：`#c7cacf`
- **網格線**：`rgba(199,202,207,0.22)`
- **標題卡背景**：統一使用白色系 `#ecf0f1`（參考墨綠主題標準）
- **標題卡文字**：深色 `#2c3e50`（確保在白色背景上的可讀性）

#### 10.4.2 淺色主題 (Light, Light Blue, Light Yellow, Light Pink)
- **主要文字**：深色 (#212529, #0d47a1, #3e2723, #4a148c)
- **輔助文字**：對應的中等深色
- **按鈕文字**：深色，移除文字陰影
- **邊框顏色**：統一中等灰色 (#757575)
- **圖表文字**：`#212529`
- **網格線**：`rgba(0,0,0,0.1)`

### 9.5 動態顏色更新系統

#### 9.5.1 主題判斷函數
```javascript
function getThemeColors() {
    const theme = document.body.getAttribute('data-theme') || 'dark-teal';
    const isLightTheme = ['light', 'light-blue', 'light-yellow', 'light-pink'].includes(theme);
    
    return {
        text: isLightTheme ? '#212529' : '#c7cacf',
        grid: isLightTheme ? 'rgba(0,0,0,0.1)' : 'rgba(199,202,207,0.22)'
    };
}
```

#### 9.5.2 圖表顏色同步
- **圖例文字**：根據主題動態調整
- **網格線顏色**：淺色主題使用淺色透明，深色主題使用原色
- **實時更新**：主題切換時自動更新所有圖表顏色

### 9.6 淺色主題特殊樣式規則

#### 9.6.1 按鈕樣式調整
```css
[data-theme="light"] .btn,
[data-theme="light-blue"] .btn,
[data-theme="light-yellow"] .btn,
[data-theme="light-pink"] .btn {
    background: linear-gradient(135deg, rgba(0,0,0,0.05), rgba(0,0,0,0.02));
    text-shadow: none;
    color: var(--text);
}
```

#### 9.6.2 頁籤樣式調整
- **背景**：深色半透明取代淺色半透明
- **文字陰影**：移除或使用淺色陰影
- **邊框**：使用主題邊框顏色

#### 9.6.3 淺色主題頁籤（Tab）對比度強化（2025-10-08 新增）
- **規則**：
  - `.tab`、`.tab:hover`、`.tab.active`、`.tab.active:hover` 在淺色主題（light / light‑blue / light‑yellow / light‑pink）下，統一 `color: var(--text)`、`text-shadow: none`。
  - `.tab.active` 的邊框採用 `border: 1px solid var(--border)` 強化輪廓。
- **目的**：避免白字/強陰影在淺色背景上對比不足，確保 WCAG AA。

### 9.7 主題選擇器UI規範
- **控件類型**：下拉選擇框 (select)
- **樣式類別**：`.theme-selector`
- **焦點效果**：2px 主色調外框
- **選項樣式**：使用主題背景和文字顏色

### 9.8 主題一致性與全局覆蓋標準

#### 9.8.1 CSS變數使用強制標準
- **所有UI元素必須使用CSS變數**：禁止硬編碼顏色值
- **強制使用的變數**：
  - 背景：`var(--bg)`, `var(--panel)`, `var(--panel-2)`
  - 文字：`var(--text)`, `var(--muted)`
  - 邊框：`var(--border)`
  - 主色調：`var(--primary)`, `var(--primary-2)`

#### 9.8.2 全局調色檢查清單
針對淺藍色主題等淺色主題的完整性檢查：
- [ ] **主體背景**：使用 `background: linear-gradient(135deg, var(--bg-gradient-1), var(--bg-gradient-2))`
- [ ] **面板背景**：使用 `background: var(--panel)` 或面板漸層變數
- [ ] **所有文字**：使用 `color: var(--text)` 或 `color: var(--muted)`
- [ ] **邊框元素**：使用 `border-color: var(--border)`
- [ ] **按鈕與互動元素**：正確應用主題感知的樣式覆蓋
- [ ] **圖表元素**：使用 `getThemeColors()` 函數動態調整

#### 9.8.3 淺色主題特殊處理標準
- **問題根源**：淺色主題容易出現部分元素未正確套用主題色彩
- **解決方案**：
  1. 審查所有CSS選擇器，確保使用CSS變數而非固定顏色
  2. 為淺色主題專門定義覆蓋規則（如已實現的按鈕和頁籤樣式）
  3. 建立主題覆蓋驗證機制

#### 9.8.4 主題實施品質控制
- **開發階段**：每個新增UI元素必須測試所有7種主題
- **測試標準**：每個主題切換後應呈現完全一致的佈局風格
- **修復原則**：發現不一致時，優先使用CSS變數方案而非硬編碼修復

### 9.9 可用性與無障礙

#### 9.9.1 對比度合規性
- 所有主題符合 WCAG AA 標準
- 文字與背景對比度 ≥ 4.5:1
- 確保視覺障礙用戶的可讀性

#### 9.9.2 用戶體驗
- **平滑過渡**：0.3秒 CSS 過渡動畫
- **狀態保持**：頁面重載時記住主題選擇
- **即時反饋**：主題切換立即生效

### 9.10 實施檢查清單
- [ ] 確保所有UI元素支援主題變數
- [ ] 驗證淺色主題的文字對比度
- [ ] 測試圖表顏色動態更新
- [ ] 檢查主題切換的平滑過渡
- [ ] 確認 localStorage 持久化功能
- [ ] 驗證所有主題的可用性
- [ ] **新增**：淺藍色主題全局調色完整性驗證
- [ ] **新增**：所有主題的一致性覆蓋測試

## 10. 版本記錄

### v1.7 (2025-10-06)
- Add global English-only language policy for this release (UI copy, tooltips, charts, exports, tutorial/quiz). Prohibit mixed-language strings.

### v1.6 (2025-10-02)
- **強化對比度持續監控機制**：新增持續監控與品質控制機制
- 建立按鈕類別對比度規格表，規範所有按鈕類別的標準實施方式
- 新增"7主題測試"強制驗證機制，確保新功能在所有主題下正常顯示
- 完善定期全站對比度審查機制（季度檢查）
- 建立新增按鈕類別的對比度檢查清單

### v1.5 (2025-10-02)
- **建立色彩對比度綁定關係管理原則**：制定主題與按鈕顏色變更的強制對比度調整標準
- 新增完整的對比度管理檢查清單與開發階段必檢項目
- 建立典型錯誤案例與預防措施指南
- 實施主題感知的自動化對比度驗證機制
- 強化WCAG AA標準合規性要求與測試流程

### v1.4 (2025-10-02)
- **統一深色主題標題卡標準**：所有深色主題標題卡使用白色底色 (#ecf0f1)
- 建立標題欄與頁面標題卡統一設計規範
- 新增深色主題標題卡一致性標準與CSS變數規範
- 制定標題卡視覺測試與品質驗證機制
- 確保深色主題間標題卡外觀的完全一致性

### v1.3 (2025-10-02) 
- **解決淺藍色主題全局調色問題**：建立主題一致性與全局覆蓋標準
- 新增CSS變數使用強制標準，禁止硬編碼顏色值
- 建立淺色主題特殊處理標準與品質控制機制
- 新增全局調色檢查清單，確保所有主題的完整性
- 制定主題實施品質控制流程

### v1.2 (2025-10-02)
- 新增多主題色系切換功能（7種主題）
- 實施動態配色系統與CSS變數架構
- 優化淺色主題的文字對比度標準
- 建立主題感知的圖表顏色同步機制
- 添加Distribution Types按鈕狀態色彩管理（active/inactive）
- 實現主題選擇的本地存儲持久化

### v1.1 (2025-10-02)
- 移動教學按鈕到左側參數功能區
- 移除無效的 Glass Style 控制項
- 優化UI佈局平衡性

### v1.0 (2025-10-02)
- 建立液態玻璃按鈕設計規範
- 定義文字對比度標準
- 新增導航標籤優化規範
- 制定 Distribution Types 按鈕專用規範

---

*本規範適用於所有新增的UI元素，除非有特殊需求另行標註。*
 
## 12.6 左側側欄分頁（2025-10-08）

- 導航分頁改為左側垂直排列的側欄（`sidebar`）。
- 側欄寬度：260px，分頁按鈕（`.tab`）需 `width: 100%`、文字置中、不可換行。
- 主內容容器（`.pages`）寬度需維持原設計（參數功能區 + 圖表區總寬不變），透過擴大外層容器寬度（`app.max-width = 原設計寬 + 側欄寬 + 間距`）來騰出額外空間給側欄，避免擠壓主內容。
- 與圖表區上邊框對齊：左側第一個分頁按鈕的上緣需與右側圖表卡片（`.chart-card`）的上邊框對齊；可用側欄的 `margin-top` 做微調（允許 px 級微調）。

### 12.6.1 分頁按鈕排序（由上而下）
1. Probability Distribution
2. AQL Plan Table Lookup
3. Reverse Sampling Query
4. C=0 Plan Table Lookup
5. AQL-LTPD Balanced Plan
6. Multiple Plan Comparison（置底）

## 12.7 分頁按鈕尺寸與圓角（2025-10-09 更新）

- 所有按鈕高度與輸入框一致：基礎 `.btn` 內距統一為 `10px 12px`（提升可讀性且與 `Parameters` 控制一致）。
- 分頁按鈕 `.tab` 內距維持 `15px 18px`（側欄導覽需要較大熱區）。
- 圓角統一為「略帶圓角」：`.btn`、`.tab` 的 `border-radius` 一律為 `8px`。
- Hover 與 Active 狀態一致性：`.tab.active:hover` 必須套用與 `.tab:hover` 相同的動態效果（位移、縮放、陰影、掃光）。

## 12.8 圖表區長寬比（2025-10-08）

- 圖表區總高度維持不變（由 `--chart-h` 或容器高度控制）。
- 長寬比固定為 4:3：以固定高度為基準由寬度自動計算，兩側多餘空間不強制填滿，置中顯示。
- 實作建議：
  - 容器 `.chart` 設定 `height: 100%`、`aspect-ratio: 4 / 3`、`width: auto`、`max-width: 100%`、`margin: 0 auto`。
  - 內部 `canvas` 維持 `width: 100%`、`height: 100%`，並在 Chart.js 設定 `maintainAspectRatio: false`，由 CSS 控制視覺比例。

### 12.8.1 圖表動畫一致性（2025-10-08）
- 全站 Chart.js 預設禁用動畫：`animation: false`。
- 目的：提升回應速度、避免各頁不一致的進場動畫。

### 12.8.2 圖表顏色綁定與主題一致性（2025-10-08 新增）
- **強制綁定**：所有圖表必須使用主題色彩函數 `getThemeColors()` 綁定以下屬性：
  - **圖例文字**：`plugins.legend.labels.color = colors.text`
  - **X/Y 網格線**：`scales.[x|y].grid.color = colors.grid`
  - **X/Y 標題文字**：`scales.[x|y].title.color = colors.text`
  - **X/Y 刻度文字**：`scales.[x|y].ticks.color = colors.text`
  - **X/Y 座標軸邊框**：`scales.[x|y].border.color = colors.grid`
- **動態更新**：主題切換時，`updateChartColors()` 必須同步更新以上 4 類屬性並 `chart.update()`。
- **輸出圖一致性**：匯出 PNG 時，需以統一的深色主題背景與文字色生成，確保所有主題下匯出圖片的一致性。

#### 12.8.2.1 實施檢查清單
- [ ] 各頁面 `new Chart(..., options)` 皆設定標題、刻度、網格、座標軸邊框與圖例之顏色綁定
- [ ] `updateChartColors()` 同步更新圖例、網格、座標軸邊框、標題與刻度文字顏色
- [ ] 匯出功能（高解析）沿用 `getThemeColors()` 配色

### 12.8.3 主題更新覆蓋範圍（2025-10-08 新增）
- **規範**：主題更新函式必須同時覆蓋所有頁面已存在的圖表實例（如：`ocChart`, `planChart`, `revChart`, `ssChart`, `c0Chart`, `aqlLtpdChart`）。
- **原因**：若有任一圖表未被更新，切換淺色/深色主題時就會出現某些頁面修好、另一些頁面又出現回歸的現象。
- **檢查**：切換到每種主題（7 種），逐頁確認座標軸邊框、網格、刻度、標題、圖例顏色一致。

### 12.8.4 匯出圖片顏色統一標準（2025-10-10 新增）
- **規範**：所有匯出的 PNG 圖片必須使用統一的深色主題顏色，確保在不同主題下匯出的圖片外觀一致。
- **實現**：`getExportThemeColors()` 函數不再根據當前主題動態調整顏色，而是固定返回深色主題顏色：
  - **文字顏色**：`#e6e9ee`（淺色文字）
  - **網格線顏色**：`rgba(199,202,207,0.4)`（可見網格線）
  - **背景顏色**：根據當前主題動態調整
- **目的**：確保匯出的圖片在所有主題下都具有良好的可讀性和一致的外觀。

### 12.8.5 圖表顏色函數統一標準（2025-01-09 新增）
- **問題**：Dark Blue 主題中圖表網格與文字顏色在不同頁面有深淺不一的情況
- **原因**：圖表初始化時使用 `getThemeColors()`（較暗），主題切換時使用 `getEnhancedThemeColors()`（較亮）
- **解決方案**：統一所有圖表使用 `getEnhancedThemeColors()` 函數
- **影響範圍**：
  - 圖例文字顏色：`plugins.legend.labels.color`
  - 軸標題顏色：`scales.[x|y].title.color`
  - 網格線顏色：`scales.[x|y].grid.color`
  - 刻度標籤顏色：`scales.[x|y].ticks.color`
  - 軸邊框顏色：`scales.[x|y].border.color`
- **修改頁面**：
  - Probability Distribution
  - AQL Plan Table Lookup
  - Reverse Sampling Query
  - C=0 Plan Table Lookup
  - AQL-LTPD Balanced Plan
  - Multiple Plan Comparison
- **顏色對比**：
  - `getThemeColors()`：text `#c7cacf`，grid `rgba(199,202,207,0.22)`
  - `getEnhancedThemeColors()`：text `#e6e9ee`，grid `rgba(199,202,207,0.4)`

## 12.9 文字與換行規範（2025-10-08）

- 分頁按鈕與一般按鈕文字一律不換行：`white-space: nowrap;`，必要時使用 `text-overflow: ellipsis`。
- 左側分頁按鈕需加寬以保證標籤文字橫向置中且不換行。

### v1.8 (2025-10-08)
- 新增：左側側欄分頁（垂直排列），主內容寬度維持不變，外層容器擴寬以容納側欄。
- 新增：圖表區固定高度、以 4:3 長寬比調整寬度並置中顯示。
- 調整：所有按鈕高度提升約 1.5 倍，圓角縮小為 8px。
- 修正：`active` 分頁的 hover 動畫與其他分頁一致（效果統一）。

### v1.9 (2025-10-09)
- 將 `.btn` 內距統一為 `10px 12px`，使 `Actions` 區塊按鈕高度與 `Parameters` 區塊控制項一致。
- 保留 `.tab` 較大的內距以維持側欄導覽可觸性。

## 12.10 匯出按鈕放置標準（2025-10-08）

- 匯出（PNG、CSV）按鈕僅放置於圖表卡右上角的工具列（`.chart-toolbar`）。
- 左側參數面板不重複呈現匯出按鈕；若有歷史遺留，應移除，事件綁定集中在工具列按鈕。
- 目的：避免重複功能、減少混淆，並維持統一的操作位置。

## 12.11 Help 按鈕與使用說明模態視窗（2025-10-09）

- 按鈕文字：`Help`
- 位置：每個頁面的圖表卡右上角工具列（`.chart-toolbar`），置於匯出按鈕之後；與匯出按鈕同層級。
- 行為：點擊開啟統一的使用說明模態（頁面情境化內容）。
- 內容分頁（固定四個 Tab）：`Overview`、`Inputs`、`Outputs & Charts`、`When to Use`。
- 可及性：`title="Usage Help"` 或等效 `aria-label`，支援鍵盤關閉（Esc）與背景遮罩點擊關閉。

### 設計原則
- 按鈕樣式沿用 `.btn`，符合現有主題文字對比度規範。