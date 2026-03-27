import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

const html = fs.readFileSync(path.resolve(__dirname, '../app/index.html'), 'utf8');

describe('UI Validation (JSDOM)', () => {
    let dom;
    let document;

    beforeEach(() => {
        dom = new JSDOM(html, { runScripts: "dangerously", resources: "usable" });
        document = dom.window.document;
    });

    it('should have the correct title', () => {
        expect(document.title).toContain('Advanced Sampling Plan Analyzer');
    });

    it('should contain the 6 main modules', () => {
        const tabs = document.querySelectorAll('.tab');
        const labels = Array.from(tabs).map(item => item.textContent.trim());
        
        expect(labels).toContain('AQL-LTPD Balanced Plan');
        expect(labels).toContain('AQL Plan Table Lookup'); // Fixed name from index.html
        expect(labels).toContain('C=0 Plan Table Lookup'); // Fixed name
        expect(labels).toContain('Probability Distribution');
        expect(labels).toContain('Reverse Sampling Query');
        expect(labels).toContain('Multiple Plan Comparison');
    });

    it('should have correct default values in AQL-LTPD section', () => {
        const aqlInput = document.getElementById('aql_ltpd_aql_input');
        const ltpdInput = document.getElementById('aql_ltpd_ltpd_input');
        
        expect(aqlInput.value).toBe('1.0');
        expect(ltpdInput.value).toBe('5.0');
    });

    it('should apply the Color Master Palette variables', () => {
        // Checking for the variables we INTEND to have or already have
        expect(html).toContain('--bg');
        expect(html).toContain('--panel');
        expect(html).toContain('--text');
    });
});
