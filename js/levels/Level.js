import { Background } from '../entities/Background.js';
import { CollisionMap } from '../physics/CollisionMap.js';
import { AmbientParticles } from '../entities/effects/AmbientParticles.js';
import { FogLayer } from '../entities/effects/FogLayer.js';

/**
 * Represents a single game level with its background, collision map, and ambient effects.
 * 
 * SOLID Principles:
 * - Single Responsibility: Manages only level-specific assets and state
 * - Open/Closed: Extendable for new level types without modification
 * - Dependency Inversion: Depends on abstractions (Entity, CollisionMap interfaces)
 * 
 * @example
 * const level = new Level(levelConfig, canvasWidth, canvasHeight);
 * await level.load();
 * level.getEntities().forEach(e => game.addEntity(e));
 */
export class Level {
    /** @type {import('./LevelConfig.js').LevelDefinition} */
    #config;
    
    /** @type {number} */
    #canvasWidth;
    
    /** @type {number} */
    #canvasHeight;
    
    /** @type {Background|null} */
    #background = null;
    
    /** @type {CollisionMap|null} */
    #collisionMap = null;
    
    /** @type {AmbientParticles|null} */
    #particles = null;
    
    /** @type {FogLayer|null} */
    #fog = null;
    
    /** @type {boolean} */
    #loaded = false;

    /**
     * Create a new Level instance.
     * @param {import('./LevelConfig.js').LevelDefinition} config - Level configuration
     * @param {number} canvasWidth - Canvas width in pixels
     * @param {number} canvasHeight - Canvas height in pixels
     */
    constructor(config, canvasWidth, canvasHeight) {
        if (!config) {
            throw new Error('Level configuration is required');
        }
        this.#config = config;
        this.#canvasWidth = canvasWidth;
        this.#canvasHeight = canvasHeight;
    }

    /**
     * Load all level assets asynchronously.
     * @returns {Promise<void>}
     */
    async load() {
        if (this.#loaded) return;

        // Load background
        this.#background = new Background(
            this.#config.backgroundPath,
            this.#canvasWidth,
            this.#canvasHeight
        );
        await this.#background.load();

        // Load collision map
        this.#collisionMap = new CollisionMap();
        await this.#collisionMap.load(this.#config.heightmapPath);

        // Create ambient particles
        const ambientConfig = this.#config.ambientConfig;
        this.#particles = new AmbientParticles(
            this.#canvasWidth,
            this.#canvasHeight,
            ambientConfig.particleCount
        );

        // Create fog layer if configured
        // Note: FogLayer creates atmospheric drifting fog with leaves
        // The third parameter controls leaf count
        if (ambientConfig.hasFog) {
            const leafCount = Math.round((ambientConfig.fogOpacity || 0.15) * 30);
            this.#fog = new FogLayer(
                this.#canvasWidth,
                this.#canvasHeight,
                leafCount
            );
        }

        this.#loaded = true;
    }

    /**
     * Check if level is fully loaded.
     * @returns {boolean}
     */
    get isLoaded() {
        return this.#loaded;
    }

    /**
     * Get the level configuration.
     * @returns {import('./LevelConfig.js').LevelDefinition}
     */
    get config() {
        return this.#config;
    }

    /**
     * Get level ID.
     * @returns {string}
     */
    get id() {
        return this.#config.id;
    }

    /**
     * Get level name.
     * @returns {string}
     */
    get name() {
        return this.#config.name;
    }

    /**
     * Get level order.
     * @returns {number}
     */
    get order() {
        return this.#config.order;
    }

    /**
     * Get the collision map.
     * @returns {CollisionMap}
     * @throws {Error} If level not loaded
     */
    get collisionMap() {
        if (!this.#loaded) {
            throw new Error('Level not loaded. Call load() first.');
        }
        return this.#collisionMap;
    }

    /**
     * Get the background entity.
     * @returns {Background}
     * @throws {Error} If level not loaded
     */
    get background() {
        if (!this.#loaded) {
            throw new Error('Level not loaded. Call load() first.');
        }
        return this.#background;
    }

    /**
     * Get the theme configuration.
     * @returns {import('./LevelConfig.js').ThemeConfig}
     */
    get theme() {
        return this.#config.theme;
    }

    /**
     * Get the spawn configuration.
     * @returns {import('./LevelConfig.js').SpawnConfig}
     */
    get spawnConfig() {
        return this.#config.spawnConfig;
    }

    /**
     * Get all level entities in correct draw order.
     * Order: Background -> Particles -> Fog (if present)
     * @returns {Array<import('../entities/Entity.js').Entity>}
     * @throws {Error} If level not loaded
     */
    getEntities() {
        if (!this.#loaded) {
            throw new Error('Level not loaded. Call load() first.');
        }

        const entities = [
            this.#background,
            this.#particles,
        ];

        if (this.#fog) {
            entities.push(this.#fog);
        }

        return entities;
    }

    /**
     * Get ground Y position for a given X coordinate.
     * Convenience wrapper around collision map.
     * @param {number} x - X coordinate
     * @returns {number} Ground Y position
     */
    getGroundY(x, feetY) {
        return this.#collisionMap.getGroundY(x, feetY);
    }

    /**
     * Check if a point is above ground.
     * Convenience wrapper around collision map.
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean}
     */
    isAboveGround(x, y) {
        return this.#collisionMap.isAboveGround(x, y);
    }

    /**
     * Dispose of level resources.
     * Call this when switching levels to free memory.
     */
    dispose() {
        // Mark entities for removal
        if (this.#background) this.#background.alive = false;
        if (this.#particles) this.#particles.alive = false;
        if (this.#fog) this.#fog.alive = false;

        this.#background = null;
        this.#collisionMap = null;
        this.#particles = null;
        this.#fog = null;
        this.#loaded = false;
    }
}
