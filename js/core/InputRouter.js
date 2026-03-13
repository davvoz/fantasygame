export class InputRouter {
    #controller;
    #isMobile;
    #canvas;

    constructor(controller, { isMobile, canvas }) {
        this.#controller = controller;
        this.#isMobile = isMobile;
        this.#canvas = canvas;
    }

    /** Bind all keyboard and mobile input handlers for title / level select / game over phases. */
    bind() {
        window.addEventListener('keydown', (e) => this.#handleKeyDown(e));

        if (this.#isMobile) {
            this.#canvas.addEventListener('touchstart', (e) => this.#handleCanvasTouch(e), { passive: false });
            document.addEventListener('touchstart', (e) => this.#handleDocumentTouch(e), { passive: false, capture: true });
        }
    }

    /** Bind fullscreen toggle (called after game init). */
    bindFullscreen() {
        window.addEventListener('keydown', (e) => {
            if (e.code === 'KeyF') {
                if (!document.fullscreenElement) {
                    this.#canvas.requestFullscreen().catch(() => {});
                } else {
                    document.exitFullscreen();
                }
            }
        });

        if (this.#isMobile) {
            const enterFullscreen = () => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(() => {});
                }
                window.removeEventListener('touchstart', enterFullscreen);
            };
            window.addEventListener('touchstart', enterFullscreen, { once: true });
        }
    }

    // ── Keyboard ─────────────────────────────────────────────────

    #handleKeyDown(e) {
        const ctrl = this.#controller;

        // Title animation — skip
        if (ctrl.titleAnimation?.alive && !ctrl.gameInitialized) {
            if (e.code === 'Space' || e.code === 'Enter') {
                ctrl.titleAnimation.skip();
                return;
            }
        }

        // Level select — navigate & confirm
        if (ctrl.levelSelectScreen?.alive) {
            if (e.code === 'ArrowUp' || e.code === 'KeyW') {
                ctrl.levelSelectScreen.selectPrev();
            } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
                ctrl.levelSelectScreen.selectNext();
            } else if (e.code === 'Space' || e.code === 'Enter') {
                ctrl.levelSelectScreen.confirm();
            }
            return;
        }

        // Level transition intro — skip
        if (ctrl.levelTransitionAnimation?.alive) {
            if (e.code === 'Space' || e.code === 'Enter') {
                ctrl.levelTransitionAnimation.skip();
            }
            return;
        }

        // Game over — play again
        if (ctrl.gameOverAnimation?.alive && ctrl.gameOverAnimation.waitingForInput) {
            if (e.code === 'Space' || e.code === 'Enter') {
                ctrl.gameOverAnimation.playAgain();
            }
            return;
        }

        // Victory — play again
        if (ctrl.victoryAnimation?.alive && ctrl.victoryAnimation.waitingForInput) {
            if (e.code === 'Space' || e.code === 'Enter') {
                ctrl.victoryAnimation.playAgain();
            }
        }
    }

    // ── Mobile Touch (canvas) ────────────────────────────────────

    #handleCanvasTouch(e) {
        const ctrl = this.#controller;

        // Title — skip
        if (ctrl.titleAnimation?.alive && !ctrl.gameInitialized) {
            e.preventDefault();
            ctrl.titleAnimation.skip();
            return;
        }

        // Level select — navigate & confirm by tap zone
        if (ctrl.levelSelectScreen?.alive) {
            e.preventDefault();
            const rect = this.#canvas.getBoundingClientRect();
            const touchY = e.touches[0].clientY - rect.top;
            const mid = rect.height / 2;
            if (touchY < mid * 0.6) {
                ctrl.levelSelectScreen.selectPrev();
            } else if (touchY > mid * 1.4) {
                ctrl.levelSelectScreen.selectNext();
            } else {
                ctrl.levelSelectScreen.confirm();
            }
        }
    }

    // ── Mobile Touch (document, capture) ─────────────────────────

    #handleDocumentTouch(e) {
        const ctrl = this.#controller;

        // Level transition intro — skip
        if (ctrl.levelTransitionAnimation?.alive) {
            e.preventDefault();
            e.stopImmediatePropagation();
            ctrl.levelTransitionAnimation.skip();
            return;
        }

        // Game over — play again
        if (ctrl.gameOverAnimation?.alive && ctrl.gameOverAnimation.waitingForInput) {
            e.preventDefault();
            e.stopImmediatePropagation();
            ctrl.gameOverAnimation.playAgain();
            return;
        }

        // Victory — play again
        if (ctrl.victoryAnimation?.alive && ctrl.victoryAnimation.waitingForInput) {
            e.preventDefault();
            e.stopImmediatePropagation();
            ctrl.victoryAnimation.playAgain();
        }
    }
}
