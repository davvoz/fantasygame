import { Projectile } from '../Projectile.js';

const SPEED = 350;
const LIFETIME = 2500;
const PX = 3; // pixel size

// Classic pixel-art arrow colors
const WOOD    = '#009ec5';   // shaft wood
const WOOD_HI = '#00e1ff';   // shaft highlight
const METAL   = '#c0c0c0';   // arrowhead metal
const METAL_HI= '#ffffff';   // metal shine
const FLETCH  = '#22d3ee';   // feather cyan (elf magic)
const FLETCH_D= '#0d9488';   // feather dark

/**
 * Elf projectile — classic pixel-art arrow.
 */
export class ElfArrow extends Projectile {
    #angle;
    #age = 0;
    #trail = [];

    constructor({ x, y, targetX, targetY, owner = null, damage = 8 }) {
        const dx = targetX - x;
        const dy = targetY - y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const angle = Math.atan2(dy, dx);

        super({
            x, y,
            width: 42,
            height: 12,
            vx: (dx / dist) * SPEED,
            vy: (dy / dist) * SPEED,
            lifetime: LIFETIME,
            owner,
            damage,
        });
        this.#angle = angle;
    }

    #px(v) { return Math.round(v / PX) * PX; }

    update(deltaTime) {
        super.update(deltaTime);
        this.#age += deltaTime;

        if (this.alive) {
            // Simple trail sparkles
            if (this.#age % 60 < 16) {
                this.#trail.push({
                    x: this.x + 6 + Math.random() * 6,
                    y: this.y + 6 + (Math.random() - 0.5) * 4,
                    life: 150,
                });
            }
        }
        for (const t of this.#trail) t.life -= deltaTime;
        this.#trail = this.#trail.filter(t => t.life > 0);
    }

    draw(ctx) {
        if (!this.alive && this.#trail.length === 0) return;
        ctx.save();
        ctx.imageSmoothingEnabled = false;

        // Draw trail sparkles
        for (const t of this.#trail) {
            const alpha = t.life / 150;
            ctx.globalAlpha = alpha * 0.8;
            ctx.fillStyle = FLETCH;
            ctx.fillRect(this.#px(t.x), this.#px(t.y), PX, PX);
        }

        if (!this.alive) { ctx.restore(); return; }

        ctx.globalAlpha = 1;
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;

        ctx.translate(cx, cy);
        ctx.rotate(this.#angle);

        // ═══════════════════════════════════════
        // PIXEL ART ARROW (old school style)
        // ═══════════════════════════════════════

        // ── Wooden shaft ──
        ctx.fillStyle = WOOD;
        ctx.fillRect(-15, -1, 30, PX);  // main shaft
        ctx.fillStyle = WOOD_HI;
        ctx.fillRect(-12, -2, 24, 1);   // top highlight

        // ── Metal arrowhead ──
        // Main head triangle (pixelated)
        ctx.fillStyle = METAL;
        ctx.fillRect(12, -1, PX, PX);
        ctx.fillRect(15, -2, PX, PX + 1);
        ctx.fillRect(15, 0, PX, PX);
        ctx.fillRect(18, -1, PX, PX);
        // Sharp tip
        ctx.fillStyle = METAL_HI;
        ctx.fillRect(21, -1, PX, PX);

        // ── Fletching (feathers) ──
        // Back feather 1 (upper)
        ctx.fillStyle = FLETCH;
        ctx.fillRect(-15, -PX - 1, PX, PX);
        ctx.fillRect(-18, -PX * 2, PX, PX);
        ctx.fillStyle = FLETCH_D;
        ctx.fillRect(-15, -PX * 2, PX, PX);

        // Back feather 2 (lower)
        ctx.fillStyle = FLETCH;
        ctx.fillRect(-15, 1, PX, PX);
        ctx.fillRect(-18, PX + 1, PX, PX);
        ctx.fillStyle = FLETCH_D;
        ctx.fillRect(-15, PX, PX, PX);

        // Notch at back
        ctx.fillStyle = WOOD;
        ctx.fillRect(-18, -1, PX, PX);

        ctx.restore();
    }
}
