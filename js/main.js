import { Game } from './core/Game.js';
import { FogLayer } from './entities/effects/FogLayer.js';
import { Mage } from './entities/characters/Mage.js';
import { Bat } from './entities/characters/Bat.js';
import { Warrior } from './entities/characters/Warrior.js';
import { Elf } from './entities/characters/Elf.js';
import { BitmapFont } from './graphics/BitmapFont.js';
import { HUD } from './ui/HUD.js';
import { Crosshair } from './ui/Crosshair.js';
import { FloatingLabel } from './entities/effects/FloatingLabel.js';
import { SpawnEffect } from './entities/effects/SpawnEffect.js';
import { TitleAnimation } from './entities/effects/TitleAnimation.js';
import { GameOverAnimation } from './entities/effects/GameOverAnimation.js';
import { LevelTransitionAnimation } from './entities/effects/LevelTransitionAnimation.js';
import { LevelManager } from './levels/index.js';
import { MobileControls } from './input/MobileControls.js';

const isMobile = MobileControls.isMobile();

const canvas = document.getElementById('gameCanvas');
canvas.width  = 960;
canvas.height = 540;

const game = new Game(canvas);

// Load bitmap font
const font = new BitmapFont();
await font.load();
game.font = font;

// ═══════════════════════════════════════════════════════════════
// TITLE ANIMATION - Epic intro before game starts
// ═══════════════════════════════════════════════════════════════
let gameInitialized = false;

const titleAnimation = new TitleAnimation(canvas.width, canvas.height, () => {
    // Title animation finished - initialize the actual game
    if (!gameInitialized) {
        gameInitialized = true;
        initGame();
    }
}, font);
game.addEntity(titleAnimation);

// Skip intro with SPACE or ENTER (keyboard)
const skipHandler = (e) => {
    if ((e.code === 'Space' || e.code === 'Enter') && titleAnimation.alive && !gameInitialized) {
        titleAnimation.skip();
    }
};
window.addEventListener('keydown', skipHandler);

// Skip intro with tap (mobile)
if (isMobile) {
    canvas.addEventListener('touchstart', function skipTouch(e) {
        if (titleAnimation.alive && !gameInitialized) {
            e.preventDefault();
            titleAnimation.skip();
        } else {
            canvas.removeEventListener('touchstart', skipTouch);
        }
    }, { passive: false });
}

// Start the game loop (title animation plays first)
game.start();

// ═══════════════════════════════════════════════════════════════
// GAME INITIALIZATION - Called after title animation completes
// ═══════════════════════════════════════════════════════════════
async function initGame() {
    // ═══════════════════════════════════════════════════════════════
    // LEVEL SYSTEM - Load first level using LevelManager
    // ═══════════════════════════════════════════════════════════════
    const levelManager = new LevelManager(game, canvas.width, canvas.height);
    game.levelManager = levelManager;

    // Load the first level (FORESTA_VERDE_NOTTE)
    const level = await levelManager.loadLevelByOrder(1); // TODO: TEST — remove to start at level 1
    let collisionMap = level.collisionMap;
    const spawnConfig = level.spawnConfig;

    console.log(`📍 Level 1: ${level.name} (Kill ${spawnConfig.killsToComplete} enemies)`);

    // ═══════════════════════════════════════════════════════════════
    // LEVEL 1 INTRO ANIMATION
    // ═══════════════════════════════════════════════════════════════
    let gameReady = false;
    let firstLevelIntroSkipHandler = null;

    const startGameAfterIntro = () => {
        if (gameReady) return;
        gameReady = true;

        // Spawn mage with effect
        const mageCenterX = 400 + 90;
        const mageGroundY = collisionMap.getGroundY(mageCenterX);
        mage.spawning = true;
        mage.stateMachine.transition('idle');
        const mageSpawnEffect = new SpawnEffect(mageCenterX, mageGroundY, {
            color: '#39ff14',
            height: 180,
            onComplete: () => { mage.spawning = false; }
        });
        game.addEntity(mageSpawnEffect);

        // Remove skip handler
        if (firstLevelIntroSkipHandler) {
            window.removeEventListener('keydown', firstLevelIntroSkipHandler);
        }
    };

    const firstLevelIntro = new LevelTransitionAnimation(
        canvas.width,
        canvas.height,
        level.config,
        font,
        startGameAfterIntro
    );
    game.addEntity(firstLevelIntro);

    // Skip handler for first level intro
    firstLevelIntroSkipHandler = (e) => {
        if (firstLevelIntro && firstLevelIntro.alive) {
            if (e.code === 'Space' || e.code === 'Enter') {
                firstLevelIntro.skip();
            }
        }
    };
    window.addEventListener('keydown', firstLevelIntroSkipHandler);

    // Mobile: skip first level intro with tap
    if (isMobile) {
        canvas.addEventListener('touchstart', function skipLevelIntroTouch(e) {
            if (firstLevelIntro && firstLevelIntro.alive) {
                e.preventDefault();
                firstLevelIntro.skip();
            } else {
                canvas.removeEventListener('touchstart', skipLevelIntroTouch);
            }
        }, { passive: false });
    }

    // Create mage (but don't spawn effect yet - wait for intro)
    const mage = new Mage({ x: 400, y: 0 });
    mage.collisionMap = collisionMap;
    mage.font = font;
    await mage.init();
    mage.spawning = true; // Keep frozen until intro finishes
    mage.stateMachine.transition('idle');
    game.addEntity(mage);

    // HUD
    const hud = new HUD(font);
    hud.track(mage, 'MAGE', '#39ff14');
    hud.mage = mage;
    game.hud = hud;

    // Crosshair (hidden on mobile — touch aim replaces it)
    if (!isMobile) {
        const crosshair = new Crosshair(game.inputManager);
        game.crosshair = crosshair;
    }

    // Mobile touch controls
    if (isMobile) {
        new MobileControls(game.inputManager, canvas);
    }

    // ── Spawn system ─────────────────────────────────────────────
    let currentMage = mage;
    game.mage = mage;
    const enemies = [];          // all alive enemies
    let enemySerial = 0;         // progressive label counter
    let levelKills = 0;          // kills in current level

    // Use level's spawn configuration (will be updated on level change)
    let currentSpawnConfig = spawnConfig;
    let MAX_ENEMIES  = currentSpawnConfig.maxEnemies;
    let SPAWN_DELAY  = currentSpawnConfig.spawnDelay;
    let KILLS_TO_COMPLETE = currentSpawnConfig.killsToComplete;

    // Weighted enemy types — pick randomly each spawn
    const ENEMY_TYPES = [
        { type: 'bat',     weight: 3, color: '#ff5252' },
        { type: 'warrior', weight: 2, color: '#ffaa00' },
        { type: 'elf',     weight: 2, color: '#22d3ee' },
    ];
    const TOTAL_WEIGHT = ENEMY_TYPES.reduce((s, e) => s + e.weight, 0);

    function pickEnemyType() {
        let r = Math.random() * TOTAL_WEIGHT;
        for (const entry of ENEMY_TYPES) {
            r -= entry.weight;
            if (r <= 0) return entry;
        }
        return ENEMY_TYPES[0];
    }

    /** Get spawn side far from mage */
    function getSpawnSideFarFromMage(leftX, rightX) {
        const mageX = currentMage.x + 90; // mage center
        const distLeft = Math.abs(mageX - leftX);
        const distRight = Math.abs(mageX - rightX);
        return distLeft >= distRight ? leftX : rightX;
    }

    /** Create & return a Bat enemy with spawn effect */
    async function spawnBat() {
        // Spawn far from mage
        const leftSide = 100;
        const rightSide = canvas.width - 220;
        const side = getSpawnSideFarFromMage(leftSide + 60, rightSide + 60) === leftSide + 60 ? leftSide : rightSide;
        const spawnY = 80 + Math.random() * 150;
        const b = new Bat({ x: side, y: spawnY });
        b.target = currentMage;
        await b.init();
        // Start invisible and frozen in idle
        b.spawning = true;
        b.stateMachine.transition('idle');
        // Bat is 120x120 - effect at bat center
        const centerX = side + 60;
        const centerY = spawnY + 60;
        const effect = new SpawnEffect(centerX, centerY + 60, {
            color: '#a855f7', // purple for bat
            height: 120,
            onComplete: () => { b.spawning = false; }
        });
        game.addEntity(effect);
        return b;
    }

    /** Pick a random surface and a valid spawn X on that surface. */
    function pickSpawnSurface(charWidth) {
        // Sample surfaces at canvas center to get all available platforms
        const midX = canvas.width / 2;
        const surfaces = collisionMap.getAllSurfaces(midX);
        if (surfaces.length === 0) return { groundY: canvas.height, side: 80, extent: { minX: 0, maxX: canvas.width } };
        const groundY = surfaces[Math.floor(Math.random() * surfaces.length)];
        const extent = collisionMap.getLayerExtent(midX, groundY);
        // Pick spawn side within platform bounds
        const margin = charWidth + 10;
        const leftSide = extent.minX + 10;
        const rightSide = Math.max(leftSide, extent.maxX - charWidth - 10);
        const leftCenter = leftSide + charWidth / 2;
        const rightCenter = rightSide + charWidth / 2;
        const chosen = getSpawnSideFarFromMage(leftCenter, rightCenter) === leftCenter ? leftSide : rightSide;
        return { groundY, side: chosen, extent };
    }

    /** Create & return a Warrior enemy with spawn effect */
    async function spawnWarrior() {
        const { groundY, side, extent } = pickSpawnSurface(160);
        // Warrior is 160x160
        const centerX = side + 80;
        const charY = groundY - 160;
        const w = new Warrior({ x: side, y: charY });
        w.collisionMap = collisionMap;
        w.attackTarget = currentMage;
        w._onAttackHit = (target, dmg) => {
            if (font) {
                const hr = target.getHitRect();
                game.addEntity(new FloatingLabel(
                    `-${dmg}`, hr.x + hr.width / 2, hr.y, font, { scale: 0.6 }
                ));
            }
        };
        await w.init();
        w.setupPatrol(extent.minX + 10, extent.maxX - 170);
        // Start invisible and frozen in idle
        w.spawning = true;
        w.stateMachine.transition('idle');
        // Effect at warrior feet (groundY)
        const effect = new SpawnEffect(centerX, groundY, {
            color: '#ffaa00', // orange for warrior
            height: 160,
            onComplete: () => { w.spawning = false; }
        });
        game.addEntity(effect);
        return w;
    }

    /** Create & return an Elf enemy with spawn effect */
    async function spawnElf() {
        const { groundY, side, extent } = pickSpawnSurface(160);
        // Elf is 160x160
        const centerX = side + 80;
        const charY = groundY - 160;
        const e = new Elf({ x: side, y: charY });
        e.collisionMap = collisionMap;
        e.attackTarget = currentMage;
        await e.init();
        e.setupPatrol(extent.minX + 10, extent.maxX - 170);
        // Start invisible and frozen in idle
        e.spawning = true;
        e.stateMachine.transition('idle');
        // Effect at elf feet (groundY)
        const effect = new SpawnEffect(centerX, groundY, {
            color: '#22d3ee', // cyan for elf
            height: 160,
            onComplete: () => { e.spawning = false; }
        });
        game.addEntity(effect);
        return e;
    }

    const SPAWN_FNS = { bat: spawnBat, warrior: spawnWarrior, elf: spawnElf };

    // ═══════════════════════════════════════════════════════════════
    // LEVEL PROGRESSION SYSTEM
    // ═══════════════════════════════════════════════════════════════
    let levelTransitionInProgress = false;
    let levelTransitionAnimation = null;

    /** Show level intro animation, then call callback */
    function showLevelIntro(level, onComplete) {
        levelTransitionAnimation = new LevelTransitionAnimation(
            canvas.width,
            canvas.height,
            level.config,
            font,
            () => {
                levelTransitionAnimation = null;
                if (onComplete) onComplete();
            }
        );
        game.addEntity(levelTransitionAnimation);
    }

    // Skip level intro with SPACE
    window.addEventListener('keydown', (e) => {
        if (levelTransitionAnimation && levelTransitionAnimation.alive) {
            if (e.code === 'Space' || e.code === 'Enter') {
                levelTransitionAnimation.skip();
            }
        }
    });

    // Mobile: skip level transition with tap (capture phase)
    if (isMobile) {
        document.addEventListener('touchstart', (e) => {
            if (levelTransitionAnimation && levelTransitionAnimation.alive) {
                e.preventDefault();
                e.stopImmediatePropagation();
                levelTransitionAnimation.skip();
            }
        }, { passive: false, capture: true });
    }

    async function transitionToNextLevel() {
        if (levelTransitionInProgress) return;
        levelTransitionInProgress = true;

        // Clear all enemies — mark dead and remove from tracking
        for (const e of enemies) {
            if (e.alive !== false) {
                e.hp = 0;
                if (e.kill) e.kill();
            }
            hud.untrack(e);
        }
        enemies.length = 0;

        // Freeze mage during transition
        currentMage.spawning = true;

        // Load next level (this loads background, collision map, etc.)
        const nextLevel = await levelManager.nextLevel();
        
        if (!nextLevel) {
            // Game completed! All levels done
            console.log('🎉 All levels completed!');
            currentMage.spawning = false;
            levelTransitionInProgress = false;
            // TODO: Show victory screen
            return;
        }

        // Show level intro animation
        showLevelIntro(nextLevel, () => {
            // Update spawn config from new level
            currentSpawnConfig = nextLevel.spawnConfig;
            MAX_ENEMIES = currentSpawnConfig.maxEnemies;
            SPAWN_DELAY = currentSpawnConfig.spawnDelay;
            KILLS_TO_COMPLETE = currentSpawnConfig.killsToComplete;
            
            // Reset counters for new level
            levelKills = 0;
            enemySerial = 0;

            // Update collision map reference for mage and spawn functions
            collisionMap = nextLevel.collisionMap;
            currentMage.collisionMap = collisionMap;

            // Unfreeze mage
            currentMage.spawning = false;

            console.log(`📍 Level ${nextLevel.order}: ${nextLevel.name} (Kill ${KILLS_TO_COMPLETE} enemies)`);
            levelTransitionInProgress = false;
        });
    }

    // Check for level completion
    function checkLevelCompletion() {
        if (KILLS_TO_COMPLETE && levelKills >= KILLS_TO_COMPLETE && !levelTransitionInProgress) {
            transitionToNextLevel();
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // GAME OVER & RESPAWN SYSTEM
    // ═══════════════════════════════════════════════════════════════
    let gameOverAnimation = null;
    let gameOverShown = false;

    async function restartGame() {
        // Kill all enemies
        for (const e of enemies) {
            if (e.alive) {
                e.hp = 0;  // Force death
                if (e.kill) e.kill();
            }
            hud.untrack(e);
        }
        enemies.length = 0;
        
        // Reset counters
        enemySerial = 0;
        levelKills = 0;

        // Reload first level
        const firstLevel = await levelManager.loadFirstLevel();
        collisionMap = firstLevel.collisionMap;
        currentSpawnConfig = firstLevel.spawnConfig;
        MAX_ENEMIES = currentSpawnConfig.maxEnemies;
        SPAWN_DELAY = currentSpawnConfig.spawnDelay;
        KILLS_TO_COMPLETE = currentSpawnConfig.killsToComplete;
        
        // Create fresh mage
        const newMage = new Mage({ x: 400, y: 0 });
        newMage.collisionMap = collisionMap;
        newMage.font = font;
        await newMage.init();
        
        // Spawn effect for respawning mage (180x180)
        const centerX = 400 + 90;
        const groundY = collisionMap.getGroundY(centerX);
        newMage.spawning = true;
        newMage.stateMachine.transition('idle');
        const respawnEffect = new SpawnEffect(centerX, groundY, {
            color: '#39ff14', // green for mage
            height: 180,
            onComplete: () => { newMage.spawning = false; }
        });
        game.addEntity(respawnEffect);
        game.addEntity(newMage);
        
        currentMage = newMage;
        game.mage = newMage;
        hud.mage = newMage;
        hud.updateTracked(0, newMage);
        
        gameOverShown = false;
        gameOverAnimation = null;

        console.log(`📍 Level 1: ${firstLevel.name} (Kill ${KILLS_TO_COMPLETE} enemies)`);
    }

    function showGameOver() {
        if (gameOverShown) return;
        gameOverShown = true;
        
        gameOverAnimation = new GameOverAnimation(canvas.width, canvas.height, () => {
            // Player pressed play again - restart everything
            restartGame();
        }, font);
        game.addEntity(gameOverAnimation);
    }

    // Input handler for game over
    window.addEventListener('keydown', (e) => {
        if (gameOverAnimation && gameOverAnimation.alive && gameOverAnimation.waitingForInput) {
            if (e.code === 'Space' || e.code === 'Enter') {
                gameOverAnimation.playAgain();
            }
        }
    });

    // Mobile: tap to restart after game over (capture phase to beat control stopPropagation)
    if (isMobile) {
        document.addEventListener('touchstart', (e) => {
            if (gameOverAnimation && gameOverAnimation.alive && gameOverAnimation.waitingForInput) {
                e.preventDefault();
                e.stopImmediatePropagation();
                gameOverAnimation.playAgain();
            }
        }, { passive: false, capture: true });
    }

    // Mage death check spawner (shows game over)
    game.addSpawner(
        () => !currentMage.alive && !gameOverShown,
        () => {
            showGameOver();
        },
        1000  // Wait 1 second after death before showing game over
    );

    // Enemy spawner — keeps exactly up to MAX_ENEMIES alive at all times
    game.addSpawner(
        () => {
            // Don't spawn during game over, level transition, or before game is ready
            if (gameOverShown || levelTransitionInProgress || !gameReady) return false;
            // Don't spawn if level transition animation is playing
            if (levelTransitionAnimation && levelTransitionAnimation.alive) return false;
            // Purge dead enemies and count kills
            for (let i = enemies.length - 1; i >= 0; i--) {
                if (!enemies[i].alive) {
                    enemies.splice(i, 1);
                    levelKills++;
                }
            }
            // Check if level completed (after loop to avoid mutating array mid-iteration)
            checkLevelCompletion();
            return enemies.length < MAX_ENEMIES;
        },
        async () => {
            const pick = pickEnemyType();
            enemySerial++;
            const enemy = await SPAWN_FNS[pick.type]();
            game.addEntity(enemy);
            enemies.push(enemy);
            const label = `${pick.type.toUpperCase()} ${enemySerial}`;
            hud.track(enemy, label, pick.color);
        },
        SPAWN_DELAY
    );

    // Fog in front of everything for depth
    const fog = new FogLayer(canvas.width, canvas.height, 3);
    game.addEntity(fog);

    // Fullscreen toggle (F key)
    window.addEventListener('keydown', (e) => {
        if (e.code === 'KeyF') {
            if (!document.fullscreenElement) {
                canvas.requestFullscreen().catch(() => {});
            } else {
                document.exitFullscreen();
            }
        }
    });

    // Mobile: auto-request fullscreen on first touch
    if (isMobile) {
        const enterFullscreen = () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
            }
            window.removeEventListener('touchstart', enterFullscreen);
        };
        window.addEventListener('touchstart', enterFullscreen, { once: true });
    }
}
