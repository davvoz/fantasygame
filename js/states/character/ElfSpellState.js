import { State } from '../State.js';
import { Direction } from '../../entities/Direction.js';
import { ElfArrow } from '../../entities/projectiles/ElfArrow.js';

/**
 * Elf ranged attack — draws bow and fires an arrow toward the attackTarget.
 * Registered as 'attack' so PatrolBehavior can trigger it.
 */
export class ElfSpellState extends State {
    #fired = false;

    enter() {
        this.#fired = false;
        const ch = this.character;

        // Face the target
        const target = ch.attackTarget;
        if (target && target.alive) {
            const cx = ch.x + ch.width / 2;
            const tx = target.x + target.width / 2;
            ch.direction = tx < cx ? Direction.LEFT : Direction.RIGHT;
        }

        ch.animator.play(`SPELL_${ch.direction}`);
    }

    update(deltaTime) {
        const anim = this.character.animator.current;
        if (!anim) return;

        // Fire at mid-frame
        if (!this.#fired && anim.currentFrame >= Math.floor(anim.frameCount / 2)) {
            this.#fired = true;
            this.#fireArrow();
        }

        if (anim.finished) {
            this.character.stateMachine.transition('idle');
        }
    }

    #fireArrow() {
        const ch = this.character;
        const target = ch.attackTarget;
        if (!target || !target.alive) return;

        const sign = ch.direction === Direction.RIGHT ? 1 : -1;
        const spawnX = ch.x + ch.width / 2 + sign * (ch.width * 0.35);
        const spawnY = ch.y + ch.height * 0.35;

        const tx = target.x + target.width / 2;
        // Fire straight horizontally (same Y as spawn point)
        const ty = spawnY;

        ch.spawn(new ElfArrow({
            x: spawnX,
            y: spawnY,
            targetX: tx,
            targetY: ty,
            owner: ch,
            damage: 8,
        }));
    }
}
