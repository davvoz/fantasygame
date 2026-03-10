import { State } from '../State.js';
import { MagicLaser } from '../../entities/projectiles/MagicLaser.js';
import { FloatingLabel } from '../../entities/effects/FloatingLabel.js';
import { Direction } from '../../entities/Direction.js';
import { PowerUpType } from '../../entities/PowerUp.js';

const SPREAD_ANGLE = 0.25; // radians (~14°) for triple-shot side beams
const POWER_DAMAGE_MULT = 2;

export class SpellState extends State {
    #fired = false;
    #inputManager = null;

    enter(inputManager) {
        this.#fired = false;
        this.#inputManager = inputManager ?? null;

        // Flip mage to face the cursor
        if (this.#inputManager) {
            const ch = this.character;
            const cx = ch.x + ch.width / 2;
            if (this.#inputManager.mouseX < cx) {
                ch.direction = Direction.LEFT;
            } else {
                ch.direction = Direction.RIGHT;
            }
        }

        const dir = this.character.direction;
        const speedMult = this.character.hasBuff(PowerUpType.ATTACK_SPEED) ? 1.8 : 1;
        this.character.animator.play(`SPELL_${dir}`, speedMult);
    }

    update(deltaTime, inputManager) {
        if (!this.#inputManager) this.#inputManager = inputManager;
        const anim = this.character.animator.current;
        if (!anim) return;

        // Fire projectile at the middle frame
        if (!this.#fired && anim.currentFrame >= Math.floor(anim.frameCount / 2)) {
            this.#fireProjectile();
            this.#fired = true;
        }

        if (anim.finished) {
            this.character.stateMachine.transition('idle');
        }
    }

    #fireProjectile() {
        const ch = this.character;
        const dir = ch.direction;
        const sign = dir === Direction.RIGHT ? 1 : -1;

        // Spawn from hand position (roughly center-front of sprite)
        const spawnX = ch.x + ch.width / 2 + sign * (ch.width / 2);
        const spawnY = ch.y + ch.height * 0.4;

        const damage = ch.hasBuff(PowerUpType.POWER) ? 10 * POWER_DAMAGE_MULT : 10;

        const baseOpts = { x: spawnX, y: spawnY, direction: dir, owner: ch, damage };
        if (this.#inputManager) {
            baseOpts.targetX = this.#inputManager.mouseX;
            baseOpts.targetY = this.#inputManager.mouseY;
        }

        // Main shot
        ch.spawn(new MagicLaser(baseOpts));

        // Triple-shot: two extra spread beams
        if (ch.hasBuff(PowerUpType.TRIPLE_SHOT) && baseOpts.targetX !== undefined) {
            const dx = baseOpts.targetX - spawnX;
            const dy = baseOpts.targetY - spawnY;
            const baseAngle = Math.atan2(dy, dx);
            const dist = Math.sqrt(dx * dx + dy * dy) || 200;
            for (const offset of [-SPREAD_ANGLE, SPREAD_ANGLE]) {
                const a = baseAngle + offset;
                ch.spawn(new MagicLaser({
                    ...baseOpts,
                    targetX: spawnX + Math.cos(a) * dist,
                    targetY: spawnY + Math.sin(a) * dist,
                }));
            }
        }

        if (ch.font) {
            const hr = typeof ch.getHitRect === 'function' ? ch.getHitRect() : ch;
            ch.spawn(new FloatingLabel(
                'SPELL!', hr.x + hr.width / 2, hr.y, ch.font, { scale: 0.7 }
            ));
        }
    }
}
