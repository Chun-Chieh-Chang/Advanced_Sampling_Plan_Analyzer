/**
 * Core mathematical and statistical logic for Sampling Plan Analyzer.
 * Extracted from index.html for unit testing and validation.
 */

// Validate acceptance probability and ensure it's within [0, 1] range
export function validateAcceptanceProbability(pa, context = '') {
    if (pa < 0) {
        console.warn(`Negative acceptance probability detected: ${pa} ${context}`);
        return 0;
    }
    if (pa > 1) {
        console.warn(`Acceptance probability > 100% detected: ${pa} ${context}`);
        return 1;
    }
    if (!isFinite(pa)) {
        console.warn(`Invalid acceptance probability detected: ${pa} ${context}`);
        return 0;
    }
    return pa;
}

// Calculate acceptance probability for given parameters
export function calculateAcceptanceProbability(n, c, p, N, distribution) {
    if (p < 0 || p > 1) {
        p = Math.max(0, Math.min(1, p));
    }

    if (p === 0) {
        return c >= 0 ? 1 : 0;
    }

    let result;
    switch (distribution) {
        case 'binom':
            result = binomialCDF(c, n, p);
            break;
        case 'pois':
            result = poissonCDF(c, n * p);
            break;
        case 'hyper':
            if (N === null || N === undefined) {
                throw new Error('Lot size required for Hypergeometric distribution');
            }
            const K = Math.round(N * p);
            result = hypergeometricCDF(c, N, K, n);
            break;
        default:
            result = binomialCDF(c, n, p);
    }

    return validateAcceptanceProbability(result, `(n=${n}, c=${c}, p=${p}, distribution=${distribution})`);
}

// Statistical distribution functions
export function binomialCDF(k, n, p) {
    if (k < 0) return 0;
    if (k >= n) return 1;
    if (p <= 0) return 1;
    if (p >= 1) return 0; // Fixed: rejection is certain if p=1 and k < n

    if (p < 1e-10) return 1;

    let sum = 0;
    for (let i = 0; i <= k; i++) {
        sum += binomialPMF(i, n, p);
        if (sum > 1) return 1;
    }
    return Math.min(1, sum);
}

export function binomialPMF(k, n, p) {
    if (k < 0 || k > n) return 0;
    if (p === 0) return k === 0 ? 1 : 0;
    if (p === 1) return k === n ? 1 : 0;

    // Use a more numerically stable approach
    // PMF(k) = C(n,k) * p^k * (1-p)^(n-k)
    // We can start with P(0) = (1-p)^n and then iteratively calculate P(k) = P(k-1) * (n-k+1)/k * p/(1-p)
    let pmf = Math.pow(1 - p, n);
    for (let i = 1; i <= k; i++) {
        pmf *= (n - i + 1) * p / (i * (1 - p));
    }
    return pmf;
}

export function poissonCDF(k, lambda) {
    if (lambda <= 0) return k >= 0 ? 1 : 0;
    if (lambda > 100) {
        // Normal approximation
        const mean = lambda;
        const variance = lambda;
        const z = (k + 0.5 - mean) / Math.sqrt(variance);
        return 0.5 * (1 + Math.sign(z) * Math.sqrt(1 - Math.exp(-2 * z * z / Math.PI)));
    }

    let sum = 0;
    for (let i = 0; i <= k; i++) {
        sum += Math.exp(-lambda) * Math.pow(lambda, i) / factorial(i);
        if (sum > 1) return 1;
    }
    return Math.min(1, sum);
}

export function hypergeometricCDF(k, N, K, n) {
    if (n > N || K > N || k > Math.min(n, K)) return 0;
    if (k < 0) return 0;
    // Fix: if k is >= min(n, K), we've covered all possible defective outcomes
    if (k >= Math.min(n, K)) return 1;

    let sum = 0;
    for (let i = 0; i <= k; i++) {
        sum += hypergeometricPMF(i, N, K, n);
        if (sum > 1) return 1;
    }
    return Math.min(1, sum);
}

export function hypergeometricPMF(k, N, K, n) {
    if (k < 0 || k > n || k > K || n - k > N - K) return 0;

    const numerator = combination(K, k) * combination(N - K, n - k);
    const denominator = combination(N, n);
    return numerator / denominator;
}

export function combination(n, k) {
    if (k > n || k < 0) return 0;
    if (k === 0 || k === n) return 1;
    if (k > n / 2) k = n - k;

    let result = 1;
    for (let i = 1; i <= k; i++) {
        result *= (n - i + 1) / i;
    }
    return result;
}

export function factorial(n) {
    if (n <= 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

// Optimization Logic
export function calculateOptimalAqlLtpdPlan(aql, ltpd, lotSize, distribution, optimizationTarget, alpha, beta) {
    if (aql >= ltpd) {
        throw new Error('AQL must be less than LTPD');
    }
    if (alpha <= 0 || alpha >= 1 || beta <= 0 || beta >= 1) {
        throw new Error('Risk values must be between 0 and 1');
    }

    const idealPaAql = 1 - alpha;
    const idealPaLtpd = beta;

    let bestPlan = null;
    let bestScore = Infinity;
    let feasiblePlans = [];

    const pAql = aql / 100;
    const pLtpd = ltpd / 100;

    for (let n = 1; n <= 500; n++) {
        let paAql, paLtpd;
        
        // Use iterative CDF calculation for O(N^2) total complexity
        if (distribution === 'binom') {
            let curPmfAql = Math.pow(1 - pAql, n);
            let curPmfLtpd = Math.pow(1 - pLtpd, n);
            paAql = curPmfAql;
            paLtpd = curPmfLtpd;
            
            for (let c = 0; c <= n; c++) {
                if (c > 0) {
                    curPmfAql *= (n - c + 1) * pAql / (c * (1 - pAql));
                    curPmfLtpd *= (n - c + 1) * pLtpd / (c * (1 - pLtpd));
                    paAql += curPmfAql;
                    paLtpd += curPmfLtpd;
                }
                
                processPlan(n, c, paAql, paLtpd);
            }
        } else if (distribution === 'pois') {
            const lambdaAql = n * pAql;
            const lambdaLtpd = n * pLtpd;
            let curPmfAql = Math.exp(-lambdaAql);
            let curPmfLtpd = Math.exp(-lambdaLtpd);
            paAql = curPmfAql;
            paLtpd = curPmfLtpd;
            
            for (let c = 0; c <= n; c++) {
                if (c > 0) {
                    curPmfAql *= lambdaAql / c;
                    curPmfLtpd *= lambdaLtpd / c;
                    paAql += curPmfAql;
                    paLtpd += curPmfLtpd;
                }
                processPlan(n, c, paAql, paLtpd);
            }
        } else {
            // Hypergeometric or other: use standard loop for now (less common to optimize this way)
            for (let c = 0; c <= n; c++) {
                paAql = calculateAcceptanceProbability(n, c, pAql, lotSize, distribution);
                paLtpd = calculateAcceptanceProbability(n, c, pLtpd, lotSize, distribution);
                processPlan(n, c, paAql, paLtpd);
            }
        }
    }

    function processPlan(n, c, paAql, paLtpd) {
        const actualAlpha = 1 - paAql;
        const actualBeta = paLtpd;

        let score;
        switch (optimizationTarget) {
            case 'minimize_n':
                if (actualAlpha <= alpha && actualBeta <= beta) {
                    score = n;
                } else {
                    return;
                }
                break;
            case 'balance':
                const aqlDeviation = Math.abs(paAql - idealPaAql);
                const ltpdDeviation = Math.abs(paLtpd - idealPaLtpd);
                let constraintPenalty = 0;
                if (actualAlpha > alpha) constraintPenalty += (actualAlpha - alpha) * 10;
                if (actualBeta > beta) constraintPenalty += (actualBeta - beta) * 10;
                score = aqlDeviation + ltpdDeviation + constraintPenalty;
                break;
            case 'max_producer':
                score = actualAlpha;
                break;
            case 'max_consumer':
                score = actualBeta;
                break;
            default:
                score = n;
        }

        const isFeasible = (actualAlpha <= alpha && actualBeta <= beta);
        if (isFeasible) {
            feasiblePlans.push({ n, c, paAql, paLtpd, actualAlpha, actualBeta, score });
        }

        if (score < bestScore) {
            bestScore = score;
            bestPlan = { n, c, paAql, paLtpd, actualAlpha, actualBeta, score };
        }
    }

    if (optimizationTarget === 'minimize_n' && feasiblePlans.length > 0) {
        return feasiblePlans.reduce((min, plan) => plan.n < min.n ? plan : min);
    }

    return bestPlan;
}

export function calculateAOQL(n, c, p, N, distribution) {
    const pa = calculateAcceptanceProbability(n, c, p, N, distribution);
    return p * pa;
}

export function calculateASN(n, c, p, N, distribution) {
    return n;
}

export function calculatePlanEfficiency(plan, idealPaAql, idealPaLtpd, alpha, beta) {
    const aqlDeviation = Math.abs(plan.paAql - idealPaAql);
    const ltpdDeviation = Math.abs(plan.paLtpd - idealPaLtpd);

    let constraintPenalty = 0;
    if (plan.actualAlpha > alpha) constraintPenalty += (plan.actualAlpha - alpha) * 2;
    if (plan.actualBeta > beta) constraintPenalty += (plan.actualBeta - beta) * 2;

    const totalDeviation = aqlDeviation + ltpdDeviation + constraintPenalty;
    return Math.max(0, 1 - totalDeviation);
}
