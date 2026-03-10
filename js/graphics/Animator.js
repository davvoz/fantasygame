/**
 * Manages a set of named animations and plays the current one.
 * Acts as the single point of control for animation switching.
 */
export class Animator {
    #animations = new Map();
    #currentKey = null;
    #speedMultiplier = 1;

    register(key, animation) {
        this.#animations.set(key, animation);
    }

    play(key, speedMultiplier = 1) {
        this.#speedMultiplier = speedMultiplier;
        if (this.#currentKey === key) return;
        this.#currentKey = key;
        this.current?.reset();
    }

    get currentKey() { return this.#currentKey; }

    get current() {
        return this.#animations.get(this.#currentKey) ?? null;
    }

    update(deltaTime) {
        this.current?.update(deltaTime * this.#speedMultiplier);
    }

    draw(ctx, x, y, width, height) {
        this.current?.draw(ctx, x, y, width, height);
    }

    /** Pixel test at normalised coords for the active animation frame. */
    isOpaqueAt(fracX, fracY) {
        return this.current?.isOpaqueAt(fracX, fracY) ?? false;
    }
}
