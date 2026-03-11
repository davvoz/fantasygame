/**
 * Level configuration definitions.
 * 
 * Each level is defined with:
 * - id: Unique identifier
 * - name: Display name
 * - backgroundPath: Path to background image
 * - heightmapPath: Path to collision heightmap JSON
 * - ambientConfig: Ambient effects configuration
 * - spawnConfig: Enemy spawn configuration (optional overrides)
 * - theme: Visual theme settings (colors, effects)
 * 
 * SOLID: Single Responsibility - This module only defines level data.
 * Open/Closed: Add new levels without modifying existing code.
 */

/**
 * @typedef {Object} AmbientConfig
 * @property {number} particleCount - Number of ambient particles
 * @property {string} [particleColor] - Optional particle color override
 * @property {boolean} [hasFog] - Whether to enable fog layer
 * @property {string} [fogColor] - Fog color
 * @property {number} [fogOpacity] - Fog opacity (0-1)
 */

/**
 * @typedef {Object} ThemeConfig
 * @property {string} primaryColor - Primary accent color
 * @property {string} secondaryColor - Secondary accent color
 * @property {string} backgroundColor - UI background tint
 */

/**
 * @typedef {Object} SpawnConfig
 * @property {number} maxEnemies - Maximum concurrent enemies
 * @property {number} spawnDelay - Delay between spawn checks (ms)
 * @property {number} killsToComplete - Enemies to kill to complete level (null for endless)
 * @property {Array<{type: string, weight: number}>} [enemyWeights] - Override enemy type weights
 */

/**
 * @typedef {Object} LevelDefinition
 * @property {string} id - Unique level identifier
 * @property {string} name - Display name
 * @property {number} order - Level order (for progression)
 * @property {string} backgroundPath - Path to background image
 * @property {string} heightmapPath - Path to heightmap JSON
 * @property {AmbientConfig} ambientConfig - Ambient effects settings
 * @property {ThemeConfig} theme - Visual theme settings
 * @property {SpawnConfig} [spawnConfig] - Optional spawn overrides
 */

/**
 * Base paths for assets
 */
const PATHS = {
    BACKGROUNDS: 'assets/spritesheets/backgrounds/',
    HEIGHTMAPS: 'assets/maps/',
};

/**
 * Level definitions registry.
 * Add new levels here following the established pattern.
 * 
 * @type {Object.<string, LevelDefinition>}
 */
export const LEVELS = {
    FORESTA_VERDE_NOTTE: {
        id: 'FORESTA_VERDE_NOTTE',
        name: 'Green Forest - Night',
        order: 1,
        backgroundPath: `${PATHS.BACKGROUNDS}FORESTA_VERDE_NOTTE.png`,
        heightmapPath: `${PATHS.HEIGHTMAPS}FORESTA_VERDE_NOTTE_heightmap.json`,
        ambientConfig: {
            particleCount: 35,
            particleColor: '#88ff88',
            hasFog: false,
        },
        theme: {
            primaryColor: '#39ff14',
            secondaryColor: '#22c55e',
            backgroundColor: '#0a1f0a',
        },
        spawnConfig: {
            maxEnemies: 3,
            spawnDelay: 2500,
            killsToComplete: 10,
        },
    },

    FORESTA_BLU_NOTTE: {
        id: 'FORESTA_BLU_NOTTE',
        name: 'Blue Forest - Night',
        order: 2,
        backgroundPath: `${PATHS.BACKGROUNDS}FORESTA_BLU_NOTTE.png`,
        heightmapPath: `${PATHS.HEIGHTMAPS}FORESTA_BLU_NOTTE_heightmap.json`,
        ambientConfig: {
            particleCount: 40,
            particleColor: '#88ccff',
            hasFog: true,
            fogColor: '#1a3a5c',
            fogOpacity: 0.15,
        },
        theme: {
            primaryColor: '#22d3ee',
            secondaryColor: '#3b82f6',
            backgroundColor: '#0a1a2f',
        },
        spawnConfig: {
            maxEnemies: 4,
            spawnDelay: 2200,
            killsToComplete: 20,
        },
    },

    FORESTA_SANGUE_NOTTE: {
        id: 'FORESTA_SANGUE_NOTTE',
        name: 'Blood Forest - Night',
        order: 3,
        backgroundPath: `${PATHS.BACKGROUNDS}FORESTA_SANGUE_NOTTE.png`,
        heightmapPath: `${PATHS.HEIGHTMAPS}FORESTA_SANGUE_NOTTE_heightmap.json`,
        ambientConfig: {
            particleCount: 45,
            particleColor: '#ff6666',
            hasFog: true,
            fogColor: '#3d1a1a',
            fogOpacity: 0.2,
        },
        theme: {
            primaryColor: '#ef4444',
            secondaryColor: '#dc2626',
            backgroundColor: '#1f0a0a',
        },
        spawnConfig: {
            maxEnemies: 5,
            spawnDelay: 2000,
            killsToComplete: 30,
        },
    },

    PIATTAFORME_NOTTE: {
        id: 'PIATTAFORME_NOTTE',
        name: 'Platforms - Night',
        order: 4,
        backgroundPath: `${PATHS.BACKGROUNDS}PIATTAFORME_NOTTE.png`,
        heightmapPath: `${PATHS.HEIGHTMAPS}PIATTAFORME_NOTTE_heightmap.json`,
        ambientConfig: {
            particleCount: 50,
            particleColor: '#cc99ff',
            hasFog: true,
            fogColor: '#2a1a3d',
            fogOpacity: 0.18,
        },
        theme: {
            primaryColor: '#a855f7',
            secondaryColor: '#7c3aed',
            backgroundColor: '#1a0a2e',
        },
        spawnConfig: {
            maxEnemies: 6,
            spawnDelay: 1800,
            killsToComplete: 40,
        },
    },
};

/**
 * Get level by ID.
 * @param {string} id - Level ID
 * @returns {LevelDefinition|undefined}
 */
export function getLevelById(id) {
    return LEVELS[id];
}

/**
 * Get all levels sorted by order.
 * @returns {LevelDefinition[]}
 */
export function getAllLevelsOrdered() {
    return Object.values(LEVELS).sort((a, b) => a.order - b.order);
}

/**
 * Get level by order number.
 * @param {number} order - Level order (1-based)
 * @returns {LevelDefinition|undefined}
 */
export function getLevelByOrder(order) {
    return Object.values(LEVELS).find(level => level.order === order);
}

/**
 * Get next level in progression.
 * @param {string} currentLevelId - Current level ID
 * @returns {LevelDefinition|null} - Next level or null if at end
 */
export function getNextLevel(currentLevelId) {
    const current = LEVELS[currentLevelId];
    if (!current) return null;
    return getLevelByOrder(current.order + 1) || null;
}

/**
 * Get total number of levels.
 * @returns {number}
 */
export function getTotalLevels() {
    return Object.keys(LEVELS).length;
}
