import { Entity } from '../Entity.js';

const PX = 5;              // chunky pixel size
const DURATION = 500;      // ms
const PARTICLE_COUNT = 16;

const PALETTE = [
    '#ffffff',  // white flash
    '#fff176',  // yellow
    '#ffab40',  // orange
    '#ff5722',  // red-orange
    '#d32f2f',  // red
    '#424242',  // smoke
];

/**
 * Chunky cartoon pixel-art explosion.
 * Big square blocks fly outward and cycle through fire colors.
 */
export class PixelExplosion extends Entity {
    #age = 0;
    #alive = true;
    #particles;
    #cx;
    #cy;

    constructor(x, y) {
        super(x, y, 0, 0);
        this.#cx = x;
        this.#cy = y;
        this.#particles = this.#create();
    }

    get alive() { return this.#alive; }

    #create() {
        const out = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const angle = (Math.PI * 2 / PARTICLE_COUNT) * i;
            const speed = 40 + Math.random() * 80;
            out.push({
                angle,
                speed,
                dist: 0,
                size: PX + Math.floor(Math.random() * 2) * PX, // PX or PX*2
            });
        }
        return out;
    }

    update(deltaTime) {
        if (!this.#alive) return;
        this.#age += deltaTime;
        if (this.#age >= DURATION) {
            this.#alive = false;
            return;
        }
        const dt = deltaTime / 1000;
        for (const p of this.#particles) {
            p.dist += p.speed * dt;
        }
    }

    draw(ctx) {
        if (!this.#alive) return;

        const progress = this.#age / DURATION;
        // Step-wise alpha (3 visible steps, then gone) for cartoon feel
        const alphaStep = progress < 0.33 ? 1 : progress < 0.66 ? 0.7 : 0.35;

        ctx.save();
        ctx.globalAlpha = alphaStep;

        for (const p of this.#particles) {
            const ci = Math.min(PALETTE.length - 1, Math.floor(progress * PALETTE.length));
            ctx.fillStyle = PALETTE[ci];

            // Snap to pixel grid
            const rawX = this.#cx + Math.cos(p.angle) * p.dist;
            const rawY = this.#cy + Math.sin(p.angle) * p.dist;
            const px = Math.round(rawX / PX) * PX;
            const py = Math.round(rawY / PX) * PX;

            ctx.fillRect(px - p.size / 2, py - p.size / 2, p.size, p.size);
        }

        // Big center flash block (first 40%)
        if (progress < 0.4) {
            const s = PX * 3;
            const fx = Math.round(this.#cx / PX) * PX;
            const fy = Math.round(this.#cy / PX) * PX;
            ctx.fillStyle = progress < 0.15 ? '#ffffff' : '#fff176';
            ctx.globalAlpha = 1;
            ctx.fillRect(fx - s, fy - s, s * 2, s * 2);
        }

        ctx.restore();
    }
}
