export function exportChartHiRes(chart, baseName, deps) {
    const { document, window, Chart, getExportThemeColors } = deps;

    if (!chart) {
        console.warn('Export aborted: chart instance is null');
        return;
    }
    document.body.style.cursor = 'wait';

    try {
        var baseW = chart.canvas.clientWidth || 800;
        var baseH = chart.canvas.clientHeight || 600;
        var scale = Math.min(window.devicePixelRatio || 2, 3);
        if (scale < 2) scale = 2;

        var offCanvas = document.createElement('canvas');
        offCanvas.width = baseW * scale;
        offCanvas.height = baseH * scale;
        var type = (chart.config && chart.config.type) ? chart.config.type : 'line';
        var srcData = chart.data || {};
        var datasets = [];

        for (var i = 0; i < (srcData.datasets ? srcData.datasets.length : 0); i++) {
            var ds = srcData.datasets[i] || {};
            var dsClone = Object.assign({}, ds);

            dsClone.data = Array.isArray(ds.data) ? ds.data.map(function (p) { return { x: p.x, y: p.y }; }) : [];
            if (ds.borderDash) {
                dsClone.borderDash = ds.borderDash.map(function (v) { return v * scale; });
            }
            dsClone.borderWidth = (ds.borderWidth || 2) * scale;
            var pr = ds.type === 'scatter' ? (ds.pointRadius || 4) : (ds.pointRadius || 0);
            dsClone.pointRadius = pr * scale;
            if (ds.label === 'Continue (Pc)') {
                dsClone.fill = '-1';
            }
            datasets.push(dsClone);
        }

        var xTitleObj = (((chart.options || {}).scales || {}).x || {}).title || {};
        var yTitleObj = (((chart.options || {}).scales || {}).y || {}).title || {};
        var exportColors = getExportThemeColors(document);
        var bgPlugin = {
            id: 'exportBg',
            beforeDraw: function (c) {
                var ctx = c.ctx;
                ctx.save();
                ctx.fillStyle = exportColors.background;
                ctx.fillRect(0, 0, c.width, c.height);
                ctx.restore();
            }
        };
        var padPx = Math.round(Math.min(baseW, baseH) * 0.02 * scale);
        var yMin = (((chart.options || {}).scales || {}).y || {}).min;
        var yMax = (((chart.options || {}).scales || {}).y || {}).max;
        var yTicksCallback = (((chart.options || {}).scales || {}).y || {}).ticks?.callback;
        var baseFontSize = 14;

        var options = {
            responsive: false,
            maintainAspectRatio: false,
            animation: false,
            devicePixelRatio: 1,
            layout: { padding: padPx },
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: exportColors.text,
                        font: { size: baseFontSize * scale }
                    }
                },
                tooltip: { enabled: false },
                filler: { propagate: true }
            },
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: !!xTitleObj.text,
                        text: xTitleObj.text || 'Defect Rate (p%)',
                        color: exportColors.text,
                        font: { size: baseFontSize * scale, weight: 'bold' }
                    },
                    grid: { color: exportColors.grid },
                    ticks: {
                        color: exportColors.text,
                        font: { size: baseFontSize * scale }
                    },
                    border: { color: exportColors.grid }
                },
                y: {
                    min: yMin,
                    max: yMax,
                    title: {
                        display: !!yTitleObj.text,
                        text: yTitleObj.text || 'Acceptance Probability (Pa%)',
                        color: exportColors.text,
                        font: { size: baseFontSize * scale, weight: 'bold' }
                    },
                    grid: { color: exportColors.grid },
                    ticks: {
                        color: exportColors.text,
                        font: { size: baseFontSize * scale },
                        callback: yTicksCallback
                    },
                    border: { color: exportColors.grid }
                }
            },
            elements: {
                line: { borderWidth: 2 * scale },
                point: { radius: 4 * scale }
            }
        };

        var chartConfig = { type: type, data: { datasets: datasets }, options: options, plugins: [bgPlugin] };
        var tempChart = new Chart(offCanvas, chartConfig);
        tempChart.render();
        tempChart.update();

        var newWin = window.open('about:blank', '_blank');
        if (!newWin) {
            alert('Popup blocked! Please allow popups for this site to use the export feature.');
            document.body.style.cursor = 'default';
            return;
        }

        newWin.document.write('<html><head><title>Exporting Chart...</title></head><body style="margin:0; padding:0; display:flex; justify-content:center; align-items:center; height:100vh; background-color:#1e293b; color:white; font-family:sans-serif;"><h2>Processing high-resolution image...</h2></body></html>');
        newWin.document.close();

        var filename = baseName + '.png';
        try {
            offCanvas.toBlob(function (blob) {
                if (!blob) {
                    console.error('Blob generation failed.');
                    if (newWin) newWin.close();
                    document.body.style.cursor = 'default';
                    alert('Image generation failed.');
                    return;
                }

                var url = URL.createObjectURL(blob);

                newWin.document.open();
                newWin.document.write(
                    '<html><head><title>Export - ' + filename + '</title></head>' +
                    '<body style="margin: 0; padding: 20px; font-family: Segoe UI, system-ui, sans-serif; background-color: #0f172a; color: #f8fafc; display: flex; flex-direction: column; align-items: center; min-height: 100vh;">' +
                    '<div style="text-align: center; margin-bottom: 20px;">' +
                    '<h2 style="margin: 0 0 8px 0;">Chart Export Ready</h2>' +
                    '<p style="margin: 0; color: #94a3b8; font-size: 14px;"><strong>Right-click</strong> the image below and select <strong>"Save image as..."</strong></p>' +
                    '</div>' +
                    '<img src="' + url + '" style="max-width: 95vw; max-height: 80vh; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); border: 1px solid #334155; background-color: #ffffff;" alt="Exported Chart">' +
                    '</body></html>'
                );
                newWin.document.close();

                tempChart.destroy();
                document.body.style.cursor = 'default';
            }, 'image/png');
        } catch (err) {
            console.error('Final export stage failed:', err);
            document.body.style.cursor = 'default';
            alert('Image generation failed.');
        }
    } catch (e) {
        console.error('Export core error:', e);
        document.body.style.cursor = 'default';
        alert('Export failed due to a processing error.');
    }
}

export function initExportHandlers(options) {
    const {
        document,
        window,
        Chart,
        getExportThemeColors,
        exportConfigs
    } = options;

    if (window.exportHandlersAttached) return;

    exportConfigs.forEach(function (cfg) {
        const pngBtn = document.getElementById(cfg.pngId);
        const csvBtn = document.getElementById(cfg.csvId);

        if (pngBtn) {
            pngBtn.onclick = function () {
                const chartInstance = cfg.chart();
                if (chartInstance) {
                    try {
                        exportChartHiRes(chartInstance, cfg.name, {
                            document: document,
                            window: window,
                            Chart: Chart,
                            getExportThemeColors: getExportThemeColors
                        });
                    } catch (err) {
                        console.error('Export PNG failed for ' + cfg.name + ':', err);
                        alert('Export failed. Check console for details.');
                    }
                } else {
                    alert('No chart data available to export.');
                }
            };
        }

        if (csvBtn) {
            csvBtn.onclick = function () {
                const chartInstance = cfg.chart();
                if (!(chartInstance && chartInstance.data && chartInstance.data.datasets)) {
                    alert('No chart data available to export.');
                    return;
                }

                let csv = 'label,x_defect_rate_percent,y_acceptance_prob\n';
                chartInstance.data.datasets.forEach(function (ds) {
                    if (ds.data) {
                        ds.data.forEach(function (p) {
                            csv += ds.label + ',' + p.x + ',' + p.y + '\n';
                        });
                    }
                });

                const filename = cfg.name + '.csv';
                const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csv);
                const overlay = document.createElement('div');
                const modalBox = document.createElement('div');
                const closeBtn = document.createElement('button');
                const downLink = document.createElement('a');
                const preview = document.createElement('div');
                const previewText = document.createElement('pre');

                overlay.id = 'csv_export_overlay';
                overlay.style.position = 'fixed';
                overlay.style.top = '0';
                overlay.style.left = '0';
                overlay.style.width = '100vw';
                overlay.style.height = '100vh';
                overlay.style.backgroundColor = 'rgba(15, 23, 42, 0.95)';
                overlay.style.zIndex = '99999';
                overlay.style.display = 'flex';
                overlay.style.flexDirection = 'column';
                overlay.style.alignItems = 'center';
                overlay.style.justifyContent = 'center';
                overlay.style.fontFamily = 'system-ui, sans-serif';

                modalBox.style.backgroundColor = '#1e293b';
                modalBox.style.padding = '30px';
                modalBox.style.borderRadius = '12px';
                modalBox.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.5)';
                modalBox.style.width = '90%';
                modalBox.style.maxWidth = '700px';
                modalBox.style.display = 'flex';
                modalBox.style.flexDirection = 'column';
                modalBox.style.alignItems = 'center';
                modalBox.style.position = 'relative';

                closeBtn.innerHTML = '?';
                closeBtn.style.position = 'absolute';
                closeBtn.style.top = '10px';
                closeBtn.style.right = '15px';
                closeBtn.style.background = 'none';
                closeBtn.style.border = 'none';
                closeBtn.style.color = '#94a3b8';
                closeBtn.style.fontSize = '24px';
                closeBtn.style.cursor = 'pointer';
                closeBtn.onclick = function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    document.body.removeChild(overlay);
                };
                modalBox.appendChild(closeBtn);

                downLink.href = csvContent;
                downLink.download = filename;
                downLink.innerText = 'Download ' + filename;
                downLink.style.display = 'inline-block';
                downLink.style.backgroundColor = '#3b82f6';
                downLink.style.color = 'white';
                downLink.style.padding = '12px 24px';
                downLink.style.textDecoration = 'none';
                downLink.style.fontWeight = 'bold';
                downLink.style.borderRadius = '6px';
                downLink.style.marginBottom = '25px';
                downLink.style.cursor = 'pointer';
                downLink.onclick = function (e) {
                    e.stopPropagation();
                    setTimeout(function () {
                        if (overlay.parentNode) document.body.removeChild(overlay);
                    }, 1000);
                };
                modalBox.appendChild(downLink);

                preview.style.backgroundColor = '#0f172a';
                preview.style.padding = '15px';
                preview.style.borderRadius = '6px';
                preview.style.width = '100%';
                preview.style.overflow = 'hidden';
                preview.style.border = '1px solid #334155';
                preview.style.boxSizing = 'border-box';

                previewText.innerText = csv.split('\n').slice(0, 10).join('\n') + (csv.split('\n').length > 10 ? '\n... (Data truncated)' : '');
                previewText.style.margin = '0';
                previewText.style.color = '#cbd5e1';
                previewText.style.fontSize = '12px';
                previewText.style.fontFamily = 'monospace';
                previewText.style.whiteSpace = 'pre-wrap';
                preview.appendChild(previewText);

                modalBox.appendChild(preview);
                overlay.appendChild(modalBox);
                document.body.appendChild(overlay);
            };
        }
    });

    window.exportHandlersAttached = true;
}
