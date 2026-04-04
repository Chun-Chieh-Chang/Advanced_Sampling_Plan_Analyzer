export function initComparisonPage(deps) {
    const {
        document,
        window,
        Chart,
        calculateAcceptanceProbability,
        calculateAOQL,
        calculateATI,
        getEnhancedThemeColors,
        onChartChange
    } = deps;

    const planCanvasEl = document.getElementById('ocChartPLAN');
    const planCtx = planCanvasEl ? planCanvasEl.getContext('2d') : null;
    const planLotSizeInput = document.getElementById('plan_lot_size_input');
    const planNInput = document.getElementById('plan_n_input');
    const planCInput = document.getElementById('plan_c_input');
    const planAqlInput = document.getElementById('plan_aql_input');
    const planLabelInput = document.getElementById('plan_label_input');
    const addPlanBtn = document.getElementById('add-plan-btn');
    const clearAllBtn = document.getElementById('clear-all-btn');
    const planListEl = document.getElementById('plan-list');
    const planXMaxEl = document.getElementById('plan_x_axis_max_input');
    const planImportBtn = document.getElementById('plan_import_btn');
    const showOcBtn = document.getElementById('show-oc-btn');
    const showAoqBtn = document.getElementById('show-aoq-btn');
    const showAtiBtn = document.getElementById('show-ati-btn');

    const planColors = ['#EF4444', '#F97316', '#FACC15', '#22C55E', '#3B82F6', '#A855F7', '#06B6D4', '#EC4899'];

    let planChart = null;
    let planCounter = 1;
    let samplingPlans = [];
    let currentCurveType = 'oc';

    window.__planLastAutoLabel = '';

    function syncChartReference() {
        window.planComparisonState = {
            chart: planChart,
            plans: samplingPlans.slice(),
            curveType: currentCurveType
        };
        if (typeof onChartChange === 'function') {
            onChartChange(planChart);
        }
    }

    function autoUpdatePlanLabel() {
        if (!planLabelInput) return;
        var n = planNInput ? planNInput.value : '';
        var c = planCInput ? planCInput.value : '';
        var aql = planAqlInput ? parseFloat(planAqlInput.value) : NaN;
        var aqlFmt = isNaN(aql) ? '' : (aql < 1 ? aql.toFixed(2) : aql.toFixed(1));
        var autoLabel = 'Plan (n=' + n + ', c=' + c + ', AQL=' + aqlFmt + '%)';
        var current = planLabelInput.value.trim();
        if (!current || current === window.__planLastAutoLabel) {
            planLabelInput.value = autoLabel;
            window.__planLastAutoLabel = autoLabel;
        }
    }

    [planNInput, planCInput, planAqlInput].forEach(function (el) {
        if (el) {
            el.addEventListener('input', autoUpdatePlanLabel);
            el.addEventListener('change', autoUpdatePlanLabel);
        }
    });
    autoUpdatePlanLabel();

    function ensurePlanChart() {
        if (planChart || !planCtx) return planChart;

        var legendLabels = {
            color: getEnhancedThemeColors().text,
            filter: function (item, chart) {
                var ds = chart.datasets && chart.datasets[item.datasetIndex];
                return !(ds && ds.type === 'scatter');
            }
        };
        var plugins = { legend: { display: true, labels: legendLabels } };
        var xScale = {
            type: 'linear',
            title: { display: true, text: 'Defect Rate (p%)', color: getEnhancedThemeColors().text },
            grid: { display: true, color: getEnhancedThemeColors().grid },
            ticks: { color: getEnhancedThemeColors().text }
        };
        var yTicks = { callback: function (v) { return (v * 100).toFixed(0) + '%'; } };
        var yScale = {
            min: 0,
            max: 1,
            title: { display: true, text: 'Acceptance Probability (Pa%)', color: getEnhancedThemeColors().text },
            ticks: Object.assign({}, yTicks, { color: getEnhancedThemeColors().text }),
            grid: { display: true, color: getEnhancedThemeColors().grid }
        };
        var scales = { x: xScale, y: yScale };
        plugins.tooltip = {
            enabled: true,
            callbacks: {
                label: function (context) {
                    var x = context.parsed && context.parsed.x;
                    var y = context.parsed && context.parsed.y;
                    var datasetLabel = context.dataset.label || '';
                    var xTxt = isFinite(x) ? (+x).toFixed(x < 1 ? 3 : 2) : '-';
                    var yTxt;

                    if (currentCurveType === 'aoq') {
                        yTxt = (isFinite(y) ? y.toFixed(2) : '-') + '%';
                    } else if (currentCurveType === 'ati') {
                        yTxt = isFinite(y) ? y.toFixed(0) : '-';
                    } else {
                        yTxt = (isFinite(y) ? (y * 100).toFixed(1) : '-') + '%';
                    }

                    if (context.dataset && context.dataset.type === 'scatter') {
                        var base = context.dataset._aqlLabel || 'AQL';
                        var scatterLabel = currentCurveType === 'aoq' ? 'AOQ' : (currentCurveType === 'ati' ? 'ATI' : 'Pa');
                        return base + ': p=' + xTxt + '% , ' + scatterLabel + '=' + yTxt;
                    }

                    var lineLabel = currentCurveType === 'aoq' ? 'AOQ' : (currentCurveType === 'ati' ? 'ATI' : 'Pa');
                    return datasetLabel + ': p=' + xTxt + '% , ' + lineLabel + '=' + yTxt;
                }
            }
        };

        var crosshairPlugin = {
            id: 'crosshairPlugin',
            afterEvent: function (chart, args) {
                var e = args.event;
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
                var cx = chart._crosshair && chart._crosshair.x;
                var cy = chart._crosshair && chart._crosshair.y;
                if (cx == null || cy == null) return;

                var ctx = chart.ctx;
                var area = chart.chartArea;
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

                var xScaleRef = chart.scales && chart.scales.x;
                var yScaleRef = chart.scales && chart.scales.y;
                if (xScaleRef && yScaleRef) {
                    var xVal = xScaleRef.getValueForPixel(cx);
                    var yVal = yScaleRef.getValueForPixel(cy);
                    if (isFinite(xVal) && isFinite(yVal)) {
                        var xTxt = xVal.toFixed(2) + '%';
                        var yTxt;
                        var yLabel;

                        if (currentCurveType === 'aoq') {
                            yLabel = 'AOQ';
                            yTxt = yVal.toFixed(2) + '%';
                        } else if (currentCurveType === 'ati') {
                            yLabel = 'ATI';
                            yTxt = yVal.toFixed(0);
                        } else {
                            yLabel = 'Pa';
                            yTxt = (yVal * 100).toFixed(1) + '%';
                        }

                        var label = 'p=' + xTxt + ' , ' + yLabel + '=' + yTxt;
                        var pad = 6;
                        var w;
                        var h = 20;
                        var bx;
                        var by;

                        ctx.fillStyle = 'rgba(28,42,54,0.9)';
                        ctx.strokeStyle = 'rgba(64,84,102,0.9)';
                        ctx.setLineDash([]);
                        ctx.font = '12px sans-serif';
                        w = ctx.measureText(label).width + pad * 2;
                        bx = Math.min(Math.max(area.left, cx + 8), area.right - w);
                        by = Math.max(area.top, cy - h - 8);
                        ctx.beginPath();
                        if (ctx.roundRect) {
                            ctx.roundRect(bx, by, w, h, 6);
                        } else {
                            ctx.rect(bx, by, w, h);
                        }
                        ctx.fill();
                        ctx.stroke();
                        ctx.fillStyle = '#e6e9ee';
                        ctx.fillText(label, bx + pad, by + 14);
                    }
                }
                ctx.restore();
            }
        };

        planChart = new Chart(planCtx, {
            type: 'line',
            data: { datasets: [] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: plugins,
                scales: scales
            },
            plugins: [crosshairPlugin]
        });
        syncChartReference();
        return planChart;
    }

    function genPValues(maxX) {
        var step = 0.05;
        var num = Math.floor(maxX / step) + 1;
        var arr = new Array(num);
        for (var i = 0; i < num; i++) {
            arr[i] = +(i * step).toFixed(2);
        }
        return arr;
    }

    function computePlanPa(dist, N, n, c, p) {
        return calculateAcceptanceProbability(n, c, p, N, dist);
    }

    function updateCurveButtons(activeType) {
        [showOcBtn, showAoqBtn, showAtiBtn].forEach(function (btn) {
            if (btn) {
                btn.classList.remove('primary');
                btn.classList.add('btn');
            }
        });

        if (activeType === 'oc' && showOcBtn) showOcBtn.classList.add('primary');
        else if (activeType === 'aoq' && showAoqBtn) showAoqBtn.classList.add('primary');
        else if (activeType === 'ati' && showAtiBtn) showAtiBtn.classList.add('primary');
    }

    function renderPlanList() {
        if (!planListEl) return;
        planListEl.innerHTML = '';
        for (var i = 0; i < samplingPlans.length; i++) {
            var p = samplingPlans[i];
            var li = document.createElement('li');
            var aqlTxt = p.aql == null ? 'No AQL' : 'AQL=' + (+p.aql).toFixed(2) + '%';
            var distTxt = p.dist ? (p.dist === 'hyper' ? 'Hypergeometric' : (p.dist === 'binom' ? 'Binomial' : 'Poisson')) : 'Binomial';
            var nTxt = p.N ? ', N=' + p.N : '';

            li.style.display = 'flex';
            li.style.justifyContent = 'space-between';
            li.style.alignItems = 'center';
            li.style.gap = '8px';
            li.style.padding = '8px';
            li.style.border = '1px solid var(--border)';
            li.style.borderRadius = '8px';
            li.innerHTML = '<span style="color:' + p.color + '; font-size: 0.85rem;">' + p.label + ': n=' + p.n + ', c=' + p.c + ', ' + aqlTxt + ' (' + distTxt + nTxt + ')</span><button class="btn" data-del="' + i + '">?</button>';
            planListEl.appendChild(li);
        }
        syncChartReference();
    }

    function updatePlanChart(curveType) {
        if (!planCtx) return;

        ensurePlanChart();
        currentCurveType = curveType || 'oc';

        var maxX = parseFloat(planXMaxEl.value || '5');
        var xs = genPValues(maxX);
        var datasets = [];

        planChart.options.scales.x.max = maxX;

        if (currentCurveType === 'aoq') {
            planChart.options.scales.y.title.text = 'Average Outgoing Quality (AOQ%)';
            planChart.options.scales.y.ticks.callback = function (v) { return v.toFixed(2) + '%'; };
            planChart.options.scales.y.min = 0;
            planChart.options.scales.y.max = undefined;
        } else if (currentCurveType === 'ati') {
            planChart.options.scales.y.title.text = 'Average Total Inspection (ATI)';
            planChart.options.scales.y.ticks.callback = function (v) { return v.toFixed(0); };
            planChart.options.scales.y.min = 0;
            planChart.options.scales.y.max = undefined;
        } else {
            planChart.options.scales.y.title.text = 'Acceptance Probability (Pa%)';
            planChart.options.scales.y.ticks.callback = function (v) { return (v * 100).toFixed(0) + '%'; };
            planChart.options.scales.y.min = 0;
            planChart.options.scales.y.max = 1;
        }

        for (var idx = 0; idx < samplingPlans.length; idx++) {
            var plan = samplingPlans[idx];
            var color = plan.color || planColors[idx % planColors.length];
            var data = [];
            var dist = plan.dist || 'binom';
            var N = plan.N || 10000;
            var label = plan.label;

            for (var j = 0; j < xs.length; j++) {
                var px = xs[j];
                var pa = computePlanPa(dist, N, plan.n, plan.c, px / 100);
                var y = pa;

                if (currentCurveType === 'aoq') {
                    y = calculateAOQL(plan.n, plan.c, px / 100, N, dist) * 100;
                } else if (currentCurveType === 'ati') {
                    y = calculateATI(plan.n, plan.c, px / 100, N, dist);
                }

                data.push({ x: px, y: y });
            }

            if (currentCurveType === 'aoq') label += ' (AOQ)';
            else if (currentCurveType === 'ati') label += ' (ATI)';

            datasets.push({
                label: label,
                data: data,
                borderColor: color,
                backgroundColor: color + '33',
                borderDash: [],
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.1
            });
        }

        planChart.data.datasets = datasets;

        if (currentCurveType === 'aoq' || currentCurveType === 'ati') {
            var maxY = 0;
            for (var i = 0; i < datasets.length; i++) {
                for (var j = 0; j < datasets[i].data.length; j++) {
                    var pointY = datasets[i].data[j].y;
                    if (isFinite(pointY) && pointY > maxY) {
                        maxY = pointY;
                    }
                }
            }
            if (maxY > 0) {
                planChart.options.scales.y.max = maxY * 1.1;
            }
        }

        planChart.options.plugins.legend.labels.color = getEnhancedThemeColors().text;
        planChart.options.scales.x.title.color = getEnhancedThemeColors().text;
        planChart.options.scales.x.grid.color = getEnhancedThemeColors().grid;
        planChart.options.scales.x.ticks.color = getEnhancedThemeColors().text;
        planChart.options.scales.y.title.color = getEnhancedThemeColors().text;
        planChart.options.scales.y.grid.color = getEnhancedThemeColors().grid;
        planChart.options.scales.y.ticks.color = getEnhancedThemeColors().text;

        planChart.update();
        renderPlanList();
        updateCurveButtons(currentCurveType);
        syncChartReference();
    }

    if (planListEl) {
        planListEl.addEventListener('click', function (e) {
            var t = e.target;
            if (t && t.getAttribute('data-del')) {
                var idx = +t.getAttribute('data-del');
                samplingPlans.splice(idx, 1);
                updatePlanChart(currentCurveType);
            }
        });
    }

    if (addPlanBtn) {
        addPlanBtn.addEventListener('click', function () {
            var n = parseInt(planNInput.value, 10);
            var c = parseInt(planCInput.value, 10);
            var N = parseInt(planLotSizeInput.value, 10) || 10000;
            var aqlStr = planAqlInput.value.trim();
            var label = planLabelInput.value.trim() || 'Plan ' + planCounter++;
            var aql = null;
            var color;

            if (!(n > 0) || !(c >= 0) || n < c) {
                alert('Please enter valid n and c (n>0, c>=0, n>=c).');
                return;
            }
            if (n > N) {
                alert('Sample size (n) cannot be larger than Lot size (N).');
                return;
            }
            if (aqlStr !== '') {
                aql = parseFloat(aqlStr);
                if (!(aql >= 0)) {
                    alert('AQL must be a non-negative number.');
                    return;
                }
            }

            color = planColors[samplingPlans.length % planColors.length];
            samplingPlans.push({ n: n, c: c, aql: aql, label: label, color: color, dist: 'binom', N: N, source: 'manual' });
            planLabelInput.value = '';
            planAqlInput.value = '';
            updatePlanChart(currentCurveType);
        });
    }

    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', function () {
            samplingPlans = [];
            planCounter = 1;
            updatePlanChart(currentCurveType);
        });
    }

    if (showOcBtn) {
        showOcBtn.addEventListener('click', function () {
            if (samplingPlans.length === 0) {
                alert('Please add at least one plan first.');
                return;
            }
            updatePlanChart('oc');
        });
    }

    if (showAoqBtn) {
        showAoqBtn.addEventListener('click', function () {
            if (samplingPlans.length === 0) {
                alert('Please add at least one plan first.');
                return;
            }
            updatePlanChart('aoq');
        });
    }

    if (showAtiBtn) {
        showAtiBtn.addEventListener('click', function () {
            if (samplingPlans.length === 0) {
                alert('Please add at least one plan first.');
                return;
            }
            updatePlanChart('ati');
        });
    }

    if (planXMaxEl) {
        planXMaxEl.addEventListener('input', function () {
            updatePlanChart(currentCurveType);
        });
    }

    if (planImportBtn) {
        planImportBtn.addEventListener('click', function () {
            var queue = window.planComparisonQueue || [];
            var added = 0;

            if (!Array.isArray(queue) || queue.length === 0) {
                alert('No exported plans found. Use Export to Plan Comparison on other pages first.');
                return;
            }

            for (var i = 0; i < queue.length; i++) {
                var q = queue[i];
                var n;
                var c;
                var aql;
                var label;
                var dist;
                var N;
                var color;

                if (!q) continue;
                n = parseInt(q.n, 10);
                c = parseInt(q.c, 10);
                if (!(n > 0) || !(c >= 0) || n < c) continue;

                aql = q.aql == null || isNaN(+q.aql) ? null : +q.aql;
                label = q.label || 'Imported ' + (i + 1);
                dist = q.dist || 'binom';
                N = q.N || 10000;
                color = planColors[samplingPlans.length % planColors.length];

                samplingPlans.push({ n: n, c: c, aql: aql, label: label, color: color, dist: dist, N: N, source: q.source });
                added++;
            }

            if (added === 0) {
                alert('No valid plans in queue to import.');
                return;
            }

            window.planComparisonQueue = [];
            updatePlanChart(currentCurveType);
            renderPlanList();
            alert('Imported ' + added + ' plan(s). Note: Plans from different pages may use different probability distributions (Hypergeometric/Binomial/Poisson).');
        });
    }

    if (planCtx) {
        ensurePlanChart();
        updatePlanChart('oc');
        updateCurveButtons('oc');
    } else {
        syncChartReference();
    }

    return {
        getChart: function () { return planChart; },
        getPlans: function () { return samplingPlans.slice(); },
        getCurveType: function () { return currentCurveType; },
        updateChart: updatePlanChart
    };
}
