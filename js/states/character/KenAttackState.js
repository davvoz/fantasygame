import { State } from '../State.js';
import { Direction } from '../../entities/Direction.js';
import { SlashEffect } from '../../entities/effects/SlashEffect.js';

const ATTACK_DAMAGE = 18;
const LUNGE_DISTANCE = 40;
const LUNGE_SPEED = 450;
const MELEE_RANGE = 130;  // px — if farther than this, use spell instead

/**
 * Ken melee attack — fierce punch/kick with lunge and slash effect.
 * If the target is beyond melee range, redirects to 'spell' (fireball).
 */
export class KenAttackState extends State {
    #hit = false;
    #slashSpawned = false;
    #lungeProgress = 0;
    #startX = 0;

    enter() {
        const ch = this.character;
        const target = ch.attackTarget;

        // Decide: melee or spell?
        if (target && target.alive) {
            const cx = ch.x + ch.width / 2;
            const tx = target.x + target.width / 2;
            ch.direction = tx < cx ? Direction.LEFT : Direction.RIGHT;

            if (Math.abs(cx - tx) > MELEE_RANGE) {
                ch.stateMachine.transition('spell');
                return;
            }
        }

        this.#hit = false;
        this.#slashSpawned = false;
        this.#lungeProgress = 0;
        this.#startX = ch.x;
        ch.animator.play(`ATTACK_${ch.direction}`);
    }

    update(deltaTime) {
        const anim = this.character.animator.current;
        if (!anim) return;

        const ch = this.character;
        const midFrame = Math.floor(anim.frameCount / 2);
        const progress = anim.currentFrame / anim.frameCount;

        // Lunge forward during wind-up
        if (progress < 0.6 && this.#lungeProgress < 1) {
            const dt = deltaTime / 1000;
            const sign = ch.direction === Direction.RIGHT ? 1 : -1;
            const lungeStep = LUNGE_SPEED * dt;
            const currentLunge = Math.abs(ch.x - this.#startX);

            if (currentLunge < LUNGE_DISTANCE) {
                ch.x += sign * Math.min(lungeStep, LUNGE_DISTANCE - currentLunge);
                this.#lungeProgress = currentLunge / LUNGE_DISTANCE;
            } else {
                this.#lungeProgress = 1;
            }
        }

        // Spawn slash effect
        if (!this.#slashSpawned && anim.currentFrame >= midFrame - 1) {
            this.#slashSpawned = true;
            const dir = ch.direction;
            const sign = dir === Direction.RIGHT ? 1 : -1;
            const slashX = ch.x + ch.width / 2 + sign * (ch.width * 0.35);
            const slashY = ch.y + ch.height * 0.35;
            ch.spawn(new SlashEffect(slashX, slashY, dir));
        }

        // Deal damage at mid-frame
        if (!this.#hit && anim.currentFrame >= midFrame) {
            this.#hit = true;
            const target = ch.attackTarget;
            if (target && target.alive) {
                const hitRect = this.#getAttackRect();
                const targetRect = target.getHitRect();
                if (this.#rectsOverlap(hitRect, targetRect)) {
                    target.takeDamage(ATTACK_DAMAGE);
                    if (ch._onAttackHit) {
                        ch._onAttackHit(target, ATTACK_DAMAGE);
                    }
                }
            }
        }

        if (anim.finished) {
            ch.stateMachine.transition('idle');
        }
    }

    #getAttackRect() {
        const ch = this.character;
        const reach = ch.width * 0.55;
        const hitW = reach;
        const hitH = ch.height * 0.5;
        const hitY = ch.y + ch.height * 0.2;
        const hitX = ch.direction === Direction.RIGHT
            ? ch.x + ch.width * 0.7
            : ch.x - hitW + ch.width * 0.3;
        return { x: hitX, y: hitY, width: hitW, height: hitH };
    }

    #rectsOverlap(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }
}
