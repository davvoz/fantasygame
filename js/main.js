import { Game } from './core/Game.js';
import { Background } from './entities/Background.js';
import { AmbientParticles } from './entities/effects/AmbientParticles.js';
import { FogLayer } from './entities/effects/FogLayer.js';
import { CollisionMap } from './physics/CollisionMap.js';
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

// Skip intro with SPACE or ENTER
const skipHandler = (e) => {
    if ((e.code === 'Space' || e.code === 'Enter') && titleAnimation.alive && !gameInitialized) {
        titleAnimation.skip();
    }
};
window.addEventListener('keydown', skipHandler);

// Start the game loop (title animation plays first)
game.start();

// ═══════════════════════════════════════════════════════════════
// GAME INITIALIZATION - Called after title animation completes
// ═══════════════════════════════════════════════════════════════
async function initGame() {
    // Background first so it draws behind everything
    const bg = new Background('assets/spritesheets/backgrounds/FORESTA_VERDE_NOTTE.png', canvas.width, canvas.height);
    await bg.load();
    game.addEntity(bg);

    // Ambient effects (between background and character)
    const particles = new AmbientParticles(canvas.width, canvas.height, 35);
    game.addEntity(particles);

    // Load collision map
    const collisionMap = new CollisionMap();
    await collisionMap.load('assets/maps/FORESTA_VERDE_NOTTE_heightmap.json');
    game.collisionMap = collisionMap;

    const mage = new Mage({ x: 400, y: 0 });
    mage.collisionMap = collisionMap;
    mage.font = font;
    await mage.init();
    // Spawn effect for initial mage (mage is 180x180)
    const mageCenterX = 400 + 90;
    const mageGroundY = collisionMap.getGroundY(mageCenterX);
    mage.spawning = true;
    mage.stateMachine.transition('idle');
    const mageSpawnEffect = new SpawnEffect(mageCenterX, mageGroundY, {
        color: '#39ff14', // green for mage
        height: 180,
        onComplete: () => { mage.spawning = false; }
    });
    game.addEntity(mageSpawnEffect);

    game.addEntity(mage);

    // HUD
    const hud = new HUD(font);
    hud.track(mage, 'MAGE', '#39ff14');
    hud.mage = mage;
    game.hud = hud;

    // Crosshair
    const crosshair = new Crosshair(game.inputManager);
    game.crosshair = crosshair;

    // ── Spawn system ─────────────────────────────────────────────
    let currentMage = mage;
    game.mage = mage;
    const enemies = [];          // all alive enemies
    let enemySerial = 0;         // progressive label counter

    const MAX_ENEMIES  = 3;      // hard cap on screen
    const SPAWN_DELAY  = 2500;   // ms between spawn checks

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

    /** Create & return a Warrior enemy with spawn effect */
    async function spawnWarrior() {
        // Spawn far from mage
        const leftSide = 80;
        const rightSide = canvas.width - 240;
        const side = getSpawnSideFarFromMage(leftSide + 80, rightSide + 80) === leftSide + 80 ? leftSide : rightSide;
        // Warrior is 160x160
        const centerX = side + 80;
        const groundY = collisionMap.getGroundY(centerX);
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
        w.setupPatrol(30, canvas.width - 200);
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
        // Spawn far from mage
        const leftSide = 80;
        const rightSide = canvas.width - 240;
        const side = getSpawnSideFarFromMage(leftSide + 80, rightSide + 80) === leftSide + 80 ? leftSide : rightSide;
        // Elf is 160x160
        const centerX = side + 80;
        const groundY = collisionMap.getGroundY(centerX);
        const charY = groundY - 160;
        const e = new Elf({ x: side, y: charY });
        e.collisionMap = collisionMap;
        e.attackTarget = currentMage;
        await e.init();
        e.setupPatrol(30, canvas.width - 200);
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
        
        // Reset enemy serial counter
        enemySerial = 0;
        
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
            // Don't spawn during game over
            if (gameOverShown) return false;
            // Purge dead enemies
            for (let i = enemies.length - 1; i >= 0; i--) {
                if (!enemies[i].alive) enemies.splice(i, 1);
            }
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
}
