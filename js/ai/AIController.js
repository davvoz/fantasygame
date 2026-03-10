/**
 * Drives a character through a sequence of Behaviors, looping forever.
 *
 * Usage:
 *   const ai = new AIController(character, [
 *       new PatrolBehavior({ ... }),
 *       new WaitBehavior(2),
 *   ]);
 *   // in update loop:
 *   ai.update(deltaTime);
 */
export class AIController {
    #character;
    #behaviors;
    #index = 0;

    constructor(character, behaviors = []) {
        this.#character = character;
        this.#behaviors = behaviors;
        if (behaviors.length > 0) {
            behaviors[0].enter(this.#character);
        }
    }

    update(deltaTime) {
        if (this.#behaviors.length === 0) return;

        const current = this.#behaviors[this.#index];
        current.onUpdate(this.#character, deltaTime);

        if (current.finished) {
            current.reset();
            this.#index = (this.#index + 1) % this.#behaviors.length;
            this.#behaviors[this.#index].enter(this.#character);
        }
    }
}
