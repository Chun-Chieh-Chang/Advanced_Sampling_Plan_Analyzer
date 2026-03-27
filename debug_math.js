import { binomialPMF, binomialCDF } from './app/logic.js';

console.log('--- Binomial Debug (n=125, p=0.05) ---');
let sum = 0;
for (let k = 0; k <= 5; k++) {
    const pmf = binomialPMF(k, 125, 0.05);
    sum += pmf;
    console.log(`k=${k}: PMF=${pmf.toFixed(6)}, Running Sum=${sum.toFixed(6)}`);
}

const cdf = binomialCDF(5, 125, 0.05);
console.log('Final CDF:', cdf);
