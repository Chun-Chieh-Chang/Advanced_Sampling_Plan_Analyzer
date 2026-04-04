import { describe, it, expect } from 'vitest';
import { C0_SAMPLING_TABLE } from '../data/reference_tables/c=0 table.js';
import { codeLetterTable } from '../data/reference_tables/CodeLetterTable.js';
import {
    codeLettersOrder_normal,
    normal_rawMasterTableData,
    normal_sampleSizes
} from '../data/reference_tables/normal.js';
import {
    codeLettersOrder_reduced,
    reduced_rawMasterTableData,
    reduced_sampleSizes
} from '../data/reference_tables/reduced.js';
import {
    codeLettersOrder_tightened,
    tightened_rawMasterTableData,
    tightened_sampleSizes
} from '../data/reference_tables/tightened.js';

describe('Reference Table Modules', () => {
    it('should expose the code letter lookup table', () => {
        expect(codeLetterTable[0].levels.II).toBe('A');
        expect(codeLetterTable.at(-1).levels.III).toBe('R');
    });

    it('should expose normal inspection data', () => {
        expect(codeLettersOrder_normal).toContain('Q');
        expect(normal_sampleSizes.L).toBe(200);
        expect(normal_rawMasterTableData.K['1.0']).toBe(3);
    });

    it('should expose reduced inspection data', () => {
        expect(codeLettersOrder_reduced).toContain('R');
        expect(reduced_sampleSizes.J).toBe(32);
        expect(reduced_rawMasterTableData.A['6.5']).toEqual({ ac: 0, re: 1 });
    });

    it('should expose tightened inspection data', () => {
        expect(codeLettersOrder_tightened).toContain('S');
        expect(tightened_sampleSizes.S).toBe(3150);
        expect(tightened_rawMasterTableData.B['6.5']).toBe(0);
    });

    it('should expose the C=0 lookup table', () => {
        expect(C0_SAMPLING_TABLE[0].lot_range).toEqual([2, 8]);
        expect(C0_SAMPLING_TABLE.at(-1).samples['1.0']).toBe(102);
    });
});
