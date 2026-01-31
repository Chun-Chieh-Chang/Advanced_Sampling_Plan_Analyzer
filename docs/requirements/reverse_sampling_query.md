## Reverse Sampling Query — 功能與邏輯需求

本頁用於「反向求解」抽樣計畫參數：在固定其中三個參數與一個目標接受機率條件（通常於 AQL 處的 Pa）時，計算剩餘的那一個參數，並繪製對應的 OC 曲線以視覺驗證。

### 1) 名詞與符號
- N: 批量大小 (Lot Size)
- n: 抽樣樣本數 (Sample Size)
- c: 可接受不良數 (Acceptance Number)
- AQL (%): 以百分比表示的不良率 p（AQL 只是一個命名位置點，用來指定在哪個 p 上檢視 Pa）
- p: 缺陷率（0–1，等於 AQL/100）
- Pa: 接受機率 P(接受批，X ≤ c)
- 分配 (Distribution): Hypergeometric / Binomial / Poisson

### 2) 使用者輸入與互動
- 基本輸入
  - N、n、c、AQL (%)
  - 目標接受機率（Target Pa at AQL，百分比，預設 95%，可調整）
  - 分配選擇：`hyper | binom | pois`
  - 反向求解目標：`aql | c | n | N | targetPa`
- 操作
  - Calculate Plan：執行反向求解並更新結果與圖表
  - Clear：恢復預設值並清空結果與圖表
- 結果顯示（資訊行）
  - 移除左側 Results 區塊，改在 Actions 下方顯示近似解資訊：Plan1/Plan2 兩行（含參數值、Pa、分配全名）
  - Plan1/Plan2 可點擊切換圖表採用的方案（鍵盤 Enter/Space 亦可）
- 圖表與匯出
  - 右上角「Defect Rate Max (%)」控制 X 軸最大值
  - Export PNG / Export Data（CSV）

### 3) 驗證與限制規則
- 一般驗證
  - N>0（除非目標為 N 才允許輸入的 N 缺省）
  - n>0、c≥0、AQL>0（除非該參數為求解目標）
  - 目標 Pa 需在 (0,1)（輸入為百分比，轉換後除以 100）
- 分配差異
  - Hypergeometric：依賴 N（有限母體），適用於解 N
  - Binomial / Poisson：不依賴 N（或僅間接），因此「解 N」不適用；嘗試時需回報錯誤或提示

### 4) 機率模型（Pa 計算）
令 p=AQL/100、X 為樣本內不良數：
- Binomial：X ~ Binom(n, p)，Pa = P(X ≤ c) = CDF_binom(c; n, p)
- Poisson：X ~ Pois(λ=n·p)，Pa = P(X ≤ c) = CDF_pois(c; λ)
- Hypergeometric：X ~ Hypergeom(N, m, n)，m ≈ round(N·p)，Pa = P(X ≤ c) = CDF_hyper(c; N, m, n)

實作上使用對應統計套件之 CDF 函式計算（如 jStat）。

### 5) 反向求解演算法
以「在 AQL 指定的不良率 p 上，讓 Pa 接近使用者設定之目標 Pa」為原則。

5.1 解 AQL（已知 N、n、c）：
- 對 p∈(0,1) 進行二分搜尋，目標使 CDF(c; N,n,p) ≈ targetPa
- 收歛後回傳 AQL% = 100·p

5.2 解 c（已知 N、n、AQL）：
- 令 p=AQL/100
- 逐一尋找整數 c≥0，建立夾點：
  - 下界 lower：Pa < targetPa 的最大 c
  - 上界 upper：Pa ≥ targetPa 的最小 c（若存在）
- 回傳 {lower, upper}，同時提供 Plan1(lower)/Plan2(upper) 顯示；預設採用上界作為繪圖值

5.3 解 n（已知 N、c、AQL）：
- 令 p=AQL/100
- 注意單調性：固定 p、c 時，Pa 隨 n 單調遞減
- 對整數 n 進行夾取 + 二分：
  - 下界 lower：Pa ≥ targetPa 的最大 n
  - 上界 upper：Pa < targetPa 的最小 n
  - 邊界：Hyper 下 1 ≤ n ≤ N；其他分配設合理上界（如 200000）
- 回傳 {lower, upper} 與 Plan1/Plan2，預設採用上界作為繪圖值

5.4 解 N（僅 Hypergeometric 合理；已知 n、c、AQL）：
- 令 p=AQL/100
- 以指數擴張（expansion）尋找上界，再以二分法在 [lower, upper] 內找到最小滿足 Pa ≥ targetPa 的 N
- 回傳 {lower, upper} 與 Plan1/Plan2，預設採用上界作為繪圖值
- 若分配為 Binomial/Poisson，因 N 對 Pa 不具直接影響，需拒絕此操作並提示使用者改用 Hypergeometric

收斂與精度：
- 二分搜尋迭代 40–60 次可達穩定精度（~1e-6 對 p），整數解（c、n、N）以最小滿足 Pa ≥ targetPa 為原則

### 6) 圖表（OC Curve）
- X 軸：不良率（百分比，0 → Xmax）
- Y 軸：Pa（0–1）
- 在求解完成後，以最終的 (N, n, c, AQL, 分配) 參數計算 OC 曲線：
  - 以固定步距（建議 0.05%）產生一組 p 值並計算 Pa
  - 設定 X 軸最大值為「Defect Rate Max (%)」
- 圖例標註：`n=?, c=?, AQL=?, N=?, Distribution=?`
- 若存在 Plan1/Plan2，預設載入 Plan2（上界）；使用者可在 Actions 點選 Plan1/Plan2 即時切換

#### 6.1 游標互動（新增 2025-10）
- 雙游標設計：
  - 游標A（Crosshair）：全區域顯示 x/y 參考線與 `p=XX% , Pa=YY%` 數值框
  - 游標B（Tooltip）：靠近資料點時顯示該點標籤，內容 `p=XX% , Pa=YY%`
- 插件範圍：Crosshair 以圖表實例為範圍（instance‑scoped），不影響其他頁面。

### 7) 匯出
- PNG：將圖表轉為 PNG 檔下載
- CSV：欄位
  - x_defect_rate_percent
  - y_acceptance_prob
  - n, c, N, AQL, distribution, target_Pa

### 8) 錯誤與提示
- 參數非法時給出明確訊息（如「Target Pa must be between 0 and 100.」）
- 嘗試以 Binomial/Poisson 解 N 時，提示「N 僅在 Hypergeometric 下有意義」
- 未能在合理範圍內找到整數解（n/c/N）時，回報無解或顯示目前最佳近似

### 9) UI 行為建議
- 依「反向求解目標」自動禁用對應輸入框以避免混淆
- 被禁用欄位在計算前不顯示值（空白）；計算後填入解並以紅字顯示
- Actions 下方顯示 Plan1/Plan2（可點擊），並以分配全名（Hypergeometric / Binomial / Poisson）呈現
- Clear 重置：N=500、n=125、c=1、AQL=1.0%、Target Pa=95%、分配=Binomial、Xmax=5%

### 10) 非功能性需求
- 不影響其他頁（Distribution、AQL Plan、C=0）的既有功能與代碼
- 計算在前端完成；需避免阻塞 UI（計算量有限情況下可同步）
- 風格與交互遵循統一按鈕與工具列規範（玻璃質感、匯出僅在圖表工具列）

### 11) 新增：Plan1/Plan2 操作與可及性（2025-10）
- 在 Actions 下以兩行顯示下界/上界方案，元素具備 `role=button`、`tabindex=0`，支援 Enter/Space 切換。
- 切換後即時重繪 OC 曲線並以紅字於被求解欄位顯示結果；未計算前該欄位維持空白。

### 12) 新增：匯出（PNG/CSV）一致性（2025-10）
- 僅在右側圖表工具列提供 Export；左側不重複放置。
- PNG 匯出沿用全域高畫質導出策略（離屏 3x、完整背景、5% 留白、等比字體/線寬）。
- CSV 欄位固定為：`x_defect_rate_percent,y_acceptance_prob,n,c,N,AQL,distribution,target_Pa`。

### 13) 風險與預防（2025-10）
- 嘗試在 Binomial/Poisson 下解 N：
  - 風險：給出誤導結果。
  - 預防：在目標為 N 且分配非 Hypergeometric 時直接阻擋並顯示提示訊息。
- Plan1/Plan2 顯示為純文字時無法點擊：
  - 預防：渲染後綁定 click/keydown，並設置 `pointerEvents:auto`、`userSelect:none`。
- 匯出阻塞或堆疊溢位：
  - 預防：採最小資料結構建立暫時圖表，禁用 responsive/animation，`devicePixelRatio=1`，使用 `toBlob` 導出。


