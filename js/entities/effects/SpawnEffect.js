import { Entity } from '../Entity.js';

const DURATION = 700;   // ms - fast and snappy
const PX = 2;           // smaller pixels = more detail

/**
 * Elegant pixel-art spawn effect.
 * Ethereal particles, magic runes, spiral energy.
 */
export class SpawnEffect extends Entity {
    #age = 0;
    #alive = true;
    #cx;
    #cy;
    #height;
    #color;
    #rgb;
    #onComplete = null;
    #particles = [];
    #runes = [];

    constructor(x, y, { color = '#39ff14', height = 160, onComplete = null } = {}) {
        super(x - 80, y - height - 30, 160, height + 60);
        this.#cx = x;
        this.#cy = y;
        this.#height = height;
        this.#color = color;
        this.#onComplete = onComplete;
        this.#rgb = this.#hexToRgb(color);
        
        // Pre-generate particle paths for smooth animation
        this.#initParticles();
        this.#initRunes();
    }

    get alive() { return this.#alive; }

    #hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 };
    }

    #initParticles() {
        // Spiral particles rising
        for (let i = 0; i < 24; i++) {
            this.#particles.push({
                angle: (Math.PI * 2 * i) / 24,
                speed: 0.8 + Math.random() * 0.4,
                radius: 15 + Math.random() * 25,
                size: PX + Math.floor(Math.random() * 2) * PX,
                phase: Math.random(),
            });
        }
    }

    #initRunes() {
        // Magic rune symbols (simple pixel patterns)
        const runePatterns = [
            [[0,1],[1,0],[1,1],[1,2],[2,1]], // cross
            [[0,0],[0,2],[1,1],[2,0],[2,2]], // X
            [[0,1],[1,0],[1,2],[2,1],[1,1]], // diamond
            [[0,0],[0,1],[0,2],[1,1],[2,0],[2,1],[2,2]], // hourglass
        ];
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6;
            this.#runes.push({
                angle,
                pattern: runePatterns[i % runePatterns.length],
                dist: 35 + (i % 2) * 10,
            });
        }
    }

    #ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
    #easeOut(t) { return 1 - Math.pow(1 - t, 3); }

    update(deltaTime) {
        if (!this.#alive) return;
        this.#age += deltaTime;
        if (this.#age >= DURATION) {
            this.#alive = false;
            if (this.#onComplete) this.#onComplete();
        }
    }

    #px(v) { return Math.round(v / PX) * PX; }

    #drawStar4(ctx, x, y, size) {
        // 4-pointed star pixel art
        const s = Math.max(PX, this.#px(size));
        const cx = this.#px(x);
        const cy = this.#px(y);
        // Center
        ctx.fillRect(cx - PX/2, cy - PX/2, PX, PX);
        // Points
        ctx.fillRect(cx - s, cy - PX/2, PX, PX);
        ctx.fillRect(cx + s - PX, cy - PX/2, PX, PX);
        ctx.fillRect(cx - PX/2, cy - s, PX, PX);
        ctx.fillRect(cx - PX/2, cy + s - PX, PX, PX);
    }

    #drawGlow(ctx, x, y, radius, alpha) {
        // Soft pixelated glow using concentric pixels
        const steps = Math.floor(radius / PX);
        for (let i = steps; i > 0; i--) {
            const r = i * PX;
            const a = alpha * (1 - i / steps) * 0.3;
            ctx.globalAlpha = a;
            // Draw sparse pixels in a circle pattern
            const count = Math.max(4, i * 2);
            for (let j = 0; j < count; j++) {
                const angle = (Math.PI * 2 * j) / count;
                const px = this.#px(x + Math.cos(angle) * r);
                const py = this.#px(y + Math.sin(angle) * r * 0.5);
                ctx.fillRect(px - PX/2, py - PX/2, PX, PX);
            }
        }
    }

    draw(ctx) {
        if (!this.#alive) return;
        const p = this.#age / DURATION;
        const { r, g, b } = this.#rgb;

        ctx.save();
        ctx.imageSmoothingEnabled = false;

        const centerY = this.#cy - this.#height * 0.5;

        // ═══════════════════════════════════════════════════
        // Layer 1: Soft ground glow (0% - 60%)
        // ═══════════════════════════════════════════════════
        if (p < 0.7) {
            const glowP = p < 0.3 ? p / 0.3 : 1 - (p - 0.3) / 0.4;
            ctx.fillStyle = this.#color;
            this.#drawGlow(ctx, this.#cx, this.#cy, 40 * glowP, glowP * 0.8);
        }

        // ═══════════════════════════════════════════════════
        // Layer 2: Magic circle with runes (0% - 50%)
        // ═══════════════════════════════════════════════════
        if (p < 0.6) {
            const circleP = Math.min(1, p / 0.2);
            const fadeP = p > 0.4 ? 1 - (p - 0.4) / 0.2 : 1;
            const rotation = p * Math.PI * 2;
            
            // Outer circle - dashed pixel effect
            ctx.globalAlpha = circleP * fadeP * 0.7;
            ctx.fillStyle = this.#color;
            const radius = 45 * this.#easeOut(circleP);
            for (let i = 0; i < 24; i++) {
                if (i % 2 === 0) continue; // Skip every other for dashed look
                const angle = (Math.PI * 2 * i) / 24 + rotation * 0.5;
                const px = this.#px(this.#cx + Math.cos(angle) * radius);
                const py = this.#px(this.#cy + Math.sin(angle) * radius * 0.35);
                ctx.fillRect(px - PX, py - PX/2, PX * 2, PX);
            }

            // Inner circle
            ctx.globalAlpha = circleP * fadeP * 0.9;
            ctx.fillStyle = `rgb(${Math.min(255, r + 80)},${Math.min(255, g + 80)},${Math.min(255, b + 80)})`;
            const innerR = 25 * this.#easeOut(circleP);
            for (let i = 0; i < 16; i++) {
                const angle = (Math.PI * 2 * i) / 16 - rotation * 0.3;
                const px = this.#px(this.#cx + Math.cos(angle) * innerR);
                const py = this.#px(this.#cy + Math.sin(angle) * innerR * 0.35);
                ctx.fillRect(px - PX/2, py - PX/2, PX, PX);
            }

            // Rune symbols
            ctx.globalAlpha = circleP * fadeP * 0.8;
            ctx.fillStyle = '#fff';
            for (const rune of this.#runes) {
                const runeAngle = rune.angle + rotation * 0.2;
                const rx = this.#cx + Math.cos(runeAngle) * rune.dist;
                const ry = this.#cy + Math.sin(runeAngle) * rune.dist * 0.35;
                
                for (const [dx, dy] of rune.pattern) {
                    ctx.fillRect(
                        this.#px(rx + (dx - 1) * PX * 1.5),
                        this.#px(ry + (dy - 1) * PX * 1.5),
                        PX, PX
                    );
                }
            }
        }

        // ═══════════════════════════════════════════════════
        // Layer 3: Spiral rising particles (10% - 80%)
        // ═══════════════════════════════════════════════════
        if (p > 0.08 && p < 0.85) {
            const spiralP = (p - 0.08) / 0.72;
            
            for (const particle of this.#particles) {
                const t = (spiralP * particle.speed + particle.phase) % 1;
                const rise = t * this.#height * 1.1;
                const spiralAngle = particle.angle + t * Math.PI * 3;
                const spiralRadius = particle.radius * (1 - t * 0.7);
                
                const px = this.#cx + Math.cos(spiralAngle) * spiralRadius;
                const py = this.#cy - rise;
                
                // Fade in at bottom, fade out at top
                const fadeIn = Math.min(1, t * 5);
                const fadeOut = Math.max(0, 1 - (t - 0.7) / 0.3);
                const alpha = fadeIn * fadeOut * (p < 0.75 ? 1 : 1 - (p - 0.75) / 0.1);
                
                if (alpha > 0.05) {
                    // Particle with slight color variation
                    const brightness = 0.7 + t * 0.3;
                    ctx.globalAlpha = alpha * 0.9;
                    ctx.fillStyle = `rgb(${Math.min(255, Math.floor(r * brightness + 50))},${Math.min(255, Math.floor(g * brightness + 50))},${Math.min(255, Math.floor(b * brightness + 50))})`;
                    ctx.fillRect(this.#px(px) - particle.size/2, this.#px(py) - particle.size/2, particle.size, particle.size);
                    
                    // Tiny trail
                    if (t > 0.1) {
                        ctx.globalAlpha = alpha * 0.4;
                        const trailY = py + PX * 3;
                        ctx.fillRect(this.#px(px) - PX/2, this.#px(trailY) - PX/2, PX, PX);
                    }
                }
            }
        }

        // ═══════════════════════════════════════════════════
        // Layer 4: Converging sparkles (40% - 70%)
        // ═══════════════════════════════════════════════════
        if (p > 0.35 && p < 0.75) {
            const convP = (p - 0.35) / 0.35;
            const eased = this.#ease(convP);
            
            for (let i = 0; i < 12; i++) {
                const angle = (Math.PI * 2 * i) / 12;
                const startDist = 70 + (i % 3) * 20;
                const dist = startDist * (1 - eased);
                
                if (dist > 3) {
                    const sx = this.#cx + Math.cos(angle) * dist;
                    const sy = centerY + Math.sin(angle) * dist * 0.6;
                    
                    ctx.globalAlpha = (1 - convP * 0.7) * 0.9;
                    ctx.fillStyle = i % 3 === 0 ? '#fff' : this.#color;
                    this.#drawStar4(ctx, sx, sy, PX * 2);
                }
            }
        }

        // ═══════════════════════════════════════════════════
        // Layer 5: Central flash (60% - 80%)
        // ═══════════════════════════════════════════════════
        if (p > 0.55 && p < 0.85) {
            const flashP = (p - 0.55) / 0.25;
            const flashEase = flashP < 0.4 ? flashP / 0.4 : 1 - (flashP - 0.4) / 0.6;
            
            // Bright center star
            ctx.fillStyle = '#fff';
            ctx.globalAlpha = flashEase * 0.95;
            this.#drawStar4(ctx, this.#cx, centerY, 6 + flashEase * 10);
            
            // Secondary colored stars
            ctx.fillStyle = this.#color;
            ctx.globalAlpha = flashEase * 0.7;
            for (let i = 0; i < 4; i++) {
                const angle = (Math.PI * 2 * i) / 4 + Math.PI / 4;
                const dist = 8 + flashEase * 12;
                this.#drawStar4(ctx, 
                    this.#cx + Math.cos(angle) * dist,
                    centerY + Math.sin(angle) * dist * 0.6,
                    PX * 2
                );
            }
        }

        // ═══════════════════════════════════════════════════
        // Layer 6: Final dispersion (70% - 100%)
        // ═══════════════════════════════════════════════════
        if (p > 0.65) {
            const dispP = (p - 0.65) / 0.35;
            const fadeOut = 1 - dispP;
            
            // Expanding ring of tiny particles
            for (let i = 0; i < 16; i++) {
                const angle = (Math.PI * 2 * i) / 16 + dispP * Math.PI * 0.3;
                const dist = 15 + dispP * 60;
                const px = this.#cx + Math.cos(angle) * dist;
                const py = centerY + Math.sin(angle) * dist * 0.55;
                
                ctx.globalAlpha = fadeOut * 0.8;
                ctx.fillStyle = i % 2 === 0 ? '#fff' : this.#color;
                ctx.fillRect(this.#px(px) - PX/2, this.#px(py) - PX/2, PX, PX);
            }
            
            // Floating sparkles
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 * i) / 8;
                const wobble = Math.sin(this.#age * 0.02 + i) * 5;
                const dist = 25 + dispP * 40 + wobble;
                const py = centerY - dispP * 20 + Math.sin(angle * 2) * 10;
                
                ctx.globalAlpha = fadeOut * 0.6;
                ctx.fillStyle = '#fff';
                this.#drawStar4(ctx, this.#cx + Math.cos(angle) * dist, py, PX);
            }
        }

        ctx.restore();
    }
}
