/**
 * Levels module - Central export for level system.
 * 
 * Usage:
 * import { LevelManager, Level, LEVELS } from './levels/index.js';
 */

export { Level } from './Level.js';
export { LevelManager } from './LevelManager.js';
export { 
    LEVELS, 
    getLevelById, 
    getLevelByOrder, 
    getNextLevel, 
    getAllLevelsOrdered,
    getTotalLevels 
} from './LevelConfig.js';
