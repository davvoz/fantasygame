import { Projectile } from '../Projectile.js';
import { Direction } from '../Direction.js';

const BEAM_SPEED = 600;
const BEAM_LENGTH = 80;
const BEAM_THICKNESS = 6;
const LIFETIME = 1500;

/**
 * Procedurally drawn magic laser beam.
 * Renders a glowing energy bolt with core + outer glow + particle trail.
 */
export class MagicLaser extends Projectile {
    #angle;
    #age = 0;
    #particles = [];

    constructor({ x, y, direction, targetX, targetY, owner = null, damage = 10 }) {
        let vx, vy, angle;
        if (targetX !== undefined && targetY !== undefined) {
            const dx = targetX - x;
            const dy = targetY - y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            vx = (dx / dist) * BEAM_SPEED;
            vy = (dy / dist) * BEAM_SPEED;
            angle = Math.atan2(dy, dx);
        } else {
            const sign = direction === Direction.RIGHT ? 1 : -1;
            vx = BEAM_SPEED * sign;
            vy = 0;
            angle = sign > 0 ? 0 : Math.PI;
        }
        super({
            x,
            y,
            width: BEAM_LENGTH,
            height: BEAM_THICKNESS,
            vx,
            vy,
            lifetime: LIFETIME,
            owner,
            damage,
        });
        this.#angle = angle;
        this.#initParticles();
    }

    #initParticles() {
        for (let i = 0; i < 8; i++) {
            this.#particles.push({
                offsetX: Math.random() * BEAM_LENGTH,
                offsetY: (Math.random() - 0.5) * BEAM_THICKNESS * 3,
                size: 1 + Math.random() * 2.5,
                phase: Math.random() * Math.PI * 2,
                speed: 1.5 + Math.random() * 3,
            });
        }
    }

    update(deltaTime) {
        super.update(deltaTime);
        this.#age += deltaTime;
    }

    draw(ctx) {
        if (!this.alive) return;

        const cx = this.x;
        const cy = this.y;
        const t = this.#age / 1000;
        const flicker = 0.85 + 0.15 * Math.sin(t * 25);

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(this.#angle);

        // Draw relative to origin (0,0) going rightward along the beam

        // --- outer glow (wide, faint) ---
        const glowWidth = BEAM_LENGTH + 10;
        const glowHeight = BEAM_THICKNESS * 4;
        const outerGrad = ctx.createRadialGradient(
            BEAM_LENGTH / 2, 0, 2,
            BEAM_LENGTH / 2, 0, glowWidth / 2
        );
        outerGrad.addColorStop(0, `rgba(200, 50, 5, ${0.25 * flicker})`);
        outerGrad.addColorStop(0.5, `rgba(255, 80, 5, ${0.10 * flicker})`);
        outerGrad.addColorStop(1, 'rgba(255, 40, 5, 0)');
        ctx.fillStyle = outerGrad;
        ctx.fillRect(-5, -glowHeight / 2, glowWidth, glowHeight);

        // --- mid glow ---
        ctx.globalCompositeOperation = 'lighter';
        ctx.shadowColor = 'rgba(199, 18, 5, 0.8)';
        ctx.shadowBlur = 12 * flicker;
        ctx.fillStyle = `rgba(220, 60, 5, ${0.5 * flicker})`;
        ctx.beginPath();
        ctx.ellipse(BEAM_LENGTH / 2, 0, BEAM_LENGTH / 2, BEAM_THICKNESS * 1.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // --- core beam (bright center) ---
        ctx.shadowColor = 'rgba(255, 200, 200, 0.07)';
        ctx.shadowBlur = 8;
        const coreGrad = ctx.createLinearGradient(0, 0, BEAM_LENGTH, 0);
        coreGrad.addColorStop(0, `rgba(155, 220, 12, ${0.9 * flicker})`);
        coreGrad.addColorStop(0.5, `rgba(155, 130, 23, ${flicker})`);
        coreGrad.addColorStop(1, `rgba(190, 50, 2, ${0.6 * flicker})`);
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.ellipse(BEAM_LENGTH / 2, 0, BEAM_LENGTH / 2, BEAM_THICKNESS / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // --- sparkle particles ---
        ctx.shadowBlur = 0;
        for (const p of this.#particles) {
            const px = p.offsetX + Math.sin(t * p.speed + p.phase) * 4;
            const py = p.offsetY + Math.cos(t * p.speed * 1.3 + p.phase) * 3;
            const alpha = (0.5 + 0.5 * Math.sin(t * p.speed * 2 + p.phase)) * flicker;
            ctx.fillStyle = `rgba(255, 200, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(px, py, p.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // --- leading tip flash ---
        const tipX = BEAM_LENGTH;
        const tipFlash = 0.6 + 0.4 * Math.sin(t * 30);
        const tipGrad = ctx.createRadialGradient(tipX, 0, 0, tipX, 0, 10);
        tipGrad.addColorStop(0, `rgba(255, 255, 255, ${tipFlash})`);
        tipGrad.addColorStop(0.4, `rgba(255, 100, 220, ${0.5 * tipFlash})`);
        tipGrad.addColorStop(1, 'rgba(200, 50, 255, 0)');
        ctx.fillStyle = tipGrad;
        ctx.beginPath();
        ctx.arc(tipX, 0, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
