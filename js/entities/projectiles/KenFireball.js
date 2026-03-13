import { Projectile } from '../Projectile.js';

const SPEED = 260;
const PX = 10;
const LIFETIME = 2500;

// Hadouken blue plasma palette
const CORE   = ['#e0f0ff', '#c8e6ff', '#ffffff'];         // white-hot center
const FLAME  = ['#3399ff', '#2277ee', '#55aaff'];         // blue fire
const OUTER  = ['#1144aa', '#0033aa', '#2266cc'];         // deep blue outer glow
const TRAIL  = ['#2266cc', '#1144aa', '#0a2266'];         // fading blue embers

/**
 * Ken's fireball — hadouken-style pixel-art flaming orb.
 * 4 animation frames with spinning fire pattern and ember trail.
 */
export class KenFireball extends Projectile {
    #age = 0;
    #frame = 0;
    #trail = [];

    // 4 frames of an 8x8 grid: big spinning fireball
    static #FRAMES = [
        [
            [0,0,0,1,1,0,0,0],
            [0,0,1,2,2,1,0,0],
            [0,1,2,3,3,2,1,0],
            [1,2,3,4,4,3,2,1],
            [1,2,3,4,4,3,2,1],
            [0,1,2,3,3,2,1,0],
            [0,0,1,2,2,1,0,0],
            [0,0,0,1,1,0,0,0],
        ],
        [
            [0,0,0,0,1,1,0,0],
            [0,0,1,2,3,2,1,0],
            [0,1,3,4,3,4,2,0],
            [1,2,4,3,4,3,2,1],
            [1,2,3,4,3,4,2,1],
            [0,1,2,4,3,3,1,0],
            [0,0,1,2,3,2,0,0],
            [0,0,1,1,0,0,0,0],
        ],
        [
            [0,0,0,1,1,0,0,0],
            [0,0,2,3,3,2,0,0],
            [0,2,3,4,4,3,2,0],
            [1,3,4,4,4,4,3,1],
            [1,3,4,4,4,4,3,1],
            [0,2,3,4,4,3,2,0],
            [0,0,2,3,3,2,0,0],
            [0,0,0,1,1,0,0,0],
        ],
        [
            [0,0,1,1,0,0,0,0],
            [0,1,2,3,2,1,0,0],
            [0,2,4,3,4,3,1,0],
            [1,2,3,4,3,4,2,1],
            [1,2,4,3,4,3,2,1],
            [0,1,3,3,4,2,1,0],
            [0,0,2,3,2,1,0,0],
            [0,0,0,0,1,1,0,0],
        ],
    ];

    constructor({ x, y, targetX, targetY, owner = null, damage = 12 }) {
        const dx = targetX - x;
        const dy = targetY - y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const size = 8 * PX;
        super({
            x, y,
            width: size,
            height: size,
            vx: (dx / dist) * SPEED,
            vy: (dy / dist) * SPEED,
            lifetime: LIFETIME,
            owner,
            damage,
        });
    }

    update(deltaTime) {
        super.update(deltaTime);
        this.#age += deltaTime;
        this.#frame = Math.floor(this.#age / 90) % 4;

        // Spawn ember trail particles
        if (this.alive) {
            this.#trail.push({
                x: this.x + this.width / 2 + (Math.random() - 0.5) * 8,
                y: this.y + this.height / 2 + (Math.random() - 0.5) * 8,
                life: 250,
            });
        }
        for (const t of this.#trail) t.life -= deltaTime;
        this.#trail = this.#trail.filter(t => t.life > 0);
    }

    draw(ctx) {
        if (!this.alive && this.#trail.length === 0) return;
        ctx.save();
        ctx.imageSmoothingEnabled = false;

        // Draw ember trail
        for (const t of this.#trail) {
            const alpha = t.life / 250;
            const ci = Math.floor((1 - alpha) * TRAIL.length);
            ctx.fillStyle = TRAIL[Math.min(ci, TRAIL.length - 1)];
            ctx.globalAlpha = alpha * 0.7;
            const px = Math.round(t.x / PX) * PX;
            const py = Math.round(t.y / PX) * PX;
            ctx.fillRect(px, py, PX, PX);
        }

        if (!this.alive) { ctx.restore(); return; }

        // Draw fireball orb
        ctx.globalAlpha = 1;
        const grid = KenFireball.#FRAMES[this.#frame];
        const baseX = Math.round(this.x / PX) * PX;
        const baseY = Math.round(this.y / PX) * PX;

        // Outer glow
        const time = this.#age / 1000;
        const pulse = 0.6 + 0.4 * Math.sin(time * 12);
        ctx.globalAlpha = 0.25 * pulse;
        ctx.fillStyle = '#2266cc';
        ctx.beginPath();
        ctx.arc(
            baseX + 3 * PX, baseY + 3 * PX,
            5 * PX, 0, Math.PI * 2,
        );
        ctx.fill();
        ctx.globalAlpha = 1;

        // Pixel grid
        for (let row = 0; row < grid.length; row++) {
            for (let col = 0; col < grid[row].length; col++) {
                const v = grid[row][col];
                if (v === 0) continue;
                if (v === 1) {
                    ctx.fillStyle = OUTER[(row + col + this.#frame) % OUTER.length];
                } else if (v === 2) {
                    ctx.fillStyle = FLAME[(row + col) % FLAME.length];
                } else if (v === 3) {
                    ctx.fillStyle = CORE[(row + col) % CORE.length];
                } else {
                    ctx.fillStyle = '#ffffff';
                }
                ctx.fillRect(baseX + col * PX, baseY + row * PX, PX, PX);
            }
        }

        ctx.restore();
    }
}
