export function initReversePage(deps) {
    const {
        document,
        window,
        Chart,
        calculateAcceptanceProbability,
        getEnhancedThemeColors,
        onChartChange
    } = deps;

    const revLotEl = document.getElementById('rev_lot_size');
    const revNEl = document.getElementById('rev_n');
    const revCEl = document.getElementById('rev_c');
    const revAqlEl = document.getElementById('rev_aql');
    const revTargetPaEl = document.getElementById('rev_target_pa');
    const revTargetParamSel = document.getElementById('rev_target_param');
    const revDistSel = document.getElementById('rev_dist_select');
    const revCalcBtn = document.getElementById('rev_calc_btn');
    const revClearBtn = document.getElementById('rev_clear_btn');
    const revErrEl = document.getElementById('rev_error');
    const revXMaxEl = document.getElementById('rev_x_max');
    const revCanvas = document.getElementById('ocChartREV');
    const revPlanLabelEl = document.getElementById('rev_plan_label');
    const revExportPlanBtn = document.getElementById('rev_export_plan');
    const revInfoEl = document.getElementById('rev_info');

    let revChart = null;
    let revLastPlan = null;
    let revLastBracket = null;
    let revLastTargetParam = null;
    let revPlanChoice = 'upper';

    function syncChartReference() {
        if (typeof onChartChange === 'function') {
            onChartChange(revChart);
        }
        window.reversePageState = {
            chart: revChart,
            lastPlan: revLastPlan,
            lastBracket: revLastBracket,
            lastTargetParam: revLastTargetParam,
            planChoice: revPlanChoice
        };
    }

    function ensureRevChart() {
        if (revChart || !revCanvas) return revChart;

        const revCrosshairPlugin = {
            id: 'revCrosshairPlugin',
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

        revChart = new Chart(revCanvas.getContext('2d'), {
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
                        ticks: { color: getEnhancedThemeColors().text },
                        border: { color: getEnhancedThemeColors().grid }
                    },
                    y: {
                        min: 0,
                        max: 1,
                        title: { display: true, text: 'Acceptance Probability (Pa%)', color: getEnhancedThemeColors().text },
                        ticks: {
                            callback: function (v) { return (v * 100).toFixed(0) + '%'; },
                            color: getEnhancedThemeColors().text
                        },
                        grid: { display: true, color: getEnhancedThemeColors().grid },
                        border: { color: getEnhancedThemeColors().grid }
                    }
                }
            },
            plugins: [revCrosshairPlugin]
        });

        syncChartReference();
        return revChart;
    }

    function revComputePa(dist, N, n, c, p) {
        return calculateAcceptanceProbability(n, c, p, N, dist);
    }

    function revGeneratePValues(maxXPercent) {
        const step = 0.05;
        const num = Math.floor(maxXPercent / step) + 1;
        return Array.from({ length: num }, function (_, i) { return +(i * step).toFixed(2); });
    }

    function drawRevChart(N, n, c, aql, dist) {
        const maxX = parseFloat(revXMaxEl && revXMaxEl.value || '5');
        const xs = revGeneratePValues(maxX);
        const colors = getEnhancedThemeColors();
        const accentColor = colors.accent || '#7863ff';
        const autoLabel = 'Reverse (n=' + n + ', c=' + c + ', AQL=' + aql.toFixed(3) + '%, N=' + N + ')';
        let currentLabel = revPlanLabelEl ? revPlanLabelEl.value.trim() : '';

        ensureRevChart();
        revChart.options.scales.x.max = maxX;

        if (!currentLabel || currentLabel === 'Reverse Query Plan' || currentLabel === revChart.__lastAutoLabel) {
            if (revPlanLabelEl) revPlanLabelEl.value = autoLabel;
            currentLabel = autoLabel;
        }
        revChart.__lastAutoLabel = autoLabel;

        revChart.data.datasets = [{
            label: currentLabel,
            data: xs.map(function (px) { return { x: px, y: revComputePa(dist, N, n, c, px / 100) }; }),
            borderColor: accentColor,
            backgroundColor: accentColor + '40',
            borderDash: [],
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.1
        }];
        revChart.update();
        syncChartReference();
    }

    function renderPlanLines(lower, upper, label, dist) {
        const distName = dist === 'hyper' ? 'Hypergeometric' : (dist === 'binom' ? 'Binomial' : 'Poisson');
        let html = '';

        function lineHtml(id, title, plan) {
            if (!plan) return '';
            return '<div id="' + id + '" style="cursor:pointer; padding: 8px; border: 1px solid #424242; border-radius: 4px; margin: 4px 0; background: rgba(60, 60, 60, 0.8); color: white; font-weight: bold;">' +
                '<strong>' + title + '</strong>  ' + label + '=' + plan.value + '  |  Pa=' + (plan.pa * 100).toFixed(2) + '%  |  ' + distName + '</div>';
        }

        html += lineHtml('rev_plan1', 'Plan1', lower);
        html += lineHtml('rev_plan2', 'Plan2', upper);
        return html;
    }

    function choosePlan(choice) {
        let N = parseFloat(revLotEl.value);
        let n = parseFloat(revNEl.value);
        let c = parseFloat(revCEl.value);
        const aql = parseFloat(revAqlEl.value);
        const dist = revDistSel.value;
        const target = parseFloat(revTargetPaEl.value) / 100;
        const selected = choice === 'upper' ? revLastBracket && revLastBracket.upper : revLastBracket && revLastBracket.lower;
        const p1 = document.getElementById('rev_plan1');
        const p2 = document.getElementById('rev_plan2');

        if (!revLastBracket || !revLastTargetParam || !selected) return;

        revPlanChoice = choice;
        if (revLastTargetParam === 'N') N = selected.value;
        if (revLastTargetParam === 'n') n = selected.value;
        if (revLastTargetParam === 'c') c = selected.value;

        highlightSolvedInput(revLastTargetParam, N, n, c, aql, target);
        revLastPlan = { N: Math.round(N), n: Math.round(n), c: Math.round(c), aql: +aql, dist: dist, targetPa: target };
        drawRevChart(revLastPlan.N, revLastPlan.n, revLastPlan.c, revLastPlan.aql, revLastPlan.dist);

        if (p1) {
            p1.style.border = choice === 'lower' ? '2px solid #1783FF' : '1px solid #424242';
            p1.style.background = choice === 'lower' ? 'rgba(45, 45, 45, 0.9)' : 'rgba(60, 60, 60, 0.8)';
        }
        if (p2) {
            p2.style.border = choice === 'upper' ? '2px solid #1783FF' : '1px solid #424242';
            p2.style.background = choice === 'upper' ? 'rgba(45, 45, 45, 0.9)' : 'rgba(60, 60, 60, 0.8)';
        }
        syncChartReference();
    }

    function attachPlanChoiceHandlers() {
        const p1 = document.getElementById('rev_plan1');
        const p2 = document.getElementById('rev_plan2');

        function bind(el, choice) {
            if (!el) return;
            el.setAttribute('role', 'button');
            el.setAttribute('tabindex', '0');
            el.style.userSelect = 'none';
            el.style.pointerEvents = 'auto';
            el.addEventListener('click', function (e) {
                e.preventDefault();
                choosePlan(choice);
            });
            el.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    choosePlan(choice);
                }
            });
            el.addEventListener('mouseenter', function () {
                el.style.background = 'rgba(80, 80, 80, 0.8)';
            });
            el.addEventListener('mouseleave', function () {
                el.style.background = choice === revPlanChoice ? 'rgba(45, 45, 45, 0.9)' : 'rgba(60, 60, 60, 0.8)';
            });
        }

        bind(p1, 'lower');
        bind(p2, 'upper');
    }

    function syncReverseDisabledInputs() {
        const target = revTargetParamSel && revTargetParamSel.value;
        [revLotEl, revNEl, revCEl, revAqlEl, revTargetPaEl].forEach(function (el) {
            if (el) {
                el.disabled = false;
                el.style.color = '';
            }
        });

        if (target === 'N' && revLotEl) {
            revLotEl.disabled = true;
            revLotEl.value = '';
        } else if (target === 'n' && revNEl) {
            revNEl.disabled = true;
            revNEl.value = '';
        } else if (target === 'c' && revCEl) {
            revCEl.disabled = true;
            revCEl.value = '';
        } else if (target === 'aql' && revAqlEl) {
            revAqlEl.disabled = true;
            revAqlEl.value = '';
        } else if (target === 'targetPa' && revTargetPaEl) {
            revTargetPaEl.disabled = true;
            revTargetPaEl.value = '';
        }
    }

    function highlightSolvedInput(targetParam, N, n, c, aql, targetPa) {
        const solvedColor = '#f56c6c';

        [revLotEl, revNEl, revCEl, revAqlEl, revTargetPaEl].forEach(function (el) {
            if (el) el.style.color = '';
        });

        if (targetParam === 'N' && revLotEl) {
            revLotEl.value = String(Math.round(N));
            revLotEl.style.color = solvedColor;
        } else if (targetParam === 'n' && revNEl) {
            revNEl.value = String(Math.round(n));
            revNEl.style.color = solvedColor;
        } else if (targetParam === 'c' && revCEl) {
            revCEl.value = String(Math.round(c));
            revCEl.style.color = solvedColor;
        } else if (targetParam === 'aql' && revAqlEl) {
            revAqlEl.value = isFinite(aql) ? (+aql).toFixed(aql < 1 ? 3 : 2) : '-';
            revAqlEl.style.color = solvedColor;
        } else if (targetParam === 'targetPa' && revTargetPaEl) {
            revTargetPaEl.value = isFinite(targetPa) ? (targetPa * 100).toFixed(1) : '-';
            revTargetPaEl.style.color = solvedColor;
        }
    }

    function solveForAql(targetPa, dist, N, n, c) {
        let lo = 0;
        let hi = 1;
        let mid = 0;

        for (let i = 0; i < 50; i++) {
            mid = (lo + hi) / 2;
            if (revComputePa(dist, N, n, c, mid) < targetPa) hi = mid;
            else lo = mid;
        }
        return mid * 100;
    }

    function solveForC(targetPa, dist, N, n, aqlPercent) {
        const p = aqlPercent / 100;
        let lower = null;
        let upper = null;

        for (let c = 0; c <= n; c++) {
            const pa = revComputePa(dist, N, n, c, p);
            if (pa >= targetPa) {
                upper = { value: c, pa: pa };
                lower = lower || { value: Math.max(0, c - 1), pa: revComputePa(dist, N, n, Math.max(0, c - 1), p) };
                break;
            }
            lower = { value: c, pa: pa };
        }
        return { lower: lower, upper: upper };
    }

    function solveForNBounded(targetPa, dist, n, c, aqlPercent) {
        const p = aqlPercent / 100;
        const Nmin = Math.max(1, Math.round(n));
        const paAtMin = revComputePa(dist, Nmin, n, c, p);
        let loN = Nmin;
        let loPa = paAtMin;
        let hiN = Math.max(Nmin + 1, Math.floor(Nmin * 2));
        const MAX_N = 10000000;
        let hiPa;
        let left;
        let right;
        let best;
        let bestPa;

        if (paAtMin >= targetPa) {
            return { lower: null, upper: { value: Nmin, pa: paAtMin } };
        }

        hiPa = revComputePa(dist, hiN, n, c, p);
        while (hiPa < targetPa && hiN < MAX_N) {
            loN = hiN;
            loPa = hiPa;
            hiN = Math.min(MAX_N, Math.floor(hiN * 2));
            if (hiN <= loN) hiN = loN + 1;
            hiPa = revComputePa(dist, hiN, n, c, p);
        }

        if (hiPa < targetPa) {
            return { lower: { value: loN, pa: loPa }, upper: null };
        }

        left = loN;
        right = hiN;
        best = hiN;
        bestPa = hiPa;

        for (let i = 0; i < 60 && left <= right; i++) {
            const mid = Math.floor((left + right) / 2);
            const pa = revComputePa(dist, mid, n, c, p);
            if (pa >= targetPa) {
                best = mid;
                bestPa = pa;
                right = mid - 1;
            } else {
                left = mid + 1;
            }
        }

        return {
            lower: { value: loN, pa: loPa },
            upper: { value: best, pa: bestPa }
        };
    }

    function solveForSampleSize(targetPa, dist, N, c, aqlPercent) {
        const p = aqlPercent / 100;
        const maxN = Math.max(1, Math.min(N || 200000, 200000));
        let lo = 1;
        let hi = maxN;
        let paLo = revComputePa(dist, N, lo, c, p);
        let paHi = revComputePa(dist, N, hi, c, p);
        let lower;
        let upper;

        if (paLo <= targetPa) {
            return { lower: null, upper: { value: lo, pa: paLo } };
        }
        if (paHi >= targetPa) {
            return { lower: { value: hi, pa: paHi }, upper: null };
        }

        lower = { value: lo, pa: paLo };
        upper = { value: hi, pa: paHi };

        while (lo + 1 < hi) {
            const mid = Math.floor((lo + hi) / 2);
            const pa = revComputePa(dist, N, mid, c, p);
            if (pa >= targetPa) {
                lo = mid;
                lower = { value: mid, pa: pa };
            } else {
                hi = mid;
                upper = { value: mid, pa: pa };
            }
        }

        return { lower: lower, upper: upper };
    }

    function solveForTargetPa(dist, N, n, c, aqlPercent) {
        return revComputePa(dist, N, n, c, aqlPercent / 100) * 100;
    }

    function doReverseCalc() {
        const dist = revDistSel.value;
        const targetParam = revTargetParamSel.value;
        let target = parseFloat(revTargetPaEl.value) / 100;
        let N = parseFloat(revLotEl.value);
        let n = parseFloat(revNEl.value);
        let c = parseFloat(revCEl.value);
        let aql = parseFloat(revAqlEl.value);
        let infoHidden = true;
        let infoText = '';

        revErrEl.style.display = 'none';

        if (targetParam !== 'targetPa' && !(target > 0 && target < 1)) {
            revErrEl.textContent = 'Target Pa must be between 0 and 100.';
            revErrEl.style.display = 'block';
            return;
        }
        if (targetParam !== 'N' && !(N > 0)) {
            revErrEl.textContent = 'Invalid N.';
            revErrEl.style.display = 'block';
            return;
        }
        if (targetParam !== 'n' && !(n > 0)) {
            revErrEl.textContent = 'Invalid n.';
            revErrEl.style.display = 'block';
            return;
        }
        if (targetParam !== 'c' && !(c >= 0)) {
            revErrEl.textContent = 'Invalid c.';
            revErrEl.style.display = 'block';
            return;
        }
        if (targetParam !== 'aql' && !(aql > 0)) {
            revErrEl.textContent = 'Invalid AQL.';
            revErrEl.style.display = 'block';
            return;
        }
        if (dist !== 'hyper' && targetParam === 'N') {
            revErrEl.textContent = 'For Binomial/Poisson, N has no effect; cannot solve N.';
            revErrEl.style.display = 'block';
            return;
        }

        revPlanChoice = 'upper';

        if (targetParam === 'aql') {
            aql = solveForAql(target, dist, N, n, c);
            revLastBracket = null;
            revLastTargetParam = null;
        } else if (targetParam === 'c') {
            revLastBracket = solveForC(target, dist, N, n, aql);
            revLastTargetParam = 'c';
            c = ((revLastBracket.upper || revLastBracket.lower) && ((revPlanChoice === 'lower' ? revLastBracket.lower : revLastBracket.upper) || revLastBracket.upper || revLastBracket.lower)).value;
            infoHidden = false;
            infoText = renderPlanLines(revLastBracket.lower, revLastBracket.upper, 'c', dist);
        } else if (targetParam === 'n') {
            revLastBracket = solveForSampleSize(target, dist, N, c, aql);
            revLastTargetParam = 'n';
            n = ((revLastBracket.upper || revLastBracket.lower) && ((revPlanChoice === 'lower' ? revLastBracket.lower : revLastBracket.upper) || revLastBracket.upper || revLastBracket.lower)).value;
            infoHidden = false;
            infoText = renderPlanLines(revLastBracket.lower, revLastBracket.upper, 'n', dist);
        } else if (targetParam === 'N') {
            revLastBracket = solveForNBounded(target, dist, n, c, aql);
            revLastTargetParam = 'N';
            N = ((revLastBracket.upper || revLastBracket.lower) && ((revPlanChoice === 'lower' ? revLastBracket.lower : revLastBracket.upper) || revLastBracket.upper || revLastBracket.lower)).value;
            infoHidden = false;
            infoText = renderPlanLines(revLastBracket.lower, revLastBracket.upper, 'N', dist);
        } else if (targetParam === 'targetPa') {
            target = solveForTargetPa(dist, N, n, c, aql) / 100;
            revLastBracket = null;
            revLastTargetParam = null;
        }

        if (revInfoEl) {
            revInfoEl.style.display = infoHidden ? 'none' : 'block';
            revInfoEl.innerHTML = infoText;
            if (!infoHidden) attachPlanChoiceHandlers();
        }

        highlightSolvedInput(targetParam, N, n, c, aql, target);
        revLastPlan = {
            N: Math.round(N),
            n: Math.round(n),
            c: Math.round(c),
            aql: +aql,
            dist: dist,
            targetPa: target
        };
        drawRevChart(revLastPlan.N, revLastPlan.n, revLastPlan.c, revLastPlan.aql, revLastPlan.dist);
    }

    function clearReverse() {
        revLotEl.value = '500';
        revNEl.value = '125';
        revCEl.value = '1';
        revAqlEl.value = '1.0';
        revTargetPaEl.value = '95';
        revDistSel.value = 'binom';
        revTargetParamSel.value = 'aql';
        revXMaxEl.value = '5';

        if (revChart) {
            revChart.data.datasets = [];
            revChart.update();
        }
        [revLotEl, revNEl, revCEl, revAqlEl, revTargetPaEl].forEach(function (el) {
            if (el) {
                el.disabled = false;
                el.style.color = '';
            }
        });
        if (revInfoEl) {
            revInfoEl.style.display = 'none';
            revInfoEl.innerHTML = '';
        }

        syncReverseDisabledInputs();
        revLastPlan = null;
        revLastBracket = null;
        revLastTargetParam = null;
        revErrEl.style.display = 'none';
        syncChartReference();
    }

    function exportPlan() {
        if (!revLastPlan) {
            alert('No plan to export. Please calculate first.');
            return;
        }

        const distName = revLastPlan.dist === 'hyper' ? 'Hypergeometric' : (revLastPlan.dist === 'binom' ? 'Binomial' : 'Poisson');
        const customLabel = revPlanLabelEl ? revPlanLabelEl.value.trim() : '';
        const label = customLabel || ('Reverse n=' + revLastPlan.n + ', c=' + revLastPlan.c + ' (' + distName + ')');
        const aql = revLastPlan.aql;
        const paAql = calculateAcceptanceProbability(revLastPlan.n, revLastPlan.c, aql / 100, revLastPlan.N, revLastPlan.dist);
        const ltpd = aql * 2;
        const paLtpd = calculateAcceptanceProbability(revLastPlan.n, revLastPlan.c, ltpd / 100, revLastPlan.N, revLastPlan.dist);

        window.planComparisonQueue = window.planComparisonQueue || [];
        window.planComparisonQueue.push({
            n: revLastPlan.n,
            c: revLastPlan.c,
            aql: aql,
            label: label,
            dist: revLastPlan.dist,
            N: revLastPlan.N,
            source: 'reverse',
            paAql: paAql,
            paLtpd: paLtpd,
            actualAlpha: 1 - paAql,
            actualBeta: paLtpd
        });
        alert('Exported to Plan Comparison queue. Switch to Multiple Plan Comparison to import.');
    }

    revCalcBtn?.addEventListener('click', doReverseCalc);
    [revTargetParamSel, revLotEl, revNEl, revCEl, revAqlEl, revTargetPaEl, revDistSel].forEach(function (el) {
        if (el) {
            el.addEventListener('change', doReverseCalc);
            if (el.tagName === 'INPUT') el.addEventListener('input', doReverseCalc);
        }
    });
    revTargetParamSel?.addEventListener('change', syncReverseDisabledInputs);
    revClearBtn?.addEventListener('click', clearReverse);
    revXMaxEl?.addEventListener('input', function () {
        if (revLastPlan) {
            drawRevChart(revLastPlan.N, revLastPlan.n, revLastPlan.c, revLastPlan.aql, revLastPlan.dist);
        }
    });
    revExportPlanBtn?.addEventListener('click', exportPlan);

    syncReverseDisabledInputs();
    setTimeout(doReverseCalc, 80);
    syncChartReference();

    return {
        getChart: function () { return revChart; },
        getLastPlan: function () { return revLastPlan; },
        recalculate: doReverseCalc
    };
}
