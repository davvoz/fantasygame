/**
 * Base class for all states.
 * Subclasses override enter(), exit(), update().
 */
export class State {
    #character;

    constructor(character) {
        this.#character = character;
    }

    get character() { return this.#character; }

    enter() {}
    exit() {}
    update(deltaTime, inputManager) {}
}
