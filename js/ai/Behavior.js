/**
 * Base class for AI behaviors.
 * A Behavior is a single "task" an AI character can perform
 * (patrol, wait, chase, flee…). Subclasses override `onUpdate`
 * and call `finish()` when the task is complete.
 */
export class Behavior {
    #finished = false;

    get finished() { return this.#finished; }

    /** Called once when the behavior becomes active. */
    enter(character) {}

    /** Called every frame while active. */
    onUpdate(character, deltaTime) {}

    /** Mark this behavior as done. */
    finish() { this.#finished = true; }

    /** Reset so the behavior can be reused. */
    reset() { this.#finished = false; }
}
