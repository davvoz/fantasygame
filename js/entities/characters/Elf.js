import { Character } from '../Character.js';
import { SpriteSheet } from '../../graphics/SpriteSheet.js';
import { Animation } from '../../graphics/Animation.js';
import { WarriorIdleState } from '../../states/character/WarriorIdleState.js';
import { WarriorWalkState } from '../../states/character/WarriorWalkState.js';
import { ElfSpellState } from '../../states/character/ElfSpellState.js';
import { TakeDamageState } from '../../states/character/TakeDamageState.js';
import { AIController } from '../../ai/AIController.js';
import { PatrolBehavior } from '../../ai/behaviors/PatrolBehavior.js';

const SPRITESHEET_PATH = 'assets/spritesheets/elf';

const ANIMATIONS = [
    { key: 'IDLE_LEFT',         file: 'IDLE_LEFT.png',         loop: true,  frameDuration: 150 },
    { key: 'IDLE_RIGHT',        file: 'IDLE_RIGHT.png',        loop: true,  frameDuration: 150 },
    { key: 'WALK_LEFT',         file: 'WALK_LEFT.png',         loop: true,  frameDuration: 100 },
    { key: 'WALK_RIGHT',        file: 'WALK_RIGHT.png',        loop: true,  frameDuration: 100 },
    { key: 'SPELL_LEFT',        file: 'SPELL_LEFT.png',        loop: false, frameDuration: 70 },
    { key: 'SPELL_RIGHT',       file: 'SPELL_RIGHT.png',       loop: false, frameDuration: 70 },
    { key: 'TAKE_DAMAGE_LEFT',  file: 'TAKE_DAMAGE_LEFT.png',  loop: false, frameDuration: 35 },
    { key: 'TAKE_DAMAGE_RIGHT', file: 'TAKE_DAMAGE_RIGHT.png', loop: false, frameDuration: 35 },
];

export class Elf extends Character {
    #ai = null;
    #attackTarget = null;
    #patrol = null;

    /** Callback set externally to spawn floating labels on hit. */
    _onAttackHit = null;

    constructor(opts = {}) {
        super({ width: 160, height: 160, speed: 70, hp: 60, ...opts });
        this.hitbox = { offsetX: 0.25, offsetY: 0.2, w: 0.5, h: 0.7 };
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

        // 'attack' is the state PatrolBehavior transitions to
        this.stateMachine.register('idle', new WarriorIdleState(this));
        this.stateMachine.register('walk', new WarriorWalkState(this));
        this.stateMachine.register('attack', new ElfSpellState(this));
        this.stateMachine.register('takeDamage', new TakeDamageState(this));
        this.stateMachine.transition('idle');
    }

    /** Set up patrol waypoints + ranged attack checks after positioning. */
    setupPatrol(leftX, rightX) {
        this.#patrol = new PatrolBehavior({
            waypoints: [
                { x: rightX, y: 0 },
                { x: leftX, y: 0 },
            ],
            loop: true,
            attackTarget: this.#attackTarget,
            attackRange: 280, // shoots from further away than warrior
            groundBased: true,
        });
        this.#ai = new AIController(this, [this.#patrol]);
    }

    update(deltaTime) {
        const state = this.stateMachine.currentName;
        if (this.#ai && state !== 'attack' && state !== 'takeDamage') {
            this.#ai.update(deltaTime / 1000);
        }
        this.stateMachine.update(deltaTime);
        this.animator.update(deltaTime);
        this.snapToGround();
    }
}
