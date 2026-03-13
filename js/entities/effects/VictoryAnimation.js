import { Entity } from '../Entity.js';

const PX = 3;

/**
 * Victory animation — "YOU WIN" with golden fireworks, confetti and "PLAY AGAIN" prompt.
 * Follows the same pattern as GameOverAnimation for input handling.
 */
export class VictoryAnimation extends Entity {
    #alive = true;
    #age = 0;
    #width;
    #height;
    #onPlayAgain;
    #font;
    #phase = 'fadein';

    // Per-character animation
    #youChars = [];
    #winChars = [];

    // Confetti
    #confetti = [];

    // Firework sparks
    #fireworkSparks = [];
    #fireworkTimer = 0;

    // Stars floating
    #stars = [];

    // Play again blink
    #playAgainVisible = false;
    #waitingForInput = false;

    constructor(width, height, onPlayAgain, font) {
        super(0, 0, width, height);
        this.#width = width;
        this.#height = height;
        this.#onPlayAgain = onPlayAgain;
        this.#font = font;

        this.#initChars();
        this.#initConfetti();
        this.#initStars();
    }

    get alive() { return this.#alive; }
    get waitingForInput() { return this.#waitingForInput; }

    playAgain() {
        if (this.#waitingForInput) {
            this.#alive = false;
            if (this.#onPlayAgain) this.#onPlayAgain();
        }
    }

    // ── init ─────────────────────────────────────────────────

    #initChars() {
        const you = 'YOU';
        const win = 'WIN!';

        for (let i = 0; i < you.length; i++) {
            this.#youChars.push({
                char: you[i],
                alpha: 0,
                scale: 0,
                delay: i * 150,
                offsetY: 0,
                shake: 0,
            });
        }

        for (let i = 0; i < win.length; i++) {
            this.#winChars.push({
                char: win[i],
                alpha: 0,
                scale: 0,
                delay: i * 150,
                offsetY: 0,
                shake: 0,
            });
        }
    }

    #initConfetti() {
        const colors = ['#ffd700', '#ff69b4', '#00ffcc', '#ff4444', '#44aaff', '#ffffff', '#ffaa00'];
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

    #initStars() {
        for (let i = 0; i < 8; i++) {
            this.#stars.push({
                x: Math.random() * this.#width,
                y: Math.random() * this.#height,
                alpha: 0.05 + Math.random() * 0.15,
                floatPhase: Math.random() * Math.PI * 2,
                size: 20 + Math.random() * 20,
            });
        }
    }

    // ── fireworks ────────────────────────────────────────────

    #spawnFirework() {
        const x = this.#width * 0.1 + Math.random() * this.#width * 0.8;
        const y = this.#height * 0.1 + Math.random() * this.#height * 0.4;
        const colors = ['#ffd700', '#ff69b4', '#00ffcc', '#ffaa00', '#44aaff'];
        const color = colors[Math.floor(Math.random() * colors.length)];

        const count = 20 + Math.floor(Math.random() * 16);
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
            });
        }
        // Bright center burst
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6;
            this.#fireworkSparks.push({
                x, y,
                vx: Math.cos(angle) * 1.5,
                vy: Math.sin(angle) * 1.5,
                color: '#ffffff',
                life: 400,
                maxLife: 400,
                size: PX * 2,
                gravity: 0.02,
            });
        }
    }

    // ── update ───────────────────────────────────────────────

    update(deltaTime) {
        if (!this.#alive) return;
        this.#age += deltaTime;

        // Update stars
        for (const s of this.#stars) {
            s.floatPhase += 0.001 * deltaTime;
        }

        // Update confetti
        if (this.#age > 500) {
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

        // Fireworks
        if (this.#age > 800) {
            this.#fireworkTimer += deltaTime;
            if (this.#fireworkTimer > 500) {
                this.#fireworkTimer = 0;
                this.#spawnFirework();
            }
        }

        // Update sparks
        for (let i = this.#fireworkSparks.length - 1; i >= 0; i--) {
            const s = this.#fireworkSparks[i];
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

        // Phase transitions
        const fadeinTime = 500;
        const youTime = 1500;
        const winTime = 2500;
        const waitTime = 3200;

        if (this.#age < fadeinTime) {
            this.#phase = 'fadein';
        } else if (this.#age < youTime) {
            this.#phase = 'you';
            this.#updateYouChars();
        } else if (this.#age < winTime) {
            this.#phase = 'win';
            this.#updateWinChars();
        } else if (this.#age < waitTime) {
            this.#phase = 'settle';
            this.#settleChars();
        } else {
            this.#phase = 'waiting';
            this.#waitingForInput = true;
            this.#settleChars();
            this.#playAgainVisible = Math.floor(this.#age / 500) % 2 === 0;
        }
    }

    #updateYouChars() {
        const phaseAge = this.#age - 500;
        for (const char of this.#youChars) {
            const charAge = phaseAge - char.delay;
            if (charAge > 0) {
                const t = Math.min(1, charAge / 200);
                char.scale = this.#easeOutBack(t) * 4;
                char.alpha = Math.min(1, charAge / 150);
                char.offsetY = -Math.sin(t * Math.PI) * 20;
                char.shake = (1 - t) * 5;
            }
        }
    }

    #updateWinChars() {
        for (const char of this.#youChars) {
            char.scale = 4;
            char.alpha = 1;
            char.offsetY = 0;
            char.shake = 0;
        }

        const phaseAge = this.#age - 1500;
        for (const char of this.#winChars) {
            const charAge = phaseAge - char.delay;
            if (charAge > 0) {
                const t = Math.min(1, charAge / 200);
                char.scale = this.#easeOutBack(t) * 4;
                char.alpha = Math.min(1, charAge / 150);
                char.offsetY = Math.sin(t * Math.PI) * 20;
                char.shake = (1 - t) * 5;
            }
        }
    }

    #settleChars() {
        for (const char of this.#youChars) {
            char.scale = 4;
            char.alpha = 1;
            char.offsetY = 0;
            char.shake = 0;
        }
        for (const char of this.#winChars) {
            char.scale = 4;
            char.alpha = 1;
            char.offsetY = 0;
            char.shake = 0;
        }
    }

    #easeOutBack(t) {
        const c = 1.7;
        return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
    }

    #px(v) { return Math.round(v / PX) * PX; }

    // ── draw ─────────────────────────────────────────────────

    draw(ctx) {
        if (!this.#alive) return;

        ctx.save();
        ctx.imageSmoothingEnabled = false;

        // Dark overlay with golden tint
        const fadeAlpha = Math.min(0.85, this.#age / 500);
        ctx.fillStyle = `rgba(10, 8, 0, ${fadeAlpha})`;
        ctx.fillRect(0, 0, this.#width, this.#height);

        // Stars
        this.#drawStars(ctx);

        // Confetti
        if (this.#age > 500) {
            this.#drawConfetti(ctx);
        }

        // Firework sparks
        this.#drawFireworkSparks(ctx);

        // Title
        if (this.#phase !== 'fadein') {
            this.#drawTitle(ctx);
        }

        // Play again
        if (this.#waitingForInput && this.#playAgainVisible) {
            this.#drawPlayAgain(ctx);
        }

        ctx.restore();
    }

    #drawStars(ctx) {
        for (const star of this.#stars) {
            const floatY = Math.sin(star.floatPhase) * 15;
            ctx.globalAlpha = star.alpha;
            ctx.fillStyle = '#ffd700';
            ctx.font = `${star.size}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('★', star.x, star.y + floatY);
        }
        ctx.globalAlpha = 1;
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

    #drawFireworkSparks(ctx) {
        for (const s of this.#fireworkSparks) {
            const lifeRatio = s.life / s.maxLife;
            ctx.globalAlpha = lifeRatio;
            ctx.fillStyle = s.color;
            ctx.fillRect(this.#px(s.x), this.#px(s.y), s.size, s.size);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(this.#px(s.x), this.#px(s.y), Math.max(1, s.size - PX), Math.max(1, s.size - PX));
        }
        ctx.globalAlpha = 1;
    }

    #drawTitle(ctx) {
        if (!this.#font || !this.#font.loaded) return;

        const youY = this.#height * 0.30;
        const winY = this.#height * 0.50;

        // Draw YOU
        let youX = (this.#width - this.#font.measureText('YOU', 4)) / 2;
        for (const char of this.#youChars) {
            if (char.alpha > 0 && char.scale > 0) {
                const shakeX = (Math.random() - 0.5) * char.shake;
                const shakeY = (Math.random() - 0.5) * char.shake;

                // Golden glow
                ctx.globalAlpha = char.alpha * 0.5;
                for (let i = 0; i < 4; i++) {
                    const angle = (Math.PI * 2 * i) / 4;
                    this.#font.drawText(ctx, char.char,
                        youX + Math.cos(angle) * 4 + shakeX,
                        youY + char.offsetY + Math.sin(angle) * 4 + shakeY,
                        { scale: char.scale, align: 'left', alpha: 0.4 }
                    );
                }

                ctx.globalAlpha = 1;
                this.#font.drawText(ctx, char.char, youX + shakeX, youY + char.offsetY + shakeY, {
                    scale: char.scale,
                    align: 'left',
                    alpha: char.alpha,
                });
            }
            youX += this.#font.measureText(char.char, 4) + 8;
        }

        // Draw WIN!
        let winX = (this.#width - this.#font.measureText('WIN!', 4)) / 2;
        for (const char of this.#winChars) {
            if (char.alpha > 0 && char.scale > 0) {
                const shakeX = (Math.random() - 0.5) * char.shake;
                const shakeY = (Math.random() - 0.5) * char.shake;

                ctx.globalAlpha = char.alpha * 0.5;
                for (let i = 0; i < 4; i++) {
                    const angle = (Math.PI * 2 * i) / 4;
                    this.#font.drawText(ctx, char.char,
                        winX + Math.cos(angle) * 4 + shakeX,
                        winY + char.offsetY + Math.sin(angle) * 4 + shakeY,
                        { scale: char.scale, align: 'left', alpha: 0.4 }
                    );
                }

                ctx.globalAlpha = 1;
                this.#font.drawText(ctx, char.char, winX + shakeX, winY + char.offsetY + shakeY, {
                    scale: char.scale,
                    align: 'left',
                    alpha: char.alpha,
                });
            }
            winX += this.#font.measureText(char.char, 4) + 8;
        }
    }

    #drawPlayAgain(ctx) {
        if (!this.#font || !this.#font.loaded) return;
        this.#font.drawText(ctx, 'PRESS SPACE TO PLAY AGAIN', this.#width / 2, this.#height - 80, {
            scale: 1,
            align: 'center',
            alpha: 1,
        });
    }
}
