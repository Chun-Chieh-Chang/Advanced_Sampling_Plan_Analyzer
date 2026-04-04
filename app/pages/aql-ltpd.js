export function initAqlLtpdPage(deps) {
    const {
        document,
        window,
        Chart,
        calculateAcceptanceProbability,
        calculateAOQL,
        calculateASN,
        calculateATI,
        calculateOptimalAqlLtpdPlan,
        calculatePlanEfficiency,
        getEnhancedThemeColors,
        onChartChange
    } = deps;

    const elements = {
        aqlInput: document.getElementById('aql_ltpd_aql_input'),
        ltpdInput: document.getElementById('aql_ltpd_ltpd_input'),
        lotSizeInput: document.getElementById('aql_ltpd_lot_size'),
        distSelect: document.getElementById('aql_ltpd_dist_select'),
        optimizationSelect: document.getElementById('aql_ltpd_optimization'),
        alphaInput: document.getElementById('aql_ltpd_alpha'),
        betaInput: document.getElementById('aql_ltpd_beta'),
        planLabelInput: document.getElementById('aql_ltpd_plan_label'),
        calculateBtn: document.getElementById('aql_ltpd_calculate_btn'),
        clearBtn: document.getElementById('aql_ltpd_clear_btn'),
        errorDiv: document.getElementById('aql_ltpd_error'),
        resultN: document.getElementById('aql_ltpd_result_n'),
        resultC: document.getElementById('aql_ltpd_result_c'),
        efficiency: document.getElementById('aql_ltpd_efficiency'),
        aqlPa: document.getElementById('aql_ltpd_aql_pa'),
        ltpdPa: document.getElementById('aql_ltpd_ltpd_pa'),
        actualAlpha: document.getElementById('aql_ltpd_actual_alpha'),
        actualBeta: document.getElementById('aql_ltpd_actual_beta'),
        aoql: document.getElementById('aql_ltpd_aoql'),
        asn: document.getElementById('aql_ltpd_asn'),
        efficiencyRating: document.getElementById('aql_ltpd_efficiency_rating'),
        improvements: document.getElementById('aql_ltpd_improvements'),
        notes: document.getElementById('aql_ltpd_notes'),
        xMaxInput: document.getElementById('aql_ltpd_x_max'),
        exportPlanBtn: document.getElementById('aql_ltpd_export_plan')
    };

    let aqlLtpdChart = null;
    let aqlLtpdLastPlan = null;

    function syncChartReference() {
        if (typeof onChartChange === 'function') {
            onChartChange(aqlLtpdChart);
        }
        window.aqlLtpdPageState = {
            chart: aqlLtpdChart,
            lastPlan: aqlLtpdLastPlan
        };
    }

    function getEfficiencyRating(efficiency) {
        if (efficiency >= 0.95) return 'Excellent (95%+)';
        if (efficiency >= 0.85) return 'Very Good (85-95%)';
        if (efficiency >= 0.75) return 'Good (75-85%)';
        if (efficiency >= 0.65) return 'Fair (65-75%)';
        if (efficiency >= 0.50) return 'Poor (50-65%)';
        return 'Very Poor (<50%)';
    }

    function generateImprovementSuggestions(plan, efficiency, alpha, beta, aql, ltpd, lotSize) {
        const suggestions = [];
        const ratio = ltpd / aql;

        if (plan.n > 200) {
            suggestions.push('Consider reducing sample size: current n=' + plan.n + ' is quite large. Try relaxing risk constraints or widening the AQL/LTPD gap.');
        } else if (plan.n < 20) {
            suggestions.push('Sample size is very small (n=' + plan.n + '). Consider increasing it for stronger discrimination.');
        }

        if (plan.actualAlpha > alpha * 1.2) {
            suggestions.push("Producer's risk is high (" + (plan.actualAlpha * 100).toFixed(1) + '% vs target ' + (alpha * 100).toFixed(1) + '%).');
        }
        if (plan.actualBeta > beta * 1.2) {
            suggestions.push("Consumer's risk is high (" + (plan.actualBeta * 100).toFixed(1) + '% vs target ' + (beta * 100).toFixed(1) + '%).');
        }

        if (efficiency < 0.75) {
            suggestions.push('Plan efficiency is low. Try a different optimization target or adjust the AQL/LTPD values for better separation.');
        }

        if (lotSize < 1000) {
            suggestions.push('For small lots, Hypergeometric distribution may give more accurate results.');
        } else if (lotSize > 10000) {
            suggestions.push('For large lots, Binomial or Poisson distributions are usually appropriate.');
        }

        if (ratio < 3) {
            suggestions.push('AQL-LTPD ratio is small (' + ratio.toFixed(1) + '). Wider separation usually improves discrimination.');
        } else if (ratio > 10) {
            suggestions.push('AQL-LTPD ratio is very large (' + ratio.toFixed(1) + '). Expect larger sample sizes.');
        }

        if (suggestions.length === 0) {
            suggestions.push('Plan appears well-balanced. Monitor real-world performance and adjust if process behavior changes.');
        }

        return suggestions.join('\n');
    }

    function calculateEfficiencyRatingAndSuggestions(plan, efficiency, alpha, beta, aql, ltpd, lotSize) {
        return {
            rating: getEfficiencyRating(efficiency),
            suggestions: generateImprovementSuggestions(plan, efficiency, alpha, beta, aql, ltpd, lotSize)
        };
    }

    function updateAqlLtpdChart(plan) {
        let ctx;
        let xMax;
        const step = 0.001;
        const pValues = [];
        const paValues = [];
        const colors = getEnhancedThemeColors();
        const accentColor = colors.accent || '#e67e22';
        let currentLabel;

        if (!plan) return;
        ctx = document.getElementById('ocChartAQL_LTPD');
        if (!ctx) return;

        xMax = parseFloat(elements.xMaxInput && elements.xMaxInput.value || 10);

        for (let p = 0; p <= xMax / 100; p += step) {
            pValues.push(p * 100);
            try {
                let pa;
                if (p === 0) {
                    pa = 1;
                } else if (p < 1e-6) {
                    pa = 1 - Math.exp(-plan.n * p * (1 + p / 2));
                } else {
                    pa = calculateAcceptanceProbability(
                        plan.n,
                        plan.c,
                        p,
                        elements.lotSizeInput && elements.lotSizeInput.value || 1000,
                        elements.distSelect && elements.distSelect.value || 'binom'
                    );
                }
                paValues.push(pa);
            } catch (error) {
                paValues.push(NaN);
            }
        }

        if (aqlLtpdChart) {
            aqlLtpdChart.destroy();
        }

        const aqlLtpdCrosshairPlugin = {
            id: 'aqlLtpdCrosshairPlugin',
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

                const drawCtx = chart.ctx;
                const area = chart.chartArea;
                if (!area) return;

                drawCtx.save();
                drawCtx.strokeStyle = 'rgba(199,202,207,0.5)';
                drawCtx.setLineDash([4, 4]);
                drawCtx.beginPath();
                drawCtx.moveTo(cx, area.top);
                drawCtx.lineTo(cx, area.bottom);
                drawCtx.stroke();
                drawCtx.beginPath();
                drawCtx.moveTo(area.left, cy);
                drawCtx.lineTo(area.right, cy);
                drawCtx.stroke();

                const xScaleRef = chart.scales && chart.scales.x;
                const yScaleRef = chart.scales && chart.scales.y;
                if (xScaleRef && yScaleRef) {
                    const xVal = xScaleRef.getValueForPixel(cx);
                    const yVal = yScaleRef.getValueForPixel(cy);
                    if (isFinite(xVal) && isFinite(yVal)) {
                        const label = 'p=' + xVal.toFixed(2) + '% , Pa=' + (yVal * 100).toFixed(1) + '%';
                        const pad = 6;
                        const width = drawCtx.measureText(label).width + pad * 2;
                        const height = 20;
                        const boxX = Math.min(Math.max(area.left, cx + 8), area.right - width);
                        const boxY = Math.max(area.top, cy - height - 8);

                        drawCtx.fillStyle = 'rgba(28,42,54,0.9)';
                        drawCtx.strokeStyle = 'rgba(64,84,102,0.9)';
                        drawCtx.setLineDash([]);
                        drawCtx.font = '12px sans-serif';
                        drawCtx.beginPath();
                        if (drawCtx.roundRect) {
                            drawCtx.roundRect(boxX, boxY, width, height, 6);
                        } else {
                            drawCtx.rect(boxX, boxY, width, height);
                        }
                        drawCtx.fill();
                        drawCtx.stroke();
                        drawCtx.fillStyle = '#e6e9ee';
                        drawCtx.fillText(label, boxX + pad, boxY + 14);
                    }
                }
                drawCtx.restore();
            }
        };

        currentLabel = elements.planLabelInput ? elements.planLabelInput.value.trim() : '';
        const autoLabel = 'Balanced Plan (n=' + plan.n + ', c=' + plan.c + ')';
        if (!currentLabel || currentLabel === 'AQL-LTPD Plan' || currentLabel === window.__aqlLtpdLastAutoLabel) {
            if (elements.planLabelInput) elements.planLabelInput.value = autoLabel;
            currentLabel = autoLabel;
        }
        window.__aqlLtpdLastAutoLabel = autoLabel;

        aqlLtpdChart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: currentLabel,
                    data: pValues.map(function (p, i) { return { x: p, y: paValues[i] }; }),
                    borderColor: accentColor,
                    backgroundColor: accentColor + '40',
                    borderDash: [],
                    borderWidth: 2,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: {
                    legend: {
                        display: true,
                        labels: { color: getEnhancedThemeColors().text }
                    },
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
                        title: {
                            display: true,
                            text: 'Defect Rate (%)',
                            color: getEnhancedThemeColors().text
                        },
                        grid: { display: true, color: getEnhancedThemeColors().grid },
                        ticks: { color: getEnhancedThemeColors().text },
                        border: { color: getEnhancedThemeColors().grid }
                    },
                    y: {
                        min: 0,
                        max: 1,
                        title: {
                            display: true,
                            text: 'Acceptance Probability',
                            color: getEnhancedThemeColors().text
                        },
                        ticks: {
                            callback: function (v) { return (v * 100).toFixed(0) + '%'; },
                            color: getEnhancedThemeColors().text
                        },
                        grid: { display: true, color: getEnhancedThemeColors().grid },
                        border: { color: getEnhancedThemeColors().grid }
                    }
                }
            },
            plugins: [aqlLtpdCrosshairPlugin]
        });

        syncChartReference();
    }

    function doAqlLtpdLookup() {
        try {
            const aql = parseFloat(elements.aqlInput && elements.aqlInput.value || 1);
            const ltpd = parseFloat(elements.ltpdInput && elements.ltpdInput.value || 5);
            const lotSize = parseInt(elements.lotSizeInput && elements.lotSizeInput.value || 1000, 10);
            const distribution = elements.distSelect && elements.distSelect.value || 'binom';
            const optimization = elements.optimizationSelect && elements.optimizationSelect.value || 'minimize_n';
            const alpha = parseFloat(elements.alphaInput && elements.alphaInput.value || 0.05);
            const beta = parseFloat(elements.betaInput && elements.betaInput.value || 0.10);
            const plan = calculateOptimalAqlLtpdPlan(aql, ltpd, lotSize, distribution, optimization, alpha, beta);
            let efficiency;
            let aoql;
            let asn;
            let feedback;
            let currentLabel;
            let autoLtpdLabel;

            if (elements.errorDiv) {
                elements.errorDiv.style.display = 'none';
            }
            if (!plan) {
                throw new Error('No feasible plan found for the specified parameters.');
            }

            efficiency = calculatePlanEfficiency(plan, 1 - alpha, beta, alpha, beta);
            aoql = calculateAOQL(plan.n, plan.c, aql / 100, lotSize, distribution);
            asn = calculateASN(plan.n, plan.c, aql / 100, lotSize, distribution);
            feedback = calculateEfficiencyRatingAndSuggestions(plan, efficiency, alpha, beta, aql, ltpd, lotSize);
            autoLtpdLabel = 'AQL-LTPD Plan (n=' + plan.n + ', c=' + plan.c + ') AQL=' + aql + '%, LTPD=' + ltpd + '%';

            if (elements.resultN) elements.resultN.value = plan.n;
            if (elements.resultC) elements.resultC.value = plan.c;
            if (elements.efficiency) elements.efficiency.value = (efficiency * 100).toFixed(1) + '%';
            if (elements.aqlPa) elements.aqlPa.value = (plan.paAql * 100).toFixed(1) + '%';
            if (elements.ltpdPa) elements.ltpdPa.value = (plan.paLtpd * 100).toFixed(1) + '%';
            if (elements.actualAlpha) elements.actualAlpha.value = (plan.actualAlpha * 100).toFixed(1) + '%';
            if (elements.actualBeta) elements.actualBeta.value = (plan.actualBeta * 100).toFixed(1) + '%';
            if (elements.aoql) elements.aoql.value = (aoql * 100).toFixed(3) + '%';
            if (elements.asn) elements.asn.value = asn.toFixed(1);
            if (elements.efficiencyRating) elements.efficiencyRating.value = feedback.rating;
            if (elements.improvements) elements.improvements.value = feedback.suggestions;

            if (elements.planLabelInput) {
                currentLabel = elements.planLabelInput.value.trim();
                if (!currentLabel || currentLabel === 'Balanced Plan' || currentLabel === (aqlLtpdLastPlan ? aqlLtpdLastPlan.__lastLabel : null)) {
                    elements.planLabelInput.value = autoLtpdLabel;
                    currentLabel = autoLtpdLabel;
                }
            } else {
                currentLabel = autoLtpdLabel;
            }

            if (elements.notes) {
                elements.notes.textContent = 'Optimal plan calculated using ' + optimization.replace('_', ' ') + ' strategy.';
            }

            plan.__lastLabel = currentLabel;
            aqlLtpdLastPlan = plan;
            updateAqlLtpdChart(plan);
        } catch (error) {
            if (elements.errorDiv) {
                elements.errorDiv.textContent = error.message;
                elements.errorDiv.style.display = 'block';
            }
        }
    }

    function clearAqlLtpdPage() {
        const resultElements = [
            elements.resultN,
            elements.resultC,
            elements.efficiency,
            elements.aqlPa,
            elements.ltpdPa,
            elements.actualAlpha,
            elements.actualBeta,
            elements.aoql,
            elements.asn,
            elements.efficiencyRating,
            elements.improvements
        ];

        if (elements.aqlInput) elements.aqlInput.value = '1.0';
        if (elements.ltpdInput) elements.ltpdInput.value = '5.0';
        if (elements.lotSizeInput) elements.lotSizeInput.value = '1000';
        if (elements.distSelect) elements.distSelect.value = 'binom';
        if (elements.optimizationSelect) elements.optimizationSelect.value = 'minimize_n';
        if (elements.alphaInput) elements.alphaInput.value = '0.05';
        if (elements.betaInput) elements.betaInput.value = '0.10';
        if (elements.xMaxInput) elements.xMaxInput.value = '10';

        resultElements.forEach(function (el) {
            if (el) el.value = '-';
        });

        if (aqlLtpdChart) {
            aqlLtpdChart.destroy();
            aqlLtpdChart = null;
        }
        if (elements.errorDiv) {
            elements.errorDiv.style.display = 'none';
        }
        if (elements.notes) {
            elements.notes.textContent = 'Enter AQL and LTPD values to calculate the optimal sampling plan.';
        }

        aqlLtpdLastPlan = null;
        syncChartReference();
    }

    function exportPlan() {
        if (!aqlLtpdLastPlan) {
            alert('No plan to export. Please calculate first.');
            return;
        }

        const distName = elements.distSelect && elements.distSelect.value === 'hyper'
            ? 'Hypergeometric'
            : (elements.distSelect && elements.distSelect.value === 'pois' ? 'Poisson' : 'Binomial');
        const customLabel = elements.planLabelInput ? elements.planLabelInput.value.trim() : '';
        const label = customLabel || 'AQL-LTPD n=' + aqlLtpdLastPlan.n + ', c=' + aqlLtpdLastPlan.c + ' (' + distName + ')';

        window.planComparisonQueue = window.planComparisonQueue || [];
        window.planComparisonQueue.push({
            n: aqlLtpdLastPlan.n,
            c: aqlLtpdLastPlan.c,
            aql: parseFloat(elements.aqlInput && elements.aqlInput.value || 1),
            label: label,
            dist: elements.distSelect && elements.distSelect.value || 'binom',
            N: parseInt(elements.lotSizeInput && elements.lotSizeInput.value || 1000, 10),
            paAql: aqlLtpdLastPlan.paAql,
            paLtpd: aqlLtpdLastPlan.paLtpd,
            actualAlpha: aqlLtpdLastPlan.actualAlpha,
            actualBeta: aqlLtpdLastPlan.actualBeta,
            source: 'aql_ltpd'
        });
        alert('Plan exported to Multiple Plan Comparison queue.');
    }

    if (elements.calculateBtn) {
        elements.calculateBtn.addEventListener('click', doAqlLtpdLookup);
        [
            elements.aqlInput,
            elements.ltpdInput,
            elements.lotSizeInput,
            elements.distSelect,
            elements.optimizationSelect,
            elements.alphaInput,
            elements.betaInput
        ].forEach(function (el) {
            if (el) {
                el.addEventListener('change', doAqlLtpdLookup);
                if (el.tagName === 'INPUT') {
                    el.addEventListener('input', doAqlLtpdLookup);
                }
            }
        });
        setTimeout(doAqlLtpdLookup, 150);
    }

    if (elements.clearBtn) {
        elements.clearBtn.addEventListener('click', clearAqlLtpdPage);
    }
    if (elements.xMaxInput) {
        elements.xMaxInput.addEventListener('input', function () {
            if (aqlLtpdLastPlan) {
                updateAqlLtpdChart(aqlLtpdLastPlan);
            }
        });
    }
    if (elements.exportPlanBtn) {
        elements.exportPlanBtn.addEventListener('click', exportPlan);
    }

    syncChartReference();

    return {
        getChart: function () { return aqlLtpdChart; },
        getLastPlan: function () { return aqlLtpdLastPlan; },
        recalculate: doAqlLtpdLookup
    };
}
