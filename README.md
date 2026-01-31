# Advanced Sampling Plan Analyzer

A single‑page, front‑end web app for designing, looking up, and visualizing acceptance sampling plans.

### Features & Pages
- **Probability Distribution**: Interactive tool for exploring and comparing different probability distributions used in sampling plans.
- **AQL Plan Table Lookup (ANSI/ASQ Z1.4)**: Query `(n, c, code letter)` by lot size and inspection level. Supports Normal/Reduced/Tightened states and renders the OC curve.
- **Reverse Sampling Query**: Query sampling plan parameters in reverse to find optimal configurations.
- **C=0 Plan Lookup**: Zero‑acceptance plans (`c=0`) with OC curve. Supports Hypergeometric/Binomial/Poisson. Now includes **Reverse Lookup** (find AQL given sample size).
- **AQL–LTPD Balanced Plan**: Satisfy both AQL and LTPD with producer/consumer risk (α, β). The app searches/optimizes to recommend `(n, c)`, draws the OC curve, and provides an efficiency score plus improvement suggestions.
- **Multi‑plan Curve Comparison**: Compare OC/AOQ/ATI curves after exporting plans from other pages (efficiency scoring lives on the AQL–LTPD page).
- **Modern UI**: Glassmorphism styling, multiple light/dark themes, keyboard accessibility.

### One-click Help (per page)
- A consistent Help button is available in the top-right chart toolbar on every page.
- Clicking Help opens a unified modal with tabs:
  - Overview: What this page is for
  - Inputs: Meaning of inputs and when to use them
  - Outputs & Charts: What the outputs represent, chart axes/units
  - When to Use: Typical scenarios and guidance
- The Help content is contextual to the current page.

### Key Capabilities
- **Distributions**: Binomial, Poisson, Hypergeometric (recommended for small finite lots).
- **OC curves**: Real‑time rendering using the chosen distribution and `(n, c)`.
- **Efficiency score (AQL–LTPD)**: `E = 1 - |Pa_AQL - (1-α)| - |Pa_LTPD - β| - penalty`, with visual rating (🌟/✅/👍/⚠️/❌/🚫).
- **Suggestions**: Data‑driven hints on sample size, risk constraints, distribution choice, and AQL–LTPD ratio.
- **Export**: High‑resolution PNG and CSV (curve data + parameters). Some pages support JSON plan export.

### Project Structure (MECE)
The project is organized following the MECE (Mutually Exclusive, Collectively Exhaustive) principle:

- **`app/`**: Core application.
  - `index.html`: The main single-page application (All-in-one).
- **`assets/`**: Visual resources.
  - `images/`: Reference screenshots and UI elements.
  - `videos/`: Demo and introduction videos.
- **`data/`**: Reference data.
  - `reference_tables/`: Decoupled lookup tables (JavaScript format) for sampling plans.
- **`docs/`**: Documentation and theory.
  - `requirements/`: Mathematical specs and functional requirements for each module.
  - `theory/`: PDF papers and background theory on sampling.
  - `marketing/`: Youtube descriptions and promotional materials.
  - `comparison/`: Feature comparison documents.
- **`archive/`**: Maintenance and legacy data.
  - `backups/`: Previous versions of the application.
  - `history/`: Full development prompt history.

### Quick Start (Local)
This is a static front-end app—no dependencies to install.
1. Open `app/index.html` directly in your browser, or
2. Serve locally to avoid file-access restrictions:
   - Python: `python -m http.server 8000` → visit `http://localhost:8000/app/index.html`
   - Node (http-server): `npx http-server -p 8000` → visit `http://localhost:8000/app/index.html`

### Usage Highlights
- **Probability Distribution**
  1) Explore and compare different probability distributions (Binomial, Poisson, Hypergeometric) used in sampling plans.
  2) Visualize distribution characteristics and understand their applications in sampling contexts.
- **AQL Table Lookup**
  1) Enter Lot Size and Inspection Level, choose an AQL.
  2) Get `code letter`, `n`, `c`. If the table value is `up/down`, a note is shown and the OC curve is not drawn.
- **Reverse Sampling Query**
  1) Query sampling plan parameters in reverse to find optimal configurations for specific requirements.
  2) Analyze existing plans to understand their characteristics and performance.
- **C=0 Plan**
  1) Enter Lot Size and AQL (or custom), choose a distribution.
  2) Lookup/compute `n` (with `c=0`), plot the OC curve; estimate LQ at Pa=10% if needed.
  3) **New**: Switch to "Find AQL" mode to lookup the AQL for a specific sample size using the dynamic dropdown.
- **AQL–LTPD Balanced Plan**
  1) Enter AQL, LTPD, α/β, distribution, optional lot size N, and an optimization target.
  2) Click Calculate to get recommended `(n, c)`, Pa at AQL/LTPD, actual α/β, AOQL/ASN, the efficiency rating, suggestions, and the OC curve.
- **Multiple Plan Comparison**
  1) Import plans from other pages or manually enter plan parameters.
  2) Compare OC/AOQ/ATI curves across multiple sampling plans to evaluate performance differences.
  3) Use Help for definitions of AOQ/ATI and curve toggles.

### Export
- Chart toolbar provides `Export PNG` and `Export Data (CSV)`.
- Typical CSV columns: `x_defect_rate_percent,y_acceptance_prob,n,c,N,aql,ltpd,alpha,beta,distribution,label` (varies by page).

### Glossary
- **AQL**: Acceptable Quality Level.
- **LTPD**: Lot Tolerance Percent Defective.
- **OC curve**: Operating Characteristic (acceptance probability vs. defect rate).
- **α / β**: Producer’s / Consumer’s risk.
- **AOQL / ASN / ATI**: Average Outgoing Quality Limit / Average Sample Number / Average Total Inspection.

### Compatibility & Accessibility
- Works on modern browsers (Chrome/Edge/Firefox/Safari).
- Keyboard navigation, high-contrast themes, and helpful tooltips are supported.

### Changelog (highlights)
- 2025-01: Dynamic efficiency formula, tutorial integration, numerical stability and search convergence improvements.
- 2025-10: AQL table page adds Normal/Reduced/Tightened states, dual cursor interactions, and high-quality export refinements.
- 2025-10-08: Unified theme bindings for all charts (legend, titles, ticks, grid, axis borders). Fixed light/dark inconsistencies on C=0 and AQL-LTPD pages by updating the global theme updater to include `c0Chart` and `aqlLtpdChart`. Added UI standards §12.8.2/§12.8.3 and light-theme tab contrast rule §9.6.3.
- 2025-10-09: Align Actions button height with Parameters controls; set global `.btn` padding to `10px 12px` for consistent vertical sizing across sections. Add unified Help button and contextual modal on every page.
- 2025-10-10: Unified export PNG image colors to dark theme colors for consistent appearance across all themes. Updated `getExportThemeColors()` function to always use dark theme colors (`#e6e9ee` text and `rgba(199,202,207,0.4)` grid lines) regardless of current theme selection.
- 2025-11-29: Added Reverse C=0 Lookup feature. Users can now find the AQL corresponding to a specific sample size using a dynamic dropdown menu.

### License / Use
For educational and research use only. For commercial use or derivative works, please contact the author first.

### Rebuild Guide (from requirements + data)

This app can be fully reconstructed using only the specs in `docs/requirements/` and data in `data/reference_tables/`. Follow this mapping:

1) UI & Layout
- Source: `docs/requirements/ui_design_standards.md`
- Key directives:
  - Left sidebar navigation (`sidebar`) with vertical `.tab` buttons (width 100%, centered, no-wrap)
  - Main content width unchanged; expand outer container to include sidebar
  - Chart area keeps fixed height; width adapts to maintain 4:3 and centers horizontally
  - Buttons: height aligned with inputs (`.btn` padding `10px 12px`), small radius (8px); `.tab.active:hover` = `.tab:hover`

2) Probability Distribution page
- Interactive tool for exploring and comparing different probability distributions
- Visualizes distribution characteristics and applications in sampling contexts

3) AQL Plan Table Lookup (ANSI/ASQ Z1.4)
- Spec: `docs/requirements/aql_plan_table_lookup.md`
- Data: `data/reference_tables/CodeLetterTable.js`, `normal.js`, `reduced.js`, `tightened.js`

4) Reverse Sampling Query
- Spec: `docs/requirements/reverse_sampling_query.md`
- Query sampling plan parameters in reverse to find optimal configurations

5) C=0 Plan Lookup
- Spec: `docs/requirements/c0_plan_table_lookup.md`
- Data: `data/reference_tables/c=0 table.js`

6) AQL–LTPD Balanced Plan page
- Spec: `docs/requirements/aql_ltpd_balanced_plan.md`
- Implements optimization to recommend `(n, c)` with efficiency scoring, AOQL/ASN, and OC curve

7) Multiple Plan Comparison
- Spec: `docs/requirements/multiple_plan_comparison.md`
- Accepts exports from other pages and renders OC/AOQ/ATI curves

8) Efficiency Analysis System
- Spec: `docs/requirements/efficiency_analysis_system.md`

9) Charting
- Library: Chart.js (CDN). Use `maintainAspectRatio: false`; layout ratio is controlled by CSS (see 1).

10) Exports
- PNG/CSV per page spec; typical CSV headers are listed in each page’s requirements file.

Bootstrapping steps:
1. Create base HTML skeleton with `sidebar` + `pages` layout as in UI standards.
2. Implement each page per its `docs/requirements/*.md` file, wiring inputs, outputs, and event handlers.
3. Load data sources from `data/reference_tables/` and build lookup functions.
4. Initialize charts with theme-aware colors; set CSS for 4:3 chart width with fixed height.
5. Wire exports (PNG/CSV) and plan export to comparison page.
