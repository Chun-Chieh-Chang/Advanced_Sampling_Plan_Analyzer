export function initC0Page(deps) {
    const {
        document,
        window,
        Chart,
        calculateAcceptanceProbability,
        getEnhancedThemeColors,
        C0_SAMPLING_TABLE,
        onChartChange
    } = deps;

    const c0LotEl = document.getElementById('c0_lot_size');
    const c0AqlSel = document.getElementById('c0_aql');
    const c0AqlCustomEl = document.getElementById('c0_aql_custom');
    const c0DistSel = document.getElementById('c0_dist_select');
    const c0LookupBtn = document.getElementById('c0_lookup_btn');
    const c0ClearBtn = document.getElementById('c0_clear_btn');
    const c0ErrEl = document.getElementById('c0_error');
    const c0XMaxEl = document.getElementById('c0_x_max');
    const c0Canvas = document.getElementById('ocChartC0');
    const c0PlanLabelEl = document.getElementById('c0_plan_label');
    const c0ExportPlanBtn = document.getElementById('c0_export_plan');
    const c0InputNEl = document.getElementById('c0_input_n');
    const c0InputNGroup = document.getElementById('c0_input_n_group');
    const c0AqlGroup = document.getElementById('c0_aql_group');
    const c0AqlCustomGroup = document.getElementById('c0_aql_custom_group');
    const c0ModeRadios = document.querySelectorAll('input[name="c0_mode"]');

    let c0Chart = null;
    let c0LastPlan = null;

    function syncChartReference() {
        if (typeof onChartChange === 'function') {
            onChartChange(c0Chart);
        }
        window.c0PageState = {
            chart: c0Chart,
            lastPlan: c0LastPlan
        };
    }

    function formatAqlLabel(value) {
        return (+value).toFixed(value < 1 ? 3 : 1);
    }

    function buildC0AqlOptions() {
        const keysSet = new Set();
        const keys = [];
        const custom = document.createElement('option');
        const desiredNum = 0.4;
        let desiredKey;

        if (!c0AqlSel) return;

        (C0_SAMPLING_TABLE || []).forEach(function (row) {
            Object.keys(row.samples).forEach(function (key) {
                keysSet.add(key);
            });
        });

        keys.push.apply(keys, Array.from(keysSet).filter(function (key) { return key !== 'null'; }));
        keys.sort(function (a, b) { return parseFloat(a) - parseFloat(b); });

        c0AqlSel.innerHTML = '';
        keys.forEach(function (key) {
            const num = parseFloat(key);
            const option = document.createElement('option');
            option.value = key;
            option.textContent = isNaN(num) ? key : formatAqlLabel(num);
            c0AqlSel.appendChild(option);
        });

        custom.value = 'custom';
        custom.textContent = 'Custom';
        c0AqlSel.appendChild(custom);

        desiredKey = keys.find(function (key) { return Math.abs(parseFloat(key) - desiredNum) < 1e-9; });
        if (!desiredKey) desiredKey = keys.includes('1.0') ? '1.0' : (keys[0] || 'custom');
        c0AqlSel.value = desiredKey;
        c0AqlCustomEl.disabled = c0AqlSel.value !== 'custom';
    }

    function ensureC0Chart() {
        if (c0Chart || !c0Canvas) return c0Chart;

        const c0CrosshairPlugin = {
            id: 'c0CrosshairPlugin',
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

        c0Chart = new Chart(c0Canvas.getContext('2d'), {
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
            plugins: [c0CrosshairPlugin]
        });

        syncChartReference();
        return c0Chart;
    }

    function generatePValues(maxXPercent) {
        const step = 0.05;
        const num = Math.floor(maxXPercent / step) + 1;
        return Array.from({ length: num }, function (_, i) { return +(i * step).toFixed(2); });
    }

    function computePa(dist, N, n, c, p) {
        return calculateAcceptanceProbability(n, c, p, N, dist);
    }

    function findLTPD10(dist, N, n) {
        const target = 0.10;
        const c = 0;
        let lo = 0;
        let hi = 1;
        let mid = 0;

        for (let i = 0; i < 40; i++) {
            mid = (lo + hi) / 2;
            if (computePa(dist, N, n, c, mid) > target) lo = mid;
            else hi = mid;
        }
        return mid * 100;
    }

    function updateC0Chart() {
        const maxX = parseFloat(c0XMaxEl && c0XMaxEl.value || '5');
        const xs = generatePValues(maxX);
        const colors = getEnhancedThemeColors();
        const accentColor = colors.accent || '#3b82f6';
        const autoLabel = 'C=0 Plan (n=' + c0LastPlan.n + ', c=0, AQL=' + formatAqlLabel(c0LastPlan.aql) + ', N=' + c0LastPlan.N + ')';
        let currentLabel = c0PlanLabelEl ? c0PlanLabelEl.value.trim() : '';

        if (!c0LastPlan) return;

        ensureC0Chart();
        c0Chart.options.scales.x.max = maxX;

        if (!currentLabel || currentLabel === 'C=0 Plan' || currentLabel === c0Chart.__lastAutoLabel) {
            if (c0PlanLabelEl) c0PlanLabelEl.value = autoLabel;
            currentLabel = autoLabel;
        }
        c0Chart.__lastAutoLabel = autoLabel;

        c0Chart.data.datasets = [{
            label: currentLabel,
            data: xs.map(function (px) { return { x: px, y: computePa(c0LastPlan.dist, c0LastPlan.N, c0LastPlan.n, 0, px / 100) }; }),
            borderColor: accentColor,
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [],
            pointRadius: 0,
            tension: 0.1
        }];
        c0Chart.update();
        syncChartReference();
    }

    function findC0SampleSizeFromTable(N, aqlValue) {
        const aqlStr = String(aqlValue);
        const aqlNum = parseFloat(aqlValue);

        for (let i = 0; i < (C0_SAMPLING_TABLE || []).length; i++) {
            const entry = C0_SAMPLING_TABLE[i];
            const min = entry.lot_range[0];
            const max = entry.lot_range[1];
            if (N >= min && (max === Infinity || N <= max)) {
                if (Object.prototype.hasOwnProperty.call(entry.samples, aqlStr)) return entry.samples[aqlStr];
                for (const key of Object.keys(entry.samples)) {
                    if (!isNaN(aqlNum) && Math.abs(parseFloat(key) - aqlNum) < 1e-9) {
                        return entry.samples[key];
                    }
                }
                return null;
            }
        }
        return null;
    }

    function findAqlFromC0Table(N, targetN) {
        for (let i = 0; i < (C0_SAMPLING_TABLE || []).length; i++) {
            const entry = C0_SAMPLING_TABLE[i];
            const min = entry.lot_range[0];
            const max = entry.lot_range[1];
            if (N >= min && (max === Infinity || N <= max)) {
                const keys = Object.keys(entry.samples)
                    .filter(function (key) { return entry.samples[key] !== null; })
                    .sort(function (a, b) { return parseFloat(a) - parseFloat(b); });
                for (const key of keys) {
                    if (entry.samples[key] === targetN) return key;
                }
                return null;
            }
        }
        return null;
    }

    function populateC0SampleSizes(N) {
        let entry = null;
        const sizes = new Set();

        if (!c0InputNEl) return;
        c0InputNEl.innerHTML = '';

        for (const row of C0_SAMPLING_TABLE || []) {
            const min = row.lot_range[0];
            const max = row.lot_range[1];
            if (N >= min && (max === Infinity || N <= max)) {
                entry = row;
                break;
            }
        }

        if (!entry) {
            const option = document.createElement('option');
            option.textContent = 'No plans for this Lot Size';
            c0InputNEl.appendChild(option);
            return;
        }

        Object.values(entry.samples).forEach(function (n) {
            if (n !== null) sizes.add(n);
        });

        Array.from(sizes).sort(function (a, b) { return a - b; }).forEach(function (n) {
            const option = document.createElement('option');
            option.value = n;
            option.textContent = n;
            c0InputNEl.appendChild(option);
        });

        if (c0InputNEl.options.length === 0) {
            const option = document.createElement('option');
            option.textContent = 'No valid plans';
            c0InputNEl.appendChild(option);
        }
    }

    function getSelectedMode() {
        return document.querySelector('input[name="c0_mode"]:checked')?.value || 'find_n';
    }

    function updateModeUi() {
        const mode = getSelectedMode();
        if (c0InputNGroup) c0InputNGroup.style.display = mode === 'find_aql' ? 'block' : 'none';
        if (c0AqlGroup) c0AqlGroup.style.display = mode === 'find_n' ? 'block' : 'none';
        if (c0AqlCustomGroup) c0AqlCustomGroup.style.display = mode === 'find_n' ? 'block' : 'none';
        if (mode === 'find_n') {
            c0AqlCustomEl.disabled = c0AqlSel.value !== 'custom';
        } else {
            populateC0SampleSizes(parseFloat(c0LotEl.value));
        }
    }

    function clearChart() {
        if (c0Chart) {
            c0Chart.data.datasets = [];
            c0Chart.update();
        }
        syncChartReference();
    }

    function doC0Lookup() {
        const N = parseFloat(c0LotEl.value);
        const basicValid = N > 0 && isFinite(N);
        const helperValid = typeof window.isC0LotSizeValid === 'function' ? window.isC0LotSizeValid(N) : true;
        const mode = getSelectedMode();
        const dist = c0DistSel.value;
        let n;
        let aqlDisplay;
        let aqlForLookup;

        if (c0ErrEl) c0ErrEl.style.display = 'none';
        if (!(basicValid && helperValid)) {
            c0ErrEl.textContent = 'Invalid lot size.';
            c0ErrEl.style.display = 'block';
            return;
        }

        if (mode === 'find_n') {
            if (c0AqlSel.value === 'custom') {
                const aqlNum = parseFloat(c0AqlCustomEl.value);
                if (!(aqlNum > 0)) {
                    c0ErrEl.textContent = 'Custom AQL must be > 0.';
                    c0ErrEl.style.display = 'block';
                    return;
                }
                aqlDisplay = formatAqlLabel(aqlNum) + '%';
                aqlForLookup = aqlNum;
            } else {
                aqlForLookup = c0AqlSel.value;
                aqlDisplay = c0AqlSel.options[c0AqlSel.selectedIndex]?.textContent || String(aqlForLookup) + '%';
            }

            n = findC0SampleSizeFromTable(N, aqlForLookup);
            if (!(n > 0)) {
                n = typeof window.lookupC0SampleSize === 'function'
                    ? window.lookupC0SampleSize(N, aqlForLookup)
                    : Math.max(1, Math.round(N * (parseFloat(aqlForLookup) || 0) / 100));
            }
            if (!(n > 0)) {
                c0ErrEl.textContent = 'No valid sample size found.';
                c0ErrEl.style.display = 'block';
                return;
            }
        } else {
            const targetN = parseInt(c0InputNEl.value, 10);
            const foundAqlKey = targetN > 0 ? findAqlFromC0Table(N, targetN) : null;
            if (!(targetN > 0)) {
                c0ErrEl.textContent = 'Invalid sample size.';
                c0ErrEl.style.display = 'block';
                return;
            }
            if (!foundAqlKey) {
                c0ErrEl.textContent = 'No standard C=0 plan found for N=' + N + ', n=' + targetN + '.';
                c0ErrEl.style.display = 'block';
                return;
            }
            aqlForLookup = foundAqlKey;
            aqlDisplay = formatAqlLabel(parseFloat(foundAqlKey)) + '%';
            n = targetN;
        }

        document.getElementById('c0_result_n').value = String(n);
        document.getElementById('c0_result_c').value = '0';
        document.getElementById('c0_result_aql').value = aqlDisplay;

        let rangeText = '-';
        for (const entry of C0_SAMPLING_TABLE || []) {
            const min = entry.lot_range[0];
            const max = entry.lot_range[1];
            if (N >= min && (max === Infinity || N <= max)) {
                rangeText = min + ' - ' + (max === Infinity ? 'Infinity' : max);
                break;
            }
        }
        document.getElementById('c0_result_lot_range').value = rangeText;
        document.getElementById('c0_result_lq10').value = findLTPD10(dist, N, n).toFixed(2) + ' %';

        c0LastPlan = {
            N: N,
            n: n,
            aql: typeof aqlForLookup === 'string' ? parseFloat(aqlForLookup) : aqlForLookup,
            dist: dist
        };
        updateC0Chart();
    }

    function clearLookup() {
        c0LotEl.value = '500';
        c0XMaxEl.value = '5';
        buildC0AqlOptions();
        c0AqlCustomEl.value = '1.0';
        c0DistSel.value = 'binom';

        const defaultMode = document.querySelector('input[name="c0_mode"][value="find_n"]');
        if (defaultMode) defaultMode.checked = true;
        updateModeUi();

        document.getElementById('c0_result_n').value = '-';
        document.getElementById('c0_result_c').value = '0';
        document.getElementById('c0_result_aql').value = '-';
        document.getElementById('c0_result_lot_range').value = '-';
        document.getElementById('c0_result_lq10').value = '-';

        clearChart();
        c0LastPlan = null;
        c0ErrEl.style.display = 'none';
        syncChartReference();
    }

    function exportPlan() {
        if (!c0LastPlan) {
            alert('No plan to export. Please lookup first.');
            return;
        }

        const distName = c0LastPlan.dist === 'hyper' ? 'Hypergeometric' : (c0LastPlan.dist === 'binom' ? 'Binomial' : 'Poisson');
        const customLabel = c0PlanLabelEl ? c0PlanLabelEl.value.trim() : '';
        const label = customLabel || ('C=0 n=' + c0LastPlan.n + ' @AQL=' + formatAqlLabel(c0LastPlan.aql) + '% (' + distName + ')');
        const aql = c0LastPlan.aql;
        const paAql = calculateAcceptanceProbability(c0LastPlan.n, 0, aql / 100, c0LastPlan.N, c0LastPlan.dist);
        const ltpd = aql * 2;
        const paLtpd = calculateAcceptanceProbability(c0LastPlan.n, 0, ltpd / 100, c0LastPlan.N, c0LastPlan.dist);

        window.planComparisonQueue = window.planComparisonQueue || [];
        window.planComparisonQueue.push({
            n: c0LastPlan.n,
            c: 0,
            aql: aql,
            label: label,
            dist: c0LastPlan.dist,
            N: c0LastPlan.N,
            source: 'c0',
            paAql: paAql,
            paLtpd: paLtpd,
            actualAlpha: 1 - paAql,
            actualBeta: paLtpd
        });
        alert('Exported to Plan Comparison queue. Switch to Multiple Plan Comparison to import.');
    }

    c0ModeRadios.forEach(function (radio) {
        radio.addEventListener('change', updateModeUi);
    });
    c0LotEl?.addEventListener('input', function () {
        if (getSelectedMode() === 'find_aql') {
            populateC0SampleSizes(parseFloat(c0LotEl.value));
        }
    });
    c0AqlSel?.addEventListener('change', function () {
        c0AqlCustomEl.disabled = c0AqlSel.value !== 'custom';
        if (!c0AqlCustomEl.disabled) c0AqlCustomEl.focus();
    });
    c0AqlCustomGroup?.addEventListener('mousedown', function (e) {
        if (c0AqlCustomEl.disabled) {
            e.preventDefault();
            c0AqlSel.value = 'custom';
            c0AqlSel.dispatchEvent(new Event('change'));
            c0AqlCustomEl.focus();
        }
    });
    c0LookupBtn?.addEventListener('click', doC0Lookup);
    [c0LotEl, c0AqlSel, c0AqlCustomEl, c0DistSel].forEach(function (el) {
        if (el) {
            el.addEventListener('change', doC0Lookup);
            if (el.tagName === 'INPUT') el.addEventListener('input', doC0Lookup);
        }
    });
    c0ClearBtn?.addEventListener('click', clearLookup);
    c0XMaxEl?.addEventListener('input', updateC0Chart);
    c0ExportPlanBtn?.addEventListener('click', exportPlan);

    buildC0AqlOptions();
    updateModeUi();
    setTimeout(doC0Lookup, 120);
    syncChartReference();

    return {
        getChart: function () { return c0Chart; },
        getLastPlan: function () { return c0LastPlan; },
        recalculate: doC0Lookup
    };
}
