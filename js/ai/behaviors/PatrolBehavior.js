import { Behavior } from '../Behavior.js';
import { Direction } from '../../entities/Direction.js';

/**
 * Moves a character back and forth between waypoints.
 *
 * Each waypoint is { x, y }. The character flies toward
 * the next waypoint at its own `speed`, flipping direction
 * when appropriate. Finishes when all waypoints have been
 * visited (then the controller loops or moves to next behavior).
 *
 * Options:
 *   waypoints   – array of { x, y }
 *   loop        – if true, patrol restarts automatically (default true)
 *   attackTarget– optional entity to attack when in range
 *   attackRange – px distance to trigger attack (default 120)
 */
export class PatrolBehavior extends Behavior {
    #waypoints;
    #waypointIndex = 0;
    #loop;
    #attackTarget = null;
    #attackRange;
    #attackCooldown = 0;
    #groundBased;

    constructor({ waypoints, loop = true, attackTarget = null, attackRange = 120, groundBased = false } = {}) {
        super();
        this.#waypoints = waypoints;
        this.#loop = loop;
        this.#attackTarget = attackTarget;
        this.#attackRange = attackRange;
        this.#groundBased = groundBased;
    }

    set attackTarget(t) { this.#attackTarget = t; }

    enter(character) {
        this.#waypointIndex = 0;
        this.#faceTarget(character);
    }

    onUpdate(character, deltaTime) {
        // Tick attack cooldown
        this.#attackCooldown = Math.max(0, this.#attackCooldown - deltaTime);

        // Check for attack opportunity each frame
        if (this.#tryAttack(character)) return;

        const target = this.#waypoints[this.#waypointIndex];
        const step = character.speed * deltaTime;

        // Ground-based characters: move only along X, snapToGround handles Y
        const dx = target.x - character.x;
        const dist = this.#groundBased
            ? Math.abs(dx)
            : Math.sqrt(dx * dx + (target.y - character.y) ** 2);

        if (dist <= step) {
            // Arrived at waypoint
            character.x = target.x;
            if (!this.#groundBased) character.y = target.y;
            this.#waypointIndex++;

            if (this.#waypointIndex >= this.#waypoints.length) {
                if (this.#loop) {
                    this.#waypointIndex = 0;
                } else {
                    this.finish();
                    return;
                }
            }
            this.#faceTarget(character);
        } else {
            // Move toward waypoint
            if (this.#groundBased) {
                character.x += Math.sign(dx) * step;
            } else {
                const ratio = step / dist;
                character.x += dx * ratio;
                character.y += (target.y - character.y) * ratio;
            }
            // Ensure walk animation stays active (e.g. after takeDamage reset)
            const dir = target.x < character.x ? Direction.LEFT : Direction.RIGHT;
            character.direction = dir;
            const expectedAnim = `WALK_${dir}`;
            if (character.animator.currentKey !== expectedAnim) {
                character.animator.play(expectedAnim);
            }
        }
    }

    /** If an attack target is in range, face it and trigger attack. */
    #tryAttack(character) {
        if (this.#attackCooldown > 0) return false;
        if (!this.#attackTarget || !this.#attackTarget.alive) return false;
        const cx = character.x + character.width / 2;
        const tx = this.#attackTarget.x + this.#attackTarget.width / 2;
        if (Math.abs(cx - tx) > this.#attackRange) return false;

        this.#attackCooldown = 2; // seconds
        character.direction = tx < cx ? Direction.LEFT : Direction.RIGHT;
        character.stateMachine.transition('attack');
        return true;
    }

    #faceTarget(character) {
        const target = this.#waypoints[this.#waypointIndex];
        const newDir = target.x < character.x ? Direction.LEFT : Direction.RIGHT;
        character.direction = newDir;
        character.animator.play(`WALK_${newDir}`);
    }

    reset() {
        super.reset();
        this.#waypointIndex = 0;
    }
}
