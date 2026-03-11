import { Entity } from './Entity.js';
import { Animator } from '../graphics/Animator.js';
import { StateMachine } from '../states/StateMachine.js';
import { Direction } from './Direction.js';

/**
 * A Character is an Entity that has:
 *  - an Animator  (plays sprite animations)
 *  - a StateMachine (drives behaviour based on input)
 *  - a facing Direction
 */
export class Character extends Entity {
    #animator;
    #stateMachine;
    #direction;
    #speed;
    #spawnQueue = [];
    #collisionMap = null;
    #velocityY = 0;
    #airborne = false;
    #hitbox = { offsetX: 0, offsetY: 0, w: 1, h: 1 }; // fractions of width/height
    #hp;
    #maxHp;
    #font = null;
    #buffs = new Map(); // PowerUpType -> remaining seconds

    constructor({ x = 0, y = 0, width = 128, height = 128, speed = 200, hp = 100 } = {}) {
        super(x, y, width, height);
        this.#animator = new Animator();
        this.#stateMachine = new StateMachine();
        this.#direction = Direction.RIGHT;
        this.#speed = speed;
        this.#hp = hp;
        this.#maxHp = hp;
    }

    get animator() { return this.#animator; }
    get stateMachine() { return this.#stateMachine; }
    get direction() { return this.#direction; }
    set direction(d) { this.#direction = d; }
    get speed() { return this.#speed; }
    get collisionMap() { return this.#collisionMap; }
    set collisionMap(map) { this.#collisionMap = map; }
    get velocityY() { return this.#velocityY; }
    set velocityY(v) { this.#velocityY = v; }
    get airborne() { return this.#airborne; }
    set airborne(v) { this.#airborne = v; }

    get hp() { return this.#hp; }
    set hp(v) { this.#hp = Math.max(0, v); }
    get maxHp() { return this.#maxHp; }

    get font() { return this.#font; }
    set font(f) { this.#font = f; }

    /** Hitbox as { offsetX, offsetY, w, h } — fractions of entity width/height */
    get hitbox() { return this.#hitbox; }
    set hitbox(hb) { this.#hitbox = hb; }

    /** Returns the absolute hitbox rect { x, y, width, height } */
    getHitRect() {
        return {
            x: this.x + this.#hitbox.offsetX * this.width,
            y: this.y + this.#hitbox.offsetY * this.height,
            width: this.#hitbox.w * this.width,
            height: this.#hitbox.h * this.height,
        };
    }

    /** Pixel-perfect hit test: is the sprite opaque at world coords (wx, wy)? */
    hitsPixel(wx, wy) {
        const fracX = (wx - this.x) / this.width;
        const fracY = (wy - this.y) / this.height;
        if (fracX < 0 || fracX >= 1 || fracY < 0 || fracY >= 1) return false;
        return this.#animator.isOpaqueAt(fracX, fracY);
    }

    spawn(entity) {
        this.#spawnQueue.push(entity);
    }

    drainSpawnQueue() {
        const queue = this.#spawnQueue;
        this.#spawnQueue = [];
        return queue;
    }

    update(deltaTime, inputManager) {
        // During spawn: only update animator for IDLE animation, freeze everything else
        if (this.spawning) {
            this.#animator.update(deltaTime);
            return;
        }
        this.#updateBuffs(deltaTime);
        this.#stateMachine.update(deltaTime, inputManager);
        this.#animator.update(deltaTime);
        this.#snapToGround();
    }

    #snapToGround() {
        if (!this.#collisionMap || this.#airborne) return;
        const feetX = this.x + this.width / 2;
        const feetY = this.y + this.height;
        const groundY = this.#collisionMap.getGroundY(feetX, feetY);
        this.y = groundY - this.height;
    }

    /** Public ground snap — call from subclass overrides of update(). */
    snapToGround() {
        this.#snapToGround();
    }

    getGroundY() {
        if (!this.#collisionMap) return this.y + this.height;
        const feetX = this.x + this.width / 2;
        const feetY = this.y + this.height;
        return this.#collisionMap.getGroundY(feetX, feetY);
    }

    takeDamage(amount = 10) {
        this.#hp = Math.max(0, this.#hp - amount);
        this.#stateMachine.transition('takeDamage');
    }

    get alive() { return this.#hp > 0; }

    /** True when the character is in a blocking state. */
    get isBlocking() {
        return this.#stateMachine.currentName === 'block';
    }

    // ── Buff system ──────────────────────────────────────────
    addBuff(type, duration) {
        this.#buffs.set(type, duration);
    }

    hasBuff(type) {
        return this.#buffs.has(type);
    }

    getBuffTimer(type) {
        return this.#buffs.get(type) ?? 0;
    }

    get activeBuffs() {
        return this.#buffs;
    }

    #updateBuffs(dt) {
        const sec = dt / 1000;
        for (const [type, remaining] of this.#buffs) {
            const t = remaining - sec;
            if (t <= 0) this.#buffs.delete(type);
            else this.#buffs.set(type, t);
        }
    }

    draw(ctx) {
        // Don't draw while spawning (spawn effect active)
        if (this.spawning) return;

        // Draw buff aura if any buffs are active
        if (this.#buffs.size > 0) {
            this.#drawBuffAura(ctx);
        }

        this.#animator.draw(ctx, this.x, this.y, this.width, this.height);
    }

    #drawBuffAura(ctx) {
        const AURA_COLORS = {
            'ATTACK_SPEED':   '#ffe033',
            'POWER':          '#ff4444',
            'TRIPLE_SHOT':    '#44aaff',
            'INVINCIBILITY':  '#ffcc00',
        };

        // Get color from first active buff
        let color = '#ffffff';
        for (const [type] of this.#buffs) {
            if (AURA_COLORS[type]) {
                color = AURA_COLORS[type];
                break;
            }
        }

        const time = performance.now() / 1000;
        const cx = this.x + this.width / 2;
        const feetY = this.y + this.height;

        ctx.save();

        // Subtle glowing ellipse at feet
        const pulse = 0.7 + 0.3 * Math.sin(time * 4);
        const ellipseW = this.width * 0.5;
        const ellipseH = 8;

        ctx.globalAlpha = 0.4 * pulse;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(cx, feetY - 4, ellipseW, ellipseH, 0, 0, Math.PI * 2);
        ctx.fill();

        // 4 small sparkles orbiting the character
        ctx.globalAlpha = 0.8;
        const orbitRadius = this.width * 0.55;
        for (let i = 0; i < 4; i++) {
            const angle = time * 2 + (i * Math.PI / 2);
            const sparkX = cx + Math.cos(angle) * orbitRadius;
            const sparkY = this.y + this.height * 0.5 + Math.sin(angle * 2) * 15;
            const sparkSize = 2 + Math.sin(time * 8 + i) * 1;

            ctx.fillStyle = color;
            ctx.fillRect(sparkX - sparkSize / 2, sparkY - sparkSize / 2, sparkSize, sparkSize);
        }

        ctx.restore();
    }
}
