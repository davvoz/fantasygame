/**
 * Generic finite state machine.
 * States are registered by name; transitions trigger enter/exit hooks.
 */
export class StateMachine {
    #states = new Map();
    #currentState = null;
    #currentName = null;
    #inputManager = null;

    register(name, state) {
        this.#states.set(name, state);
    }

    get currentState() { return this.#currentState; }
    get currentName() { return this.#currentName; }

    transition(name) {
        if (name === this.#currentName) return;
        const next = this.#states.get(name);
        if (!next) return;
        this.#currentState?.exit();
        this.#currentName = name;
        this.#currentState = next;
        this.#currentState.enter(this.#inputManager);
    }

    update(deltaTime, inputManager) {
        this.#inputManager = inputManager;
        this.#currentState?.update(deltaTime, inputManager);
    }
}
