import { Behavior } from '../Behavior.js';
import { Direction } from '../../entities/Direction.js';

/**
 * When the character is close enough to the target, face it and attack.
 * Finishes immediately after triggering the attack state so the AI
 * controller can move on to the next behavior (e.g. resume patrol).
 *
 * Options:
 *   target – the entity to attack
 *   range  – max distance (px) to trigger attack (default 120)
 */
export class AttackBehavior extends Behavior {
    #target;
    #range;

    constructor({ target, range = 120 } = {}) {
        super();
        this.#target = target;
        this.#range = range;
    }

    set target(t) { this.#target = t; }

    enter(_character) {
        // nothing special on enter
    }

    onUpdate(character, _deltaTime) {
        if (!this.#target || !this.#target.alive) {
            this.finish();
            return;
        }

        const cx = character.x + character.width / 2;
        const tx = this.#target.x + this.#target.width / 2;
        const dist = Math.abs(cx - tx);

        if (dist <= this.#range) {
            // Face the target
            character.direction = tx < cx ? Direction.LEFT : Direction.RIGHT;
            // Trigger attack state
            character.stateMachine.transition('attack');
            this.finish();
        } else {
            // Not in range — just finish so patrol continues
            this.finish();
        }
    }

    reset() {
        super.reset();
    }
}
