import { describe, it, expect } from 'vitest';
import { 
    binomialCDF, 
    poissonCDF, 
    hypergeometricCDF, 
    calculateAcceptanceProbability,
    calculateOptimalAqlLtpdPlan
} from '../app/logic.js';

describe('Statistical Distributions', () => {
    describe('Binomial Distribution', () => {
        it('should correctly calculate Pa for n=125, c=2, p=0.01', () => {
            // Exact Binomial value: 0.8693
            const result = binomialCDF(2, 125, 0.01);
            expect(result).toBeCloseTo(0.8693, 4);
        });

        it('should correctly calculate Pa for n=125, c=5, p=0.05', () => {
             // Exact Binomial value: 0.4015
             const result = binomialCDF(5, 125, 0.05);
             expect(result).toBeCloseTo(0.4015, 4);
        });
    });

    describe('Poisson Distribution', () => {
        it('should correctly calculate Pa for n=125, c=2, p=0.01 (lambda=1.25)', () => {
            // Standard value: Pa ≈ 0.8685
            const result = poissonCDF(2, 1.25);
            expect(result).toBeCloseTo(0.8685, 4);
        });
    });

    describe('Hypergeometric Distribution', () => {
        it('should correctly calculate Pa for N=500, n=50, c=2, p=0.02 (K=10)', () => {
            // Exact Hypergeometric value: 0.9317
            const result = hypergeometricCDF(2, 500, 10, 50);
            expect(result).toBeCloseTo(0.9317, 4);
        });
    });
});

describe('Sampling Plan Optimization', () => {
    it('should find the optimal plan for AQL=1%, LTPD=5%, alpha=0.05, beta=0.10', () => {
        const plan = calculateOptimalAqlLtpdPlan(1, 5, 1000, 'binom', 'minimize_n', 0.05, 0.10);
        expect(plan).not.toBeNull();
        expect(plan.n).toBeGreaterThan(0);
        expect(plan.c).toBeGreaterThanOrEqual(0);
        expect(plan.actualAlpha).toBeLessThanOrEqual(0.05);
        expect(plan.actualBeta).toBeLessThanOrEqual(0.10);
        
        // n=132, c=3 is a known standard plan for these risks
        console.log(`Optimal Plan: n=${plan.n}, c=${plan.c}, alpha=${plan.actualAlpha.toFixed(4)}, beta=${plan.actualBeta.toFixed(4)}`);
    });
});

describe('Edge Cases & Robustness', () => {
    it('should handle zero defect rate', () => {
        const pa = calculateAcceptanceProbability(125, 2, 0, 1000, 'binom');
        expect(pa).toBe(1);
    });

    it('should handle defect rate = 1', () => {
        const pa = calculateAcceptanceProbability(125, 2, 1, 1000, 'binom');
        expect(pa).toBe(0);
    });

    it('should handle large k (k >= n)', () => {
        const pa = calculateAcceptanceProbability(50, 60, 0.1, 1000, 'binom');
        expect(pa).toBe(1);
    });

    it('should throw error when AQL >= LTPD', () => {
        expect(() => calculateOptimalAqlLtpdPlan(5, 1, 1000, 'binom', 'minimize_n', 0.05, 0.10))
            .toThrow('AQL must be less than LTPD');
    });

    it('should handle invalid p values gracefully', () => {
        const pa = calculateAcceptanceProbability(50, 2, 1.5, 1000, 'binom');
        expect(pa).toBe(0); // Clamped to 1, then CDF(2, 50, 1) = 0
    });
});
