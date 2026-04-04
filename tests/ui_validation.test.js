import { describe, it, expect } from 'vitest';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const html = fs.readFileSync(resolve(__dirname, '../app/index.html'), 'utf8');

describe('UI Validation', () => {
    it('should have the correct title', () => {
        expect(html).toContain('<title>Advanced Sampling Plan Analyzer');
    });

    it('should contain the 6 main modules', () => {
        expect(html).toContain('AQL-LTPD Balanced Plan');
        expect(html).toContain('AQL Plan Table Lookup');
        expect(html).toContain('C=0 Plan Table Lookup');
        expect(html).toContain('Probability Distribution');
        expect(html).toContain('Reverse Sampling Query');
        expect(html).toContain('Multiple Plan Comparison');
    });

    it('should have correct default values in AQL-LTPD section', () => {
        expect(html).toContain('id="aql_ltpd_aql_input"');
        expect(html).toContain('value="1.0"');
        expect(html).toContain('id="aql_ltpd_ltpd_input"');
        expect(html).toContain('value="5.0"');
    });

    it('should apply the Color Master Palette variables', () => {
        expect(html).toContain('--bg');
        expect(html).toContain('--panel');
        expect(html).toContain('--text');
    });

    it('should keep tutorial controls and key labels free of corrupted placeholder text', () => {
        expect(html).toContain('Start Interactive Tutorial');
        expect(html).toContain('Interactive Sampling Plan Tutorial');
        expect(html).toContain('id="tutorial-next-btn">Next</button>');
        expect(html).toContain("Producer's Risk (alpha)");
        expect(html).not.toContain('??/button');
    });

    it('should load deploy-safe local assets and the prebuilt app bundle', () => {
        expect(html).toContain('<link rel="icon" type="image/svg+xml" href="./assets/images/favicon.svg">');
        expect(html).toContain('<link rel="apple-touch-icon" href="./assets/images/favicon.svg">');
        expect(html).toContain('<script src="./assets/vendor/chart.min.js"></script>');
        expect(html).toContain('<script src="./main.bundle.js"></script>');
        expect(html).not.toContain('cdn.jsdelivr.net/npm/chart.js');
        expect(html).not.toContain('type="module" src="./main.js"');
        expect(html).not.toContain('../assets/');
    });
});
