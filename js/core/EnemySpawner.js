import { Bat } from '../entities/characters/Bat.js';
import { Warrior } from '../entities/characters/Warrior.js';
import { Elf } from '../entities/characters/Elf.js';
import { Ken } from '../entities/characters/Ken.js';
import { SpawnEffect } from '../entities/effects/SpawnEffect.js';
import { FloatingLabel } from '../entities/effects/FloatingLabel.js';

const ENEMY_TYPES = [
    { type: 'bat',     weight: 3, color: '#ff5252' },
    { type: 'warrior', weight: 2, color: '#ffaa00' },
    { type: 'elf',     weight: 2, color: '#22d3ee' },
    { type: 'ken',     weight: 1, color: '#ff6600' },
];
const TOTAL_WEIGHT = ENEMY_TYPES.reduce((s, e) => s + e.weight, 0);

export class EnemySpawner {
    #game;
    #font;
    #canvasWidth;

    constructor(game, { canvasWidth, font }) {
        this.#game = game;
        this.#font = font;
        this.#canvasWidth = canvasWidth;
    }

    /** Pick a random enemy type using weighted distribution. */
    pickEnemyType() {
        let r = Math.random() * TOTAL_WEIGHT;
        for (const entry of ENEMY_TYPES) {
            r -= entry.weight;
            if (r <= 0) return entry;
        }
        return ENEMY_TYPES[0];
    }

    /** Pick the side farthest from the mage. */
    #getSpawnSideFarFromMage(leftX, rightX, mage) {
        const mageX = mage.x + 90;
        const distLeft = Math.abs(mageX - leftX);
        const distRight = Math.abs(mageX - rightX);
        return distLeft >= distRight ? leftX : rightX;
    }

    /** Pick a random surface and a valid spawn X on that surface. */
    #pickSpawnSurface(charWidth, collisionMap, mage) {
        const midX = this.#canvasWidth / 2;
        const surfaces = collisionMap.getAllSurfaces(midX);
        if (surfaces.length === 0) {
            return { groundY: 540, side: 80, extent: { minX: 0, maxX: this.#canvasWidth } };
        }
        const groundY = surfaces[Math.floor(Math.random() * surfaces.length)];
        const extent = collisionMap.getLayerExtent(midX, groundY);
        const margin = charWidth + 10;
        const leftSide = extent.minX + 10;
        const rightSide = Math.max(leftSide, extent.maxX - charWidth - 10);
        const leftCenter = leftSide + charWidth / 2;
        const rightCenter = rightSide + charWidth / 2;
        const chosen = this.#getSpawnSideFarFromMage(leftCenter, rightCenter, mage) === leftCenter
            ? leftSide : rightSide;
        return { groundY, side: chosen, extent };
    }

    /** Spawn a Bat enemy with spawn effect. */
    async #spawnBat(mage) {
        const leftSide = 100;
        const rightSide = this.#canvasWidth - 220;
        const side = this.#getSpawnSideFarFromMage(leftSide + 60, rightSide + 60, mage) === leftSide + 60
            ? leftSide : rightSide;
        const spawnY = 80 + Math.random() * 150;
        const b = new Bat({ x: side, y: spawnY });
        b.target = mage;
        await b.init();
        b.spawning = true;
        b.stateMachine.transition('idle');
        const centerX = side + 60;
        const centerY = spawnY + 60;
        const effect = new SpawnEffect(centerX, centerY + 60, {
            color: '#a855f7',
            height: 120,
            onComplete: () => { b.spawning = false; }
        });
        this.#game.addEntity(effect);
        return b;
    }

    /** Create an onAttackHit callback that shows a floating damage label. */
    #makeOnAttackHit() {
        const game = this.#game;
        const font = this.#font;
        return (target, dmg) => {
            if (font) {
                const hr = target.getHitRect();
                game.addEntity(new FloatingLabel(
                    `-${dmg}`, hr.x + hr.width / 2, hr.y, font, { scale: 0.6 }
                ));
            }
        };
    }

    /** Spawn a Warrior enemy with spawn effect. */
    async #spawnWarrior(collisionMap, mage) {
        const { groundY, side, extent } = this.#pickSpawnSurface(160, collisionMap, mage);
        const centerX = side + 80;
        const charY = groundY - 160;
        const w = new Warrior({ x: side, y: charY });
        w.collisionMap = collisionMap;
        w.attackTarget = mage;
        w._onAttackHit = this.#makeOnAttackHit();
        await w.init();
        w.setupPatrol(extent.minX + 10, extent.maxX - 170);
        w.spawning = true;
        w.stateMachine.transition('idle');
        const effect = new SpawnEffect(centerX, groundY, {
            color: '#ffaa00',
            height: 160,
            onComplete: () => { w.spawning = false; }
        });
        this.#game.addEntity(effect);
        return w;
    }

    /** Spawn an Elf enemy with spawn effect. */
    async #spawnElf(collisionMap, mage) {
        const { groundY, side, extent } = this.#pickSpawnSurface(160, collisionMap, mage);
        const centerX = side + 80;
        const charY = groundY - 160;
        const e = new Elf({ x: side, y: charY });
        e.collisionMap = collisionMap;
        e.attackTarget = mage;
        await e.init();
        e.setupPatrol(extent.minX + 10, extent.maxX - 170);
        e.spawning = true;
        e.stateMachine.transition('idle');
        const effect = new SpawnEffect(centerX, groundY, {
            color: '#22d3ee',
            height: 160,
            onComplete: () => { e.spawning = false; }
        });
        this.#game.addEntity(effect);
        return e;
    }

    /** Spawn a Ken enemy with spawn effect. */
    async #spawnKen(collisionMap, mage) {
        const { groundY, side, extent } = this.#pickSpawnSurface(160, collisionMap, mage);
        const centerX = side + 80;
        const charY = groundY - 160;
        const k = new Ken({ x: side, y: charY });
        k.collisionMap = collisionMap;
        k.attackTarget = mage;
        k._onAttackHit = this.#makeOnAttackHit();
        await k.init();
        k.setupPatrol(extent.minX + 10, extent.maxX - 170);
        k.spawning = true;
        k.stateMachine.transition('idle');
        const effect = new SpawnEffect(centerX, groundY, {
            color: '#ff6600',
            height: 160,
            onComplete: () => { k.spawning = false; }
        });
        this.#game.addEntity(effect);
        return k;
    }

    /**
     * Spawn an enemy of the given type.
     * @param {string} type - 'bat' | 'warrior' | 'elf' | 'ken'
     * @param {object} collisionMap
     * @param {object} mage - current mage reference
     * @returns {Promise<object>} spawned enemy entity
     */
    async spawn(type, collisionMap, mage) {
        switch (type) {
            case 'bat':     return this.#spawnBat(mage);
            case 'warrior': return this.#spawnWarrior(collisionMap, mage);
            case 'elf':     return this.#spawnElf(collisionMap, mage);
            case 'ken':     return this.#spawnKen(collisionMap, mage);
            default:        return this.#spawnBat(mage);
        }
    }
}
