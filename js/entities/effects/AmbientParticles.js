import { Entity } from '../Entity.js';

/**
 * Floating luminous particles (fireflies / magic spores).
 * Each particle drifts slowly, pulses in brightness, and wraps around the screen.
 */
export class AmbientParticles extends Entity {
    #particles = [];
    #canvasW;
    #canvasH;

    /**
     * @param {number} canvasW
     * @param {number} canvasH
     * @param {number} count  Number of particles
     */
    constructor(canvasW, canvasH, count = 35) {
        super(0, 0, canvasW, canvasH);
        this.#canvasW = canvasW;
        this.#canvasH = canvasH;

        for (let i = 0; i < count; i++) {
            this.#particles.push(this.#createParticle());
        }
    }

    #createParticle() {
        const size = 1.5 + Math.random() * 2.5;          // radius 1.5‒4
        const speed = 4 + Math.random() * 10;             // px/s drift
        const angle = Math.random() * Math.PI * 2;
        return {
            x: Math.random() * this.#canvasW,
            y: Math.random() * this.#canvasH * 0.85,      // mostly upper area
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 3,               // slight upward bias
            size,
            baseAlpha: 0.3 + Math.random() * 0.5,
            alpha: 0,
            // Pulse
            pulseSpeed: 0.8 + Math.random() * 1.5,        // rad/s
            pulsePhase: Math.random() * Math.PI * 2,
            // Color tint  (cyan ↔ blue range)
            hue: 180 + Math.random() * 40,                 // 180‒220
            saturation: 80 + Math.random() * 20,
            lightness: 60 + Math.random() * 20,
            // Subtle wobble
            wobbleAmp: 0.3 + Math.random() * 0.6,
            wobbleSpeed: 1 + Math.random() * 2,
            wobblePhase: Math.random() * Math.PI * 2,
            time: 0,
        };
    }

    update(deltaTime) {
        const dt = deltaTime / 1000;
        for (const p of this.#particles) {
            p.time += dt;

            // Wobble perpendicular to movement
            const wobble = Math.sin(p.time * p.wobbleSpeed + p.wobblePhase) * p.wobbleAmp;

            p.x += (p.vx + wobble) * dt;
            p.y += p.vy * dt;

            // Pulse alpha
            const pulse = Math.sin(p.time * p.pulseSpeed + p.pulsePhase);
            p.alpha = p.baseAlpha * (0.5 + 0.5 * pulse);

            // Wrap around
            if (p.x < -10) p.x = this.#canvasW + 10;
            if (p.x > this.#canvasW + 10) p.x = -10;
            if (p.y < -10) p.y = this.#canvasH + 10;
            if (p.y > this.#canvasH + 10) p.y = -10;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        for (const p of this.#particles) {
            const color = `hsla(${p.hue}, ${p.saturation}%, ${p.lightness}%, ${p.alpha})`;
            const glowColor = `hsla(${p.hue}, ${p.saturation}%, ${p.lightness}%, ${p.alpha * 0.3})`;

            // Outer glow
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
            ctx.fillStyle = glowColor;
            ctx.fill();

            // Core
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
        }

        ctx.restore();
    }
}
