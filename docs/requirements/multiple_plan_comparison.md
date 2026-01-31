## Multiple Plan Comparison — 功能與邏輯需求

本頁用於新增多組抽樣計畫並同圖比較其 OC 曲線，支援對每個計畫設定 `n`、`c`、可選的 `AQL(%)` 與自訂 `label`，並在圖上以散點與標籤標出 AQL 對應的 Pa 值。

### 1) 參數與名詞
- n: 抽樣樣本數 (Sample Size)
- c: 可接受不良數 (Acceptance Number)
- AQL(%): 於該不良率 p=AQL/100 處，計算 Pa；可留空代表不標記 AQL 點
- Plan Label: 計畫顯示名稱（缺省為 `Plan 1`, `Plan 2`, …）
- Distribution: 比較畫面以 Binomial 為主；若計畫帶有 `N` 並指定分配為 Hypergeometric，則以 Hypergeometric 計算；如指定 Poisson 則以 Poisson 計算

### 2) 使用者互動
- 左側控制區
  - 輸入框：`plan_n_input`, `plan_c_input`, `plan_aql_input`, `plan_label_input`
  - 主要按鈕：`add-plan-btn` 新增計畫；`clear-all-btn` 清除全部
  - 清單：`plan-list` 顯示已加入的計畫，每列顯示 `label, n, c, AQL` 與刪除按鈕（`×`）
  - X 軸最大值：`plan_x_axis_max_input`（單位 %）
- 互動行為
  - 按下 Add Plan 後，將當前輸入以顏色循環加入 `samplingPlans` 陣列，並立即重繪圖表
  - 點擊清單中的 `×` 刪除對應計畫，並重繪
  - 點擊 Clear All 清空 `samplingPlans` 並重繪
  - 調整 X 軸最大值時即時重繪

### 3) 驗證與限制
- `n > 0`、`c ≥ 0`、`n ≥ c`
- `AQL` 留空表示不設定；若提供，需 `AQL ≥ 0` 且可解析為數字
- label 可留空，系統自動補上 `Plan i`

### 4) 計算模型（OC 曲線）
- 共同：產生 p 值序列 `pValues = [0, step, 2·step, …, xMax%/100]`，舊版 step=0.0005（0.05%）
- Binomial：`Pa = CDF_binom(c; n, p)`
- Poisson：`Pa = CDF_pois(c; λ=n·p)`
- Hypergeometric（當計畫包含 `N` 且 `distType='Hypergeometric'`）：`Pa = CDF_hyper(c; N, K, n)`，其中 `K=round(N·p)`；需檢查非法區（如 `n>N`）時回傳 `NaN`

### 5) 繪圖規格
- 每個計畫一條折線：
  - label 來自 plan.label
  - 線色 `plan.color`（循環調色盤）、`backgroundColor = color(0.2–0.35)`、`borderWidth=2`、`pointRadius=0`、`tension=0.1`
- AQL 標記（可選）：
  - 若 `plan.aql != null`，計算 `Pa(aql)` 並在該點以散點標出（半透明底色、白色描邊、radius≈6）
  - 加上文字標籤註解：`{label} ({AQL%}, {Pa%})`，位置位於點的上方（yAdjust）
- X 軸：`[0, xMax%]`；Y 軸：`[0, 1]`，以百分比刻度顯示
- 標題：`Comparison of Sampling Plans`
- 右上角資訊浮層（自訂 plugin）：列出 `label: [AQL=??% ,] n=?, c=?`（以該計畫顏色繪製文字）

### 6) 資料結構
- `samplingPlans: Array<{ n: number, c: number, aql: number|null, label: string, color: string, distType?: 'Binomial'|'Poisson'|'Hypergeometric', N?: number, source?: string, paAql?: number, paLtpd?: number, actualAlpha?: number, actualBeta?: number }>`
- 新增時 `aql` 以 `AQL_input/100` 儲存；留空為 `null`
- 顏色由固定調色盤依序分配（循環）
- 效率計算數據（NEW）：
  - `paAql`: AQL點的允收機率
  - `paLtpd`: LTPD點的允收機率
  - `actualAlpha`: 實際生產者風險
  - `actualBeta`: 實際消費者風險
  - `source`: 計畫來源（'aql_ltpd', 'reverse', 'c0', 'aql', 'manual'）

### 7) 流程
1. 使用者輸入 n/c/AQL/label → 按 `Add Plan`
2. 檢核通過 → push 至 `samplingPlans` → `updatePlanComparisonChart()`
3. `updatePlanComparisonChart()`：
   - 設定 xMax
   - 產生 `pValues`
   - 針對每個 plan 以所選分配（預設 Binomial）產生資料集，push 到 `ocChart.data.datasets`
   - 若有 AQL → push 對應散點 dataset 並加入對應 label 註解
   - 更新 annotation、更新 plan 清單檢視
4. 刪除或清除 → 更新圖表與清單

### 8) 匯出
- PNG：使用 Chart.js 內建 API 轉為圖片下載
- CSV：輸出表頭 `label,x_defect_rate_percent,y_acceptance_prob`
  - 逐一展開所有計畫的資料集列入 CSV（或僅輸出目前可見範圍）

### 9) UX 與可用性
- 各輸入有即時驗證與錯誤提示（alert 或錯誤訊息區）
- 顏色穩定循環；刪除項目後顏色不重排（保持對應）
- X 軸最大值調整應即時反映於曲線與 AQL 散點與標籤位置
- 在切換頁籤回到本頁時，若已有 `samplingPlans`，應保持既有曲線而不清空

### 10) 邊界情況
- Hypergeometric 計算需避免非法組合（例如 `n>N`、`K> N`、`c>n` 等），遇到時資料點回傳 `NaN` 以避免干擾圖表
- 當 `AQL% > xMax%` 時，AQL 散點與標籤不繪出（或延後至擴大 X 軸時再繪）
- 計畫數量過多時，建議限制同時顯示的資料集數量或採用更細的顏色/線型區分


### 11) 近期事故 RCA 與預防措施（2025-10）
根因分析（Root Cause）
- 內嵌腳本於「Multiple Plan Comparison」初始化區塊中使用了可選鏈結、箭頭函式與深巢狀行內物件，部分執行環境（或在語法錯誤被截斷時）在解析物件結構與括號結束處發生 `Unexpected token )`，導致整段腳本停止，進而使頁籤切換無效。

預防措施
- 事件註冊與函式宣告：以傳統 `function` 取代箭頭函式；新增 DOM 存在性檢查再綁定監聽。
- 物件組裝：將 Chart.js 的 `options/plugins/scales` 等巢狀物件拆為多個中間變數再傳入，避免行內大量括號與逗號造成定位困難的語法錯誤。
- 可選鏈結替代：避免在關鍵初始化（canvas context、事件註冊）使用可選鏈結，改為顯式判斷 null/undefined。
- 分頁防呆：頁籤切換時先移除所有 `active`，再根據 `data-target` 查得節點後才加上 `active`，找不到節點時直接 `return` 並 `console.warn`，避免拋錯中斷。
- 一致性檢查：於本頁與各子頁新增最小運作路徑（無跨頁資料也可正常運作），跨頁功能缺失不應影響本頁基本操作。

要求（Engineering Policy）
- 內嵌腳本一律採「保守語法」：不使用可選鏈結與箭頭函式；深巢狀物件需拆解；任何跨頁依賴需具備空值容忍與後援路徑。
- 新功能提交需在最新 Chrome 與一個退一步的環境（或啟用較嚴格的打包/轉譯設定）各做一次手動冒煙測試（含頁籤切換）。

### 12) 跨頁匯出/匯入（與一鍵比較）
目標
- 在 `Reverse Sampling Query`、`AQL Plan Table Lookup`、`C=0 Plan Table Lookup` 三頁提供「匯出至 Multiple Plan Comparison」按鈕，將目前計畫參數佇列（queue）至全域。
- 在 `Multiple Plan Comparison` 頁：
  - 已移除「Import From Pages」機制；本頁採「自建輸入」為主，跨頁匯入暫不提供

資料結構
- 全域佇列：`window.planComparisonQueue: Array<{ n: number, c: number, aql: number|null, label: string }>`
  - 來源頁若有 `N` 與分配型態，後續可擴充 `{ distType?: 'Binomial'|'Poisson'|'Hypergeometric', N?: number }`

互動規格
- 三個來源頁在成功得到目前的計畫（有 `n` 與 `c`，`aql` 可為 `null`）後，匯出按鈕可將資訊交由使用者自行記錄（暫不自動匯入）。
- `Multiple Plan Comparison` 僅接受頁內新增的計畫；不再提供跨頁自動匯入/手動匯入。

### 13) 圖表互動（更新 2025-10）
- 本頁圖表採用「雙游標」設計：
  - 游標A（Crosshair 視覺輔助）：顯示垂直/水平虛線與隨滑鼠移動的數值框
  - 游標B（Chart.js Tooltip）：靠近實際資料點時顯示該點標籤
- 數值與單位規則（依曲線類型動態切換）：
  - OC：`p=XX% , Pa=YY%`
  - AOQ：`p=XX% , AOQ=YY%`
  - ATI：`p=XX% , ATI=ZZ`（ZZ 為整數，無百分比）
- 技術要求：Crosshair 為「實例範圍」插件（instance‑scoped），僅掛載於本頁圖表，避免外溢至其他頁面。
- AQL 散點顯示規則：
  - OC：可顯示 AQL 散點，tooltip 內容為 `AQL: p=XX% , Pa=YY%`
  - AOQ/ATI：AQL 散點改以對應量測值顯示（AOQ 或 ATI），並於 tooltip 套用正確標籤與單位。

### 14) 匯出圖檔（新增要求）
- 支援高解析度匯出：
  - 目標 4K（寬度 3840px，高度依圖表比例），但避免檔案過大
  - 優先提供 WebP（如瀏覽器支援）並以中等壓縮品質輸出（建議 0.85），PNG 作為備援
  - 各頁面 Export PNG/Data 的設計，圖像匯出需可指定縮放倍率（如 2x、3x、4x）或目標像素大小

### 15) 新增：跨頁佇列匯入（2025-10）
- 本頁新增「Import from pages」按鈕，從 `window.planComparisonQueue` 匯入由其他頁面（Reverse/AQL/C=0）匯出的計畫。
- 佇列結構：`Array<{ n:number, c:number, aql:number|null, label:string }>`（後續可擴充 `distType` 與 `N`）。
- 匯入行為：
  - 逐筆檢核 `n>0, c>=0, n>=c`，将有效項目加入 `samplingPlans`，自動套用循環色彩並重繪。
  - 匯入完成後清空佇列並提示「Imported X plan(s).」。

### 16) 新增：匯出圖檔品質與版面（2025-10）
- 匯出格式：強制 PNG（與舊版一致）。
- 解析度：以離屏畫布（offscreen canvas）建立暫時 Chart.js 實例輸出，高解析倍率預設 3x（可調整到 4x）。
- 字體/線寬尺度：依倍率等比例放大 legend/ticks/title 字體、`elements.line.borderWidth` 與 `elements.point.radius`，保持 UI 視覺比例。
- 背景：在暫時圖表上以 `beforeDraw` 插件於整張畫布先填滿 UI 背景色（`--panel-2`），避免透明或邊緣殘缺。
- 框距：匯出時以 `layout.padding≈5%` 增加四邊留白，避免線框緊貼邊緣。
- 效能：使用 `toBlob` 非阻塞下載，避免長時間佔用主緒；必要時回退 `toDataURL`。

### 17) 新增：初始化網格可見性（2025-10）
- 在建立圖表前即設定 X 軸 `max` 為 UI 輸入的初始值，確保第一次 render 就有完整座標域，網格立即可見。

### 18) 近期匯出相關 RCA 與預防（2025-10）
- 現象一：`chart.js:13 t.startsWith is not a function`
  - 原因：呼叫 `toBase64Image(type, quality)` 等參數化路徑在某些版本會觸發內部對型別假設；
  - 預防：改用無參數 `toBase64Image()` 或 `canvas.toDataURL('image/png')` 後援；最佳路徑為 `canvas.toBlob()`。
- 現象二：`Maximum call stack size exceeded`
  - 原因：直接深拷貝 live chart 的 `data/options/plugins` 造成循環或巨大物件；
  - 預防：以「最小資料結構」重建 datasets/options，不克隆 Chart 實例或函式；關閉 `responsive/animation`，`devicePixelRatio=1`。
- 現象三：`[Violation] 'click' handler took >1s`
  - 原因：在主緒放大重繪 live chart 再導出；
  - 預防：改於離屏畫布建立暫時圖表並以 `toBlob` 非同步導出。
- 現象四：匯出背景未完全覆蓋
  - 原因：僅填 chartArea 或縮放後產生 DPR 縫隙；
  - 預防：在 `beforeDraw` 以整張畫布填底色，並將暫時圖表 `devicePixelRatio=1` 一致化。

### 19) 版本相容性（2025-10）
- 本專案釘選 Chart.js 3.9.1（與舊版行為相容）；如需升級至 v4/v5，匯出流程仍需維持「離屏 + 最小資料結構」的策略並重新驗證。

### 20) 計畫效率分析功能移除（2025-01）
#### 20.1 功能移除說明
- **移除原因**：為簡化比較頁面功能，專注於OC曲線比較
- **移除內容**：
  - Plan Efficiency Analysis 面板
  - 效率比較表格 (`#plan-efficiency-comparison`)
  - 最佳計畫推薦 (`#plan-recommendation`)
  - 相關JavaScript函數：
    - `calculatePlanEfficiencyForComparison()`
    - `calculateDiscriminationPower()`
    - `calculateRiskBalance()`
    - `updatePlanEfficiencyComparison()`

#### 20.2 保留功能
- **AQL-LTPD頁面效率分析**：保持獨立頁面的效率計算功能
- **OC曲線比較**：維持多計畫OC曲線視覺化比較
- **基本計畫管理**：新增、刪除、清除計畫功能

#### 20.3 影響範圍
- **UI變更**：移除左側效率分析面板
- **功能簡化**：專注於OC曲線比較，減少複雜度
- **效能提升**：移除效率計算，提升頁面響應速度

### 21) 新增：AOQ與ATI曲線功能（2025-01）
#### 21.1 功能概述
- **新增按鈕**：在Actions面板中新增三個曲線類型按鈕
  - "Show OC Curves" - 顯示操作特性曲線（預設）
  - "Show AOQ Curves" - 顯示平均出廠品質曲線
  - "Show ATI Curves" - 顯示平均總檢驗數曲線

#### 21.2 AOQ曲線功能
- **計算公式**：AOQ = p × Pa × (N-n)/N
  - p: 不良率
  - Pa: 允收機率
  - N: 批次大小
  - n: 樣本數
- **顯示特性**：
  - Y軸標籤：Average Outgoing Quality (AOQ%)
  - 數值格式：百分比顯示（小數點後2位）
  - 曲線標籤：計畫名稱 + " (AOQ)"

#### 21.3 ATI曲線功能
- **計算公式**：ATI = n + (1-Pa) × (N-n)
  - n: 樣本數
  - Pa: 允收機率
  - N: 批次大小
- **顯示特性**：
  - Y軸標籤：Average Total Inspection (ATI)
  - 數值格式：整數顯示
  - 曲線標籤：計畫名稱 + " (ATI)"

#### 21.4 技術實現
- **函數修改**：`updatePlanChart(curveType)` 支援三種曲線類型
- **按鈕狀態管理**：`updateCurveButtons(activeType)` 管理按鈕激活狀態
- **動態Y軸**：根據曲線類型自動調整Y軸標籤和數值格式
- **AQL標記**：僅在OC曲線中顯示AQL散點標記

#### 21.5 使用流程
1. 新增一個或多個抽樣計畫
2. 點擊對應的曲線類型按鈕
3. 圖表自動更新顯示相應的曲線
4. 按鈕狀態會反映當前顯示的曲線類型
5. 支援匯出PNG和CSV格式

#### 21.6 應用場景
- **AOQ曲線**：評估不同計畫的品質保護能力
- **ATI曲線**：比較不同計畫的檢驗成本
- **綜合分析**：結合OC、AOQ、ATI曲線進行全面評估

### 22) 教學系統整合（2025-01）
#### 22.1 教學內容更新
- **新增教學步驟**：
  - "📈 Advanced Curve Analysis: AOQ & ATI" - 進階曲線分析教學
  - "⚖️ AQL-LTPD Balanced Plans" - 平衡計畫優化教學
- **測驗題庫擴充**：新增15題涵蓋AOQ、ATI、AQL-LTPD功能
- **總題庫數量**：67題（原52題 + 新增15題）

#### 22.2 教學內容完整性
- **基礎概念**：統計抽樣、OC曲線、機率分佈
- **工具操作**：各頁面功能使用指導
- **進階功能**：AOQ/ATI曲線、AQL-LTPD優化
- **實務應用**：綜合分析和最佳化策略

### 23) 技術改進與優化（2025-01）
#### 23.1 曲線類型持久化
- **問題解決**：修正max defect rate更新時曲線類型跳轉問題
- **技術實現**：新增`currentCurveType`狀態追蹤
- **影響範圍**：所有圖表更新操作保持當前曲線類型

#### 23.2 動態Y軸範圍
- **AOQ曲線**：自動計算最大AOQ值並設定Y軸範圍
- **ATI曲線**：自動計算最大ATI值並設定Y軸範圍
- **實現方式**：動態計算所有數據點的最大值，設定為110%以提供視覺緩衝

#### 23.3 Tooltip優化
- **智能格式化**：根據曲線類型顯示正確的數值格式
- **OC曲線**：顯示百分比格式（如：95.0%）
- **AOQ曲線**：顯示百分比格式（如：2.50%）
- **ATI曲線**：顯示整數格式（如：150）

### 24) 用戶體驗改進（2025-01）
#### 24.1 按鈕狀態管理
- **視覺反饋**：當前激活的曲線類型按鈕會高亮顯示
- **狀態同步**：按鈕狀態與圖表顯示保持一致
- **操作直觀**：用戶可以清楚知道當前查看的曲線類型

#### 24.2 錯誤處理
- **空計畫檢查**：切換曲線類型前檢查是否有計畫存在
- **用戶提示**：提供清晰的錯誤訊息和操作指導
- **優雅降級**：確保在各種情況下系統都能正常運作

### 25) 效能優化（2025-01）
#### 25.1 計算效率
- **動態範圍計算**：只在AOQ和ATI模式下進行額外計算
- **記憶體管理**：避免重複計算和記憶體洩漏
- **渲染優化**：減少不必要的圖表重繪

#### 25.2 響應性改進
- **即時更新**：參數變更時立即反映在圖表上
- **狀態保持**：切換頁面後返回時保持之前的設定
- **載入優化**：減少初始載入時間和資源消耗


