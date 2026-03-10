import { Entity } from '../Entity.js';
import { PowerUpType } from '../PowerUp.js';

const PX = 3;

// Colors for each power-up type
const COLORS = {
    [PowerUpType.HEALTH]:        { main: '#39ff14', light: '#88ff66', dark: '#0d7a00' },
    [PowerUpType.ATTACK_SPEED]:  { main: '#ffe033', light: '#fff28a', dark: '#b89500' },
    [PowerUpType.POWER]:         { main: '#ff4444', light: '#ff8888', dark: '#991111' },
    [PowerUpType.TRIPLE_SHOT]:   { main: '#44aaff', light: '#88ccff', dark: '#0e5599' },
    [PowerUpType.INVINCIBILITY]: { main: '#ffcc00', light: '#ffee66', dark: '#aa7700' },
};

// Symbols for each type
const SYMBOLS = {
    [PowerUpType.HEALTH]:        '♥',
    [PowerUpType.ATTACK_SPEED]:  '⚡',
    [PowerUpType.POWER]:         '🔥',
    [PowerUpType.TRIPLE_SHOT]:   '⋯',
    [PowerUpType.INVINCIBILITY]: '★',
};

/**
 * Dramatic power-up pickup effect with particles, rings, and symbols
 */
export class PowerUpEffect extends Entity {
    #alive = true;
    #age = 0;
    #lifetime = 1200;
    #type;
    #colors;
    #symbol;
    
    // Effect elements
    #particles = [];
    #rings = [];
    #sparks = [];
    #floatingSymbols = [];

    constructor(x, y, type) {
        super(x - 60, y - 60, 120, 120);
        this.centerX = x;
        this.centerY = y;
        this.#type = type;
        this.#colors = COLORS[type] || COLORS[PowerUpType.HEALTH];
        this.#symbol = SYMBOLS[type] || '✦';
        
        this.#initParticles();
        this.#initRings();
        this.#initSparks();
        this.#initFloatingSymbols();
    }

    get alive() { return this.#alive; }

    #initParticles() {
        // Burst of particles outward
        for (let i = 0; i < 24; i++) {
            const angle = (Math.PI * 2 * i) / 24 + Math.random() * 0.3;
            const speed = 80 + Math.random() * 120;
            this.#particles.push({
                x: this.centerX,
                y: this.centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: PX + Math.floor(Math.random() * 2) * PX,
                life: 800 + Math.random() * 400,
                maxLife: 800 + Math.random() * 400,
                color: Math.random() > 0.5 ? this.#colors.main : this.#colors.light,
            });
        }
    }

    #initRings() {
        // Expanding rings
        for (let i = 0; i < 3; i++) {
            this.#rings.push({
                radius: 0,
                maxRadius: 80 + i * 30,
                delay: i * 150,
                thickness: PX * 2,
                alpha: 1,
            });
        }
    }

    #initSparks() {
        // Rising sparks
        for (let i = 0; i < 16; i++) {
            this.#sparks.push({
                x: this.centerX + (Math.random() - 0.5) * 40,
                y: this.centerY,
                vx: (Math.random() - 0.5) * 30,
                vy: -100 - Math.random() * 150,
                size: PX,
                life: 600 + Math.random() * 400,
                maxLife: 600 + Math.random() * 400,
                delay: Math.random() * 200,
            });
        }
    }

    #initFloatingSymbols() {
        // Floating symbols around pickup point
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI * 2 * i) / 4;
            this.#floatingSymbols.push({
                angle,
                radius: 30,
                alpha: 1,
                scale: 0,
                delay: i * 80,
            });
        }
    }

    #px(v) { return Math.round(v / PX) * PX; }

    update(deltaTime) {
        if (!this.#alive) return;
        this.#age += deltaTime;
        const dt = deltaTime / 1000;

        // Update particles
        for (const p of this.#particles) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vx *= 0.96;
            p.vy *= 0.96;
            p.life -= deltaTime;
        }
        this.#particles = this.#particles.filter(p => p.life > 0);

        // Update rings
        for (const r of this.#rings) {
            if (this.#age < r.delay) continue;
            const ringAge = this.#age - r.delay;
            const t = Math.min(1, ringAge / 400);
            r.radius = t * r.maxRadius;
            r.alpha = 1 - t;
        }

        // Update sparks
        for (const s of this.#sparks) {
            if (this.#age < s.delay) continue;
            s.x += s.vx * dt;
            s.y += s.vy * dt;
            s.vy += 50 * dt; // slight gravity
            s.life -= deltaTime;
        }
        this.#sparks = this.#sparks.filter(s => s.life > 0);

        // Update floating symbols
        for (const f of this.#floatingSymbols) {
            if (this.#age < f.delay) continue;
            const symAge = this.#age - f.delay;
            const t = Math.min(1, symAge / 300);
            f.scale = this.#easeOutBack(t);
            f.radius = 30 + t * 20;
            f.angle += 0.003 * deltaTime;
            
            if (symAge > 600) {
                f.alpha = Math.max(0, 1 - (symAge - 600) / 400);
            }
        }

        if (this.#age >= this.#lifetime) {
            this.#alive = false;
        }
    }

    #easeOutBack(t) {
        const c = 1.7;
        return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
    }

    draw(ctx) {
        if (!this.#alive) return;
        
        ctx.save();
        ctx.imageSmoothingEnabled = false;

        // Draw rings (expanding circles)
        this.#drawRings(ctx);

        // Draw particles
        this.#drawParticles(ctx);

        // Draw sparks
        this.#drawSparks(ctx);

        // Draw floating symbols
        this.#drawFloatingSymbols(ctx);

        // Central flash
        if (this.#age < 200) {
            this.#drawCentralFlash(ctx);
        }

        ctx.restore();
    }

    #drawRings(ctx) {
        for (const r of this.#rings) {
            if (r.alpha <= 0 || r.radius <= 0) continue;
            
            ctx.globalAlpha = r.alpha * 0.6;
            ctx.strokeStyle = this.#colors.main;
            ctx.lineWidth = r.thickness;
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, r.radius, 0, Math.PI * 2);
            ctx.stroke();

            // Inner glow ring
            ctx.globalAlpha = r.alpha * 0.3;
            ctx.strokeStyle = this.#colors.light;
            ctx.lineWidth = r.thickness * 2;
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, r.radius, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    #drawParticles(ctx) {
        for (const p of this.#particles) {
            const alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.fillRect(this.#px(p.x), this.#px(p.y), p.size, p.size);
            
            // Glow trail
            ctx.globalAlpha = alpha * 0.4;
            ctx.fillStyle = this.#colors.light;
            ctx.fillRect(this.#px(p.x - p.vx * 0.02), this.#px(p.y - p.vy * 0.02), p.size, p.size);
        }
    }

    #drawSparks(ctx) {
        for (const s of this.#sparks) {
            if (this.#age < s.delay) continue;
            const alpha = s.life / s.maxLife;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.#colors.light;
            ctx.fillRect(this.#px(s.x), this.#px(s.y), s.size, s.size);
            
            // Spark trail
            ctx.globalAlpha = alpha * 0.5;
            ctx.fillRect(this.#px(s.x), this.#px(s.y + 3), s.size, s.size * 2);
        }
    }

    #drawFloatingSymbols(ctx) {
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        for (const f of this.#floatingSymbols) {
            if (f.scale <= 0 || f.alpha <= 0) continue;
            
            const x = this.centerX + Math.cos(f.angle) * f.radius;
            const y = this.centerY + Math.sin(f.angle) * f.radius;
            
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(f.scale, f.scale);
            
            // Glow
            ctx.globalAlpha = f.alpha * 0.5;
            ctx.fillStyle = this.#colors.light;
            ctx.fillText(this.#symbol, 2, 2);
            
            // Main symbol
            ctx.globalAlpha = f.alpha;
            ctx.fillStyle = this.#colors.main;
            ctx.fillText(this.#symbol, 0, 0);
            
            ctx.restore();
        }
    }

    #drawCentralFlash(ctx) {
        const t = this.#age / 200;
        const alpha = 1 - t;
        const size = 20 + t * 40;
        
        // White flash
        ctx.globalAlpha = alpha * 0.8;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, size, 0, Math.PI * 2);
        ctx.fill();

        // Colored inner
        ctx.globalAlpha = alpha * 0.6;
        ctx.fillStyle = this.#colors.light;
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, size * 0.6, 0, Math.PI * 2);
        ctx.fill();
    }
}
