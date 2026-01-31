## C=0 Plan Table Lookup — Page Requirements (v2)

Purpose: Provide zero-acceptance (C=0) sampling plan lookup and visualization. Users input lot size and target AQL to obtain the recommended sample size n with c=0, OR input sample size to find the corresponding AQL (Reverse Lookup). Users can then view the corresponding OC curve and export results.

### 1) Data source
- File: `master tables/c=0 table.js`
- Table symbol: `C0_SAMPLING_TABLE` — array of entries:
  - `lot_range`: [min, max] (max can be `Infinity`)
  - `samples`: map<string AQL, number|null> where null means not available
- Helper functions available globally when loaded:
  - `lookupC0SampleSize(lotSize:number, aqlLevel:number|string): number|null`
  - `isC0LotSizeValid(lotSize:number|string): boolean`

### 2) Inputs (Left panel)
- **Lookup Mode** (New): Radio buttons to toggle between:
  - **Find Sample Size (n)** (Default)
  - **Find AQL** (Reverse Lookup)
- Lot Size (`#c0_lot_size`): number, > 0
- **Find Sample Size Mode**:
  - AQL (`#c0_aql`): select with options built from the union of all `samples` keys across the table, sorted numerically (e.g., 0.010, 0.015, …, 10.0). Also allow a custom numeric input `#c0_aql_custom` that activates when “Custom” is selected.
- **Find AQL Mode**:
  - Sample Size (`#c0_input_n`): Dropdown menu populated dynamically with valid sample sizes from the table for the current Lot Size.
- Distribution (`#c0_dist_select`): select with options `Hypergeometric (default)`, `Binomial`, `Poisson` (for OC computation). Default to Hypergeometric when N is finite.
- Actions:
  - Lookup Plan (`#c0_lookup_btn`)
  - Clear (`#c0_clear_btn`)
- Export Options: Export PNG (`#c0_export_png`) and Export CSV (`#c0_export_csv`) mirroring global toolbar actions.

### 3) Derived outputs (Left panel → Results block)
- Sample Size n (`#c0_result_n`): integer from lookup or computed fallback
- Acceptance Number c (`#c0_result_c`): always 0 for C=0 plan
- AQL used (`#c0_result_aql`): normalized numeric value used for lookup (or found via reverse lookup)
- Lot range hit (`#c0_result_lot_range`): the entry range where the lot falls
- LQ at Pa=10% (`#c0_result_lq10`): optional computed characteristic; solve for p where Pa = 0.10 using selected distribution with c=0, n as above, N as entered

### 4) Lookup rules
1. Validate lot size via `isC0LotSizeValid`; show inline error if invalid.
2. **If Find Sample Size Mode**:
   - Determine effective AQL value (Select or Custom).
   - Execute `lookupC0SampleSize(lotSize, aql)`:
     - If table contains the lot range and exact AQL key → use that value
     - Else fallback uses formula `round(max(1, lot * aql / 100))` (per helper)
   - Set `n` to result.
3. **If Find AQL Mode**:
   - Get selected Sample Size `n` from dropdown.
   - Search `C0_SAMPLING_TABLE` for the entry matching `lotSize`.
   - Iterate through `samples` in that entry to find the AQL key where the value equals `n`.
   - If found, set `AQL` to that key.
   - If not found (should not happen with dropdown), show error.
4. Set `c=0`.

Edge notes:
- If lookup returns `null` (no data and formula yields invalid), block chart generation and show message.
- AQL display preserves three-decimal formatting where applicable.

### 5) Chart behavior (Right panel)
- Canvas: reuse global `#ocChart` within this section.
- X-axis: Defect Rate (p%) from 0 to `#x_max` (default 5%).
- Y-axis: Acceptance Probability (Pa) 0–1; display as percent ticks.
- Data: single OC curve for the active C=0 plan:
  - Hypergeometric: `Pa = P(X ≤ 0)` for `X ~ Hypergeom(N, K=round(N*p), n)`
  - Binomial: `Pa = (1 - p)^n`
  - Poisson: `Pa = e^{-n p}`
- Series label: `C=0 Plan (n={n}, c=0, AQL={aql}, N={N})`
- Color: use existing theme defaults; no multi-plan overlay on this page.

#### 5.1 Cursor interactions (New 2025-10)
- Dual cursors:
  - Cursor A (Crosshair): shows reference lines and a floating label `p=XX% , Pa=YY%`
  - Cursor B (Tooltip): near points, shows `p=XX% , Pa=YY%`
- Scope: crosshair is instance‑scoped to this chart only.

### 6) Interactions
- **Mode Switching**: Toggles visibility of AQL inputs vs Sample Size dropdown.
- **Dynamic Dropdown**: In "Find AQL" mode, changing Lot Size updates the Sample Size dropdown options.
- Clicking Lookup:
  - Validates inputs, performs lookup (forward or reverse), updates Results block
  - Draws/updates the OC curve using chosen distribution
- Changing Lot Size, AQL, Distribution, or X-max should update the chart only after a successful Lookup.
- Clear: resets inputs to defaults (Find Sample Size mode) and clears results/curve.

### 7) Export
- PNG/CSV actions mirror the Distribution page behavior but export only the current single C=0 curve.
- CSV headers: `x_defect_rate_percent, y_acceptance_prob, n, c, N, AQL, distribution`.

### 8) Defaults (Updated 2025-10-08)
- Lot Size default: 500
- AQL default: prefer 0.4 when present (numeric match across string keys like '0.40'); else 1.0; else first available key
- Distribution default: Hypergeometric
- X-max default: 5%

### 9) Validation & messaging
- Inline error under fields when invalid; disable Lookup when invalid.
- When using fallback (non-exact table key), show subtle note: “Computed by formula, not an exact table value.”
 - AQL keys in the table can differ by string formatting (e.g., '0.4' vs '0.40'); when choosing defaults or executing lookup, match numerically to avoid format mismatch.

### 10) Performance
- Lookup and rendering are O(1)/O(m) over p-grid; p step uses existing global step (0.05%).

### 11) Accessibility & i18n
- Labels in English with room for Traditional Chinese translations; keep IDs stable.
- Buttons use the project’s glass button style.
