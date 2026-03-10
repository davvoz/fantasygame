import { State } from '../State.js';
import { Direction } from '../../entities/Direction.js';
import { SonicWave } from '../../entities/projectiles/SonicWave.js';

const SHOOT_INTERVAL = 2; // seconds between shots

export class BatIdleState extends State {
    #shootTimer = 0;

    enter() {
        this.character.animator.play(`IDLE_${this.character.direction}`);
        this.#shootTimer = SHOOT_INTERVAL;
    }

    update(deltaTime) {
        const ch = this.character;
        const dt = deltaTime / 1000;
        const dx = ch.direction === Direction.LEFT ? -1 : 1;

        ch.x += dx * ch.speed * dt;

        // Flip at screen edges
        if (ch.x <= 0) {
            ch.x = 0;
            ch.direction = Direction.RIGHT;
            ch.animator.play('IDLE_RIGHT');
        } else if (ch.x + ch.width >= 960) {
            ch.x = 960 - ch.width;
            ch.direction = Direction.LEFT;
            ch.animator.play('IDLE_LEFT');
        }

        // Shoot toward the target only if it's in the facing direction
        this.#shootTimer -= dt;
        if (this.#shootTimer <= 0) {
            this.#shootTimer = SHOOT_INTERVAL;
            const spawnX = ch.x + ch.width / 2;
            const spawnY = ch.y + ch.height / 2;
            const t = ch.target;
            if (t) {
                const tx = t.x + t.width / 2;
                const ty = t.y + t.height / 2;
                const inFront = (ch.direction === Direction.LEFT && tx < spawnX) ||
                                (ch.direction === Direction.RIGHT && tx > spawnX);
                if (inFront) {
                    ch.spawn(new SonicWave({ x: spawnX, y: spawnY, targetX: tx, targetY: ty, owner: ch }));
                }
            }
        }
    }
}
