import { Level } from './Level.js';
import { 
    LEVELS, 
    getLevelById, 
    getLevelByOrder, 
    getNextLevel,
    getAllLevelsOrdered,
    getTotalLevels 
} from './LevelConfig.js';

/**
 * Manages game levels: loading, switching, and progression.
 * 
 * SOLID Principles:
 * - Single Responsibility: Only manages level lifecycle
 * - Open/Closed: New levels can be added via LevelConfig without modifying this class
 * - Liskov Substitution: Works with any Level implementation
 * - Interface Segregation: Exposes minimal interface for level management
 * - Dependency Inversion: Depends on Level abstraction, not concrete implementations
 * 
 * @example
 * const levelManager = new LevelManager(game, canvasWidth, canvasHeight);
 * await levelManager.loadLevel('FORESTA_VERDE_NOTTE');
 * // or
 * await levelManager.loadLevelByOrder(1);
 * // Later...
 * await levelManager.nextLevel();
 */
export class LevelManager {
    /** @type {import('../core/Game.js').Game} */
    #game;
    
    /** @type {number} */
    #canvasWidth;
    
    /** @type {number} */
    #canvasHeight;
    
    /** @type {Level|null} */
    #currentLevel = null;
    
    /** @type {Map<string, Level>} */
    #levelCache = new Map();
    
    /** @type {boolean} */
    #isTransitioning = false;

    /** @type {Function|null} */
    #onLevelChangeCallback = null;

    /** @type {Function|null} */
    #onAllLevelsCompleteCallback = null;

    /**
     * Create a new LevelManager.
     * @param {import('../core/Game.js').Game} game - Game instance
     * @param {number} canvasWidth - Canvas width
     * @param {number} canvasHeight - Canvas height
     */
    constructor(game, canvasWidth, canvasHeight) {
        this.#game = game;
        this.#canvasWidth = canvasWidth;
        this.#canvasHeight = canvasHeight;
    }

    /**
     * Get the currently active level.
     * @returns {Level|null}
     */
    get currentLevel() {
        return this.#currentLevel;
    }

    /**
     * Check if a level transition is in progress.
     * @returns {boolean}
     */
    get isTransitioning() {
        return this.#isTransitioning;
    }

    /**
     * Get current level order (1-based).
     * @returns {number} Current level order, or 0 if no level loaded
     */
    get currentLevelOrder() {
        return this.#currentLevel?.order ?? 0;
    }

    /**
     * Get total number of levels.
     * @returns {number}
     */
    get totalLevels() {
        return getTotalLevels();
    }

    /**
     * Check if current level is the last level.
     * @returns {boolean}
     */
    get isLastLevel() {
        return this.currentLevelOrder >= this.totalLevels;
    }

    /**
     * Set callback for level change events.
     * @param {Function} callback - (newLevel: Level, previousLevel: Level|null) => void
     */
    onLevelChange(callback) {
        this.#onLevelChangeCallback = callback;
    }

    /**
     * Set callback for when all levels are completed.
     * @param {Function} callback - () => void
     */
    onAllLevelsComplete(callback) {
        this.#onAllLevelsCompleteCallback = callback;
    }

    /**
     * Load a level by its ID.
     * @param {string} levelId - Level ID (e.g., 'FORESTA_VERDE_NOTTE')
     * @param {Object} [options] - Load options
     * @param {boolean} [options.useCache=true] - Whether to use cached level
     * @returns {Promise<Level>}
     * @throws {Error} If level ID is invalid
     */
    async loadLevel(levelId, options = { useCache: true }) {
        const config = getLevelById(levelId);
        if (!config) {
            throw new Error(`Invalid level ID: ${levelId}`);
        }

        return this.#loadLevelFromConfig(config, options);
    }

    /**
     * Load a level by its order number.
     * @param {number} order - Level order (1-based)
     * @param {Object} [options] - Load options
     * @param {boolean} [options.useCache=true] - Whether to use cached level
     * @returns {Promise<Level>}
     * @throws {Error} If level order is invalid
     */
    async loadLevelByOrder(order, options = { useCache: true }) {
        const config = getLevelByOrder(order);
        if (!config) {
            throw new Error(`Invalid level order: ${order}. Valid range: 1-${this.totalLevels}`);
        }

        return this.#loadLevelFromConfig(config, options);
    }

    /**
     * Load the first level.
     * @param {Object} [options] - Load options
     * @returns {Promise<Level>}
     */
    async loadFirstLevel(options = {}) {
        return this.loadLevelByOrder(1, options);
    }

    /**
     * Advance to the next level.
     * @param {Object} [options] - Load options
     * @returns {Promise<Level|null>} Next level, or null if at end
     */
    async nextLevel(options = {}) {
        if (!this.#currentLevel) {
            return this.loadFirstLevel(options);
        }

        const nextConfig = getNextLevel(this.#currentLevel.id);
        if (!nextConfig) {
            // All levels completed
            if (this.#onAllLevelsCompleteCallback) {
                this.#onAllLevelsCompleteCallback();
            }
            return null;
        }

        return this.#loadLevelFromConfig(nextConfig, options);
    }

    /**
     * Reload the current level.
     * @returns {Promise<Level>}
     * @throws {Error} If no level is currently loaded
     */
    async reloadCurrentLevel() {
        if (!this.#currentLevel) {
            throw new Error('No level currently loaded');
        }

        // Force reload without cache
        return this.loadLevel(this.#currentLevel.id, { useCache: false });
    }

    /**
     * Get all available level IDs.
     * @returns {string[]}
     */
    getAvailableLevelIds() {
        return Object.keys(LEVELS);
    }

    /**
     * Get all levels ordered by progression.
     * @returns {Array<{id: string, name: string, order: number}>}
     */
    getLevelList() {
        return getAllLevelsOrdered().map(config => ({
            id: config.id,
            name: config.name,
            order: config.order,
        }));
    }

    /**
     * Preload all levels into cache.
     * Useful for smoother transitions.
     * @returns {Promise<void>}
     */
    async preloadAllLevels() {
        const levels = getAllLevelsOrdered();
        await Promise.all(
            levels.map(config => this.#getOrCreateLevel(config, true))
        );
    }

    /**
     * Preload a specific level by ID.
     * @param {string} levelId - Level ID to preload
     * @returns {Promise<void>}
     */
    async preloadLevel(levelId) {
        const config = getLevelById(levelId);
        if (config) {
            await this.#getOrCreateLevel(config, true);
        }
    }

    /**
     * Clear the level cache.
     * Call this to free memory when needed.
     */
    clearCache() {
        for (const level of this.#levelCache.values()) {
            if (level !== this.#currentLevel) {
                level.dispose();
            }
        }
        this.#levelCache.clear();
        
        // Re-add current level to cache if exists
        if (this.#currentLevel) {
            this.#levelCache.set(this.#currentLevel.id, this.#currentLevel);
        }
    }

    /**
     * Internal: Load level from config.
     * @private
     */
    async #loadLevelFromConfig(config, options) {
        if (this.#isTransitioning) {
            throw new Error('Level transition already in progress');
        }

        this.#isTransitioning = true;

        try {
            const previousLevel = this.#currentLevel;

            // Unload previous level entities from game
            if (previousLevel) {
                this.#unloadLevelFromGame(previousLevel);
            }

            // Get or create level
            const useCache = options.useCache !== false;
            const level = await this.#getOrCreateLevel(config, useCache);

            // Add new level entities to game
            this.#addLevelToGame(level);

            // Set as current
            this.#currentLevel = level;

            // Fire callback
            if (this.#onLevelChangeCallback) {
                this.#onLevelChangeCallback(level, previousLevel);
            }

            return level;
        } finally {
            this.#isTransitioning = false;
        }
    }

    /**
     * Internal: Get level from cache or create new.
     * @private
     */
    async #getOrCreateLevel(config, useCache) {
        if (useCache && this.#levelCache.has(config.id)) {
            const cached = this.#levelCache.get(config.id);
            if (cached.isLoaded) return cached;
            // Level was disposed — reload it
            await cached.load();
            return cached;
        }

        const level = new Level(config, this.#canvasWidth, this.#canvasHeight);
        await level.load();

        if (useCache) {
            this.#levelCache.set(config.id, level);
        }

        return level;
    }

    /**
     * Internal: Add level entities to game.
     * @private
     */
    #addLevelToGame(level) {
        // Set collision map on game
        this.#game.collisionMap = level.collisionMap;

        // Add level entities (background, particles, fog)
        // Insert at start so they draw behind other entities (characters, effects)
        // Insert in reverse order so background ends up first
        const entities = level.getEntities();
        for (let i = entities.length - 1; i >= 0; i--) {
            this.#game.insertEntityAtStart(entities[i]);
        }
    }

    /**
     * Internal: Remove level entities from game.
     * @private
     */
    #unloadLevelFromGame(level) {
        // Mark level entities for removal
        level.dispose();
    }
}
