import { Entity } from '../Entity.js';

const PX = 3;

/**
 * Full-screen celebration scene after completing a level.
 * Shows the mage playing the CELEBRATE spritesheet (grid: 5 cols × 12 rows = 60 frames)
 * with fireworks, confetti, text effects and dramatic lighting.
 *
 * Timeline:
 *  0 –  400ms : fadeIn (dark overlay)
 *  400 – 1400ms : "LEVEL COMPLETE!" text slam
 *  1400 – 5400ms : mage celebrate animation + fireworks + confetti
 *  5400 – 6200ms : stats flyIn (kills, time…)
 *  6200 – 7400ms : hold / results visible
 *  7400 – 8000ms : fadeOut to black (ready for next level intro)
 */
export class CelebrationScene extends Entity {
    #alive = true;
    #age = 0;
    #width;
    #height;
    #onComplete;
    #font;
    #level;       // current level config
    #levelKills;

    // Spritesheet for celebration (grid layout)
    #celebImage;
    #celebLoaded = false;
    #celebCols = 5;
    #celebRows = 6;
    #celebFrameW = 0;
    #celebFrameH = 0;
    #celebFrame = 0;
    #celebElapsed = 0;
    #celebFrameDuration = 80; // ms per frame
    #celebTotalFrames = 30;

    // Background image
    #bgImage;
    #bgLoaded = false;

    // Theme
    #primaryColor;
    #secondaryColor;
    #bgColor;

    // Phase
    #phase = 'fadeIn';

    // Text chars
    #completeChars = [];
    #statsLines = [];

    // Particles
    #confetti = [];
    #fireworks = [];
    #fireworkSparks = [];
    #glowParticles = [];

    // Timing
    static FADE_IN     =  400;
    static TEXT_SLAM   = 1400;
    static CELEBRATE   = 5400;
    static STATS       = 6200;
    static HOLD        = 7400;
    static FADE_OUT    = 8000;

    constructor(width, height, level, font, levelKills, onComplete) {
        super(0, 0, width, height);
        this.#width = width;
        this.#height = height;
        this.#level = level;
        this.#font = font;
        this.#levelKills = levelKills;
        this.#onComplete = onComplete;

        this.#primaryColor = level.theme.primaryColor;
        this.#secondaryColor = level.theme.secondaryColor;
        this.#bgColor = level.theme.backgroundColor;

        // Load celebration spritesheet (grid)
        this.#celebImage = new Image();
        this.#celebImage.onload = () => {
            this.#celebFrameW = this.#celebImage.width / this.#celebCols;
            this.#celebFrameH = this.#celebImage.height / this.#celebRows;
            this.#celebLoaded = true;
        };
        this.#celebImage.src = 'assets/spritesheets/mage/CELEBRATE.png';

        // Load background
        this.#bgImage = new Image();
        this.#bgImage.onload = () => { this.#bgLoaded = true; };
        this.#bgImage.src = level.backgroundPath;

        this.#initTextChars();
        this.#initConfetti();
        this.#initGlowParticles();
        this.#buildStatsLines();
    }

    get alive() { return this.#alive; }
    set alive(v) { this.#alive = v; }

    skip() {
        this.#alive = false;
        if (this.#onComplete) this.#onComplete();
    }

    // ── init helpers ────────────────────────────────────────────

    #initTextChars() {
        const text = 'LEVEL COMPLETE!';
        for (let i = 0; i < text.length; i++) {
            this.#completeChars.push({
                char: text[i],
                alpha: 0,
                scale: 0,
                delay: i * 50,
                offsetY: 0,
                shake: 0,
            });
        }
    }

    #buildStatsLines() {
        this.#statsLines = [
            { text: `ENEMIES DEFEATED: ${this.#levelKills}`, alpha: 0, offsetX: 0, delay: 0 },
            { text: `LEVEL ${this.#level.order} CLEARED`, alpha: 0, offsetX: 0, delay: 200 },
        ];
    }

    #initConfetti() {
        const colors = [this.#primaryColor, this.#secondaryColor, '#ffd700', '#ff69b4', '#00ffcc', '#ffffff'];
        for (let i = 0; i < 120; i++) {
            this.#confetti.push({
                x: Math.random() * this.#width,
                y: -20 - Math.random() * this.#height,
                vx: (Math.random() - 0.5) * 3,
                vy: 1.5 + Math.random() * 3,
                size: PX + Math.floor(Math.random() * 3) * PX,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.15,
                alpha: 0.7 + Math.random() * 0.3,
                wobble: Math.random() * Math.PI * 2,
                wobbleSpeed: 0.02 + Math.random() * 0.04,
            });
        }
    }

    #initGlowParticles() {
        for (let i = 0; i < 30; i++) {
            this.#glowParticles.push({
                x: this.#width / 2 + (Math.random() - 0.5) * 300,
                y: this.#height / 2 + (Math.random() - 0.5) * 200,
                radius: 20 + Math.random() * 60,
                alpha: 0,
                maxAlpha: 0.04 + Math.random() * 0.06,
                phase: Math.random() * Math.PI * 2,
                speed: 0.001 + Math.random() * 0.002,
                color: Math.random() > 0.5 ? this.#primaryColor : this.#secondaryColor,
            });
        }
    }

    // ── firework helpers ───────────────────────────────────────

    #spawnFirework() {
        const x = this.#width * 0.15 + Math.random() * this.#width * 0.7;
        const y = this.#height * 0.15 + Math.random() * this.#height * 0.35;
        const colors = [this.#primaryColor, this.#secondaryColor, '#ffd700', '#ff69b4'];
        const color = colors[Math.floor(Math.random() * colors.length)];

        // Ring of sparks
        const count = 24 + Math.floor(Math.random() * 16);
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
            const speed = 2 + Math.random() * 4;
            this.#fireworkSparks.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color,
                life: 600 + Math.random() * 600,
                maxLife: 600 + Math.random() * 600,
                size: PX,
                gravity: 0.04,
                trail: [],
            });
        }

        // Inner burst (brighter, slower)
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            this.#fireworkSparks.push({
                x, y,
                vx: Math.cos(angle) * 1.5,
                vy: Math.sin(angle) * 1.5,
                color: '#ffffff',
                life: 400,
                maxLife: 400,
                size: PX * 2,
                gravity: 0.02,
                trail: [],
            });
        }
    }

    // ── update ──────────────────────────────────────────────────

    update(deltaTime) {
        if (!this.#alive) return;
        this.#age += deltaTime;

        // Phase transitions
        if (this.#age < CelebrationScene.FADE_IN) {
            this.#phase = 'fadeIn';
        } else if (this.#age < CelebrationScene.TEXT_SLAM) {
            this.#phase = 'textSlam';
        } else if (this.#age < CelebrationScene.CELEBRATE) {
            this.#phase = 'celebrate';
        } else if (this.#age < CelebrationScene.STATS) {
            this.#phase = 'stats';
        } else if (this.#age < CelebrationScene.HOLD) {
            this.#phase = 'hold';
        } else if (this.#age < CelebrationScene.FADE_OUT) {
            this.#phase = 'fadeOut';
        } else {
            this.#alive = false;
            if (this.#onComplete) this.#onComplete();
            return;
        }

        this.#updateTextChars();
        this.#updateCelebAnimation(deltaTime);
        this.#updateConfetti(deltaTime);
        this.#updateFireworks(deltaTime);
        this.#updateGlowParticles();
        this.#updateStats();
    }

    #updateTextChars() {
        if (this.#age < CelebrationScene.FADE_IN) return;
        const phaseAge = this.#age - CelebrationScene.FADE_IN;
        const targetScale = this.#fitTextScale('LEVEL COMPLETE!', 3);

        for (const ch of this.#completeChars) {
            const charAge = phaseAge - ch.delay;
            if (charAge > 0) {
                const t = Math.min(1, charAge / 180);
                ch.scale = this.#easeOutBack(t) * targetScale;
                ch.alpha = Math.min(1, charAge / 120);
                ch.offsetY = -Math.sin(t * Math.PI) * 25;
                ch.shake = charAge < 120 ? (Math.random() - 0.5) * 6 : 0;
            }
        }

        // After slam, settle
        if (phaseAge > 800) {
            for (const ch of this.#completeChars) {
                ch.scale = targetScale;
                ch.alpha = 1;
                ch.offsetY = 0;
                ch.shake = 0;
            }
        }
    }

    #updateCelebAnimation(deltaTime) {
        if (this.#phase !== 'celebrate' && this.#phase !== 'stats' && this.#phase !== 'hold' && this.#phase !== 'fadeOut') return;
        this.#celebElapsed += deltaTime;
        while (this.#celebElapsed >= this.#celebFrameDuration) {
            this.#celebElapsed -= this.#celebFrameDuration;
            this.#celebFrame++;
            if (this.#celebFrame >= this.#celebTotalFrames) {
                this.#celebFrame = 0; // loop
            }
        }
    }

    #updateConfetti(deltaTime) {
        if (this.#age < CelebrationScene.TEXT_SLAM) return;
        const dt = deltaTime / 1000;
        for (const c of this.#confetti) {
            c.wobble += c.wobbleSpeed * deltaTime;
            c.x += c.vx + Math.sin(c.wobble) * 0.8;
            c.y += c.vy;
            c.rotation += c.rotSpeed;
            if (c.y > this.#height + 30) {
                c.y = -20;
                c.x = Math.random() * this.#width;
            }
        }
    }

    #updateFireworks(deltaTime) {
        if (this.#age < CelebrationScene.TEXT_SLAM + 200) return;

        // Spawn new fireworks periodically
        const fireworkInterval = 400;
        const timeSinceFirstFirework = this.#age - (CelebrationScene.TEXT_SLAM + 200);
        const expectedCount = Math.floor(timeSinceFirstFirework / fireworkInterval);
        if (this.#fireworks.length < expectedCount && this.#phase !== 'fadeOut') {
            this.#fireworks.push({ time: this.#age });
            this.#spawnFirework();
        }

        // Update sparks
        for (let i = this.#fireworkSparks.length - 1; i >= 0; i--) {
            const s = this.#fireworkSparks[i];
            s.trail.push({ x: s.x, y: s.y });
            if (s.trail.length > 5) s.trail.shift();
            s.x += s.vx;
            s.y += s.vy;
            s.vy += s.gravity;
            s.vx *= 0.98;
            s.vy *= 0.98;
            s.life -= deltaTime;
            if (s.life <= 0) {
                this.#fireworkSparks.splice(i, 1);
            }
        }
    }

    #updateGlowParticles() {
        for (const g of this.#glowParticles) {
            g.phase += g.speed * 16;
            g.alpha = g.maxAlpha * (0.5 + 0.5 * Math.sin(g.phase));
        }
    }

    #updateStats() {
        if (this.#age < CelebrationScene.CELEBRATE) return;
        const phaseAge = this.#age - CelebrationScene.CELEBRATE;
        for (const line of this.#statsLines) {
            const lineAge = phaseAge - line.delay;
            if (lineAge > 0) {
                const t = Math.min(1, lineAge / 400);
                line.alpha = this.#easeOutCubic(t);
                line.offsetX = (1 - this.#easeOutCubic(t)) * -200;
            }
        }
    }

    // ── draw ─────────────────────────────────────────────────────

    draw(ctx) {
        if (!this.#alive) return;
        ctx.save();
        ctx.imageSmoothingEnabled = false;

        // Background
        this.#drawBackground(ctx);

        // Glow particles (behind everything)
        this.#drawGlowParticles(ctx);

        // Confetti (behind mage)
        if (this.#age >= CelebrationScene.TEXT_SLAM) {
            this.#drawConfetti(ctx);
        }

        // Mage celebrate animation
        if (this.#phase === 'celebrate' || this.#phase === 'stats' || this.#phase === 'hold' || this.#phase === 'fadeOut') {
            this.#drawCelebMage(ctx);
        }

        // Firework sparks
        this.#drawFireworkSparks(ctx);

        // "LEVEL COMPLETE!" text
        if (this.#age >= CelebrationScene.FADE_IN) {
            this.#drawCompleteText(ctx);
        }

        // Stats
        if (this.#age >= CelebrationScene.CELEBRATE) {
            this.#drawStats(ctx);
        }

        // Scanlines
        this.#drawScanlines(ctx);

        // Fade overlays
        this.#drawFadeOverlay(ctx);

        // Skip prompt
        if (this.#age > 1200 && this.#phase !== 'fadeOut') {
            this.#drawSkipHint(ctx);
        }

        ctx.restore();
    }

    #drawBackground(ctx) {
        // Solid black base — prevents level entities from showing through
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, this.#width, this.#height);

        // Draw the level bg image, then dark overlay
        if (this.#bgLoaded) {
            ctx.drawImage(this.#bgImage, 0, 0, this.#width, this.#height);
        }
        // Dark overlay for focus
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.#width, this.#height);

        // Radial vignette
        const grad = ctx.createRadialGradient(
            this.#width / 2, this.#height / 2, this.#height * 0.2,
            this.#width / 2, this.#height / 2, this.#height * 0.9
        );
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.6)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.#width, this.#height);
    }

    #drawGlowParticles(ctx) {
        for (const g of this.#glowParticles) {
            if (g.alpha <= 0) continue;
            const grad = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.radius);
            grad.addColorStop(0, this.#hexToRgba(g.color, g.alpha));
            grad.addColorStop(1, this.#hexToRgba(g.color, 0));
            ctx.fillStyle = grad;
            ctx.fillRect(g.x - g.radius, g.y - g.radius, g.radius * 2, g.radius * 2);
        }
    }

    #drawConfetti(ctx) {
        for (const c of this.#confetti) {
            ctx.save();
            ctx.translate(c.x, c.y);
            ctx.rotate(c.rotation);
            ctx.globalAlpha = c.alpha;
            ctx.fillStyle = c.color;
            ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 0.5);
            ctx.restore();
        }
    }

    #drawCelebMage(ctx) {
        if (!this.#celebLoaded) return;

        const col = this.#celebFrame % this.#celebCols;
        const row = Math.floor(this.#celebFrame / this.#celebCols);
        const sx = col * this.#celebFrameW;
        const sy = row * this.#celebFrameH;

        // Draw mage centered, with a ground glow
        const drawH = 260;
        const drawW = drawH * (this.#celebFrameW / this.#celebFrameH);
        const drawX = (this.#width - drawW) / 2;
        const drawY = this.#height * 0.38;

        // Ground glow beneath mage
        const glowGrad = ctx.createRadialGradient(
            this.#width / 2, drawY + drawH, 10,
            this.#width / 2, drawY + drawH, drawW * 0.7
        );
        glowGrad.addColorStop(0, this.#hexToRgba(this.#primaryColor, 0.35));
        glowGrad.addColorStop(0.6, this.#hexToRgba(this.#primaryColor, 0.1));
        glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glowGrad;
        ctx.fillRect(drawX - 60, drawY + drawH - 40, drawW + 120, 80);

        // Mage sprite
        ctx.drawImage(
            this.#celebImage,
            sx, sy, this.#celebFrameW, this.#celebFrameH,
            drawX, drawY, drawW, drawH
        );

        // Magic aura shimmer around mage
        const shimmerAlpha = 0.15 + 0.1 * Math.sin(this.#age * 0.005);
        ctx.shadowColor = this.#primaryColor;
        ctx.shadowBlur = 30;
        ctx.globalAlpha = shimmerAlpha;
        ctx.drawImage(
            this.#celebImage,
            sx, sy, this.#celebFrameW, this.#celebFrameH,
            drawX - 4, drawY - 4, drawW + 8, drawH + 8
        );
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }

    #drawFireworkSparks(ctx) {
        for (const s of this.#fireworkSparks) {
            const lifeRatio = s.life / s.maxLife;
            ctx.globalAlpha = lifeRatio;

            // Trail
            for (let t = 0; t < s.trail.length; t++) {
                const trailAlpha = (t / s.trail.length) * lifeRatio * 0.4;
                ctx.fillStyle = this.#hexToRgba(s.color, trailAlpha);
                ctx.fillRect(s.trail[t].x, s.trail[t].y, s.size, s.size);
            }

            // Spark head
            ctx.fillStyle = s.color;
            ctx.fillRect(s.x, s.y, s.size, s.size);

            // Bright center
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(s.x, s.y, Math.max(1, s.size - PX), Math.max(1, s.size - PX));
        }
        ctx.globalAlpha = 1;
    }

    #drawCompleteText(ctx) {
        if (!this.#font || !this.#font.loaded) return;
        const text = 'LEVEL COMPLETE!';
        const scale = this.#completeChars[0]?.scale || 0;
        if (scale <= 0) return;

        const totalW = this.#font.measureText(text, scale);
        let x = (this.#width - totalW) / 2;
        const baseY = this.#height * 0.14;

        for (const ch of this.#completeChars) {
            if (ch.alpha <= 0) continue;

            const charX = x + ch.shake;
            const charY = baseY + ch.offsetY;

            // Glow behind text
            ctx.shadowColor = this.#primaryColor;
            ctx.shadowBlur = 16;
            this.#font.drawText(ctx, ch.char, charX, charY, { scale: ch.scale, alpha: ch.alpha });
            ctx.shadowBlur = 0;

            // Main draw
            this.#font.drawText(ctx, ch.char, charX, charY, { scale: ch.scale, alpha: ch.alpha });

            x += this.#font.measureText(ch.char, ch.scale) + 2 * ch.scale;
        }
        ctx.globalAlpha = 1;
    }

    #drawStats(ctx) {
        if (!this.#font || !this.#font.loaded) return;
        const statScale = 1.2;
        let y = this.#height * 0.82;

        for (const line of this.#statsLines) {
            if (line.alpha <= 0) continue;

            const w = this.#font.measureText(line.text, statScale);
            const x = (this.#width - w) / 2 + line.offsetX;

            ctx.shadowColor = this.#primaryColor;
            ctx.shadowBlur = 8;
            this.#font.drawText(ctx, line.text, x, y, { scale: statScale, alpha: line.alpha });
            ctx.shadowBlur = 0;

            y += 36;
        }
        ctx.globalAlpha = 1;
    }

    #drawScanlines(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.04)';
        for (let y = 0; y < this.#height; y += 4) {
            ctx.fillRect(0, y, this.#width, 2);
        }
    }

    #drawFadeOverlay(ctx) {
        if (this.#phase === 'fadeIn') {
            // Fade from black
            const t = 1 - this.#age / CelebrationScene.FADE_IN;
            ctx.fillStyle = `rgba(0,0,0,${t})`;
            ctx.fillRect(0, 0, this.#width, this.#height);
        } else if (this.#phase === 'fadeOut') {
            // Fade to black
            const t = (this.#age - CelebrationScene.HOLD) / (CelebrationScene.FADE_OUT - CelebrationScene.HOLD);
            ctx.fillStyle = `rgba(0,0,0,${Math.min(1, t)})`;
            ctx.fillRect(0, 0, this.#width, this.#height);
        }
    }

    #drawSkipHint(ctx) {
        if (!this.#font || !this.#font.loaded) return;
        const pulse = 0.4 + 0.3 * Math.sin(this.#age * 0.004);
        const text = 'PRESS SPACE TO SKIP';
        const s = 0.6;
        const w = this.#font.measureText(text, s);
        this.#font.drawText(ctx, text, (this.#width - w) / 2, this.#height - 34, { scale: s, alpha: pulse });
    }

    // ── utils ────────────────────────────────────────────────────

    #fitTextScale(text, ideal) {
        const maxW = this.#width * 0.85;
        if (!this.#font || !this.#font.loaded) return ideal;
        const measured = this.#font.measureText(text, ideal);
        return measured <= maxW ? ideal : ideal * (maxW / measured);
    }

    #easeOutBack(t) {
        const c = 1.7;
        return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
    }

    #easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    #hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    }
}
