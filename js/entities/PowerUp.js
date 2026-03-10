import { Entity } from './Entity.js';

/**
 * Power-up types
 */
export const PowerUpType = Object.freeze({
    HEALTH:         'HEALTH',
    ATTACK_SPEED:   'ATTACK_SPEED',
    POWER:          'POWER',
    TRIPLE_SHOT:    'TRIPLE_SHOT',
    INVINCIBILITY:  'INVINCIBILITY',
});

// ── Physics ──────────────────────────────────────────────
const GRAVITY    = 650;
const BOUNCE     = 0.55;
const FRICTION   = 0.85;
const MIN_VY     = 30;
const KICK_VX    = 60;
const SIZE       = 48;

// ── Pixel-art rendering ──────────────────────────────────
const PX = 3;  // each "pixel" is 3×3 screen pixels (chunky 16-bit feel)

// 0 = transparent, 1 = outline, 2 = dark shade, 3 = main, 4 = highlight, 5 = white specular
const PALETTES = {
    [PowerUpType.HEALTH]:        { 1: '#0a4a00', 2: '#0d7a00', 3: '#39ff14', 4: '#88ff66', 5: '#ccffcc' },
    [PowerUpType.ATTACK_SPEED]:  { 1: '#6a4a00', 2: '#b89500', 3: '#ffe033', 4: '#fff28a', 5: '#fffde0' },
    [PowerUpType.POWER]:         { 1: '#550000', 2: '#991111', 3: '#ff4444', 4: '#ff8888', 5: '#ffcccc' },
    [PowerUpType.TRIPLE_SHOT]:   { 1: '#002a55', 2: '#0e5599', 3: '#44aaff', 4: '#88ccff', 5: '#d0eeff' },
    [PowerUpType.INVINCIBILITY]: { 1: '#5a3a00', 2: '#aa7700', 3: '#ffcc00', 4: '#ffee66', 5: '#fffacc' },
};

// ── Pixel-art sprites (16×16 grids) ─────────────────────
// HEALTH: big chunky heart with shading
const HEART = [
    [0,0,0,1,1,1,0,0,0,1,1,1,0,0,0,0],
    [0,0,1,4,5,4,1,0,1,4,5,4,1,0,0,0],
    [0,1,4,5,4,3,3,1,3,3,5,4,4,1,0,0],
    [0,1,5,4,3,3,3,3,3,3,3,4,5,1,0,0],
    [1,4,4,3,3,3,3,3,3,3,3,3,4,4,1,0],
    [1,4,3,3,3,3,3,3,3,3,3,3,3,4,1,0],
    [1,3,3,3,3,3,3,3,3,3,3,3,3,3,1,0],
    [1,3,3,3,3,3,3,3,3,3,3,3,3,3,1,0],
    [0,1,3,3,3,3,3,3,3,3,3,3,3,1,0,0],
    [0,1,2,3,3,3,3,3,3,3,3,3,2,1,0,0],
    [0,0,1,2,3,3,3,3,3,3,3,2,1,0,0,0],
    [0,0,0,1,2,3,3,3,3,3,2,1,0,0,0,0],
    [0,0,0,0,1,2,3,3,3,2,1,0,0,0,0,0],
    [0,0,0,0,0,1,2,3,2,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,2,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0],
];

// ATTACK_SPEED: detailed lightning bolt
const BOLT = [
    [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
    [0,0,0,0,0,1,4,5,4,1,0,0,0,0,0,0],
    [0,0,0,0,1,4,5,4,3,1,0,0,0,0,0,0],
    [0,0,0,1,4,5,4,3,3,1,0,0,0,0,0,0],
    [0,0,1,4,5,4,3,3,1,0,0,0,0,0,0,0],
    [0,1,4,5,4,3,3,3,1,0,0,0,0,0,0,0],
    [1,4,5,4,3,3,3,3,3,1,1,1,1,0,0,0],
    [1,5,4,3,3,3,3,3,3,3,5,4,4,1,0,0],
    [1,1,1,1,1,3,3,3,3,5,4,3,4,1,0,0],
    [0,0,0,0,1,3,3,3,5,4,3,3,1,0,0,0],
    [0,0,0,0,1,2,3,3,4,3,3,2,1,0,0,0],
    [0,0,0,0,0,1,2,3,3,3,2,1,0,0,0,0],
    [0,0,0,0,0,0,1,2,3,2,1,0,0,0,0,0],
    [0,0,0,0,0,0,0,1,3,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,1,2,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
];

// POWER: big detailed flame
const FLAME = [
    [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,4,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,1,5,4,1,0,0,1,0,0,0,0],
    [0,0,0,0,0,1,5,4,3,1,1,4,1,0,0,0],
    [0,0,0,0,1,4,5,5,3,3,4,4,1,0,0,0],
    [0,0,0,1,4,5,5,5,4,3,3,4,1,0,0,0],
    [0,0,0,1,4,5,5,5,4,3,3,3,3,1,0,0],
    [0,0,1,4,5,5,5,4,4,3,3,3,3,1,0,0],
    [0,0,1,3,4,5,5,4,3,3,3,3,3,1,0,0],
    [0,1,3,3,4,5,4,3,3,3,3,3,2,1,0,0],
    [0,1,3,3,3,4,4,3,3,3,3,2,2,1,0,0],
    [0,1,2,3,3,3,3,3,3,3,2,2,2,1,0,0],
    [0,0,1,2,3,3,3,3,3,2,2,2,1,0,0,0],
    [0,0,0,1,2,2,3,3,2,2,2,1,0,0,0,0],
    [0,0,0,0,1,1,2,2,2,1,1,0,0,0,0,0],
    [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0],
];

// TRIPLE_SHOT: three crystal arrows
const ARROWS = [
    [0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,1,4,1,0,0,0,0,0,0,0,0,0,0,0],
    [0,1,5,4,3,1,1,1,1,1,1,1,0,0,0,0],
    [1,5,4,3,3,3,3,3,2,2,2,1,0,0,0,0],
    [0,1,5,4,3,1,1,1,1,1,1,1,0,0,0,0],
    [0,0,1,4,1,0,0,0,1,0,0,0,0,0,0,0],
    [0,0,0,1,0,0,0,1,4,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,5,4,3,1,1,1,1,1,0],
    [0,0,0,0,0,1,5,4,3,3,3,3,2,2,1,0],
    [0,0,0,0,0,0,1,5,4,3,1,1,1,1,1,0],
    [0,0,0,0,0,0,0,1,4,1,0,1,0,0,0,0],
    [0,0,0,0,0,0,0,0,1,0,1,4,1,0,0,0],
    [0,0,0,0,0,0,0,0,0,1,5,4,3,1,1,1],
    [0,0,0,0,0,0,0,0,1,5,4,3,3,3,2,1],
    [0,0,0,0,0,0,0,0,0,1,5,4,3,1,1,1],
    [0,0,0,0,0,0,0,0,0,0,1,4,1,0,0,0],
];

// INVINCIBILITY: ornate shield with star
const SHIELD = [
    [0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,0,1,4,5,5,5,5,5,4,1,0,0,0,0],
    [0,0,1,4,5,4,4,5,4,4,5,4,1,0,0,0],
    [0,1,4,4,4,3,3,4,3,3,4,4,4,1,0,0],
    [0,1,4,3,3,3,5,3,5,3,3,3,4,1,0,0],
    [0,1,3,3,3,5,5,5,5,5,3,3,3,1,0,0],
    [0,1,3,3,5,5,5,5,5,5,5,3,3,1,0,0],
    [0,1,3,3,3,5,5,5,5,5,3,3,3,1,0,0],
    [0,1,3,3,3,3,5,3,5,3,3,3,3,1,0,0],
    [0,1,3,3,3,3,3,3,3,3,3,3,3,1,0,0],
    [0,0,1,2,3,3,3,3,3,3,3,2,1,0,0,0],
    [0,0,1,2,2,3,3,3,3,3,2,2,1,0,0,0],
    [0,0,0,1,2,2,3,3,3,2,2,1,0,0,0,0],
    [0,0,0,0,1,2,2,3,2,2,1,0,0,0,0,0],
    [0,0,0,0,0,1,2,2,2,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0],
];

const SPRITES = {
    [PowerUpType.HEALTH]:        HEART,
    [PowerUpType.ATTACK_SPEED]:  BOLT,
    [PowerUpType.POWER]:         FLAME,
    [PowerUpType.TRIPLE_SHOT]:   ARROWS,
    [PowerUpType.INVINCIBILITY]: SHIELD,
};

/**
 * 16-bit retro pixel-art power-up with bouncing physics.
 */
export class PowerUp extends Entity {
    #type;
    #age = 0;
    #alive = true;
    #vy;
    #vx;
    #grounded = false;
    #collisionMap = null;
    #flashFrame = 0;
    #sparkles = [];

    constructor(x, y, type, collisionMap = null) {
        super(x, y, SIZE, SIZE);
        this.#type = type;
        this.#collisionMap = collisionMap;
        this.#vy = -(200 + Math.random() * 120);
        this.#vx = (Math.random() - 0.5) * KICK_VX * 2;
        // Pixel sparkle particles — more and bigger for chunky sprites
        for (let i = 0; i < 6; i++) {
            this.#sparkles.push({
                angle: (Math.PI * 2 * i) / 6,
                dist: 28 + Math.random() * 8,
                speed: 1.0 + Math.random() * 1.2,
                phase: Math.random() * Math.PI * 2,
            });
        }
    }

    get type() { return this.#type; }
    get alive() { return this.#alive; }

    kill() { this.#alive = false; }

    update(deltaTime) {
        const dt = deltaTime / 1000;
        this.#age += dt;
        // Classic 16-bit flash cycle: every ~120ms toggle
        this.#flashFrame = Math.floor(this.#age * 8) % 4;

        if (!this.#grounded) {
            this.#vy += GRAVITY * dt;
            this.y += this.#vy * dt;
            this.x += this.#vx * dt;

            const footX = this.x + this.width / 2;
            const groundY = this.#collisionMap
                ? this.#collisionMap.getGroundY(footX) - this.height
                : 540 - this.height;
            if (this.y >= groundY) {
                this.y = groundY;
                if (Math.abs(this.#vy) < MIN_VY) {
                    this.#grounded = true;
                    this.#vy = 0;
                    this.#vx = 0;
                } else {
                    this.#vy = -Math.abs(this.#vy) * BOUNCE;
                    this.#vx *= FRICTION;
                }
            }
        }
    }

    draw(ctx) {
        if (!this.#alive) return;

        const pal = PALETTES[this.#type];
        const sprite = SPRITES[this.#type];
        const cx = Math.round(this.x + this.width / 2);
        const baseY = Math.round(this.y + this.height / 2);
        // Gentle pixel bob when grounded (snap to PX grid)
        const bobOff = this.#grounded
            ? Math.round(Math.sin(this.#age * 2.5) * 3 / PX) * PX
            : 0;
        const bobY = baseY + bobOff;
        const t = this.#age;
        const flash = this.#flashFrame;

        ctx.save();
        ctx.imageSmoothingEnabled = false;

        // ── 1. Pixel shadow on ground ──
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = '#000';
        const shadowW = 14 * PX;
        const shadowH = 2 * PX;
        const shadowY = this.#grounded
            ? bobY + 26
            : Math.round(this.y + this.height) + 4;
        ctx.fillRect(cx - shadowW / 2, shadowY, shadowW, shadowH);
        ctx.globalAlpha = 1;

        // ── 2. Orbiting pixel sparkles (retro cross pattern) ──
        for (const sp of this.#sparkles) {
            const a = sp.angle + t * sp.speed;
            const d = sp.dist + Math.sin(t * 3 + sp.phase) * 4;
            const sx = Math.round((cx + Math.cos(a) * d) / PX) * PX;
            const sy = Math.round((bobY + Math.sin(a) * d * 0.5) / PX) * PX;
            // Blinking: skip every other frame for each sparkle
            const visible = (flash + Math.floor(sp.phase * 2)) % 3 !== 0;
            if (visible) {
                ctx.fillStyle = pal[5]; // white center
                ctx.fillRect(sx, sy, PX, PX);
                // Cross arms (bigger)
                ctx.fillStyle = pal[4]; // highlight
                ctx.fillRect(sx - PX, sy, PX, PX);
                ctx.fillRect(sx + PX, sy, PX, PX);
                ctx.fillRect(sx, sy - PX, PX, PX);
                ctx.fillRect(sx, sy + PX, PX, PX);
                // Outer tips
                ctx.fillStyle = pal[3];
                ctx.fillRect(sx - PX * 2, sy, PX, PX);
                ctx.fillRect(sx + PX * 2, sy, PX, PX);
            }
        }

        // ── 3. Draw the pixel-art sprite ──
        const sprW = sprite[0].length * PX;
        const sprH = sprite.length * PX;
        const startX = cx - Math.round(sprW / 2);
        const startY = bobY - Math.round(sprH / 2);

        // Flash effect: on flash frames 0 & 2, draw normally;
        // on frame 1, boost brightness; on frame 3, use highlight palette
        for (let row = 0; row < sprite.length; row++) {
            for (let col = 0; col < sprite[row].length; col++) {
                const v = sprite[row][col];
                if (v === 0) continue;

                let colorIdx = v;
                // Classic SNES white-flash on frame 1
                if (flash === 1 && v >= 2) {
                    colorIdx = Math.min(v + 1, 5);
                }

                ctx.fillStyle = pal[colorIdx];
                ctx.fillRect(startX + col * PX, startY + row * PX, PX, PX);
            }
        }

        // ── 4. Animated specular twinkle (traveling highlight) ──
        // Multiple white pixels that sweep across the sprite (retro shine)
        const twinkleCols = [
            (Math.floor(t * 8) % 12) + 2,
            (Math.floor(t * 8 + 4) % 12) + 2,
        ];
        for (const twinkleCol of twinkleCols) {
            for (let row = 1; row < 4; row++) {
                if (twinkleCol < sprite[0].length && sprite[row] && sprite[row][twinkleCol] > 1) {
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(startX + twinkleCol * PX, startY + row * PX, PX, PX);
                }
            }
        }

        ctx.restore();
    }

    /** Pick a random power-up type */
    static randomType() {
        const types = Object.values(PowerUpType);
        return types[Math.floor(Math.random() * types.length)];
    }
}
