import { State } from '../State.js';
import { Direction } from '../../entities/Direction.js';
import { KenFireball } from '../../entities/projectiles/KenFireball.js';

const SPELL_DAMAGE = 12;

/**
 * Ken ranged attack — channels ki and hurls a fireball toward the target.
 * Registered as 'spell' so KenAttackState can redirect here when out of melee range.
 */
export class KenSpellState extends State {
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
            this.#fireProjectile();
        }

        if (anim.finished) {
            this.character.stateMachine.transition('idle');
        }
    }

    #fireProjectile() {
        const ch = this.character;
        const target = ch.attackTarget;
        if (!target || !target.alive) return;

        const sign = ch.direction === Direction.RIGHT ? 1 : -1;
        const spawnX = ch.x + ch.width / 2 + sign * (ch.width * 0.4);
        const spawnY = ch.y + ch.height * 0.4;

        const tx = target.x + target.width / 2;
        const ty = target.y + target.height * 0.4;

        ch.spawn(new KenFireball({
            x: spawnX,
            y: spawnY,
            targetX: tx,
            targetY: ty,
            owner: ch,
            damage: SPELL_DAMAGE,
        }));
    }
}
