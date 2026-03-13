import { Entity } from '../Entity.js';
import { getAllLevelsOrdered } from '../../levels/LevelConfig.js';

const PX = 3;

/**
 * Level selection screen — lets the player choose how many levels to play.
 * Displays available levels as a vertical list with a selector arrow.
 * Follows the same entity pattern as TitleAnimation / VictoryAnimation.
 */
export class LevelSelectScreen extends Entity {
    #alive = true;
    #age = 0;
    #width;
    #height;
    #onSelect;
    #font;
    #phase = 'fadein';

    // Level data
    #levels = [];
    #selectedIndex = 0;

    // Visual state
    #titleAlpha = 0;
    #itemAlphas = [];
    #arrowBlink = 0;
    #ready = false;

    // Particles (ambient sparkles)
    #particles = [];

    // Background
    #bgImage;
    #bgLoaded = false;

    /**
     * @param {number} width  - Canvas width
     * @param {number} height - Canvas height
     * @param {Function} onSelect - Called with the selected max level order (1-based)
     * @param {import('../../graphics/BitmapFont.js').BitmapFont} font
     */
    constructor(width, height, onSelect, font) {
        super(0, 0, width, height);
        this.#width = width;
        this.#height = height;
        this.#onSelect = onSelect;
        this.#font = font;

        this.#levels = getAllLevelsOrdered();
        this.#selectedIndex = this.#levels.length - 1; // Default: play all levels
        this.#itemAlphas = this.#levels.map(() => 0);

        this.#initParticles();

        // Reuse the first level background for atmosphere
        this.#bgImage = new Image();
        this.#bgImage.onload = () => { this.#bgLoaded = true; };
        this.#bgImage.src = 'assets/spritesheets/backgrounds/FORESTA_VERDE_NOTTE.png';
    }

    get alive() { return this.#alive; }

    /** Move selection up */
    selectPrev() {
        if (!this.#ready) return;
        this.#selectedIndex = Math.max(0, this.#selectedIndex - 1);
    }

    /** Move selection down */
    selectNext() {
        if (!this.#ready) return;
        this.#selectedIndex = Math.min(this.#levels.length - 1, this.#selectedIndex + 1);
    }

    /** Confirm current selection */
    confirm() {
        if (!this.#ready) return;
        this.#alive = false;
        const maxOrder = this.#levels[this.#selectedIndex].order;
        if (this.#onSelect) this.#onSelect(maxOrder);
    }

    skip() {
        // Skip fadein — jump to ready state immediately
        this.#age = 1200;
        this.#titleAlpha = 1;
        for (let i = 0; i < this.#itemAlphas.length; i++) this.#itemAlphas[i] = 1;
        this.#ready = true;
        this.#phase = 'ready';
    }

    // ── particles ────────────────────────────────────────────

    #initParticles() {
        for (let i = 0; i < 30; i++) {
            this.#particles.push({
                x: Math.random() * this.#width,
                y: Math.random() * this.#height,
                size: 1 + Math.random() * 2,
                alpha: 0.2 + Math.random() * 0.4,
                speed: 5 + Math.random() * 10,
                phase: Math.random() * Math.PI * 2,
                pulseSpeed: 0.8 + Math.random() * 1.5,
            });
        }
    }

    // ── update ───────────────────────────────────────────────

    update(deltaTime) {
        if (!this.#alive) return;
        this.#age += deltaTime;
        const dt = deltaTime / 1000;

        // Particles drift & pulse
        for (const p of this.#particles) {
            p.phase += dt * p.pulseSpeed;
            p.x += p.speed * dt * 0.3;
            p.y -= p.speed * dt * 0.1;
            if (p.x > this.#width + 10) p.x = -10;
            if (p.y < -10) p.y = this.#height + 10;
        }

        this.#arrowBlink += deltaTime;

        // Phase transitions
        const fadeinEnd = 400;
        const titleEnd = 800;
        const itemsEnd = titleEnd + this.#levels.length * 150 + 300;

        if (this.#age < fadeinEnd) {
            this.#phase = 'fadein';
            this.#titleAlpha = Math.min(1, this.#age / fadeinEnd);
        } else if (this.#age < titleEnd) {
            this.#phase = 'title';
            this.#titleAlpha = 1;
        } else if (this.#age < itemsEnd) {
            this.#phase = 'items';
            this.#titleAlpha = 1;
            // Stagger each level item
            const phaseAge = this.#age - titleEnd;
            for (let i = 0; i < this.#levels.length; i++) {
                const itemAge = phaseAge - i * 150;
                if (itemAge > 0) {
                    this.#itemAlphas[i] = Math.min(1, itemAge / 200);
                }
            }
        } else {
            this.#phase = 'ready';
            this.#titleAlpha = 1;
            for (let i = 0; i < this.#itemAlphas.length; i++) this.#itemAlphas[i] = 1;
            this.#ready = true;
        }
    }

    // ── draw ─────────────────────────────────────────────────

    #px(v) { return Math.round(v / PX) * PX; }

    draw(ctx) {
        if (!this.#alive) return;

        ctx.save();
        ctx.imageSmoothingEnabled = false;

        // Background image (dimmed)
        if (this.#bgLoaded) {
            ctx.globalAlpha = 0.3;
            ctx.drawImage(this.#bgImage, 0, 0, this.#width, this.#height);
            ctx.globalAlpha = 1;
        }

        // Dark overlay
        const fadeAlpha = Math.min(0.8, this.#age / 400);
        ctx.fillStyle = `rgba(5, 10, 20, ${fadeAlpha})`;
        ctx.fillRect(0, 0, this.#width, this.#height);

        // Particles
        this.#drawParticles(ctx);

        // Title: SELECT LEVEL
        if (this.#titleAlpha > 0) {
            this.#drawTitle(ctx);
        }

        // Level items
        this.#drawItems(ctx);

        // Confirm hint
        if (this.#ready) {
            this.#drawHint(ctx);
        }

        ctx.restore();
    }

    #drawParticles(ctx) {
        for (const p of this.#particles) {
            const pulse = 0.5 + 0.5 * Math.sin(p.phase);
            ctx.globalAlpha = p.alpha * pulse * this.#titleAlpha;
            ctx.fillStyle = '#39ff14';
            ctx.fillRect(this.#px(p.x), this.#px(p.y), PX * p.size, PX * p.size);
        }
        ctx.globalAlpha = 1;
    }

    #drawTitle(ctx) {
        if (!this.#font?.loaded) return;

        const title = 'SELECT LEVEL';
        const scale = 3;
        const x = this.#width / 2;
        const y = this.#height * 0.12;

        // Glow
        this.#font.drawText(ctx, title, x, y, {
            scale,
            align: 'center',
            alpha: this.#titleAlpha * 0.3,
        });
        // Main
        this.#font.drawText(ctx, title, x, y, {
            scale,
            align: 'center',
            alpha: this.#titleAlpha,
        });
    }

    #drawItems(ctx) {
        if (!this.#font?.loaded) return;

        const totalLevels = this.#levels.length;
        const itemScale = 2;
        const lineHeight = 52;
        const startY = this.#height * 0.30;

        for (let i = 0; i < totalLevels; i++) {
            const alpha = this.#itemAlphas[i];
            if (alpha <= 0) continue;

            const lvl = this.#levels[i];
            const y = startY + i * lineHeight;
            const isSelected = i === this.#selectedIndex;

            // Build label: "1. Green Forest - Night"
            const label = `${lvl.order}. ${lvl.name}`;
            const labelX = this.#width / 2;

            // Selected highlight: pulsing glow
            if (isSelected && this.#ready) {
                const pulse = 0.6 + 0.4 * Math.sin(this.#arrowBlink * 0.005);

                // Selection indicator arrow
                const arrowX = labelX - this.#font.measureText(label, itemScale) / 2 - 30;
                this.#font.drawText(ctx, '>', arrowX, y, {
                    scale: itemScale,
                    align: 'left',
                    alpha: pulse * alpha,
                });

                // Highlighted text
                this.#font.drawText(ctx, label, labelX, y, {
                    scale: itemScale,
                    align: 'center',
                    alpha: alpha,
                });

                // Glow behind selected item
                const textW = this.#font.measureText(label, itemScale);
                ctx.globalAlpha = pulse * 0.08 * alpha;
                ctx.fillStyle = lvl.theme?.primaryColor ?? '#39ff14';
                const glowX = labelX - textW / 2 - 10;
                ctx.fillRect(glowX, y - 4, textW + 20, lineHeight - 8);
                ctx.globalAlpha = 1;
            } else {
                // Dimmed non-selected item
                this.#font.drawText(ctx, label, labelX, y, {
                    scale: itemScale,
                    align: 'center',
                    alpha: alpha * (this.#ready ? 0.45 : 1),
                });
            }
        }
    }

    #drawHint(ctx) {
        if (!this.#font?.loaded) return;

        const blink = Math.floor(this.#arrowBlink / 500) % 2 === 0;
        if (!blink) return;

        const hint = 'PRESS SPACE TO START';
        const scale = 1.5;
        const y = this.#height * 0.88;

        this.#font.drawText(ctx, hint, this.#width / 2, y, {
            scale,
            align: 'center',
            alpha: 0.8,
        });
    }
}
