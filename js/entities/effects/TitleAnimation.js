import { Entity } from '../Entity.js';

const PX = 3; // Pixel size for effects

/**
 * Epic title animation for "FANTASY ANARCHY"
 * Letters appear one at a time with dramatic effects
 * Uses the game background with ambient particles
 */
export class TitleAnimation extends Entity {
    #alive = true;
    #age = 0;
    #width;
    #height;
    #onComplete;
    #font;
    #phase = 'intro';
    
    // Background
    #bgImage;
    #bgLoaded = false;
    
    // Per-character animation
    #fantasyChars = [];
    #anarchyChars = [];
    
    // Ambient particles (like game's fireflies)
    #particles = [];
    #sparks = [];
    
    // Fog blobs
    #fog = [];
    
    // Falling leaves
    #leaves = [];

    constructor(width, height, onComplete, font) {
        super(0, 0, width, height);
        this.#width = width;
        this.#height = height;
        this.#onComplete = onComplete;
        this.#font = font;
        
        // Load background image
        this.#bgImage = new Image();
        this.#bgImage.onload = () => { this.#bgLoaded = true; };
        this.#bgImage.src = 'assets/spritesheets/backgrounds/FORESTA_VERDE_NOTTE.png';
        
        this.#initChars();
        this.#initParticles();
        this.#initFog();
        this.#initLeaves();
    }

    get alive() { return this.#alive; }

    skip() {
        this.#alive = false;
        if (this.#onComplete) this.#onComplete();
    }

    #initChars() {
        const fantasy = 'FANTASY';
        const anarchy = 'ANARCHY';
        
        for (let i = 0; i < fantasy.length; i++) {
            this.#fantasyChars.push({
                char: fantasy[i],
                alpha: 0,
                scale: 0,
                delay: i * 120, // Stagger each letter
                offsetY: 0,
            });
        }
        
        for (let i = 0; i < anarchy.length; i++) {
            this.#anarchyChars.push({
                char: anarchy[i],
                alpha: 0,
                scale: 0,
                delay: i * 120,
                offsetY: 0,
            });
        }
    }

    #initParticles() {
        // Firefly-like particles (same as AmbientParticles)
        for (let i = 0; i < 45; i++) {
            const size = 1.5 + Math.random() * 2.5;
            const speed = 4 + Math.random() * 10;
            const angle = Math.random() * Math.PI * 2;
            this.#particles.push({
                x: Math.random() * this.#width,
                y: Math.random() * this.#height * 0.85,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 3,
                size,
                baseAlpha: 0.3 + Math.random() * 0.5,
                alpha: 0,
                pulseSpeed: 0.8 + Math.random() * 1.5,
                pulsePhase: Math.random() * Math.PI * 2,
                hue: 180 + Math.random() * 40, // cyan-blue range
                saturation: 80 + Math.random() * 20,
                lightness: 60 + Math.random() * 20,
                wobbleAmp: 0.3 + Math.random() * 0.6,
                wobbleSpeed: 1 + Math.random() * 2,
                wobblePhase: Math.random() * Math.PI * 2,
                time: 0,
            });
        }
    }

    #initFog() {
        // Drifting fog blobs
        for (let i = 0; i < 6; i++) {
            this.#fog.push({
                x: Math.random() * this.#width,
                y: this.#height * (0.4 + Math.random() * 0.5),
                r: 200 + Math.random() * 200,
                speed: 5 + Math.random() * 10
            });
        }
    }

    #initLeaves() {
        // Falling leaves
        for (let i = 0; i < 30; i++) {
            this.#leaves.push({
                x: Math.random() * this.#width,
                y: Math.random() * this.#height,
                size: 6 + Math.random() * 6,
                speedY: 30 + Math.random() * 40,
                speedX: -20 + Math.random() * 40,
                rot: Math.random() * Math.PI * 2,
                rotSpeed: -2 + Math.random() * 4,
                swing: Math.random() * 3
            });
        }
    }

    update(deltaTime) {
        if (!this.#alive) return;
        this.#age += deltaTime;
        const dt = deltaTime / 1000;

        // Update firefly particles
        for (const p of this.#particles) {
            p.time += dt;
            const wobble = Math.sin(p.time * p.wobbleSpeed + p.wobblePhase) * p.wobbleAmp;
            p.x += (p.vx + wobble) * dt;
            p.y += p.vy * dt;
            const pulse = Math.sin(p.time * p.pulseSpeed + p.pulsePhase);
            p.alpha = p.baseAlpha * (0.5 + 0.5 * pulse);
            if (p.x < -10) p.x = this.#width + 10;
            if (p.x > this.#width + 10) p.x = -10;
            if (p.y < -10) p.y = this.#height + 10;
            if (p.y > this.#height + 10) p.y = -10;
        }

        // Update fog
        for (const f of this.#fog) {
            f.x += f.speed * dt;
            if (f.x > this.#width + f.r) f.x = -f.r;
        }

        // Update leaves
        for (const l of this.#leaves) {
            l.y += l.speedY * dt;
            l.x += l.speedX * dt + Math.sin(l.y * 0.05) * l.swing;
            l.rot += l.rotSpeed * dt;
            if (l.y > this.#height + 20) {
                l.y = -20;
                l.x = Math.random() * this.#width;
            }
        }

        // Update sparks
        for (let i = this.#sparks.length - 1; i >= 0; i--) {
            const s = this.#sparks[i];
            s.x += s.vx;
            s.y += s.vy;
            s.vy += 0.12;
            s.life -= deltaTime;
            if (s.life <= 0) this.#sparks.splice(i, 1);
        }

        // Phase transitions
        const introTime = 500;
        const fantasyTime = 1800;
        const anarchyTime = 3200;
        const endTime = 4200;

        if (this.#age < introTime) {
            this.#phase = 'intro';
        } else if (this.#age < fantasyTime) {
            this.#phase = 'fantasy';
            this.#updateFantasyChars();
        } else if (this.#age < anarchyTime) {
            this.#phase = 'anarchy';
            this.#updateAnarchyChars();
        } else if (this.#age < endTime) {
            this.#phase = 'flash';
        } else {
            this.#alive = false;
            if (this.#onComplete) this.#onComplete();
        }
    }

    #updateFantasyChars() {
        const phaseAge = this.#age - 500;
        for (const char of this.#fantasyChars) {
            const charAge = phaseAge - char.delay;
            if (charAge > 0) {
                const t = Math.min(1, charAge / 200);
                char.scale = this.#easeOutBack(t) * 3;
                char.alpha = Math.min(1, charAge / 150);
                char.offsetY = -Math.sin(t * Math.PI) * 15;
                
                // Sparks on appear
                if (charAge > 0 && charAge < 30 && Math.random() > 0.5) {
                    const idx = this.#fantasyChars.indexOf(char);
                    const x = this.#getCharX('FANTASY', idx, 3) + 30;
                    this.#addSparks(x, this.#height * 0.35, '#00ffff');
                }
            }
        }
    }

    #updateAnarchyChars() {
        // Keep fantasy visible
        for (const char of this.#fantasyChars) {
            char.scale = 3;
            char.alpha = 1;
            char.offsetY = 0;
        }
        
        const phaseAge = this.#age - 1800;
        for (const char of this.#anarchyChars) {
            const charAge = phaseAge - char.delay;
            if (charAge > 0) {
                const t = Math.min(1, charAge / 200);
                char.scale = this.#easeOutBack(t) * 3;
                char.alpha = Math.min(1, charAge / 150);
                char.offsetY = Math.sin(t * Math.PI) * 15;
                
                // Sparks on appear
                if (charAge > 0 && charAge < 30 && Math.random() > 0.5) {
                    const idx = this.#anarchyChars.indexOf(char);
                    const x = this.#getCharX('ANRCHY', idx, 3) + 30;
                    this.#addSparks(x, this.#height * 0.55, '#ff0066');
                }
            }
        }
    }

    #getCharX(text, index, scale) {
        if (!this.#font || !this.#font.loaded) return 0;
        const totalWidth = this.#font.measureText(text, scale);
        const startX = (this.#width - totalWidth) / 2;
        let x = startX;
        for (let i = 0; i < index; i++) {
            x += this.#font.measureText(text[i], scale) + 2 * scale;
        }
        return x;
    }

    #addSparks(x, y, color) {
        for (let i = 0; i < 8; i++) {
            this.#sparks.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 10,
                vy: -Math.random() * 6 - 3,
                color,
                life: 500 + Math.random() * 300,
                size: PX,
            });
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

        // Game background
        this.#drawBackground(ctx);
        
        // Fog layer
        this.#drawFog(ctx);
        
        // Falling leaves
        this.#drawLeaves(ctx);
        
        // Firefly particles
        this.#drawParticles(ctx);

        // Draw based on phase
        if (this.#phase === 'intro') {
            this.#drawIntro(ctx);
        } else if (this.#phase === 'fantasy' || this.#phase === 'anarchy' || this.#phase === 'flash') {
            this.#drawTitle(ctx);
        }

        // Sparks
        this.#drawSparks(ctx);

        // Flash effect
        if (this.#phase === 'flash') {
            this.#drawFlash(ctx);
        }

        // Skip hint
        if (this.#age > 500 && this.#phase !== 'flash') {
            this.#drawSkipHint(ctx);
        }

        ctx.restore();
    }

    #drawBackground(ctx) {
        // Draw actual game background
        if (this.#bgLoaded) {
            ctx.drawImage(this.#bgImage, 0, 0, this.#width, this.#height);
        } else {
            // Fallback dark background while loading
            ctx.fillStyle = '#0a0f0a';
            ctx.fillRect(0, 0, this.#width, this.#height);
        }
        
        // Slight darkening to make title pop more
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, this.#width, this.#height);
    }

    #drawFog(ctx) {
        ctx.globalCompositeOperation = 'lighter';
        for (const f of this.#fog) {
            const grd = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
            grd.addColorStop(0, 'rgba(100, 150, 120, 0.08)');
            grd.addColorStop(0.5, 'rgba(80, 120, 100, 0.04)');
            grd.addColorStop(1, 'rgba(60, 100, 80, 0)');
            ctx.fillStyle = grd;
            ctx.fillRect(f.x - f.r, f.y - f.r, f.r * 2, f.r * 2);
        }
        ctx.globalCompositeOperation = 'source-over';
    }

    #drawLeaves(ctx) {
        ctx.fillStyle = '#2a4020';
        for (const l of this.#leaves) {
            ctx.save();
            ctx.translate(l.x, l.y);
            ctx.rotate(l.rot);
            ctx.globalAlpha = 0.6;
            // Simple leaf shape (small diamond)
            ctx.beginPath();
            ctx.moveTo(0, -l.size / 2);
            ctx.lineTo(l.size / 3, 0);
            ctx.lineTo(0, l.size / 2);
            ctx.lineTo(-l.size / 3, 0);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
        ctx.globalAlpha = 1;
    }

    #drawParticles(ctx) {
        // Firefly-style particles with glow
        ctx.globalCompositeOperation = 'lighter';
        for (const p of this.#particles) {
            const color = `hsla(${p.hue}, ${p.saturation}%, ${p.lightness}%, ${p.alpha})`;
            
            // Glow
            const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
            grd.addColorStop(0, color);
            grd.addColorStop(0.5, `hsla(${p.hue}, ${p.saturation}%, ${p.lightness}%, ${p.alpha * 0.3})`);
            grd.addColorStop(1, 'transparent');
            ctx.fillStyle = grd;
            ctx.fillRect(p.x - p.size * 4, p.y - p.size * 4, p.size * 8, p.size * 8);
            
            // Core
            ctx.fillStyle = `hsla(${p.hue}, 50%, 90%, ${p.alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
    }

    #drawIntro(ctx) {
        const introP = this.#age / 500;
        const centerX = this.#width / 2;
        const centerY = this.#height / 2;

        // Magic circle forming
        const circleRadius = 100 + introP * 50;
        const segments = 24;
        
        for (let i = 0; i < segments; i++) {
            const angle = (Math.PI * 2 * i) / segments + this.#age * 0.002;
            const x = centerX + Math.cos(angle) * circleRadius * introP;
            const y = centerY + Math.sin(angle) * circleRadius * introP;
            
            ctx.globalAlpha = introP * 0.8;
            ctx.fillStyle = i % 2 === 0 ? '#00ffff' : '#ff00ff';
            ctx.fillRect(this.#px(x), this.#px(y), PX * 2, PX * 2);
        }

        // Inner converging particles
        for (let i = 0; i < 16; i++) {
            const angle = (Math.PI * 2 * i) / 16 - this.#age * 0.003;
            const dist = 150 * (1 - introP);
            const x = centerX + Math.cos(angle) * dist;
            const y = centerY + Math.sin(angle) * dist;
            
            ctx.globalAlpha = introP;
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(this.#px(x), this.#px(y), PX, PX);
        }

        // Central glow
        ctx.globalAlpha = introP * 0.5;
        ctx.fillStyle = '#ffffff';
        const glowSize = 10 + introP * 20;
        ctx.fillRect(this.#px(centerX - glowSize/2), this.#px(centerY - glowSize/2), glowSize, glowSize);
    }

    #drawTitle(ctx) {
        if (!this.#font || !this.#font.loaded) return;

        const fantasyY = this.#height * 0.35;
        const anarchyY = this.#height * 0.55;

        // Draw FANTASY characters one by one
        let fantasyX = (this.#width - this.#font.measureText('FANTASY', 3)) / 2;
        for (const char of this.#fantasyChars) {
            if (char.alpha > 0 && char.scale > 0) {
                // Glow
                ctx.globalAlpha = char.alpha * 0.4;
                for (let i = 0; i < 4; i++) {
                    const angle = (Math.PI * 2 * i) / 4;
                    this.#font.drawText(ctx, char.char, 
                        fantasyX + Math.cos(angle) * 3, 
                        fantasyY + char.offsetY + Math.sin(angle) * 3, 
                        { scale: char.scale, align: 'left', alpha: 0.3 }
                    );
                }
                
                // Main character
                ctx.globalAlpha = 1;
                this.#font.drawText(ctx, char.char, fantasyX, fantasyY + char.offsetY, {
                    scale: char.scale,
                    align: 'left',
                    alpha: char.alpha
                });
            }
            fantasyX += this.#font.measureText(char.char, 3) + 6;
        }

        // Draw ANARCHY characters one by one
        let anarchyX = (this.#width - this.#font.measureText('ANARCHY', 3)) / 2;
        for (const char of this.#anarchyChars) {
            if (char.alpha > 0 && char.scale > 0) {
                // Glow
                ctx.globalAlpha = char.alpha * 0.4;
                for (let i = 0; i < 4; i++) {
                    const angle = (Math.PI * 2 * i) / 4;
                    this.#font.drawText(ctx, char.char, 
                        anarchyX + Math.cos(angle) * 3, 
                        anarchyY + char.offsetY + Math.sin(angle) * 3, 
                        { scale: char.scale, align: 'left', alpha: 0.3 }
                    );
                }
                
                // Main character
                ctx.globalAlpha = 1;
                this.#font.drawText(ctx, char.char, anarchyX, anarchyY + char.offsetY, {
                    scale: char.scale,
                    align: 'left',
                    alpha: char.alpha
                });
            }
            anarchyX += this.#font.measureText(char.char, 3) + 6;
        }
    }

    #drawSparks(ctx) {
        for (const s of this.#sparks) {
            const lifeRatio = s.life / 800;
            ctx.globalAlpha = lifeRatio;
            ctx.fillStyle = s.color;
            ctx.fillRect(this.#px(s.x), this.#px(s.y), s.size, s.size);
            
            // Trail
            ctx.globalAlpha = lifeRatio * 0.5;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(this.#px(s.x - s.vx * 0.5), this.#px(s.y - s.vy * 0.5), PX, PX);
        }
    }

    #drawFlash(ctx) {
        const flashAge = this.#age - 3200;
        const flashP = Math.max(0, Math.min(1, flashAge / 1000));
        
        const intensity = flashP < 0.15 ? flashP / 0.15 : 1 - (flashP - 0.15) / 0.85;
        
        ctx.globalAlpha = intensity * 0.85;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, this.#width, this.#height);

        // Expanding magic rings
        const ringRadius = Math.max(0, flashP * 600);
        ctx.globalAlpha = (1 - flashP) * 0.6;
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = PX * 2;
        ctx.beginPath();
        ctx.arc(this.#width / 2, this.#height / 2, ringRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#ff00ff';
        ctx.beginPath();
        ctx.arc(this.#width / 2, this.#height / 2, Math.max(0, ringRadius * 0.6), 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.strokeStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(this.#width / 2, this.#height / 2, Math.max(0, ringRadius * 0.3), 0, Math.PI * 2);
        ctx.stroke();
    }

    #drawSkipHint(ctx) {
        if (!this.#font || !this.#font.loaded) return;
        
        const blink = Math.sin(this.#age * 0.005) > 0;
        this.#font.drawText(ctx, 'PRESS SPACE TO SKIP', this.#width / 2, this.#height - 50, {
            scale: 0.8,
            align: 'center',
            alpha: blink ? 0.6 : 0.3
        });
    }
}
