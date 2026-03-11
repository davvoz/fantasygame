import { GameLoop } from './GameLoop.js';
import { InputManager } from '../input/InputManager.js';
import { Renderer } from '../graphics/Renderer.js';
import { Projectile } from '../entities/Projectile.js';
import { Character } from '../entities/Character.js';
import { PowerUp, PowerUpType } from '../entities/PowerUp.js';
import { PixelExplosion } from '../entities/effects/PixelExplosion.js';
import { FloatingLabel } from '../entities/effects/FloatingLabel.js';
import { PowerUpEffect } from '../entities/effects/PowerUpEffect.js';

const BUFF_DURATIONS = {
    [PowerUpType.HEALTH]:        0,   // instant
    [PowerUpType.ATTACK_SPEED]:  8,
    [PowerUpType.POWER]:         8,
    [PowerUpType.TRIPLE_SHOT]:   6,
    [PowerUpType.INVINCIBILITY]: 6,
};

const BUFF_LABELS = {
    [PowerUpType.HEALTH]:        'HEAL +30',
    [PowerUpType.ATTACK_SPEED]:  'SPEED UP!',
    [PowerUpType.POWER]:         'POWER UP!',
    [PowerUpType.TRIPLE_SHOT]:   'TRIPLE!',
    [PowerUpType.INVINCIBILITY]: 'INVINCIBLE!',
};

export class Game {
    #renderer;
    #inputManager;
    #gameLoop;
    #entities = [];
    #hud = null;
    #font = null;
    #spawners = [];
    #crosshair = null;
    #mage = null;
    #collisionMap = null;

    constructor(canvas) {
        this.#renderer = new Renderer(canvas);
        this.#inputManager = new InputManager();
        this.#inputManager.setCanvas(canvas);
        this.#gameLoop = new GameLoop((dt) => this.#loop(dt));
    }

    get renderer() { return this.#renderer; }
    get inputManager() { return this.#inputManager; }

    set hud(h) { this.#hud = h; }
    set font(f) { this.#font = f; }
    set crosshair(c) { this.#crosshair = c; }
    set mage(m) { this.#mage = m; }
    get mage() { return this.#mage; }
    set collisionMap(cm) { this.#collisionMap = cm; }

    /**
     * Register a spawner: when the watched entity dies, callback fires after a delay.
     * @param {function(): boolean} isDead - returns true when the entity is dead
     * @param {function(): void} onSpawn - called to spawn a replacement
     * @param {number} delay - ms before respawn
     */
    addSpawner(isDead, onSpawn, delay = 2000) {
        this.#spawners.push({ isDead, onSpawn, delay, timer: 0, waiting: false, spawning: false });
    }

    addEntity(entity) {
        this.#entities.push(entity);
    }

    /**
     * Insert entity at the beginning of the entity list.
     * Useful for background/environment entities that should render behind everything.
     * @param {Entity} entity 
     */
    insertEntityAtStart(entity) {
        this.#entities.unshift(entity);
    }

    removeEntity(entity) {
        const idx = this.#entities.indexOf(entity);
        if (idx !== -1) this.#entities.splice(idx, 1);
    }

    start() {
        this.#gameLoop.start();
    }

    stop() {
        this.#gameLoop.stop();
    }

    #loop(deltaTime) {
        this.#update(deltaTime);
        this.#render();
    }

    #update(deltaTime) {
        const toAdd = [];

        for (const entity of this.#entities) {
            entity.update(deltaTime, this.#inputManager);

            // Collect spawned entities from characters
            if (typeof entity.drainSpawnQueue === 'function') {
                toAdd.push(...entity.drainSpawnQueue());
            }
        }

        // Add newly spawned entities
        for (const e of toAdd) this.#entities.push(e);

        // Projectile–Character collisions
        this.#checkProjectileHits();

        // Power-up pickup
        this.#checkPowerUpPickups();

        // Remove dead entities (projectiles, etc.)
        this.#entities = this.#entities.filter(e => e.alive !== false);

        // Spawners
        for (const s of this.#spawners) {
            if (!s.waiting && !s.spawning && s.isDead()) {
                s.waiting = true;
                s.timer = 0;
            }
            if (s.waiting && !s.spawning) {
                s.timer += deltaTime;
                if (s.timer >= (typeof s.delay === 'function' ? s.delay() : s.delay)) {
                    s.waiting = false;
                    s.spawning = true;
                    Promise.resolve(s.onSpawn()).then(() => { s.spawning = false; });
                }
            }
        }
    }

    #checkProjectileHits() {
        const projectiles = this.#entities.filter(e => e instanceof Projectile && e.alive);
        const characters  = this.#entities.filter(e => e instanceof Character);

        for (const p of projectiles) {
            for (const c of characters) {
                if (c === p.owner) continue;
                // Broad phase: AABB on the full sprite bounds
                if (!this.#aabb(p, c)) continue;
                // Narrow phase: pixel-perfect test
                if (!this.#pixelHit(p, c)) continue;

                // Block only if facing the projectile
                if (c.isBlocking) {
                    const facingLeft = c.direction === 'LEFT';
                    const comingFromLeft = p.vx > 0;
                    if ((facingLeft && comingFromLeft) || (!facingLeft && !comingFromLeft)) {
                        p.reflect(c);
                        if (this.#font) {
                            const hr = c.getHitRect();
                            this.#entities.push(new FloatingLabel(
                                'BLOCK!', hr.x + hr.width / 2, hr.y, this.#font, { scale: 0.7 }
                            ));
                        }
                        break;
                    }
                }

                // Explosion at impact point
                const hitX = p.x + p.width / 2;
                const hitY = p.y + p.height / 2;
                this.#entities.push(new PixelExplosion(hitX, hitY));

                p.kill();
                if (typeof c.takeDamage === 'function') {
                    // Invincibility: absorb hit, show label, no damage
                    if (typeof c.hasBuff === 'function' && c.hasBuff(PowerUpType.INVINCIBILITY)) {
                        if (this.#font) {
                            const hr = c.getHitRect();
                            this.#entities.push(new FloatingLabel(
                                'IMMUNE!', hr.x + hr.width / 2, hr.y, this.#font, { scale: 0.6 }
                            ));
                        }
                        break;
                    }
                    const dmg = p.damage ?? 10;
                    c.takeDamage(dmg);
                    if (this.#font) {
                        const hr = c.getHitRect();
                        this.#entities.push(new FloatingLabel(
                            `-${dmg}`, hr.x + hr.width / 2, hr.y, this.#font, { scale: 0.6 }
                        ));
                    }
                    // Spawn a power-up where the character died
                    if (!c.alive && c !== this.#mage) {
                        const pu = new PowerUp(
                            c.x + c.width / 2 - 15,
                            c.y + c.height * 0.3,
                            PowerUp.randomType(),
                            this.#collisionMap
                        );
                        this.#entities.push(pu);
                    }
                }
                break;
            }
        }
    }

    #aabb(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }

    /** Sample a grid of points inside the projectile and check character pixels. */
    #pixelHit(projectile, character) {
        if (typeof character.hitsPixel !== 'function') return true;
        const steps = 3;
        for (let i = 0; i <= steps; i++) {
            for (let j = 0; j <= steps; j++) {
                const px = projectile.x + (projectile.width * i) / steps;
                const py = projectile.y + (projectile.height * j) / steps;
                if (character.hitsPixel(px, py)) return true;
            }
        }
        return false;
    }

    #checkPowerUpPickups() {
        if (!this.#mage || !this.#mage.alive) return;
        const mageRect = this.#mage.getHitRect();

        for (const e of this.#entities) {
            if (!(e instanceof PowerUp) || !e.alive) continue;
            if (!this.#aabb(mageRect, e)) continue;

            e.kill();
            const type = e.type;
            const duration = BUFF_DURATIONS[type];

            if (type === PowerUpType.HEALTH) {
                this.#mage.hp = Math.min(this.#mage.hp + 30, this.#mage.maxHp);
            } else {
                this.#mage.addBuff(type, duration);
            }

            // Dramatic power-up effect
            const hr = this.#mage.getHitRect();
            const effectX = hr.x + hr.width / 2;
            const effectY = hr.y + hr.height / 2;
            this.#entities.push(new PowerUpEffect(effectX, effectY, type));

            // Floating label
            if (this.#font) {
                this.#entities.push(new FloatingLabel(
                    BUFF_LABELS[type], effectX, hr.y - 10, this.#font, { scale: 0.8 }
                ));
            }
        }
    }

    #render() {
        this.#renderer.clear();
        for (const entity of this.#entities) {
            entity.draw(this.#renderer.ctx);
        }
        // Debug: draw heightmap lines
        //if (this.#collisionMap) {
          //  this.#collisionMap.debugDraw(this.#renderer.ctx);
       // }
        if (this.#hud) this.#hud.draw(this.#renderer.ctx);
        if (this.#crosshair) this.#crosshair.draw(this.#renderer.ctx);
    }
}
