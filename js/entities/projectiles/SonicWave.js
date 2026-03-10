import { Projectile } from '../Projectile.js';

const SPEED = 180;
const PX = 3;
const LIFETIME = 3000;

// Dark/toxic palette for the bat
const CORE   = ['#a855f7', '#7c3aed', '#c084fc']; // purple
const EDGE   = ['#22d3ee', '#06b6d4', '#67e8f9']; // cyan sparks
const TRAIL  = ['#6b21a8', '#4c1d95'];             // dark purple trail

/**
 * Bat projectile — pixel-art toxic orb with trailing particles.
 * 4 animation frames, spinning pixel pattern, spark trail.
 */
export class SonicWave extends Projectile {
    #age = 0;
    #frame = 0;
    #trail = [];

    // 4 frames of a 6x6 grid: rotating skull-like orb
    static #FRAMES = [
        [
            [0,0,1,1,0,0],
            [0,1,2,2,1,0],
            [1,2,3,3,2,1],
            [1,2,3,3,2,1],
            [0,1,2,2,1,0],
            [0,0,1,1,0,0],
        ],
        [
            [0,0,0,1,0,0],
            [0,1,2,2,1,0],
            [1,2,3,2,3,1],
            [1,3,2,3,2,1],
            [0,1,2,2,1,0],
            [0,0,1,0,0,0],
        ],
        [
            [0,0,1,1,0,0],
            [0,2,1,1,2,0],
            [1,3,2,2,3,1],
            [1,3,2,2,3,1],
            [0,2,1,1,2,0],
            [0,0,1,1,0,0],
        ],
        [
            [0,0,1,0,0,0],
            [0,1,2,2,1,0],
            [1,2,3,2,3,1],
            [1,3,2,3,2,1],
            [0,1,2,2,1,0],
            [0,0,0,1,0,0],
        ],
    ];

    constructor({ x, y, targetX, targetY, owner = null }) {
        const dx = targetX - x;
        const dy = targetY - y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const size = 6 * PX;
        super({
            x, y,
            width: size,
            height: size,
            vx: (dx / dist) * SPEED,
            vy: (dy / dist) * SPEED,
            lifetime: LIFETIME,
            owner,
        });
    }

    update(deltaTime) {
        super.update(deltaTime);
        this.#age += deltaTime;
        this.#frame = Math.floor(this.#age / 100) % 4;

        // Spawn trail particle every 60ms
        if (this.alive && this.#age > 60) {
            this.#trail.push({
                x: this.x + this.width / 2 + (Math.random() - 0.5) * 6,
                y: this.y + this.height / 2 + (Math.random() - 0.5) * 6,
                life: 200,
            });
        }
        // Age trail
        for (const t of this.#trail) t.life -= deltaTime;
        this.#trail = this.#trail.filter(t => t.life > 0);
    }

    draw(ctx) {
        if (!this.alive && this.#trail.length === 0) return;
        ctx.save();

        // Draw trail
        for (const t of this.#trail) {
            const alpha = t.life / 200;
            const ci = Math.floor((1 - alpha) * TRAIL.length);
            ctx.fillStyle = TRAIL[Math.min(ci, TRAIL.length - 1)];
            ctx.globalAlpha = alpha * 0.7;
            const px = Math.round(t.x / PX) * PX;
            const py = Math.round(t.y / PX) * PX;
            ctx.fillRect(px, py, PX, PX);
        }

        if (!this.alive) { ctx.restore(); return; }

        // Draw orb
        ctx.globalAlpha = 1;
        const grid = SonicWave.#FRAMES[this.#frame];
        const baseX = Math.round(this.x / PX) * PX;
        const baseY = Math.round(this.y / PX) * PX;

        for (let row = 0; row < grid.length; row++) {
            for (let col = 0; col < grid[row].length; col++) {
                const v = grid[row][col];
                if (v === 0) continue;
                if (v === 1) {
                    ctx.fillStyle = EDGE[(row + col + this.#frame) % EDGE.length];
                } else if (v === 2) {
                    ctx.fillStyle = CORE[(row + col) % CORE.length];
                } else {
                    // Bright center pixel
                    ctx.fillStyle = '#e9d5ff';
                }
                ctx.fillRect(baseX + col * PX, baseY + row * PX, PX, PX);
            }
        }

        ctx.restore();
    }
}
