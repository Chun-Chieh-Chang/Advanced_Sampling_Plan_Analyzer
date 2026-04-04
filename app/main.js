import {
            calculateAcceptanceProbability,
            calculateAOQL,
            calculateASN,
            calculateATI,
            calculateOptimalAqlLtpdPlan,
            calculatePlanEfficiency
        } from './logic.js';
        import { C0_SAMPLING_TABLE } from '../data/reference_tables/c=0 table.js';
        import { codeLetterTable } from '../data/reference_tables/CodeLetterTable.js';
        import {
            codeLettersOrder_normal,
            normal_rawMasterTableData,
            normal_sampleSizes
        } from '../data/reference_tables/normal.js';
        import {
            codeLettersOrder_reduced,
            reduced_rawMasterTableData,
            reduced_sampleSizes
        } from '../data/reference_tables/reduced.js';
        import {
            codeLettersOrder_tightened,
            tightened_rawMasterTableData,
            tightened_sampleSizes
        } from '../data/reference_tables/tightened.js';
        import { initComparisonPage } from './pages/comparison.js';
        import { initAqlLtpdPage } from './pages/aql-ltpd.js';
        import { initAqlLookupPage } from './pages/aql-table.js';
        import { initC0Page } from './pages/c0.js';
        import { initDistributionPage } from './pages/distribution.js';
        import { initReversePage } from './pages/reverse.js';
        import {
            getEnhancedThemeColors,
            getExportThemeColors,
            initThemeSystem
        } from './core/theme.js';
        import { initHelpSystem } from './core/help.js';
        import { initExportHandlers } from './core/export.js';
        import { initTutorialSystem } from './core/tutorial.js';

        const { Chart } = window;
        let ocChart = null;
        let planChart = null;
        let revChart = null;
        let ssChart = null;
        let c0Chart = null;
        let aqlLtpdChart = null;

        // Reference tables are imported from data/reference_tables/*.

        // Tabs routing (layout only)
        const tabEls = document.querySelectorAll('.tab');
        const sections = {
            distribution: document.getElementById('section-distribution'),
            plan: document.getElementById('section-plan'),
            reverse: document.getElementById('section-reverse'),
            kaiyi: document.getElementById('section-kaiyi'),
            c0: document.getElementById('section-c0'),
            'aql-ltpd': document.getElementById('section-aql-ltpd')
        };
        tabEls.forEach(t => t.addEventListener('click', () => {
            tabEls.forEach(z => z.classList.remove('active'));
            t.classList.add('active');
            Object.values(sections).forEach(s => { if (s) s.classList.remove('active'); });
            const key = t.getAttribute('data-target');
            const sec = sections[key];
            if (!sec) { console.warn('No section for key:', key); return; }
            sec.classList.add('active');
        }));

        initDistributionPage({
            document: document,
            window: window,
            Chart: Chart,
            calculateAcceptanceProbability: calculateAcceptanceProbability,
            getEnhancedThemeColors: getEnhancedThemeColors,
            onChartChange: function (chart) {
                ocChart = chart;
            }
        });

        initExportHandlers({
            document: document,
            window: window,
            Chart: Chart,
            getExportThemeColors: getExportThemeColors,
            exportConfigs: [
                { pngId: 'export_png', csvId: 'export_csv', chart: () => typeof ocChart !== 'undefined' ? ocChart : null, name: 'oc_chart' },
                { pngId: 'plan_export_png', csvId: 'plan_export_csv', chart: () => typeof planChart !== 'undefined' ? planChart : null, name: 'plan_comparison' },
                { pngId: 'rev_export_png', csvId: 'rev_export_csv', chart: () => typeof revChart !== 'undefined' ? revChart : null, name: 'reverse_query' },
                { pngId: 'ss_export_png', csvId: 'ss_export_csv', chart: () => typeof ssChart !== 'undefined' ? ssChart : null, name: 'aql_lookup' },
                { pngId: 'c0_export_png_toolbar', csvId: 'c0_export_csv_toolbar', chart: () => typeof c0Chart !== 'undefined' ? c0Chart : null, name: 'c0_lookup' },
                { pngId: 'aql_ltpd_export_png_toolbar', csvId: 'aql_ltpd_export_csv_toolbar', chart: () => typeof aqlLtpdChart !== 'undefined' ? aqlLtpdChart : null, name: 'aql_ltpd_balanced' }
            ]
        });

        // ===== Multiple Plan Comparison functionality =====
        initComparisonPage({
            document: document,
            window: window,
            Chart: Chart,
            calculateAcceptanceProbability: calculateAcceptanceProbability,
            calculateAOQL: calculateAOQL,
            calculateATI: calculateATI,
            getEnhancedThemeColors: getEnhancedThemeColors,
            onChartChange: function (chart) {
                planChart = chart;
            }
        });

        // ===== Reverse page functionality =====
        initReversePage({
            document: document,
            window: window,
            Chart: Chart,
            calculateAcceptanceProbability: calculateAcceptanceProbability,
            getEnhancedThemeColors: getEnhancedThemeColors,
            onChartChange: function (chart) {
                revChart = chart;
            }
        });

        // ===== C=0 page functionality =====
        initC0Page({
            document: document,
            window: window,
            Chart: Chart,
            calculateAcceptanceProbability: calculateAcceptanceProbability,
            getEnhancedThemeColors: getEnhancedThemeColors,
            C0_SAMPLING_TABLE: C0_SAMPLING_TABLE,
            onChartChange: function (chart) {
                c0Chart = chart;
            }
        });

        // ===== AQL page functionality =====
        initAqlLookupPage({
            document: document,
            window: window,
            Chart: Chart,
            calculateAcceptanceProbability: calculateAcceptanceProbability,
            getEnhancedThemeColors: getEnhancedThemeColors,
            codeLetterTable: codeLetterTable,
            codeLettersOrder_normal: codeLettersOrder_normal,
            normal_rawMasterTableData: normal_rawMasterTableData,
            normal_sampleSizes: normal_sampleSizes,
            codeLettersOrder_reduced: codeLettersOrder_reduced,
            reduced_rawMasterTableData: reduced_rawMasterTableData,
            reduced_sampleSizes: reduced_sampleSizes,
            codeLettersOrder_tightened: codeLettersOrder_tightened,
            tightened_rawMasterTableData: tightened_rawMasterTableData,
            tightened_sampleSizes: tightened_sampleSizes,
            onChartChange: function (chart) {
                ssChart = chart;
            }
        });

        // ===== Interactive Tutorial System =====
        const tutorialSteps = [
            {
                title: "Welcome to Sampling Plan Analysis!",
                content: `
                <h3>What is Statistical Sampling?</h3>
                <p>Statistical sampling is a quality control method where we inspect only a small portion of a production lot to make decisions about the entire lot's quality.</p>
                
                <div class="highlight-box">
                    <strong>Key Concept:</strong> Instead of checking every single item (which is expensive and time-consuming), we use mathematical models to determine how many items to inspect and what acceptance criteria to use.
                </div>
                
                <div class="example-box">
                    <strong>Real Example:</strong> You receive 10,000 electronic components. Instead of testing all 10,000, you might test only 125 components. If 2 or fewer are defective, you accept the entire lot. If 3 or more are defective, you reject it.
                </div>
                
                <p>This tutorial will teach you how to design and analyze these sampling plans using three different statistical models!</p>
            `,
                highlight: null
            },
            {
                title: "Understanding OC Curves",
                content: `
                <h3>What is an Operating Characteristic (OC) Curve?</h3>
                <p>An OC curve shows the probability of accepting a lot based on its true defect rate. It's the heart of sampling plan analysis!</p>
                
                <div class="highlight-box">
                    <strong>How to Read an OC Curve:</strong>
                    <ul>
                        <li><strong>X-axis:</strong> True defect rate in the lot (%)</li>
                        <li><strong>Y-axis:</strong> Probability of accepting the lot (%)</li>
                        <li><strong>Ideal curve:</strong> High acceptance for good lots, low acceptance for bad lots</li>
                    </ul>
                </div>
                
                <div class="example-box">
                    <strong>Example:</strong> If your lot has a 1% defect rate, you want a 95% chance of accepting it. If it has a 5% defect rate, you might want only a 10% chance of accepting it.
                </div>
                
                <p>The steeper the curve, the better it discriminates between good and bad lots!</p>
            `,
                highlight: '#ocChart'
            },
            {
                title: "Three Statistical Models",
                content: `
                <h3>Why Different Probability Distributions?</h3>
                <p>The choice of statistical model depends on your sampling conditions:</p>
                
                <div class="highlight-box">
                    <strong>Hypergeometric (Most Accurate):</strong>
                    <ul>
                        <li>Use when: Finite lot size, sampling without replacement</li>
                        <li>Example: Testing 50 items from a lot of 500</li>
                        <li>Considers lot depletion effect</li>
                    </ul>
                </div>
                
                <div class="example-box">
                    <strong>Binomial (Most Common):</strong>
                    <ul>
                        <li>Use when: Large lot size or sampling with replacement</li>
                        <li>Example: Testing 125 items from a lot of 100,000</li>
                        <li>Assumes constant defect probability</li>
                    </ul>
                </div>
                
                <div class="warning-box">
                    <strong>Poisson (Approximation):</strong>
                    <ul>
                        <li>Use when: Large sample size, small defect rate</li>
                        <li>Example: n > 50 and defect rate < 5%</li>
                        <li>Computational convenience</li>
                    </ul>
                </div>
            `,
                highlight: '[data-dist]'
            },
            {
                title: "Interactive Demo: Try It!",
                content: `
                <h3>Let's Experiment with Parameters!</h3>
                <p>Now let's see how changing parameters affects the OC curve. Try these experiments:</p>
                
                <div class="tutorial-interactive-demo">
                    <strong>Experiment 1: Sample Size Effect</strong>
                    <ol>
                        <li>Set N=1000, n=50, c=2</li>
                        <li>Now change n to 100, then 200</li>
                        <li>Notice how larger sample sizes make steeper curves!</li>
                    </ol>
                </div>
                
                <div class="tutorial-interactive-demo">
                    <strong>Experiment 2: Acceptance Number Effect</strong>
                    <ol>
                        <li>Set N=1000, n=125, c=1</li>
                        <li>Now change c to 3, then 5</li>
                        <li>Higher c values shift the curve to the right!</li>
                    </ol>
                </div>
                
                <div class="tutorial-interactive-demo">
                    <strong>Experiment 3: Distribution Comparison</strong>
                    <ol>
                        <li>Set N=500, n=50, c=2</li>
                        <li>Toggle between Hypergeometric, Binomial, and Poisson</li>
                        <li>See how they differ for small lot sizes!</li>
                    </ol>
                </div>
            `,
                highlight: '.parameters'
            },
            {
                title: "AQL and Quality Standards",
                content: `
                <h3>Understanding Acceptable Quality Level (AQL)</h3>
                <p>AQL is the maximum defect rate you're willing to accept most of the time (typically 95% acceptance probability).</p>
                
                <div class="highlight-box">
                    <strong>AQL Concept:</strong>
                    <ul>
                        <li><strong>AQL 1.0%:</strong> You accept lots with 1% defects 95% of the time</li>
                        <li><strong>AQL 2.5%:</strong> You accept lots with 2.5% defects 95% of the time</li>
                        <li><strong>Lower AQL = Stricter quality requirements</strong></li>
                    </ul>
                </div>
                
                <div class="example-box">
                    <strong>Industry Standards (ANSI/ASQ Z1.4):</strong>
                    <ul>
                        <li>Critical defects: AQL 0.15% or lower</li>
                        <li>Major defects: AQL 1.0% to 2.5%</li>
                        <li>Minor defects: AQL 4.0% to 6.5%</li>
                    </ul>
                </div>
                
                <p>The AQL Plan Table Lookup page helps you find standard sampling plans based on your lot size and desired AQL!</p>
            `,
                highlight: null
            },
            {
                title: "Reverse Engineering Plans",
                content: `
                <h3>Working Backwards from Requirements</h3>
                <p>Sometimes you know your quality requirements but need to find the right sampling plan parameters.</p>
                
                <div class="highlight-box">
                    <strong>Reverse Query Scenarios:</strong>
                    <ul>
                        <li><strong>Find AQL:</strong> Given n, c, and target acceptance rate</li>
                        <li><strong>Find Sample Size:</strong> Given AQL, c, and target acceptance rate</li>
                        <li><strong>Find Acceptance Number:</strong> Given n, AQL, and target acceptance rate</li>
                        <li><strong>Find Lot Size:</strong> For hypergeometric plans</li>
                    </ul>
                </div>
                
                <div class="example-box">
                    <strong>Example Problem:</strong>
                    <p>"I want to accept lots with 1% defects at least 95% of the time, and I can only inspect 100 items with c=2. What's my actual AQL?"</p>
                    <p><strong>Solution:</strong> Use Reverse Query to calculate AQL -> 1.24%</p>
                </div>
                
                <p>This is powerful for validating existing plans or designing custom ones!</p>
            `,
                highlight: null
            },
            {
                title: "Comparing Multiple Plans",
                content: `
                <h3>Plan Comparison and Optimization</h3>
                <p>Different sampling plans have different risk profiles. The Multiple Plan Comparison page helps you visualize and choose the best one.</p>
                
                <div class="highlight-box">
                    <strong>Important Statistical Concept:</strong>
                    <p>Plans from different pages may use different probability distributions (Hypergeometric/Binomial/Poisson). Even with the same n,c values, they can produce different OC curves!</p>
                </div>
                
                <div class="example-box">
                    <strong>Comparison Strategies:</strong>
                    <ul>
                        <li><strong>Risk Analysis:</strong> Compare producer's risk (alpha) and consumer's risk (beta)</li>
                        <li><strong>Cost Analysis:</strong> Balance inspection costs vs. quality costs</li>
                        <li><strong>Discrimination:</strong> Choose plans with steeper OC curves</li>
                    </ul>
                </div>
                
                <div class="warning-box">
                    <strong>Pro Tip:</strong> Export plans from different pages to compare their performance under various statistical assumptions!
                </div>
            `,
                highlight: null
            },
            {
                title: "Advanced Curve Analysis: AOQ & ATI",
                content: `
                <h3>Beyond OC Curves: Quality and Cost Analysis</h3>
                <p>The Multiple Plan Comparison page now supports three types of curves for comprehensive plan evaluation:</p>
                
                <div class="highlight-box">
                    <strong>OC Curves (Operating Characteristic):</strong>
                    <ul>
                        <li>Shows acceptance probability vs. defect rate</li>
                        <li>Primary tool for risk assessment</li>
                        <li>Steeper curves = better discrimination</li>
                    </ul>
                </div>
                
                <div class="example-box">
                    <strong>AOQ Curves (Average Outgoing Quality):</strong>
                    <ul>
                        <li>Formula: AOQ = p * Pa * (N-n)/N</li>
                        <li>Shows average quality of accepted lots</li>
                        <li>Lower AOQ = better quality protection</li>
                        <li>Peak AOQ indicates maximum outgoing quality</li>
                    </ul>
                </div>
                
                <div class="warning-box">
                    <strong>ATI Curves (Average Total Inspection):</strong>
                    <ul>
                        <li>Formula: ATI = n + (1-Pa) * (N-n)</li>
                        <li>Shows average inspection cost per lot</li>
                        <li>Lower ATI = more cost-effective</li>
                        <li>Balances sample size vs. 100% inspection</li>
                    </ul>
                </div>
                
                <p><strong>Usage:</strong> Click "Show AOQ Curves" or "Show ATI Curves" buttons to switch between different analysis modes!</p>
            `,
                highlight: null
            },
            {
                title: "AQL-LTPD Balanced Plans",
                content: `
                <h3>Advanced Optimization: Balancing Producer and Consumer Risks</h3>
                <p>The AQL-LTPD Balanced Plan page uses mathematical optimization to design plans that balance both producer and consumer requirements.</p>
                
                <div class="highlight-box">
                    <strong>Key Concepts:</strong>
                    <ul>
                        <li><strong>AQL (Acceptable Quality Level):</strong> Maximum defect rate you accept 95% of the time</li>
                        <li><strong>LTPD (Lot Tolerance Percent Defective):</strong> Maximum defect rate you accept 10% of the time</li>
                        <li><strong>Producer's Risk (alpha):</strong> Probability of rejecting a good lot</li>
                        <li><strong>Consumer's Risk (beta):</strong> Probability of accepting a bad lot</li>
                    </ul>
                </div>
                
                <div class="example-box">
                    <strong>Optimization Strategies:</strong>
                    <ul>
                        <li><strong>Minimize Sample Size:</strong> Find smallest n that meets constraints</li>
                        <li><strong>Balance AQL-LTPD:</strong> Equal weight to both requirements</li>
                        <li><strong>Maximize Producer Protection:</strong> Minimize producer's risk</li>
                        <li><strong>Maximize Consumer Protection:</strong> Minimize consumer's risk</li>
                    </ul>
                </div>
                
                <div class="warning-box">
                    <strong>Plan Efficiency Formula:</strong>
                    <p>E = 1 - |Pa_AQL - (1-alpha)| - |Pa_LTPD - beta| - penalty</p>
                    <p>Higher efficiency = better balance of risks and requirements</p>
                </div>
                
                <p><strong>Usage:</strong> Set your AQL, LTPD, lot size, and risk preferences, then choose optimization strategy!</p>
            `,
                highlight: null
            },
            {
                title: "Quiz: Test Your Knowledge!",
                content: `
                <h3>Quick Knowledge Check</h3>
                <p>Randomly selected questions. Click the correct answer:</p>
                <div id="tutorial-quiz-container"></div>
                <div style="margin-top: 16px; display:flex; gap:8px; align-items:center;">
                    <button id="quiz-refresh-btn" class="btn">Refresh Quiz</button>
                    <span style="color: var(--muted); font-style: italic;">Each refresh pulls new questions covering key sampling plan topics.</span>
                </div>
            `,
                highlight: null,
                isQuiz: true
            }
        ];

        // ===== Quiz bank (>=50 questions) =====
        const quizQuestionBank = [
            { q: 'Which distribution applies to finite lots with sampling without replacement?', options: ['Hypergeometric', 'Binomial', 'Poisson'], answer: 0 },
            { q: 'For very large (or effectively infinite) lots with constant defect rate, which distribution is typical?', options: ['Hypergeometric', 'Binomial', 'Poisson'], answer: 1 },
            { q: 'When sample size is large and defect rate is small, which approximation is commonly used?', options: ['Poisson', 'Binomial', 'Normal'], answer: 0 },
            { q: 'On an OC curve, what does the y-axis represent?', options: ['Defect rate', 'Acceptance probability (Pa)', 'Sample size'], answer: 1 },
            { q: 'On an OC curve, what is usually on the x-axis?', options: ['Defect rate p (%)', 'Sample size n', 'AQL value'], answer: 0 },
            { q: 'What does AQL 1.0% typically mean?', options: ['Allow 1% defects', 'Lots with 1% defects are accepted about 95% of the time', 'Average defect rate equals 1%'], answer: 1 },
            { q: 'Under the same distribution, increasing n tends to make the OC curve?', options: ['Steeper', 'Flatter', 'Unchanged'], answer: 0 },
            { q: 'With the same n, increasing c tends to shift the curve?', options: ['To the right', 'To the left', 'No shift'], answer: 0 },
            { q: 'In a C=0 plan, what is c?', options: ['0', '1', '2'], answer: 0 },
            { q: 'In plan parameters (n, c), what does c denote?', options: ['Sample size', 'Acceptance number', 'Lot size'], answer: 1 },
            { q: 'Given N=500, n=50, without replacement, which distribution?', options: ['Binomial', 'Hypergeometric', 'Poisson'], answer: 1 },
            { q: 'A smaller AQL indicates?', options: ['Looser control', 'Stricter control', 'No relation to strictness'], answer: 1 },
            { q: 'Which pages can export a plan to Multiple Plan Comparison?', options: ['Reverse', 'AQL Lookup', 'Both'], answer: 2 },
            { q: 'Where do you set the x-axis maximum on the Comparison chart?', options: ['Left parameters panel', 'Chart toolbar (top-right)', 'Hidden setting'], answer: 1 },
            { q: 'In hypergeometric distribution, which extra parameter is required?', options: ['Lot size N', 'Lambda', 'Mean'], answer: 0 },
            { q: 'The Poisson parameter is typically approximated as?', options: ['n*p', 'n/p', 'n+p'], answer: 0 },
            { q: 'To display an AQL marker on the chart, you must provide?', options: ['AQL (%)', 'LTPD (%)', 'alpha and beta risks'], answer: 0 },
            { q: 'A steeper OC curve implies?', options: ['Better discrimination', 'Worse discrimination', 'Cannot tell'], answer: 0 },
            { q: 'On the Reverse page you can solve for?', options: ['AQL', 'n', 'c', 'All of the above'], answer: 3 },
            { q: 'A common use case of C=0 plans is?', options: ['High-risk critical defects', 'General inspection', 'Documentation'], answer: 0 },
            { q: 'For Binomial, the acceptance probability uses CDF(c; n, p). Here p means?', options: ['Sample proportion', 'Defect rate', 'Pass rate'], answer: 1 },
            { q: 'For Poisson in sampling, lambda is often?', options: ['n*p', 'p/n', 'n/p'], answer: 0 },
            { q: 'Across different distributions, OC curves for the same (n, c) can be?', options: ['Identical', 'Different', 'Not drawable'], answer: 1 },
            { q: 'When N is very large, sampling without replacement can be approximated by?', options: ['Binomial', 'Hypergeometric', 'Poisson'], answer: 0 },
            { q: 'The AQL lookup page references which standard?', options: ['ANSI/ASQ Z1.4', 'MIL-STD-105E', 'ISO 9001'], answer: 0 },
            { q: 'To compare plans, you should examine?', options: ['OC curve shape/shift', 'x-axis unit only', 'Chart background color'], answer: 0 },
            { q: 'Increasing c typically affects producer risk (alpha) by?', options: ['Increasing', 'Decreasing', 'No change'], answer: 1 },
            { q: 'Increasing n typically affects consumer risk (beta) by?', options: ['Increasing', 'Decreasing', 'No change'], answer: 1 },
            { q: 'In this tool, Pa ranges between?', options: ['0 to 100', '0 to 1', '1 to 100'], answer: 1 },
            { q: 'The x-axis p values are expressed in?', options: ['Decimal fraction', 'Percent (%)', 'Per mille'], answer: 1 },
            { q: 'If AQL=2.5%, a typical Pa at p=2.5% is?', options: ['95%', '90%', '50%'], answer: 0 },
            { q: 'Poisson approximation is most suitable for?', options: ['Small n, high p', 'Large n, small p', 'Any case'], answer: 1 },
            { q: 'Key parameters for Hypergeometric are?', options: ['N, n, c, p', 'n, c, p', 'N, p'], answer: 0 },
            { q: 'Are AQL dots shown in the legend on Comparison?', options: ['Shown', 'Hidden', 'Configurable'], answer: 1 },
            { q: 'AQL marker tooltip shows?', options: ['p only', 'Pa only', 'p and Pa'], answer: 2 },
            { q: 'Default unit for target Pa on Reverse page is?', options: ['%', 'Decimal', 'Not displayed'], answer: 0 },
            { q: 'If n < c, the app will?', options: ['Show an error', 'Proceed normally', 'Auto-correct'], answer: 0 },
            { q: 'Chart export buttons are located?', options: ['Left side', 'Chart toolbar', 'Footer'], answer: 1 },
            { q: 'In Multiple Plan Comparison, newly added manual plans default to?', options: ['Hypergeometric', 'Binomial', 'Poisson'], answer: 1 },
            { q: 'Main difference between Binomial and Hypergeometric?', options: ['With/without replacement', 'Sample size only', 'Presence of AQL'], answer: 0 },
            { q: 'To consider lot depletion effect, choose?', options: ['Binomial', 'Hypergeometric', 'Poisson'], answer: 1 },
            { q: 'When comparing different (n, c) plans, recommended approach?', options: ['View one curve only', 'Visualize multiple curves together', 'Rely on text'], answer: 1 },
            { q: 'Typical acceptance probability at AQL?', options: ['50%', '80%', '95%'], answer: 2 },
            { q: 'To tighten inspection stringency you could?', options: ['Lower n', 'Lower c or increase n', 'Do nothing'], answer: 1 },
            { q: 'LTPD commonly describes?', options: ['A consumer-risk point for bad lots', 'Average defect rate', 'Best cost'], answer: 0 },
            { q: 'Label on the randomize button should be?', options: ['Refresh questions', 'Refresh Quiz', 'Reset quiz'], answer: 1 },
            { q: 'If distributions differ but (n, c) are the same, OC can be?', options: ['Exactly the same', 'Slightly different', 'Not drawable'], answer: 1 },
            { q: 'An advantage of C=0 for high-risk defects is?', options: ['Looser acceptance threshold', 'Lower consumer risk', 'Higher producer risk'], answer: 1 },
            { q: 'Position of the AQL marker is determined by?', options: ['AQL and Pa(AQL)', 'n and c', 'N and n'], answer: 0 },
            { q: 'After changing x-axis max in Comparison, AQL dots?', options: ['Do not update', 'Update automatically', 'Require page reload'], answer: 1 },
            { q: 'Can the Reverse page export a plan to Comparison?', options: ['Yes', 'No', 'C=0 only'], answer: 0 },
            { q: 'Can the AQL Lookup page export a plan?', options: ['Yes', 'No', 'Hypergeometric only'], answer: 0 },
            { q: 'What does AOQ stand for?', options: ['Average Outgoing Quality', 'Acceptable Quality Level', 'Average Quality Output'], answer: 0 },
            { q: 'What does ATI stand for?', options: ['Average Total Inspection', 'Acceptable Total Inspection', 'Average Test Items'], answer: 0 },
            { q: 'AOQ formula is: AOQ = p ? Pa ? (N-n)/N. What does p represent?', options: ['Sample size', 'Defect rate', 'Acceptance probability'], answer: 1 },
            { q: 'ATI formula is: ATI = n + (1-Pa) ? (N-n). What does (1-Pa) represent?', options: ['Acceptance probability', 'Rejection probability', 'Defect rate'], answer: 1 },
            { q: 'In the AQL-LTPD Balanced Plan page, what does "Minimize Sample Size" optimization do?', options: ['Find largest n', 'Find smallest n that meets constraints', 'Balance n and c'], answer: 1 },
            { q: 'Plan Efficiency formula includes which components?', options: ['Only AQL deviation', 'AQL deviation + LTPD deviation + penalty', 'Only LTPD deviation'], answer: 1 },
            { q: 'Which curve type shows inspection costs?', options: ['OC curves', 'AOQ curves', 'ATI curves'], answer: 2 },
            { q: 'Which curve type shows outgoing quality?', options: ['OC curves', 'AOQ curves', 'ATI curves'], answer: 1 },
            { q: 'In Multiple Plan Comparison, how many curve types can you display?', options: ['1 (OC only)', '2 (OC and AOQ)', '3 (OC, AOQ, ATI)'], answer: 2 },
            { q: 'What happens when you change max defect rate in AOQ mode?', options: ['Switches to OC mode', 'Stays in AOQ mode', 'Shows error'], answer: 1 },
            { q: 'ATI curves show values in which unit?', options: ['Percentage (%)', 'Count (number)', 'Decimal (0-1)'], answer: 1 },
            { q: 'AOQ curves show values in which unit?', options: ['Percentage (%)', 'Count (number)', 'Decimal (0-1)'], answer: 0 },
            { q: 'What is the purpose of AQL-LTPD Balanced Plans?', options: ['Find standard plans', 'Optimize plans balancing both risks', 'Calculate C=0 plans'], answer: 1 },
            { q: 'Which optimization strategy gives equal weight to AQL and LTPD?', options: ['Minimize Sample Size', 'Balance AQL-LTPD', 'Maximize Producer Protection'], answer: 1 }
        ];

        // ===== AQL-LTPD Balanced Plan Page Functionality =====
        initAqlLtpdPage({
            document: document,
            window: window,
            Chart: Chart,
            calculateAcceptanceProbability: calculateAcceptanceProbability,
            calculateAOQL: calculateAOQL,
            calculateASN: calculateASN,
            calculateATI: calculateATI,
            calculateOptimalAqlLtpdPlan: calculateOptimalAqlLtpdPlan,
            calculatePlanEfficiency: calculatePlanEfficiency,
            getEnhancedThemeColors: getEnhancedThemeColors,
            onChartChange: function (chart) {
                aqlLtpdChart = chart;
            }
        });

        // Initialize systems when page loads
        document.addEventListener('DOMContentLoaded', function () {
            initThemeSystem({
                document: document,
                localStorage: localStorage,
                getCharts: function () {
                    return [ocChart, planChart, revChart, ssChart, c0Chart, aqlLtpdChart];
                }
            });
            initTutorialSystem({
                document: document,
                tutorialSteps: tutorialSteps,
                quizQuestionBank: quizQuestionBank
            });
            initHelpSystem({ document: document });
        });

        // Universal chart label updater for real-time typing
        ['rev_plan_label', 'ss_plan_label', 'c0_plan_label', 'aql_ltpd_plan_label'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', (e) => {
                let chart = null;
                if (id === 'rev_plan_label') chart = typeof revChart !== 'undefined' ? revChart : null;
                if (id === 'ss_plan_label') chart = typeof ssChart !== 'undefined' ? ssChart : null;
                if (id === 'c0_plan_label') chart = typeof c0Chart !== 'undefined' ? c0Chart : null;
                if (id === 'aql_ltpd_plan_label') chart = typeof aqlLtpdChart !== 'undefined' ? aqlLtpdChart : null;
                
                if (chart && chart.data && chart.data.datasets && chart.data.datasets.length > 0) {
                    chart.data.datasets[0].label = e.target.value;
                    chart.update();
                }
            });
        });

