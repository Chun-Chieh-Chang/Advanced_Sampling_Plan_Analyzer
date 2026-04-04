export function initDistributionPage(options) {
    const {
        document,
        window,
        Chart,
        calculateAcceptanceProbability,
        getEnhancedThemeColors,
        onChartChange
    } = options;

    const canvas = document.getElementById('ocChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const xMaxInit = parseFloat((document.getElementById('x_max')?.value) || '5');

    const ocCrosshairPlugin = {
        id: 'ocCrosshairPlugin',
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

            const ctxRef = chart.ctx;
            const area = chart.chartArea;
            if (!area) return;

            ctxRef.save();
            ctxRef.strokeStyle = 'rgba(199,202,207,0.5)';
            ctxRef.setLineDash([4, 4]);
            ctxRef.beginPath();
            ctxRef.moveTo(cx, area.top);
            ctxRef.lineTo(cx, area.bottom);
            ctxRef.stroke();
            ctxRef.beginPath();
            ctxRef.moveTo(area.left, cy);
            ctxRef.lineTo(area.right, cy);
            ctxRef.stroke();

            const xScaleRef = chart.scales && chart.scales.x;
            const yScaleRef = chart.scales && chart.scales.y;
            if (xScaleRef && yScaleRef) {
                const xVal = xScaleRef.getValueForPixel(cx);
                const yVal = yScaleRef.getValueForPixel(cy);
                if (isFinite(xVal) && isFinite(yVal)) {
                    const xTxt = xVal.toFixed(2) + '%';
                    const yTxt = (yVal * 100).toFixed(1) + '%';
                    const label = 'p=' + xTxt + ' , Pa=' + yTxt;
                    ctxRef.fillStyle = 'rgba(28,42,54,0.9)';
                    ctxRef.strokeStyle = 'rgba(64,84,102,0.9)';
                    ctxRef.setLineDash([]);
                    const pad = 6;
                    ctxRef.font = '12px sans-serif';
                    const w = ctxRef.measureText(label).width + pad * 2;
                    const h = 20;
                    const bx = Math.min(Math.max(area.left, cx + 8), area.right - w);
                    const by = Math.max(area.top, cy - h - 8);
                    ctxRef.beginPath();
                    if (ctxRef.roundRect) ctxRef.roundRect(bx, by, w, h, 6);
                    else ctxRef.rect(bx, by, w, h);
                    ctxRef.fill();
                    ctxRef.stroke();
                    ctxRef.fillStyle = '#e6e9ee';
                    ctxRef.fillText(label, bx + pad, by + 14);
                }
            }

            ctxRef.restore();
        }
    };

    const ocChart = new Chart(ctx, {
        type: 'line',
        data: { datasets: [] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: {
                legend: { position: 'top', labels: { color: getEnhancedThemeColors().text } },
                tooltip: {
                    enabled: true,
                    callbacks: {
                        label: function (context) {
                            const x = context.parsed && context.parsed.x;
                            const y = context.parsed && context.parsed.y;
                            const datasetLabel = context.dataset.label || '';
                            const xText = (isFinite(x) ? (+x).toFixed(x < 1 ? 3 : 2) : '-');
                            const yText = (isFinite(y) ? (y * 100).toFixed(1) : '-');
                            return `${datasetLabel}: p=${xText}%, Pa=${yText}%`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    title: { display: true, text: 'Defect Rate (p%)', color: getEnhancedThemeColors().text },
                    max: xMaxInit,
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
        plugins: [ocCrosshairPlugin]
    });

    if (onChartChange) onChartChange(ocChart);

    const distLotSizeEl = document.getElementById('dist_lot_size');
    const distNEl = document.getElementById('dist_n');
    const distCEl = document.getElementById('dist_c');
    const xMaxEl = document.getElementById('x_max');
    const btns = Array.from(document.querySelectorAll('[data-dist]'));
    const distState = { hyper: true, binom: true, pois: true };

    function syncButtons() {
        btns.forEach(b => {
            const key = b.getAttribute('data-dist');
            b.classList.toggle('primary', !!distState[key]);
        });
    }

    function generatePValues(maxXPercent) {
        const step = 0.05;
        const num = Math.floor(maxXPercent / step) + 1;
        return Array.from({ length: num }, (_, i) => +(i * step).toFixed(2));
    }

    function getPaBinomial(n, c, p) {
        return calculateAcceptanceProbability(n, c, p, undefined, 'binom');
    }

    function getPaPoisson(n, c, p) {
        return calculateAcceptanceProbability(n, c, p, undefined, 'pois');
    }

    function getPaHyper(N, n, c, p) {
        return calculateAcceptanceProbability(n, c, p, N, 'hyper');
    }

    function updateDistributionChart() {
        const N = parseInt(distLotSizeEl?.value || '10000', 10);
        const n = parseInt(distNEl?.value || '125', 10);
        const c = parseInt(distCEl?.value || '2', 10);
        const maxX = parseFloat(xMaxEl?.value || '5');
        if (isNaN(N) || N < 1 || isNaN(n) || n < 1 || isNaN(c) || c < 0 || isNaN(maxX) || maxX <= 0) return;

        const pValuesPercent = generatePValues(maxX);
        ocChart.options.scales.x.max = maxX;
        const datasets = [];
        const colors = {
            hyper: 'rgba(241,196,15,1)',
            binom: 'rgba(46,204,113,1)',
            pois: 'rgba(231,76,60,1)'
        };

        if (distState.hyper) {
            datasets.push({
                label: 'Hypergeometric',
                data: pValuesPercent.map(px => ({ x: px, y: getPaHyper(N, n, c, px / 100) })),
                borderColor: colors.hyper,
                backgroundColor: 'rgba(241,196,15,0.25)',
                borderDash: [],
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.1
            });
        }

        if (distState.binom) {
            datasets.push({
                label: 'Binomial',
                data: pValuesPercent.map(px => ({ x: px, y: getPaBinomial(n, c, px / 100) })),
                borderColor: colors.binom,
                backgroundColor: 'rgba(46,204,113,0.25)',
                borderDash: [6, 4],
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.1
            });
        }

        if (distState.pois) {
            datasets.push({
                label: 'Poisson',
                data: pValuesPercent.map(px => ({ x: px, y: getPaPoisson(n, c, px / 100) })),
                borderColor: colors.pois,
                backgroundColor: 'rgba(231,76,60,0.25)',
                borderDash: [2, 2],
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.1
            });
        }

        ocChart.data.datasets = datasets;
        ocChart.update();
    }

    syncButtons();

    btns.forEach(b => b.addEventListener('click', () => {
        const key = b.getAttribute('data-dist');
        distState[key] = !distState[key];
        syncButtons();
        updateDistributionChart();
    }));

    [distLotSizeEl, distNEl, distCEl, xMaxEl].forEach(el => {
        el?.addEventListener('input', () => {
            updateDistributionChart();
        });
    });

    const exportBtn = document.getElementById('dist_export_plan');
    exportBtn?.addEventListener('click', function () {
        const N = parseInt(document.getElementById('dist_lot_size')?.value || '0', 10);
        const n = parseInt(document.getElementById('dist_n')?.value || '0', 10);
        const c = parseInt(document.getElementById('dist_c')?.value || '0', 10);

        if (isNaN(N) || N < 1 || isNaN(n) || n < 1 || isNaN(c) || c < 0) {
            window.alert('Please enter valid parameters (N, n, c).');
            return;
        }
        if (n > N) {
            window.alert('Sample size (n) cannot be larger than Lot size (N).');
            return;
        }

        let dist = 'binom';
        if (distState.hyper) dist = 'hyper';
        else if (distState.binom) dist = 'binom';
        else if (distState.pois) dist = 'pois';

        window.planComparisonQueue = window.planComparisonQueue || [];
        const distName = dist === 'hyper' ? 'Hypergeometric' : (dist === 'binom' ? 'Binomial' : 'Poisson');
        const customLabel = document.getElementById('dist_plan_label')?.value.trim();
        const label = customLabel || ('Dist Plan (n=' + n + ', c=' + c + ', ' + distName + ')');

        window.planComparisonQueue.push({
            n: n,
            c: c,
            aql: null,
            label: label,
            dist: dist,
            N: N,
            source: 'distribution'
        });

        window.alert('Plan (n=' + n + ', c=' + c + ') exported to Comparison queue. Switch to Multiple Plan Comparison to import.');
    });

    updateDistributionChart();
}
