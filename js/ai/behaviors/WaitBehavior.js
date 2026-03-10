import { Behavior } from '../Behavior.js';

/**
 * Does nothing for a set duration, then finishes.
 * Useful between other behaviors (e.g. pause between patrols).
 *
 * @param {number} duration – seconds to wait
 */
export class WaitBehavior extends Behavior {
    #duration;
    #elapsed = 0;

    constructor(duration) {
        super();
        this.#duration = duration;
    }

    enter() {
        this.#elapsed = 0;
    }

    onUpdate(_character, deltaTime) {
        this.#elapsed += deltaTime;
        if (this.#elapsed >= this.#duration) {
            this.finish();
        }
    }

    reset() {
        super.reset();
        this.#elapsed = 0;
    }
}
