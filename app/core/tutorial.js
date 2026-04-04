export function initTutorialSystem(options) {
    const {
        document,
        tutorialSteps,
        quizQuestionBank,
        alertFn = globalThis.alert ? globalThis.alert.bind(globalThis) : function () {},
        setTimeoutFn = globalThis.setTimeout ? globalThis.setTimeout.bind(globalThis) : function (fn) { fn(); }
    } = options;

    let currentTutorialStep = 0;
    let tutorialActive = false;

    const tutorialModal = document.getElementById('tutorial-modal');
    const tutorialTitle = document.getElementById('tutorial-title');
    const tutorialStepContent = document.getElementById('tutorial-step-content');
    const tutorialProgressFill = document.getElementById('tutorial-progress-fill');
    const tutorialProgressText = document.getElementById('tutorial-progress-text');
    const tutorialDots = document.getElementById('tutorial-dots');
    const tutorialPrevBtn = document.getElementById('tutorial-prev-btn');
    const tutorialNextBtn = document.getElementById('tutorial-next-btn');
    const tutorialCloseBtn = document.getElementById('tutorial-close-btn');
    const tutorialHighlight = document.getElementById('tutorial-highlight');
    const startTutorialBtn = document.getElementById('start-tutorial-btn');
    const tutorialOverlay = document.querySelector('.tutorial-overlay');

    function shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function renderRandomQuiz(count = 6) {
        const container = document.getElementById('tutorial-quiz-container');
        if (!container) return;

        container.innerHTML = '';
        const picked = shuffleArray([...quizQuestionBank]).slice(0, Math.max(5, count));
        picked.forEach((item, idx) => {
            const wrap = document.createElement('div');
            wrap.className = 'tutorial-quiz';

            const q = document.createElement('p');
            q.innerHTML = `<strong>Question ${idx + 1}:</strong> ${item.q}`;
            wrap.appendChild(q);

            item.options.forEach((opt, i) => {
                const div = document.createElement('div');
                div.className = 'tutorial-quiz-option';
                div.setAttribute('data-correct', String(i === item.answer));
                div.textContent = opt;
                wrap.appendChild(div);
            });

            container.appendChild(wrap);
        });

        setTimeoutFn(() => {
            container.querySelectorAll('.tutorial-quiz-option').forEach(option => {
                option.addEventListener('click', function () {
                    const isCorrect = this.getAttribute('data-correct') === 'true';
                    this.classList.add(isCorrect ? 'correct' : 'incorrect');
                    const quiz = this.closest('.tutorial-quiz');
                    quiz.querySelectorAll('.tutorial-quiz-option').forEach(opt => {
                        if (opt !== this) opt.style.pointerEvents = 'none';
                    });

                    if (isCorrect) {
                        this.innerHTML += ' Correct';
                    } else {
                        this.innerHTML += ' Try again!';
                        setTimeoutFn(() => {
                            const correct = quiz.querySelector('[data-correct="true"]');
                            if (correct) {
                                correct.classList.add('correct');
                                correct.innerHTML += ' This is correct!';
                            }
                        }, 600);
                    }
                });
            });
        }, 50);
    }

    function closeTutorial() {
        tutorialActive = false;
        if (tutorialModal) tutorialModal.style.display = 'none';
        if (tutorialHighlight) tutorialHighlight.style.display = 'none';
        document.body.style.overflow = '';
    }

    function highlightElement(selector) {
        const element = document.querySelector(selector);
        if (!(element && tutorialHighlight)) return;

        const rect = element.getBoundingClientRect();
        tutorialHighlight.style.display = 'block';
        tutorialHighlight.style.left = `${rect.left - 5}px`;
        tutorialHighlight.style.top = `${rect.top - 5}px`;
        tutorialHighlight.style.width = `${rect.width + 10}px`;
        tutorialHighlight.style.height = `${rect.height + 10}px`;
    }

    function updateTutorialStep() {
        const step = tutorialSteps[currentTutorialStep];
        if (!(step && tutorialTitle && tutorialStepContent && tutorialProgressFill && tutorialProgressText && tutorialPrevBtn && tutorialNextBtn)) {
            return;
        }

        tutorialTitle.textContent = step.title;
        tutorialStepContent.innerHTML = step.content;

        const progress = ((currentTutorialStep + 1) / tutorialSteps.length) * 100;
        tutorialProgressFill.style.width = `${progress}%`;
        tutorialProgressText.textContent = `Step ${currentTutorialStep + 1} of ${tutorialSteps.length}`;

        document.querySelectorAll('.tutorial-dot').forEach((dot, index) => {
            dot.classList.toggle('active', index === currentTutorialStep);
        });

        tutorialPrevBtn.style.display = currentTutorialStep > 0 ? 'block' : 'none';
        tutorialNextBtn.textContent = currentTutorialStep === tutorialSteps.length - 1 ? 'Complete Tutorial!' : 'Next';

        if (step.highlight) {
            highlightElement(step.highlight);
        } else if (tutorialHighlight) {
            tutorialHighlight.style.display = 'none';
        }

        if (step.isQuiz) {
            setTimeoutFn(() => {
                renderRandomQuiz(6);
                const btn = document.getElementById('quiz-refresh-btn');
                if (btn) {
                    btn.onclick = function () {
                        renderRandomQuiz(6);
                    };
                }
            }, 50);
        }
    }

    function startTutorial() {
        tutorialActive = true;
        currentTutorialStep = 0;
        if (tutorialModal) tutorialModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        updateTutorialStep();

        setTimeoutFn(() => {
            const content = tutorialModal?.querySelector('.tutorial-content');
            if (content) content.style.animation = 'none';
        }, 400);
    }

    function nextTutorialStep() {
        if (currentTutorialStep < tutorialSteps.length - 1) {
            currentTutorialStep++;
            updateTutorialStep();
        } else {
            setTimeoutFn(() => {
                alertFn('Congratulations! You\'ve completed the Sampling Plan Tutorial!\n\nYou\'re now ready to use all the advanced features of this analyzer. Happy sampling!');
                closeTutorial();
            }, 100);
        }
    }

    function prevTutorialStep() {
        if (currentTutorialStep > 0) {
            currentTutorialStep--;
            updateTutorialStep();
        }
    }

    function goToTutorialStep(stepIndex) {
        if (stepIndex >= 0 && stepIndex < tutorialSteps.length) {
            currentTutorialStep = stepIndex;
            updateTutorialStep();
        }
    }

    if (tutorialDots) {
        tutorialDots.innerHTML = '';
        tutorialSteps.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.className = `tutorial-dot ${index === 0 ? 'active' : ''}`;
            dot.addEventListener('click', () => goToTutorialStep(index));
            tutorialDots.appendChild(dot);
        });
    }

    startTutorialBtn?.addEventListener('click', startTutorial);
    tutorialCloseBtn?.addEventListener('click', closeTutorial);
    tutorialPrevBtn?.addEventListener('click', prevTutorialStep);
    tutorialNextBtn?.addEventListener('click', nextTutorialStep);
    tutorialOverlay?.addEventListener('click', closeTutorial);

    document.addEventListener('keydown', e => {
        if (!tutorialActive) return;
        if (e.key === 'Escape') closeTutorial();
        if (e.key === 'ArrowLeft') prevTutorialStep();
        if (e.key === 'ArrowRight') nextTutorialStep();
    });
}
