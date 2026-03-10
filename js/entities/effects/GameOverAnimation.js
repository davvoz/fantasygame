import { Entity } from '../Entity.js';

const PX = 3;

/**
 * Game Over animation with "GAME OVER" text and "PLAY AGAIN" prompt
 */
export class GameOverAnimation extends Entity {
    #alive = true;
    #age = 0;
    #width;
    #height;
    #onPlayAgain;
    #font;
    #phase = 'fadein';
    
    // Per-character animation
    #gameChars = [];
    #overChars = [];
    
    // Blood/death particles
    #particles = [];
    
    // Skulls floating
    #skulls = [];
    
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
        this.#initParticles();
        this.#initSkulls();
    }

    get alive() { return this.#alive; }
    get waitingForInput() { return this.#waitingForInput; }

    playAgain() {
        if (this.#waitingForInput) {
            this.#alive = false;
            if (this.#onPlayAgain) this.#onPlayAgain();
        }
    }

    #initChars() {
        const game = 'GAME';
        const over = 'OVER';
        
        for (let i = 0; i < game.length; i++) {
            this.#gameChars.push({
                char: game[i],
                alpha: 0,
                scale: 0,
                delay: i * 150,
                offsetY: 0,
                shake: 0,
            });
        }
        
        for (let i = 0; i < over.length; i++) {
            this.#overChars.push({
                char: over[i],
                alpha: 0,
                scale: 0,
                delay: i * 150,
                offsetY: 0,
                shake: 0,
            });
        }
    }

    #initParticles() {
        // Dark/red floating particles
        for (let i = 0; i < 40; i++) {
            this.#particles.push({
                x: Math.random() * this.#width,
                y: this.#height + Math.random() * 50,
                vx: (Math.random() - 0.5) * 0.5,
                vy: -0.5 - Math.random() * 1.5,
                size: PX + Math.floor(Math.random() * 2) * PX,
                alpha: 0.3 + Math.random() * 0.4,
                color: Math.random() > 0.5 ? '#ff0033' : '#660022',
            });
        }
    }

    #initSkulls() {
        // ASCII skull positions
        for (let i = 0; i < 6; i++) {
            this.#skulls.push({
                x: Math.random() * this.#width,
                y: Math.random() * this.#height,
                alpha: 0.05 + Math.random() * 0.1,
                floatPhase: Math.random() * Math.PI * 2,
                size: 30 + Math.random() * 20,
            });
        }
    }

    update(deltaTime) {
        if (!this.#alive) return;
        this.#age += deltaTime;
        const dt = deltaTime / 1000;

        // Update particles (float upward)
        for (const p of this.#particles) {
            p.x += p.vx;
            p.y += p.vy;
            if (p.y < -20) {
                p.y = this.#height + 20;
                p.x = Math.random() * this.#width;
            }
        }

        // Update skulls
        for (const s of this.#skulls) {
            s.floatPhase += 0.001 * deltaTime;
        }

        // Phase transitions
        const fadeinTime = 500;
        const gameTime = 1500;
        const overTime = 2500;
        const waitTime = 3200;

        if (this.#age < fadeinTime) {
            this.#phase = 'fadein';
        } else if (this.#age < gameTime) {
            this.#phase = 'game';
            this.#updateGameChars();
        } else if (this.#age < overTime) {
            this.#phase = 'over';
            this.#updateOverChars();
        } else if (this.#age < waitTime) {
            this.#phase = 'settle';
            this.#settleChars();
        } else {
            this.#phase = 'waiting';
            this.#waitingForInput = true;
            this.#settleChars();
            // Blink "PLAY AGAIN"
            this.#playAgainVisible = Math.floor(this.#age / 500) % 2 === 0;
        }
    }

    #updateGameChars() {
        const phaseAge = this.#age - 500;
        for (const char of this.#gameChars) {
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

    #updateOverChars() {
        // Keep GAME visible
        for (const char of this.#gameChars) {
            char.scale = 4;
            char.alpha = 1;
            char.offsetY = 0;
            char.shake = 0;
        }
        
        const phaseAge = this.#age - 1500;
        for (const char of this.#overChars) {
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
        for (const char of this.#gameChars) {
            char.scale = 4;
            char.alpha = 1;
            char.offsetY = 0;
            char.shake = 0;
        }
        for (const char of this.#overChars) {
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

    draw(ctx) {
        if (!this.#alive) return;
        
        ctx.save();
        ctx.imageSmoothingEnabled = false;

        // Dark overlay (fade in)
        const fadeAlpha = Math.min(0.85, this.#age / 500);
        ctx.fillStyle = `rgba(10, 0, 0, ${fadeAlpha})`;
        ctx.fillRect(0, 0, this.#width, this.#height);

        // Skulls in background
        this.#drawSkulls(ctx);

        // Rising particles
        this.#drawParticles(ctx);

        // GAME OVER text
        if (this.#phase !== 'fadein') {
            this.#drawTitle(ctx);
        }

        // Play again prompt
        if (this.#waitingForInput && this.#playAgainVisible) {
            this.#drawPlayAgain(ctx);
        }

        ctx.restore();
    }

    #drawSkulls(ctx) {
        ctx.font = 'bold 40px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        for (const skull of this.#skulls) {
            const floatY = Math.sin(skull.floatPhase) * 15;
            ctx.globalAlpha = skull.alpha;
            ctx.fillStyle = '#330011';
            ctx.font = `${skull.size}px monospace`;
            ctx.fillText('☠', skull.x, skull.y + floatY);
        }
        ctx.globalAlpha = 1;
    }

    #drawParticles(ctx) {
        for (const p of this.#particles) {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.fillRect(this.#px(p.x), this.#px(p.y), p.size, p.size);
        }
        ctx.globalAlpha = 1;
    }

    #drawTitle(ctx) {
        if (!this.#font || !this.#font.loaded) return;

        const gameY = this.#height * 0.35;
        const overY = this.#height * 0.55;

        // Draw GAME characters
        let gameX = (this.#width - this.#font.measureText('GAME', 4)) / 2;
        for (const char of this.#gameChars) {
            if (char.alpha > 0 && char.scale > 0) {
                const shakeX = (Math.random() - 0.5) * char.shake;
                const shakeY = (Math.random() - 0.5) * char.shake;
                
                // Red glow
                ctx.globalAlpha = char.alpha * 0.5;
                for (let i = 0; i < 4; i++) {
                    const angle = (Math.PI * 2 * i) / 4;
                    this.#font.drawText(ctx, char.char, 
                        gameX + Math.cos(angle) * 4 + shakeX, 
                        gameY + char.offsetY + Math.sin(angle) * 4 + shakeY, 
                        { scale: char.scale, align: 'left', alpha: 0.4 }
                    );
                }
                
                // Main character
                ctx.globalAlpha = 1;
                this.#font.drawText(ctx, char.char, gameX + shakeX, gameY + char.offsetY + shakeY, {
                    scale: char.scale,
                    align: 'left',
                    alpha: char.alpha
                });
            }
            gameX += this.#font.measureText(char.char, 4) + 8;
        }

        // Draw OVER characters
        let overX = (this.#width - this.#font.measureText('OVER', 4)) / 2;
        for (const char of this.#overChars) {
            if (char.alpha > 0 && char.scale > 0) {
                const shakeX = (Math.random() - 0.5) * char.shake;
                const shakeY = (Math.random() - 0.5) * char.shake;
                
                // Red glow
                ctx.globalAlpha = char.alpha * 0.5;
                for (let i = 0; i < 4; i++) {
                    const angle = (Math.PI * 2 * i) / 4;
                    this.#font.drawText(ctx, char.char, 
                        overX + Math.cos(angle) * 4 + shakeX, 
                        overY + char.offsetY + Math.sin(angle) * 4 + shakeY, 
                        { scale: char.scale, align: 'left', alpha: 0.4 }
                    );
                }
                
                // Main character  
                ctx.globalAlpha = 1;
                this.#font.drawText(ctx, char.char, overX + shakeX, overY + char.offsetY + shakeY, {
                    scale: char.scale,
                    align: 'left',
                    alpha: char.alpha
                });
            }
            overX += this.#font.measureText(char.char, 4) + 8;
        }
    }

    #drawPlayAgain(ctx) {
        if (!this.#font || !this.#font.loaded) return;
        
        // "PRESS SPACE TO PLAY AGAIN"
        this.#font.drawText(ctx, 'PRESS SPACE TO PLAY AGAIN', this.#width / 2, this.#height - 80, {
            scale: 1,
            align: 'center',
            alpha: 1
        });
    }
}
