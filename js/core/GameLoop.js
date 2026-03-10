export class GameLoop {
    #callback;
    #lastTime = 0;
    #running = false;
    #rafId = null;

    constructor(callback) {
        this.#callback = callback;
    }

    start() {
        this.#running = true;
        this.#lastTime = performance.now();
        this.#rafId = requestAnimationFrame(this.#loop);
    }

    stop() {
        this.#running = false;
        if (this.#rafId !== null) {
            cancelAnimationFrame(this.#rafId);
            this.#rafId = null;
        }
    }

    #loop = (now) => {
        if (!this.#running) return;
        const deltaTime = now - this.#lastTime;
        this.#lastTime = now;
        this.#callback(deltaTime);
        this.#rafId = requestAnimationFrame(this.#loop);
    };
}
