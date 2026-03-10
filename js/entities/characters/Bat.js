import { Character } from '../Character.js';
import { SpriteSheet } from '../../graphics/SpriteSheet.js';
import { Animation } from '../../graphics/Animation.js';
import { BatIdleState } from '../../states/character/BatIdleState.js';
import { TakeDamageState } from '../../states/character/TakeDamageState.js';

const SPRITESHEET_PATH = 'assets/spritesheets/bat';
const FRAME_COUNT = 11;

const ANIMATIONS = [
    { key: 'IDLE_LEFT',  file: 'IDLE_LEFT.png',  loop: true, frameDuration: 100 },
    { key: 'IDLE_RIGHT', file: 'IDLE_RIGHT.png', loop: true, frameDuration: 100 },
    { key: 'TAKE_DAMAGE_LEFT',  file: 'TAKE_DAMAGE_LEFT.png',  loop: false, frameDuration: 60 },
    { key: 'TAKE_DAMAGE_RIGHT', file: 'TAKE_DAMAGE_RIGHT.png', loop: false, frameDuration: 60 },
];

export class Bat extends Character {
    #target = null;

    constructor(opts = {}) {
        super({ width: 120, height: 120, speed: 60, hp: 50, ...opts });
        // Tighter hitbox: central body
        this.hitbox = { offsetX: 0.2, offsetY: 0.2, w: 0.6, h: 0.6 };
    }

    get target() { return this.#target; }
    set target(t) { this.#target = t; }

    async init() {
        const loadTasks = ANIMATIONS.map(async (cfg) => {
            const sheet = new SpriteSheet(`${SPRITESHEET_PATH}/${cfg.file}`, FRAME_COUNT);
            await sheet.load();
            const anim = new Animation(sheet, {
                frameDuration: cfg.frameDuration,
                loop: cfg.loop,
            });
            this.animator.register(cfg.key, anim);
        });

        await Promise.all(loadTasks);

        this.stateMachine.register('idle', new BatIdleState(this));
        this.stateMachine.register('takeDamage', new TakeDamageState(this));
        this.stateMachine.transition('idle');
    }

    update(deltaTime) {
        this.stateMachine.update(deltaTime);
        this.animator.update(deltaTime);
    }
}
