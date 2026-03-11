import { Actions } from './Actions.js';

export class InputManager {
    #activeActions = new Set();
    #keyMap = new Map();
    #mouseX = 0;
    #mouseY = 0;
    #canvas = null;

    constructor() {
        this.#setupDefaultBindings();
        this.#setupListeners();
    }

    /** Bind to a canvas so mouse coords are in game-space. */
    setCanvas(canvas) {
        this.#canvas = canvas;
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            this.#mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
            this.#mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
        });
        canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.#activeActions.add(Actions.SPELL);
        });
        canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.#activeActions.delete(Actions.SPELL);
        });
    }

    get mouseX() { return this.#mouseX; }
    get mouseY() { return this.#mouseY; }

    /* ---- key bindings ---- */

    #setupDefaultBindings() {
        this.bind('ArrowLeft',  Actions.MOVE_LEFT);
        this.bind('KeyA',       Actions.MOVE_LEFT);
        this.bind('ArrowRight', Actions.MOVE_RIGHT);
        this.bind('KeyD',       Actions.MOVE_RIGHT);
        this.bind('ArrowUp',   Actions.JUMP);
        this.bind('KeyW',      Actions.JUMP);
        this.bind('ArrowDown', Actions.CROUCH);
        this.bind('KeyS',      Actions.CROUCH);
        this.bind('KeyE',      Actions.BLOCK);
    }

    bind(code, action) {
        this.#keyMap.set(code, action);
    }

    unbind(code) {
        this.#keyMap.delete(code);
    }

    /* ---- listeners ---- */

    #setupListeners() {
        window.addEventListener('keydown', (e) => {
            const action = this.#keyMap.get(e.code);
            if (action !== undefined) {
                e.preventDefault();
                this.#activeActions.add(action);
            }
        });

        window.addEventListener('keyup', (e) => {
            const action = this.#keyMap.get(e.code);
            if (action !== undefined) {
                this.#activeActions.delete(action);
            }
        });
    }

    /* ---- programmatic activation (for touch controls) ---- */

    activate(action) {
        this.#activeActions.add(action);
    }

    deactivate(action) {
        this.#activeActions.delete(action);
    }

    setMousePosition(x, y) {
        this.#mouseX = x;
        this.#mouseY = y;
    }

    /* ---- queries ---- */

    isActive(action) {
        return this.#activeActions.has(action);
    }

    getActiveActions() {
        return new Set(this.#activeActions);
    }
}
