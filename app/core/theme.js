export function getCssVar(name, documentRef = document) {
    try {
        return getComputedStyle(documentRef.documentElement).getPropertyValue(name).trim();
    } catch (error) {
        return '';
    }
}

export function getEnhancedThemeColors(documentRef = document) {
    const theme = documentRef.body.getAttribute('data-theme') || 'dark-teal';
    const isLightTheme = ['light', 'light-blue', 'light-yellow', 'light-pink'].includes(theme);

    if (isLightTheme) {
        return {
            text: '#212529',
            grid: 'rgba(0,0,0,0.5)',
            background: getCssVar('--panel-2', documentRef) || getCssVar('--panel', documentRef) || '#ffffff'
        };
    }

    return {
        text: '#e6e9ee',
        grid: 'rgba(199,202,207,0.4)',
        background: getCssVar('--panel-2', documentRef) || getCssVar('--panel', documentRef) || '#111c26'
    };
}

export function getUiChartBg(documentRef = document) {
    return getCssVar('--panel-2', documentRef) || getCssVar('--panel', documentRef) || '#111c26';
}

export function getExportThemeColors(documentRef = document) {
    const theme = documentRef.body.getAttribute('data-theme') || 'dark-teal';
    const isLightTheme = ['light', 'light-blue', 'light-yellow', 'light-pink'].includes(theme);

    if (isLightTheme) {
        return {
            text: '#1f2937',
            grid: '#9ca3af',
            background: getUiChartBg(documentRef)
        };
    }

    return {
        text: '#ffffff',
        grid: '#64748b',
        background: getUiChartBg(documentRef)
    };
}

function updateChartColors(getCharts, documentRef = document) {
    const colors = getEnhancedThemeColors(documentRef);

    getCharts().forEach(function (chart) {
        if (!(chart && chart.options)) return;

        if (chart.options.plugins && chart.options.plugins.legend && chart.options.plugins.legend.labels) {
            chart.options.plugins.legend.labels.color = colors.text;
        }
        if (chart.options.plugins && chart.options.plugins.title) {
            chart.options.plugins.title.color = colors.text;
        }

        if (chart.options.scales) {
            ['x', 'y'].forEach(function (axis) {
                const scale = chart.options.scales[axis];
                if (!scale) return;
                if (scale.grid) scale.grid.color = colors.grid;
                if (scale.title) scale.title.color = colors.text;
                if (scale.ticks) scale.ticks.color = colors.text;
                if (scale.border) scale.border.color = colors.grid;
            });
        }

        chart.update();
    });
}

function applyTheme(theme, options) {
    const { document: documentRef, getCharts } = options;
    const body = documentRef.body;

    body.removeAttribute('data-theme');
    if (theme !== 'dark-teal') {
        body.setAttribute('data-theme', theme);
    }

    body.style.transition = 'all 0.3s ease';
    setTimeout(function () {
        body.style.transition = '';
    }, 300);

    updateChartColors(getCharts, documentRef);
}

export function initThemeSystem(options) {
    const { document: documentRef, localStorage: storage, getCharts } = options;
    const themeSelector = documentRef.getElementById('theme_selector');
    const savedTheme = storage.getItem('app-theme') || 'dark-teal';

    if (!themeSelector) return;

    themeSelector.value = savedTheme;
    applyTheme(savedTheme, { document: documentRef, getCharts: getCharts });

    themeSelector.addEventListener('change', function () {
        const selectedTheme = this.value;
        applyTheme(selectedTheme, { document: documentRef, getCharts: getCharts });
        storage.setItem('app-theme', selectedTheme);
    });
}
