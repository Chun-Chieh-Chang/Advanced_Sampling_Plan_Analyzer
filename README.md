# Advanced Sampling Plan Analyzer

A single-page front-end web app for designing, looking up, comparing, and exporting acceptance sampling plans.

## Features

- Probability Distribution explorer for Binomial, Poisson, and Hypergeometric OC curves
- AQL Plan Table Lookup based on ANSI/ASQ Z1.4 reference tables
- Reverse Sampling Query for solving plan parameters from target requirements
- C=0 Plan Lookup with standard-table and reverse-AQL support
- AQL-LTPD Balanced Plan optimization with efficiency scoring and improvement suggestions
- Multiple Plan Comparison with OC, AOQ, and ATI curve modes
- Theme switching, contextual help, tutorial flow, PNG export, and CSV export

## Project Structure

- `app/`
  - `index.html`: application shell and UI layout
  - `main.js`: application bootstrap and shared wiring
  - `core/`: shared systems such as theme, export, help, and tutorial logic
  - `pages/`: feature modules for each page
  - `logic.js`: reusable statistical and optimization functions
- `data/reference_tables/`: lookup tables for AQL and C=0 plans
- `docs/requirements/`: feature and UI requirement documents
- `assets/`: images and other static assets
- `tests/`: Vitest coverage for math logic, UI structure, and reference-table exports

## Quick Start

### Run the app

This is a static front-end app, so there is no build step required for normal use. The checked-in `app/main.bundle.js` lets `app/index.html` run even when opened directly from disk, and the `app/` folder is self-contained for GitHub Pages deployment.

1. Open `app/index.html` directly in a browser, or
2. Serve the repository locally:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000/app/index.html`.

If you edit source files under `app/main.js`, `app/core/`, or `app/pages/`, rebuild the browser bundle before testing by running:

```bash
npm run build:bundle
```

## GitHub Pages

The GitHub Pages workflow publishes the contents of `app/` as the site root. That means:

- `https://chun-chieh-chang.github.io/Advanced_Sampling_Plan_Analyzer/` serves `app/index.html`
- Any runtime assets needed by the page must live under `app/`

### Run tests

Install dependencies once:

```bash
npm install
```

Run validation:

```bash
npm test
```

## Main Pages

### Probability Distribution

Compare distribution behavior for the same `(N, n, c)` inputs and export the resulting plan to comparison.

### AQL Plan Table Lookup

Look up code letter, sample size, and acceptance/rejection values using lot size, inspection level, AQL, and inspection state.

### Reverse Sampling Query

Solve for AQL, sample size, acceptance number, lot size, or target acceptance probability from the remaining parameters.

### C=0 Plan Lookup

Work with zero-acceptance plans, including reverse lookup of AQL from a selected sample size.

### AQL-LTPD Balanced Plan

Optimize a plan against both AQL and LTPD targets with producer/consumer risk limits and inspect efficiency, AOQL, and ASN outputs.

### Multiple Plan Comparison

Compare imported or manually entered plans with OC, AOQ, and ATI curve views.

## Export

- `Export PNG`: high-resolution chart export
- `Export Data`: CSV export of plotted curve data
- `Export to Plan Comparison`: queue a plan for comparison-page import

## References

- AQL lookup data: `data/reference_tables/CodeLetterTable.js`, `data/reference_tables/normal.js`, `data/reference_tables/reduced.js`, `data/reference_tables/tightened.js`
- C=0 lookup data: `data/reference_tables/c=0 table.js`
- Feature requirements: `docs/requirements/`

## License / Use

For educational and research use only. For commercial use or derivative works, please contact the author first.
