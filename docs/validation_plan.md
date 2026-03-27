# Software Validation Plan (確效計畫) - Advanced Sampling Plan Analyzer

## 1. Introduction
This document defines the validation strategy for the Advanced Sampling Plan Analyzer. The goal is to ensure that the application functions according to its specified requirements (docs/requirements/) and provides accurate statistical results.

## 2. Validation Scope
The validation covers the following areas:
- **Mathematical Logic**: OC Curve, AOQ, ATI, AQL/LTPD optimization, and metric calculations (AOQL, ASN).
- **Statistical Tables**: ANSI/ASQ Z1.4 (AQL Lookup) and Squeglia's C=0 tables.
- **UI/UX Excellence**: Compliance with Color Master Palette, high contrast, and responsive design.
- **Robustness**: Handling of invalid inputs, extreme values, and edge cases.

## 3. Methodology
Validation will be performed using a combination of:
- **Automated Unit Testing**: Testing core logic functions in isolation using Vitest.
- **Automated UI Testing**: Verifying browser-level behaviors and rendering.
- **Manual Verification**: Cross-checking results with known statistical tables and external tools (e.g., calculations from standardized textbooks).

## 4. Acceptance Criteria
- **Accuracy**: Calculations must match theoretical values within a tolerance of 0.001%.
- **Zero Errors**: Console must be free of any errors or warnings during operation.
- **Performance**: Calculations and chart updates must occur in < 100ms for typical inputs.
- **Visuals**: Must follow the project's Color Master Palette and 4px-grid spacing rules (defined in user_global).

## 5. Test Cases (Summary)
| ID | Title | Description | Expected Result |
|----|-------|-------------|-----------------|
| TC-01 | AQL-LTPD Binomial | Calc plan for AQL=1%, LTPD=5%, α=0.05, β=0.10 | n=132, c=3 (approx) |
| TC-02 | Z1.4 Table Lookup | N=1000, AQL=1.0, Level II | n=80, Ac=2, Re=3 |
| TC-03 | C=0 Squeglia's | N=100, custom AQL 1.0 | n=13, c=0 |
| TC-04 | Responsive Check | View on 375px width | Layout stacks properly, text is readable |
| TC-05 | Input Robustness | Input n < c or non-numeric | Error message displayed, app does not crash |

## 6. Execution & Reporting
Results will be recorded in `DEV_LOG.md` and a final `validation_report.md` will be generated.
