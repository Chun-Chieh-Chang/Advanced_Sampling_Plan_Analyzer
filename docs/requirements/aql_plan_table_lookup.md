## AQL Plan Table Lookup — Page Requirements (v1)

Purpose: Query ANSI/ASQ Z1.4-2003 single-sampling plans by AQL using lot size and inspection level, display the resulting plan (n, c, code letter), and render its OC curve. Exports live only in the chart toolbar.

### 1) Data sources
- `master tables/CodeLetterTable.js` — provides:
  - `codeLetterTable`: mapping from lot size ranges to inspection levels → code letters
  - `sampleSizes`: mapping from code letter → sample size n
  - `rawMasterTableData`: mapping from code letter × AQL → acceptance number c or tightening signals ('up'/'down')
  - `codeLettersOrder`, `aqlLevels`
- Additional tables `normal.js`, `reduced.js`, `tightened.js` are available if we later support switching between inspection states. Initial version targets Normal inspection only.

### 2) Inputs (Left panel)
- Lot Size (`#ss_lot_size`): number, >0
- Inspection Level (`#ss_inspection_level`): select options I, II (default), III and S-1..S-4
- AQL (`#ss_aql`): select from known levels in `aqlLevels` (0.15, 0.40, 0.65, 1.0, 2.5). Optionally allow Custom AQL (`#ss_aql_custom`) for OC curve only when not in the table (displayed as computed, not standard).
- Actions: Lookup Plan (`#ss_lookup_btn`), Clear (`#ss_clear_btn`)

### 3) Results (Left panel)
- Code Letter (`#ss_result_code`)
- Sample Size n (`#ss_result_n`)
- Acceptance No. c (`#ss_result_c`)
- Inspection State (`#ss_result_state`) — "Normal" for v1
- Notes (`#ss_result_note`) — messages like 'up/down' meaning move to tightened/reduced not available in v1, show as advisory only

### 4) Lookup rules (Normal inspection)
1. Find code letter by matching lot size in `codeLetterTable` using selected inspection level.
2. Sample size n = `sampleSizes[codeLetter]`.
3. Acceptance number c = value in `rawMasterTableData[codeLetter][AQL]`:
   - If numeric → use as c
   - If 'up' or 'down' → treat as no numeric c; show in Notes and block OC curve rendering until user switches to an AQL with numeric c.
4. Display results and draw chart if c is numeric.

Edge cases:
- If lot size exceeds last range, use the row with `max: null`.
- If AQL not in table and Custom AQL is given: plan is "non-standard"; compute OC with given n and c derived by nearest AQL having numeric c (or disallow — TBD by user feedback).

### 5) Chart behavior (Right panel)
- Canvas: reuse per-page canvas `#ocChartAQL`.
- Defect Rate X-axis: 0 → `#ss_x_max` (default 5%).
- Y-axis: Acceptance Probability (Pa).
- Distributions:
  - For ANSI/ASQ Z1.4, assume Binomial for large lots. Provide a Distribution select (`#ss_dist_select`: Hypergeometric, Binomial, Poisson). Default Binomial; Hypergeometric uses entered N; Poisson for small p.
- Series label: `AQL Plan (n={n}, c={c}, AQL={aql}, Code={code}, Level={level})`.

#### 5.1 Cursor interactions (New 2025-10)
- Dual cursors:
  - Cursor A (Crosshair): shows reference lines and a floating label `p=XX% , Pa=YY%` across the plot area
  - Cursor B (Tooltip): shows dataset label near actual points with `p=XX% , Pa=YY%`
- Scope: crosshair plugin is attached per-chart (instance‑scoped) to avoid leaking behavior across pages.

### 6) Interactions
- Lookup:
  - Validates inputs, finds code letter, sample size, acceptance number
  - If c numeric → draw OC curve via selected distribution
  - If c is 'up'/'down' → show note and do not draw curve
- Changing fields after Lookup updates chart only after pressing Lookup again (manual mode like C=0). X-max updates chart immediately.
- Clear resets inputs and clears results/curve.

### 7) Export
- Only in chart toolbar: `Export PNG` and `Export Data` (CSV). CSV headers: `x_defect_rate_percent,y_acceptance_prob,n,c,N,AQL,code_letter,inspection_level,distribution`.

### 8) Defaults (Updated 2025-10-08)
- Lot Size: 1000
- Inspection Level: II
- Inspection State: Reduced
- AQL: 0.4 (selected by numeric match; e.g., '0.4' matches option key '0.40')
- Distribution: Binomial
- X-max: 5%

### 9) Validation & messaging
- Numeric validation for lot size; disable Lookup if invalid.
- If AQL yields 'up'/'down', show clear hint in `#ss_result_note` and keep chart empty.
 - AQL option keys can be string-formatted (e.g., '0.40'); when selecting defaults or reading values, treat keys numerically to avoid string-format mismatch.

### 10) Accessibility & styling
- Use the glass button component for actions; inputs match app theme.
- Follow shared rule: exports only in chart toolbar.

### 11) 新增：檢驗狀態與 up/down 解析（2025-10）
- 支援 Normal/Tightened/Reduced 三種狀態，依狀態切換使用對應表格與 code-letter 序。
- 當表中值為 'up'/'down' 時：
  - 在 Notes 顯示對應訊息；
  - 不繪製 OC 曲線，直到選到具數值 c 的 AQL。
- 若 AQL 不在表中且使用自訂 AQL：顯示為「非標準」並仍可繪製 OC（採 `n` 與選擇的 `c`）。

### 12) 新增：匯出（2025-10）
- Export PNG/CSV 僅在右側工具列；CSV 欄位：`x_defect_rate_percent,y_acceptance_prob,n,c,N,AQL,code_letter,inspection_level,distribution`。
- PNG 匯出沿用全域高畫質導出策略（離屏 3x、完整背景、5% 留白、等比字體/線寬）。

### 13) 風險與預防（2025-10）
- 表格鍵值字串型別不一致（如 '0.4' 與 '0.40'）：
  - 預防：組選單時保留原字串鍵，排序採 `parseFloat`，查表時同時嘗試數值等價比對。
- lot size 驗證與範圍落點顯示：
  - 預防：以 `isC0LotSizeValid` 類同方式對輸入作顯性驗證；顯示實際命中的 `lot_range` 供查核。

This spec awaits your confirmation before implementation.


