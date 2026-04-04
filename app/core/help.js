export function initHelpSystem(options) {
    const { document } = options;
    let helpModal = document.getElementById('help-modal');

    if (!helpModal) {
        const wrap = document.createElement('div');
        wrap.id = 'help-modal';
        wrap.style.display = 'none';
        wrap.style.position = 'fixed';
        wrap.style.inset = '0';
        wrap.style.zIndex = '9999';
        wrap.style.alignItems = 'center';
        wrap.style.justifyContent = 'center';
        wrap.innerHTML = '\n                <div class="tutorial-overlay" style="position:absolute; inset:0; background:rgba(0,0,0,0.5);"></div>\n                <div class="tutorial-content" style="position:relative; max-width:900px; width:90%; background:var(--panel); border:1px solid var(--border); border-radius:12px; box-shadow:0 10px 40px rgba(0,0,0,0.35); overflow:hidden;">\n                    <div class="tutorial-header" style="display:flex; align-items:center; justify-content:space-between;">\n                        <h2 style="margin:0; font-size:1.3rem;">User Instructions</h2>\n                        <div>\n                            <button class="btn" id="help-close-btn">Close</button>\n                        </div>\n                    </div>\n                    <div style="padding:18px 24px 8px; border-bottom:1px solid var(--border);">\n                        <div id="help-tabs" style="display:flex; gap:8px; flex-wrap:wrap;"></div>\n                    </div>\n                    <div id="help-content" style="padding:18px 24px; max-height:60vh; overflow:auto;"></div>\n                </div>';
        document.body.appendChild(wrap);
        helpModal = wrap;
    }

    const helpTabs = document.getElementById('help-tabs');
    const helpContent = document.getElementById('help-content');
    const closeBtn = document.getElementById('help-close-btn');
    const overlay = helpModal.querySelector('.tutorial-overlay');
    const helpData = {
        distribution: {
            tabs: ['Overview', 'Parameters', 'Charts', 'Usage'],
            sections: [
                '<p>Compare OC/AOQ/ATI behavior for Hypergeometric, Binomial, and Poisson distributions under the same sampling plan.</p>',
                '<ul><li>N: Lot Size (Required for Hypergeometric)</li><li>n: Sample Size</li><li>c: Acceptance Number</li><li>AQL(%): Acceptable Quality Level</li><li>X-axis Max (%): Defect rate display range</li></ul>',
                '<ul><li>OC Curve: y=Pa (Probability of Acceptance)</li><li>AOQ Curve: Average Outgoing Quality (%)</li><li>ATI Curve: Average Total Inspection</li><li>Export: PNG/CSV</li></ul>',
                '<ul><li>Compare the impact of different distribution assumptions</li><li>Quickly view AQL markers and curve steepness</li></ul>'
            ]
        },
        plan: {
            tabs: ['Overview', 'Parameters', 'Output', 'Usage'],
            sections: [
                '<p>Overlay multiple sampling plans to visualize and compare their OC/AOQ/ATI behavior.</p>',
                '<ul><li>n, c, AQL(%), Labels, X-axis Max</li></ul>',
                '<ul><li>Plan list and legend, AQL markers</li><li>Support for PNG/CSV and importing from other pages</li></ul>',
                '<ul><li>Evaluate multiple plan options and demonstrate differences to stakeholders</li></ul>'
            ]
        },
        reverse: {
            tabs: ['Overview', 'Parameters', 'Output', 'Usage'],
            sections: [
                '<p>Fix three parameters to solve for the remaining one (AQL, n, c, N, or target Pa).</p>',
                '<ul><li>Target parameter, N, n, c, AQL(%), Target Pa(%), Distribution</li></ul>',
                '<ul><li>Calculated plan (n, c) and OC chart</li><li>Exportable to Comparison page</li></ul>',
                '<ul><li>Find appropriate n or c when specific risk points (e.g., AQL 95%) are required</li></ul>'
            ]
        },
        kaiyi: {
            tabs: ['Overview', 'Parameters', 'Output', 'Usage'],
            sections: [
                '<p>Lookup AQL sampling plans based on ANSI/ASQ Z1.4 standard.</p>',
                '<ul><li>Lot Size (N), AQL, Inspection Level, Inspection State (Normal/Tightened/Reduced)</li></ul>',
                '<ul><li>Output Code Letter, Sample Size, Ac/Re, and Pa/Pr/Pc at AQL</li><li>OC Curve and Export</li></ul>',
                '<ul><li>When compliance with standard sampling systems is required</li></ul>'
            ]
        },
        c0: {
            tabs: ['Overview', 'Parameters', 'Output', 'Usage'],
            sections: [
                '<p>Lookup C=0 (Zero Acceptance) sampling plans according to Squeglia\'s table.</p>',
                '<ul><li>Lot Size (N), AQL or custom AQL, Distribution</li></ul>',
                '<ul><li>Output n, c=0, and corresponding LTPD at Pa=10%</li></ul>',
                '<ul><li>High-risk critical defects or strict quality control scenarios</li></ul>'
            ]
        },
        'aql-ltpd': {
            tabs: ['Overview', 'Parameters', 'Output', 'Usage'],
            sections: [
                '<p>Design optimal sampling plans that satisfy both AQL and LTPD constraints using mathematical optimization.</p>',
                '<ul><li>AQL(%), LTPD(%), N, Distribution, Optimization Target, alpha/beta, X-axis Max</li></ul>',
                '<ul><li>Output n, c, Efficiency Score, AOQL/ASN, OC Curve, and Export</li></ul>',
                '<ul><li>Balance risks at both ends of the quality spectrum (Producer and Consumer)</li></ul>'
            ]
        }
    };

    function close() {
        helpModal.style.display = 'none';
        document.body.style.overflow = '';
    }

    function open() {
        helpModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function renderHelp(kind) {
        const data = helpData[kind] || helpData.distribution;
        helpTabs.innerHTML = '';
        data.tabs.forEach(function (tab, index) {
            const button = document.createElement('button');
            button.className = 'btn' + (index === 0 ? ' primary' : '');
            button.textContent = tab;
            button.addEventListener('click', function () {
                Array.from(helpTabs.children).forEach(function (child) {
                    child.classList.remove('primary');
                });
                button.classList.add('primary');
                helpContent.innerHTML = data.sections[index];
            });
            helpTabs.appendChild(button);
        });
        helpContent.innerHTML = data.sections[0] || '';
    }

    closeBtn && closeBtn.addEventListener('click', close);
    overlay && overlay.addEventListener('click', close);

    document.querySelectorAll('[data-help-for]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            renderHelp(btn.getAttribute('data-help-for'));
            open();
        });
    });
}
