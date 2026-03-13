import { Mage } from '../entities/characters/Mage.js';
import { FogLayer } from '../entities/effects/FogLayer.js';
import { SpawnEffect } from '../entities/effects/SpawnEffect.js';
import { TitleAnimation } from '../entities/effects/TitleAnimation.js';
import { LevelSelectScreen } from '../entities/effects/LevelSelectScreen.js';
import { LevelTransitionAnimation } from '../entities/effects/LevelTransitionAnimation.js';
import { CelebrationScene } from '../entities/effects/CelebrationScene.js';
import { SceneTransition } from '../entities/effects/SceneTransition.js';
import { GameOverAnimation } from '../entities/effects/GameOverAnimation.js';
import { VictoryAnimation } from '../entities/effects/VictoryAnimation.js';
import { HUD } from '../ui/HUD.js';
import { Crosshair } from '../ui/Crosshair.js';
import { MobileControls } from '../input/MobileControls.js';
import { LevelManager } from '../levels/index.js';
import { EnemySpawner } from './EnemySpawner.js';
import { InputRouter } from './InputRouter.js';

export class GameFlowController {
    #game;
    #canvas;
    #font;
    #canvasWidth;
    #canvasHeight;
    #isMobile;

    // Sub-systems
    #levelManager;
    #enemySpawner;
    #inputRouter;
    #hud;

    // Player
    #currentMage = null;

    // Enemies
    #enemies = [];
    #enemySerial = 0;

    // Level state
    #collisionMap = null;
    #levelKills = 0;
    #maxTargetLevel = 4;

    // Spawn config (updated per level)
    #maxEnemies;
    #spawnDelay;
    #killsToComplete;

    // Flow flags
    #gameInitialized = false;
    #gameReady = false;
    #gameOverShown = false;
    #levelTransitionInProgress = false;

    // Active animations (InputRouter reads these)
    #titleAnimation = null;
    #levelSelectScreen = null;
    #levelTransitionAnimation = null;
    #gameOverAnimation = null;
    #victoryAnimation = null;

    constructor(game, { canvas, canvasWidth, canvasHeight, font, isMobile = false }) {
        this.#game = game;
        this.#canvas = canvas;
        this.#font = font;
        this.#canvasWidth = canvasWidth;
        this.#canvasHeight = canvasHeight;
        this.#isMobile = isMobile;

        this.#enemySpawner = new EnemySpawner(game, { canvasWidth, font });
        this.#inputRouter = new InputRouter(this, { isMobile, canvas });
    }

    // ── Public getters (used by InputRouter) ─────────────────────

    get titleAnimation()           { return this.#titleAnimation; }
    get levelSelectScreen()        { return this.#levelSelectScreen; }
    get levelTransitionAnimation() { return this.#levelTransitionAnimation; }
    get gameOverAnimation()        { return this.#gameOverAnimation; }
    get victoryAnimation()         { return this.#victoryAnimation; }
    get gameInitialized()          { return this.#gameInitialized; }

    // ── Bootstrap ────────────────────────────────────────────────

    /** Start the game flow: show title animation, then level select. */
    init() {
        this.#titleAnimation = new TitleAnimation(
            this.#canvasWidth, this.#canvasHeight,
            () => {
                if (!this.#gameInitialized) this.#showLevelSelect();
            },
            this.#font
        );
        this.#game.addEntity(this.#titleAnimation);
        this.#inputRouter.bind();
    }

    // ── Title & Level Select ─────────────────────────────────────

    #showLevelSelect() {
        this.#levelSelectScreen = new LevelSelectScreen(
            this.#canvasWidth, this.#canvasHeight,
            (selectedMaxLevel) => {
                this.#levelSelectScreen = null;
                this.#maxTargetLevel = selectedMaxLevel;
                if (!this.#gameInitialized) {
                    this.#gameInitialized = true;
                    this.#initGame();
                } else {
                    this.#restartGame();
                }
            },
            this.#font
        );
        this.#game.addEntity(this.#levelSelectScreen);
    }

    // ── Game Initialization ──────────────────────────────────────

    async #initGame() {
        // Level system
        this.#levelManager = new LevelManager(this.#game, this.#canvasWidth, this.#canvasHeight);
        this.#game.levelManager = this.#levelManager;

        const level = await this.#levelManager.loadLevelByOrder(1);
        this.#collisionMap = level.collisionMap;
        const spawnConfig = level.spawnConfig;
        this.#applySpawnConfig(spawnConfig);

        console.log(`📍 Level 1: ${level.name} (Kill ${this.#killsToComplete} enemies)`);

        // First-level intro animation
        const startGameAfterIntro = () => {
            if (this.#gameReady) return;
            this.#gameReady = true;
            this.#spawnMageEffect(this.#currentMage);
        };

        const firstLevelIntro = new LevelTransitionAnimation(
            this.#canvasWidth, this.#canvasHeight,
            level.config, this.#font,
            startGameAfterIntro
        );
        this.#levelTransitionAnimation = firstLevelIntro;
        this.#game.addEntity(firstLevelIntro);

        // Create mage (frozen until intro finishes)
        const mage = await this.#createMage();
        this.#currentMage = mage;
        this.#game.mage = mage;

        // HUD
        this.#hud = new HUD(this.#font);
        this.#hud.track(mage, 'MAGE', '#39ff14');
        this.#hud.mage = mage;
        this.#game.hud = this.#hud;

        // Crosshair (desktop only)
        if (!this.#isMobile) {
            this.#game.crosshair = new Crosshair(this.#game.inputManager);
        }

        // Mobile controls
        if (this.#isMobile) {
            new MobileControls(this.#game.inputManager, this.#canvas);
        }

        // Spawners
        this.#setupSpawners();

        // Fog in front of everything
        this.#game.addEntity(new FogLayer(this.#canvasWidth, this.#canvasHeight, 3));

        // Fullscreen toggle
        this.#inputRouter.bindFullscreen();
    }

    // ── Mage creation ────────────────────────────────────────────

    async #createMage() {
        const mage = new Mage({ x: 400, y: 0 });
        mage.collisionMap = this.#collisionMap;
        mage.font = this.#font;
        await mage.init();
        mage.spawning = true;
        mage.stateMachine.transition('idle');
        this.#game.addEntity(mage);
        return mage;
    }

    #spawnMageEffect(mage) {
        const centerX = 400 + 90;
        const groundY = this.#collisionMap.getGroundY(centerX);
        mage.spawning = true;
        mage.stateMachine.transition('idle');
        const effect = new SpawnEffect(centerX, groundY, {
            color: '#39ff14',
            height: 180,
            onComplete: () => { mage.spawning = false; }
        });
        this.#game.addEntity(effect);
    }

    // ── Spawn config ─────────────────────────────────────────────

    #applySpawnConfig(config) {
        this.#maxEnemies = config.maxEnemies;
        this.#spawnDelay = config.spawnDelay;
        this.#killsToComplete = config.killsToComplete;
    }

    // ── Spawners ─────────────────────────────────────────────────

    #setupSpawners() {
        // Mage death checker
        this.#game.addSpawner(
            () => !this.#currentMage.alive && !this.#gameOverShown,
            () => { this.#showGameOver(); },
            1000
        );

        // Enemy spawner
        this.#game.addSpawner(
            () => {
                if (this.#gameOverShown || this.#levelTransitionInProgress || !this.#gameReady) return false;
                if (this.#levelTransitionAnimation && this.#levelTransitionAnimation.alive) return false;
                // Purge dead enemies and count kills
                for (let i = this.#enemies.length - 1; i >= 0; i--) {
                    if (!this.#enemies[i].alive) {
                        this.#enemies.splice(i, 1);
                        this.#levelKills++;
                    }
                }
                this.#checkLevelCompletion();
                return this.#enemies.length < this.#maxEnemies && !this.#levelTransitionInProgress;
            },
            async () => {
                if (this.#levelTransitionInProgress || this.#gameOverShown) return;
                const pick = this.#enemySpawner.pickEnemyType();
                this.#enemySerial++;
                const enemy = await this.#enemySpawner.spawn(pick.type, this.#collisionMap, this.#currentMage);
                if (this.#levelTransitionInProgress || this.#gameOverShown) {
                    enemy.hp = 0;
                    if (enemy.kill) enemy.kill();
                    return;
                }
                this.#game.addEntity(enemy);
                this.#enemies.push(enemy);
                const label = `${pick.type.toUpperCase()} ${this.#enemySerial}`;
                this.#hud.track(enemy, label, pick.color);
            },
            this.#spawnDelay
        );
    }

    // ── Level Progression ────────────────────────────────────────

    #checkLevelCompletion() {
        if (this.#killsToComplete && this.#levelKills >= this.#killsToComplete && !this.#levelTransitionInProgress) {
            this.#transitionToNextLevel();
        }
    }

    #showLevelIntro(level, onComplete) {
        this.#levelTransitionAnimation = new LevelTransitionAnimation(
            this.#canvasWidth, this.#canvasHeight,
            level.config, this.#font,
            () => {
                this.#levelTransitionAnimation = null;
                if (onComplete) onComplete();
            }
        );
        this.#game.addEntity(this.#levelTransitionAnimation);
    }

    async #transitionToNextLevel() {
        if (this.#levelTransitionInProgress) return;
        this.#levelTransitionInProgress = true;

        // Clear enemies
        for (const e of this.#enemies) {
            if (e.alive !== false) {
                e.hp = 0;
                if (e.kill) e.kill();
            }
            this.#hud.untrack(e);
        }
        this.#enemies.length = 0;

        this.#game.clearTransientEntities(new Set([this.#currentMage]));
        this.#currentMage.spawning = true;
        this.#game.resetSpawners();

        const currentLevel = this.#levelManager.currentLevel;
        const themeColor = currentLevel?.config?.theme?.primaryColor ?? '#39ff14';

        // Persistent black overlay
        const blackOverlay = {
            alive: true, x: 0, y: 0, width: this.#canvasWidth, height: this.#canvasHeight,
            update() {},
            draw(ctx) { ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, this.width, this.height); }
        };
        this.#game.addEntity(blackOverlay);

        // STEP 1: Celebration
        await this.#showCelebration(currentLevel, themeColor);

        const reachedTarget = currentLevel.order >= this.#maxTargetLevel;

        // STEP 2: Diamond wipe + preload next level
        let nextLevel = null;
        await new Promise((resolve) => {
            const wipe = new SceneTransition(
                this.#canvasWidth, this.#canvasHeight, themeColor,
                async () => {
                    if (!reachedTarget) nextLevel = await this.#levelManager.nextLevel();
                },
                resolve
            );
            this.#game.addEntity(wipe);
        });

        if (!nextLevel) {
            console.log('🎉 All levels completed!');
            this.#currentMage.spawning = false;
            this.#levelTransitionInProgress = false;
            this.#levelKills = 0;
            this.#showVictory();
            return;
        }

        // STEP 3: Level intro
        this.#showLevelIntro(nextLevel, () => {
            blackOverlay.alive = false;
            this.#applySpawnConfig(nextLevel.spawnConfig);
            this.#levelKills = 0;
            this.#enemySerial = 0;
            this.#collisionMap = nextLevel.collisionMap;
            this.#currentMage.collisionMap = this.#collisionMap;
            this.#currentMage.spawning = false;
            console.log(`📍 Level ${nextLevel.order}: ${nextLevel.name} (Kill ${this.#killsToComplete} enemies)`);
            this.#levelTransitionInProgress = false;
        });
    }

    async #showCelebration(currentLevel, themeColor) {
        await new Promise((resolve) => {
            const celebration = new CelebrationScene(
                this.#canvasWidth, this.#canvasHeight,
                currentLevel.config, this.#font,
                this.#levelKills, resolve
            );
            this.#game.addEntity(celebration);

            const skipCeleb = (e) => {
                if (celebration.alive && (e.code === 'Space' || e.code === 'Enter')) {
                    celebration.skip();
                    window.removeEventListener('keydown', skipCeleb);
                }
            };
            window.addEventListener('keydown', skipCeleb);

            if (this.#isMobile) {
                const skipCelebTouch = (e) => {
                    if (celebration.alive) {
                        e.preventDefault();
                        celebration.skip();
                        document.removeEventListener('touchstart', skipCelebTouch, true);
                    }
                };
                document.addEventListener('touchstart', skipCelebTouch, { passive: false, capture: true });
            }
        });
    }

    // ── Game Over & Victory ──────────────────────────────────────

    #showGameOver() {
        if (this.#gameOverShown) return;
        this.#gameOverShown = true;
        this.#gameOverAnimation = new GameOverAnimation(
            this.#canvasWidth, this.#canvasHeight,
            () => {
                if (this.#currentMage) this.#currentMage.hp = 0;
                this.#game.clearTransientEntities(new Set());
                this.#hud.reset();
                this.#gameOverAnimation = null;
                this.#showLevelSelect();
            },
            this.#font
        );
        this.#game.addEntity(this.#gameOverAnimation);
    }

    #showVictory() {
        this.#gameOverShown = true;
        this.#game.clearTransientEntities(new Set([this.#currentMage]));
        this.#victoryAnimation = new VictoryAnimation(
            this.#canvasWidth, this.#canvasHeight,
            () => {
                if (this.#currentMage) this.#currentMage.hp = 0;
                this.#game.clearTransientEntities(new Set());
                this.#hud.reset();
                this.#victoryAnimation = null;
                this.#showLevelSelect();
            },
            this.#font
        );
        this.#game.addEntity(this.#victoryAnimation);
    }

    // ── Restart ──────────────────────────────────────────────────

    async #restartGame() {
        // Kill all enemies
        for (const e of this.#enemies) {
            if (e.alive) {
                e.hp = 0;
                if (e.kill) e.kill();
            }
            this.#hud.untrack(e);
        }
        this.#enemies.length = 0;

        if (this.#currentMage) this.#currentMage.hp = 0;
        this.#game.clearTransientEntities(new Set());

        this.#enemySerial = 0;
        this.#levelKills = 0;
        this.#levelTransitionInProgress = false;
        this.#hud.reset();

        // Reload first level
        const firstLevel = await this.#levelManager.loadFirstLevel();
        this.#collisionMap = firstLevel.collisionMap;
        this.#applySpawnConfig(firstLevel.spawnConfig);

        // Fresh mage
        const newMage = new Mage({ x: 400, y: 0 });
        newMage.collisionMap = this.#collisionMap;
        newMage.font = this.#font;
        await newMage.init();
        this.#spawnMageEffect(newMage);
        this.#game.addEntity(newMage);

        // Recreate front fog
        this.#game.addEntity(new FogLayer(this.#canvasWidth, this.#canvasHeight, 3));

        this.#currentMage = newMage;
        this.#game.mage = newMage;
        this.#hud.mage = newMage;
        this.#hud.track(newMage, 'MAGE', '#39ff14');

        this.#gameOverShown = false;
        this.#gameOverAnimation = null;

        console.log(`📍 Level 1: ${firstLevel.name} (Kill ${this.#killsToComplete} enemies)`);
    }
}
