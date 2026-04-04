export function initAqlLookupPage(deps) {
    const {
        document,
        window,
        Chart,
        calculateAcceptanceProbability,
        getEnhancedThemeColors,
        codeLetterTable,
        codeLettersOrder_normal,
        normal_rawMasterTableData,
        normal_sampleSizes,
        codeLettersOrder_reduced,
        reduced_rawMasterTableData,
        reduced_sampleSizes,
        codeLettersOrder_tightened,
        tightened_rawMasterTableData,
        tightened_sampleSizes,
        onChartChange
    } = deps;

    const ssLotEl = document.getElementById('ss_lot_size');
    const ssLevelSel = document.getElementById('ss_inspection_level');
    const ssAqlSel = document.getElementById('ss_aql');
    const ssAqlCustomEl = document.getElementById('ss_aql_custom');
    const ssDistSel = document.getElementById('ss_dist_select');
    const ssStateSel = document.getElementById('ss_state_select');
    const ssLookupBtn = document.getElementById('ss_lookup_btn');
    const ssClearBtn = document.getElementById('ss_clear_btn');
    const ssErrEl = document.getElementById('ss_error');
    const ssXMaxEl = document.getElementById('ss_x_max');
    const ssCtx = document.getElementById('ocChartAQL');
    const ssPlanLabelEl = document.getElementById('ss_plan_label');
    const ssExportPlanBtn = document.getElementById('ss_export_plan');

    let ssChart = null;
    let ssLastPlan = null;
    let ssAllAqlKeys = null;

    function syncChartReference() {
        if (typeof onChartChange === 'function') {
            onChartChange(ssChart);
        }
        window.aqlLookupPageState = {
            chart: ssChart,
            lastPlan: ssLastPlan
        };
    }

    function generatePValues(maxXPercent) {
        const step = 0.05;
        const num = Math.floor(maxXPercent / step) + 1;
        return Array.from({ length: num }, function (_, i) { return +(i * step).toFixed(2); });
    }

    function populateInspectionLevels() {
        const levels = ['I', 'II', 'III', 'S-1', 'S-2', 'S-3', 'S-4'];
        if (!ssLevelSel) return;
        ssLevelSel.innerHTML = '';
        levels.forEach(function (level) {
            const option = document.createElement('option');
            option.value = level;
            option.textContent = level;
            ssLevelSel.appendChild(option);
        });
        ssLevelSel.value = 'II';
    }

    function collectAqlKeys() {
        const sets = [];

        function pushKeys(table) {
            if (!table) return;
            Object.keys(table).forEach(function (letter) {
                const row = table[letter];
                if (!row) return;
                Object.keys(row).forEach(function (key) { sets.push(key); });
            });
        }

        pushKeys(normal_rawMasterTableData);
        pushKeys(tightened_rawMasterTableData);
        pushKeys(reduced_rawMasterTableData);

        return Array.from(new Set(sets)).sort(function (a, b) {
            return parseFloat(a) - parseFloat(b);
        });
    }

    function populateAqlLevels() {
        const desiredAttr = ssAqlSel && ssAqlSel.getAttribute('data-default') || '0.4';
        const desiredNum = parseFloat(desiredAttr);
        let desiredKey;
        const custom = document.createElement('option');

        if (!ssAqlSel) return;
        if (!ssAllAqlKeys) ssAllAqlKeys = collectAqlKeys();

        ssAqlSel.innerHTML = '';
        (ssAllAqlKeys && ssAllAqlKeys.length ? ssAllAqlKeys : ['0.15', '0.40', '0.65', '1.0', '2.5']).forEach(function (key) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = key;
            ssAqlSel.appendChild(option);
        });

        custom.value = 'custom';
        custom.textContent = 'Custom';
        ssAqlSel.appendChild(custom);

        desiredKey = Array.from(ssAqlSel.options)
            .map(function (option) { return option.value; })
            .find(function (value) { return Math.abs(parseFloat(value) - desiredNum) < 1e-9; });

        if (!desiredKey) {
            desiredKey = Array.from(ssAqlSel.options).some(function (option) { return option.value === '1.0'; }) ? '1.0' : (ssAqlSel.options[0] ? ssAqlSel.options[0].value : 'custom');
        }

        ssAqlSel.value = desiredKey;
        if (ssAqlCustomEl) ssAqlCustomEl.disabled = ssAqlSel.value !== 'custom';
    }

    function ensureSsChart() {
        if (ssChart || !ssCtx) return ssChart;

        const ssCrosshairPlugin = {
            id: 'ssCrosshairPlugin',
            afterEvent: function (chart, args) {
                const e = args.event;
                if (!e) return;
                chart._crosshair = chart._crosshair || { x: null, y: null };
                if (e.type === 'mousemove') {
                    chart._crosshair.x = e.x;
                    chart._crosshair.y = e.y;
                    chart.draw();
                }
                if (e.type === 'mouseout') {
                    chart._crosshair.x = null;
                    chart._crosshair.y = null;
                    chart.draw();
                }
            },
            afterDraw: function (chart) {
                const cx = chart._crosshair && chart._crosshair.x;
                const cy = chart._crosshair && chart._crosshair.y;
                if (cx == null || cy == null) return;

                const ctx = chart.ctx;
                const area = chart.chartArea;
                if (!area) return;

                ctx.save();
                ctx.strokeStyle = 'rgba(199,202,207,0.5)';
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.moveTo(cx, area.top);
                ctx.lineTo(cx, area.bottom);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(area.left, cy);
                ctx.lineTo(area.right, cy);
                ctx.stroke();

                const xScaleRef = chart.scales && chart.scales.x;
                const yScaleRef = chart.scales && chart.scales.y;
                if (xScaleRef && yScaleRef) {
                    const xVal = xScaleRef.getValueForPixel(cx);
                    const yVal = yScaleRef.getValueForPixel(cy);
                    if (isFinite(xVal) && isFinite(yVal)) {
                        const label = 'p=' + xVal.toFixed(2) + '% , Pa=' + (yVal * 100).toFixed(1) + '%';
                        const pad = 6;
                        const width = ctx.measureText(label).width + pad * 2;
                        const height = 20;
                        const boxX = Math.min(Math.max(area.left, cx + 8), area.right - width);
                        const boxY = Math.max(area.top, cy - height - 8);

                        ctx.fillStyle = 'rgba(28,42,54,0.9)';
                        ctx.strokeStyle = 'rgba(64,84,102,0.9)';
                        ctx.setLineDash([]);
                        ctx.font = '12px sans-serif';
                        ctx.beginPath();
                        if (ctx.roundRect) {
                            ctx.roundRect(boxX, boxY, width, height, 6);
                        } else {
                            ctx.rect(boxX, boxY, width, height);
                        }
                        ctx.fill();
                        ctx.stroke();
                        ctx.fillStyle = '#e6e9ee';
                        ctx.fillText(label, boxX + pad, boxY + 14);
                    }
                }
                ctx.restore();
            }
        };

        ssChart = new Chart(ssCtx.getContext('2d'), {
            type: 'line',
            data: { datasets: [] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: {
                    legend: { display: true, labels: { color: getEnhancedThemeColors().text } },
                    tooltip: {
                        enabled: true,
                        callbacks: {
                            label: function (context) {
                                const x = context.parsed && context.parsed.x;
                                const y = context.parsed && context.parsed.y;
                                const datasetLabel = context.dataset.label || '';
                                const xText = isFinite(x) ? (+x).toFixed(x < 1 ? 3 : 2) : '-';
                                const yText = isFinite(y) ? (y * 100).toFixed(1) : '-';
                                return datasetLabel + ': p=' + xText + '%, Pa=' + yText + '%';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        title: { display: true, text: 'Defect Rate (p%)', color: getEnhancedThemeColors().text },
                        grid: { display: true, color: getEnhancedThemeColors().grid },
                        ticks: { color: getEnhancedThemeColors().text }
                    },
                    y: {
                        min: 0,
                        max: 1,
                        title: { display: true, text: 'Acceptance Probability (Pa%)', color: getEnhancedThemeColors().text },
                        ticks: {
                            callback: function (v) { return (v * 100).toFixed(0) + '%'; },
                            color: getEnhancedThemeColors().text
                        },
                        grid: { display: true, color: getEnhancedThemeColors().grid }
                    }
                }
            },
            plugins: [ssCrosshairPlugin]
        });

        syncChartReference();
        return ssChart;
    }

    function getCodeLetter(N, level) {
        let max;
        for (const row of codeLetterTable || []) {
            max = row.max == null ? Infinity : row.max;
            if (N >= row.min && N <= max) {
                return row.levels[level];
            }
        }
        return null;
    }

    function getStateRefs() {
        const state = ssStateSel && ssStateSel.value || 'normal';
        if (state === 'tightened') {
            return {
                table: tightened_rawMasterTableData,
                sizes: tightened_sampleSizes,
                order: codeLettersOrder_tightened,
                label: 'Tightened'
            };
        }
        if (state === 'reduced') {
            return {
                table: reduced_rawMasterTableData,
                sizes: reduced_sampleSizes,
                order: codeLettersOrder_reduced,
                label: 'Reduced'
            };
        }
        return {
            table: normal_rawMasterTableData,
            sizes: normal_sampleSizes,
            order: codeLettersOrder_normal,
            label: 'Normal'
        };
    }

    function getSampleSizeFromCode(code) {
        const refs = getStateRefs();
        return refs.sizes && refs.sizes[code] || null;
    }

    function getValueByNumericAqlKey(rowObj, aqlStr) {
        let bestKey;
        let bestDelta = Infinity;
        const target = parseFloat(aqlStr);

        if (!rowObj) return undefined;
        if (aqlStr in rowObj) return rowObj[aqlStr];
        if (!isFinite(target)) return undefined;

        Object.keys(rowObj).forEach(function (key) {
            const value = parseFloat(key);
            const delta = Math.abs(value - target);
            if (isFinite(value) && delta < bestDelta) {
                bestDelta = delta;
                bestKey = key;
            }
        });

        if (bestKey != null && Math.abs(parseFloat(bestKey) - target) < 1e-12) return rowObj[bestKey];
        if (bestKey != null && Math.abs(parseFloat(bestKey) - target) < 1e-6) return rowObj[bestKey];
        return undefined;
    }

    function normalizeAcReCell(cell, isReduced) {
        if (cell == null) return null;
        if (typeof cell === 'number') {
            if (isReduced && cell === 0) return { ac: 0, re: 1 };
            return { ac: cell, re: cell + 1 };
        }
        if (Array.isArray(cell) && cell.length === 2 && cell.every(function (value) { return typeof value === 'number'; })) {
            return { ac: cell[0], re: cell[1] };
        }
        if (typeof cell === 'object' && typeof cell.ac === 'number' && typeof cell.re === 'number') {
            return { ac: cell.ac, re: cell.re };
        }
        return null;
    }

    function findFinalPlan(initialLetter, aqlStr) {
        const refs = getStateRefs();
        let currentIndex;
        let currentLetter;
        let plan;
        const visited = new Set();
        const normState = ssStateSel && ssStateSel.value === 'reduced';

        if (!refs.table || !refs.order) return { finalLetter: null, finalAc: null };

        currentIndex = refs.order.indexOf(initialLetter);
        if (currentIndex === -1) return { finalLetter: null, finalAc: null };

        currentLetter = initialLetter;
        plan = getValueByNumericAqlKey(refs.table[currentLetter], aqlStr);
        visited.add(currentLetter);

        while (plan === 'down' || plan === 'up') {
            currentIndex += plan === 'down' ? 1 : -1;
            if (currentIndex < 0 || currentIndex >= refs.order.length) return { finalLetter: null, finalAc: null };
            currentLetter = refs.order[currentIndex];
            if (visited.has(currentLetter)) return { finalLetter: null, finalAc: null };
            visited.add(currentLetter);
            plan = getValueByNumericAqlKey(refs.table[currentLetter], aqlStr);
        }

        const normalized = normalizeAcReCell(plan, normState);
        if (!normalized) return { finalLetter: null, finalAc: null };
        return { finalLetter: currentLetter, finalAc: normalized.ac, finalRe: normalized.re };
    }

    function ssComputePa(dist, N, n, c, p) {
        return calculateAcceptanceProbability(n, c, p, N, dist);
    }

    function drawSsChart(N, n, c, aql, code, level, dist) {
        const maxX = parseFloat(ssXMaxEl && ssXMaxEl.value || '5');
        const xs = generatePValues(maxX);
        const rejectColor = 'rgba(231,76,60,1)';
        const continueFill = 'rgba(52,152,219,0.20)';
        const paData = [];
        const prData = [];
        const upperData = [];
        const re = typeof (ssLastPlan && ssLastPlan.re) === 'number' ? ssLastPlan.re : (c != null ? c + 1 : null);
        const colors = getEnhancedThemeColors();
        const accentColor = colors.accent || 'rgba(241,196,15,1)';
        const autoLabel = 'Accept (Pa)  n=' + n + ', c=' + c + ', AQL=' + aql + ', Code=' + code + ', Level=' + level;
        let currentLabel = ssPlanLabelEl ? ssPlanLabelEl.value.trim() : '';

        ensureSsChart();
        ssChart.options.scales.x.max = maxX;

        xs.forEach(function (px) {
            const p = px / 100;
            const Pa = ssComputePa(dist, N, n, c, p);
            let Pr;

            if (re != null && re > c) {
                const cdfReMinus1 = ssComputePa(dist, N, n, re - 1, p);
                Pr = Math.max(0, 1 - cdfReMinus1);
            } else {
                Pr = Math.max(0, 1 - Pa);
            }

            paData.push({ x: px, y: Pa });
            prData.push({ x: px, y: Pr });
            upperData.push({ x: px, y: Math.max(0, 1 - Pr) });
        });

        if (!currentLabel || currentLabel === 'AQL Plan' || currentLabel === ssChart.__lastAutoLabel) {
            if (ssPlanLabelEl) ssPlanLabelEl.value = autoLabel;
            currentLabel = autoLabel;
        }
        ssChart.__lastAutoLabel = autoLabel;

        ssChart.data.datasets = [
            { label: currentLabel, data: paData, borderColor: accentColor, backgroundColor: 'transparent', borderDash: [], borderWidth: 2, pointRadius: 0, tension: 0.1 },
            { label: 'Continue (Pc)', data: upperData, borderColor: 'rgba(0,0,0,0)', backgroundColor: continueFill, fill: '-1', pointRadius: 0, tension: 0.1 },
            { label: 'Reject (Pr)', data: prData, borderColor: rejectColor, backgroundColor: 'transparent', borderDash: [6, 4], borderWidth: 2, pointRadius: 0, tension: 0.1 }
        ];
        ssChart.update();
        syncChartReference();
    }

    function clearChart() {
        if (ssChart) {
            ssChart.data.datasets = [];
            ssChart.update();
        }
        syncChartReference();
    }

    function doSsLookup() {
        const N = parseFloat(ssLotEl && ssLotEl.value);
        const level = ssLevelSel && ssLevelSel.value;
        let aqlStr;
        let code0;
        let finalPlan;
        let code;
        let c;
        let re;
        let n;
        let note = '-';
        const dist = ssDistSel && ssDistSel.value;
        let p;
        let Pa;
        let Pr = 0;
        let Pc = 0;

        if (ssErrEl) ssErrEl.style.display = 'none';
        if (!(N > 0)) {
            if (ssErrEl) {
                ssErrEl.textContent = 'Invalid lot size.';
                ssErrEl.style.display = 'block';
            }
            return;
        }

        if (ssAqlSel && ssAqlSel.value === 'custom') {
            const aqlNum = parseFloat(ssAqlCustomEl && ssAqlCustomEl.value);
            if (!(aqlNum > 0)) {
                if (ssErrEl) {
                    ssErrEl.textContent = 'Custom AQL must be > 0.';
                    ssErrEl.style.display = 'block';
                }
                return;
            }
            aqlStr = aqlNum.toString();
        } else {
            aqlStr = ssAqlSel && ssAqlSel.value;
        }

        code0 = getCodeLetter(N, level);
        if (!code0) {
            if (ssErrEl) {
                ssErrEl.textContent = 'No code letter for inputs.';
                ssErrEl.style.display = 'block';
            }
            return;
        }

        finalPlan = findFinalPlan(code0, aqlStr);
        if (!finalPlan.finalLetter || typeof finalPlan.finalAc !== 'number') {
            if (ssErrEl) {
                ssErrEl.textContent = 'No numeric acceptance number found for this AQL in the selected state.';
                ssErrEl.style.display = 'block';
            }
            clearChart();
            return;
        }

        code = finalPlan.finalLetter;
        c = finalPlan.finalAc;
        re = typeof finalPlan.finalRe === 'number' ? finalPlan.finalRe : (c != null ? c + 1 : null);
        n = getSampleSizeFromCode(code);

        if (!n) {
            if (ssErrEl) {
                ssErrEl.textContent = 'No sample size for code letter in this state.';
                ssErrEl.style.display = 'block';
            }
            return;
        }

        if (code !== code0) note = 'Resolved by ' + code0 + ' -> ' + code;

        document.getElementById('ss_result_code').value = code;
        document.getElementById('ss_result_n').value = String(n);
        document.getElementById('ss_result_c').value = c == null ? '-' : String(c);
        if (document.getElementById('ss_result_re')) document.getElementById('ss_result_re').value = re == null ? '-' : String(re);
        document.getElementById('ss_result_state').value = (ssStateSel && ssStateSel.value || 'normal').replace(/^./, function (match) { return match.toUpperCase(); });
        document.getElementById('ss_result_note').value = note;

        p = parseFloat(aqlStr) / 100;
        Pa = ssComputePa(dist, N, n, c, p);
        if (ssStateSel && ssStateSel.value === 'reduced' && re != null && re > c) {
            const cdfReMinus1 = ssComputePa(dist, N, n, re - 1, p);
            Pr = Math.max(0, 1 - cdfReMinus1);
            Pc = Math.max(0, 1 - Pa - Pr);
        } else {
            Pr = Math.max(0, 1 - Pa);
            Pc = 0;
        }

        if (document.getElementById('ss_result_pa')) document.getElementById('ss_result_pa').value = (Pa * 100).toFixed(2) + '%';
        if (document.getElementById('ss_result_prej')) document.getElementById('ss_result_prej').value = (Pr * 100).toFixed(2) + '%';
        if (document.getElementById('ss_result_pcont')) document.getElementById('ss_result_pcont').value = (Pc * 100).toFixed(2) + '%';

        if (n >= N) {
            if (ssErrEl) {
                ssErrEl.textContent = 'Sample size n=' + n + ' >= Lot size N=' + N + '. Consider 100% inspection instead of sampling.';
                ssErrEl.style.display = 'block';
            }
            ssLastPlan = { N: N, level: level, code: code, n: n, c: c, aql: aqlStr, dist: dist };
            clearChart();
            return;
        }

        ssLastPlan = { N: N, level: level, code: code, n: n, c: c, re: re, aql: aqlStr, dist: dist };
        if (c == null) {
            clearChart();
            return;
        }

        drawSsChart(N, n, c, aqlStr, code, level, dist);
    }

    function clearLookup() {
        ssLotEl.value = '500';
        populateInspectionLevels();
        populateAqlLevels();
        ssAqlCustomEl.value = '1.0';
        ssDistSel.value = 'binom';
        ssStateSel.value = 'normal';

        [
            'ss_result_code',
            'ss_result_n',
            'ss_result_c',
            'ss_result_re',
            'ss_result_state',
            'ss_result_note',
            'ss_result_pa',
            'ss_result_prej',
            'ss_result_pcont'
        ].forEach(function (id) {
            const el = document.getElementById(id);
            if (!el) return;
            el.value = id === 'ss_result_state' ? 'Normal' : '-';
        });

        clearChart();
        ssLastPlan = null;
        if (ssErrEl) ssErrEl.style.display = 'none';
        syncChartReference();
    }

    function exportPlan() {
        if (!ssLastPlan || ssLastPlan.c == null) {
            alert('No plan to export. Please lookup first.');
            return;
        }

        const distName = ssLastPlan.dist === 'hyper' ? 'Hypergeometric' : (ssLastPlan.dist === 'binom' ? 'Binomial' : 'Poisson');
        const customLabel = ssPlanLabelEl ? ssPlanLabelEl.value.trim() : '';
        const label = customLabel || ('AQL ' + ssLastPlan.aql + ' (Code ' + ssLastPlan.code + ', ' + distName + ')');
        const aql = parseFloat(ssLastPlan.aql);
        const paAql = calculateAcceptanceProbability(ssLastPlan.n, ssLastPlan.c, aql / 100, ssLastPlan.N, ssLastPlan.dist);
        const ltpd = aql * 2;
        const paLtpd = calculateAcceptanceProbability(ssLastPlan.n, ssLastPlan.c, ltpd / 100, ssLastPlan.N, ssLastPlan.dist);

        window.planComparisonQueue = window.planComparisonQueue || [];
        window.planComparisonQueue.push({
            n: ssLastPlan.n,
            c: ssLastPlan.c,
            aql: aql,
            label: label,
            dist: ssLastPlan.dist,
            N: ssLastPlan.N,
            source: 'aql',
            paAql: paAql,
            paLtpd: paLtpd,
            actualAlpha: 1 - paAql,
            actualBeta: paLtpd
        });
        alert('Exported to Plan Comparison queue. Switch to Multiple Plan Comparison to import.');
    }

    ssAqlSel && ssAqlSel.addEventListener('change', function () {
        ssAqlCustomEl.disabled = ssAqlSel.value !== 'custom';
        if (!ssAqlCustomEl.disabled) ssAqlCustomEl.focus();
    });

    if (ssAqlCustomEl && ssAqlCustomEl.closest('.custom-aql-group')) {
        ssAqlCustomEl.closest('.custom-aql-group').addEventListener('mousedown', function (e) {
            if (ssAqlCustomEl.disabled) {
                e.preventDefault();
                ssAqlSel.value = 'custom';
                ssAqlSel.dispatchEvent(new Event('change'));
                ssAqlCustomEl.focus();
            }
        });
    }

    ssLookupBtn && ssLookupBtn.addEventListener('click', doSsLookup);
    [ssLotEl, ssLevelSel, ssAqlSel, ssAqlCustomEl, ssStateSel, ssDistSel].forEach(function (el) {
        if (el) {
            el.addEventListener('change', doSsLookup);
            if (el.tagName === 'INPUT') el.addEventListener('input', doSsLookup);
        }
    });
    ssClearBtn && ssClearBtn.addEventListener('click', clearLookup);
    ssXMaxEl && ssXMaxEl.addEventListener('input', function () {
        if (ssLastPlan && ssLastPlan.c != null) {
            drawSsChart(ssLastPlan.N, ssLastPlan.n, ssLastPlan.c, ssLastPlan.aql, ssLastPlan.code, ssLastPlan.level, ssLastPlan.dist);
        }
    });
    ssExportPlanBtn && ssExportPlanBtn.addEventListener('click', exportPlan);

    populateInspectionLevels();
    populateAqlLevels();
    setTimeout(doSsLookup, 100);
    syncChartReference();

    return {
        getChart: function () { return ssChart; },
        getLastPlan: function () { return ssLastPlan; },
        recalculate: doSsLookup
    };
}
