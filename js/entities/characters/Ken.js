import { Character } from '../Character.js';
import { SpriteSheet } from '../../graphics/SpriteSheet.js';
import { Animation } from '../../graphics/Animation.js';
import { WarriorIdleState } from '../../states/character/WarriorIdleState.js';
import { WarriorWalkState } from '../../states/character/WarriorWalkState.js';
import { KenAttackState } from '../../states/character/KenAttackState.js';
import { KenSpellState } from '../../states/character/KenSpellState.js';
import { TakeDamageState } from '../../states/character/TakeDamageState.js';
import { AIController } from '../../ai/AIController.js';
import { PatrolBehavior } from '../../ai/behaviors/PatrolBehavior.js';

const SPRITESHEET_PATH = 'assets/spritesheets/ken';

const ANIMATIONS = [
    { key: 'IDLE_LEFT',         file: 'IDLE_LEFT.png',         loop: true,  frameDuration: 150 },
    { key: 'IDLE_RIGHT',        file: 'IDLE_RIGHT.png',        loop: true,  frameDuration: 150 },
    { key: 'WALK_LEFT',         file: 'WALK_LEFT.png',         loop: true,  frameDuration: 100 },
    { key: 'WALK_RIGHT',        file: 'WALK_RIGHT.png',        loop: true,  frameDuration: 100 },
    { key: 'ATTACK_LEFT',       file: 'ATTACK_LEFT.png',       loop: false, frameDuration: 55 },
    { key: 'ATTACK_RIGHT',      file: 'ATTACK_RIGHT.png',      loop: false, frameDuration: 55 },
    { key: 'SPELL_LEFT',        file: 'SPELL_LEFT.png',        loop: false, frameDuration: 65 },
    { key: 'SPELL_RIGHT',       file: 'SPELL_RIGHT.png',       loop: false, frameDuration: 65 },
    { key: 'TAKE_DAMAGE_LEFT',  file: 'TAKE_DAMAGE_LEFT.png',  loop: false, frameDuration: 60 },
    { key: 'TAKE_DAMAGE_RIGHT', file: 'TAKE_DAMAGE_RIGHT.png', loop: false, frameDuration: 60 },
];

/**
 * Ken — hybrid AI fighter with both melee attack and ranged spell (fireball).
 * When in melee range he lunges with a strike; at medium range he hurls a fireball.
 */
export class Ken extends Character {
    #ai = null;
    #attackTarget = null;
    #patrol = null;

    /** Callback set externally to spawn floating labels on hit. */
    _onAttackHit = null;

    constructor(opts = {}) {
        super({ width: 200, height: 200, speed: 90, hp: 90, ...opts });
        this.hitbox = { offsetX: 0.2, offsetY: 0.2, w: 0.6, h: 0.7 };
    }

    get attackTarget() { return this.#attackTarget; }
    set attackTarget(t) {
        this.#attackTarget = t;
        if (this.#patrol) this.#patrol.attackTarget = t;
    }

    async init() {
        const loadTasks = ANIMATIONS.map(async (cfg) => {
            const sheet = new SpriteSheet(`${SPRITESHEET_PATH}/${cfg.file}`);
            await sheet.load();
            const anim = new Animation(sheet, {
                frameDuration: cfg.frameDuration,
                loop: cfg.loop,
            });
            this.animator.register(cfg.key, anim);
        });

        await Promise.all(loadTasks);

        this.stateMachine.register('idle',       new WarriorIdleState(this));
        this.stateMachine.register('walk',       new WarriorWalkState(this));
        this.stateMachine.register('attack',     new KenAttackState(this));
        this.stateMachine.register('spell',      new KenSpellState(this));
        this.stateMachine.register('takeDamage', new TakeDamageState(this));
        this.stateMachine.transition('idle');
    }

    /** Set up patrol waypoints + combat checks after positioning. */
    setupPatrol(leftX, rightX) {
        this.#patrol = new PatrolBehavior({
            waypoints: [
                { x: rightX, y: 0 },
                { x: leftX, y: 0 },
            ],
            loop: true,
            attackTarget: this.#attackTarget,
            attackRange: 250,   // triggers 'attack' state; KenAttackState decides melee vs spell
            groundBased: true,
        });
        this.#ai = new AIController(this, [this.#patrol]);
    }

    update(deltaTime) {
        const state = this.stateMachine.currentName;
        if (this.#ai && state !== 'attack' && state !== 'spell' && state !== 'takeDamage') {
            this.#ai.update(deltaTime / 1000);
        }
        this.stateMachine.update(deltaTime);
        this.animator.update(deltaTime);
        this.snapToGround();
        this.y += 25;
    }
}
