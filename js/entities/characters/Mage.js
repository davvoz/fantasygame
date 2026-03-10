import { Character } from '../Character.js';
import { SpriteSheet } from '../../graphics/SpriteSheet.js';
import { Animation } from '../../graphics/Animation.js';
import { IdleState } from '../../states/character/IdleState.js';
import { WalkState } from '../../states/character/WalkState.js';
import { SpellState } from '../../states/character/SpellState.js';
import { JumpState } from '../../states/character/JumpState.js';
import { CrouchState } from '../../states/character/CrouchState.js';
import { TakeDamageState } from '../../states/character/TakeDamageState.js';
import { BlockState } from '../../states/character/BlockState.js';

const SPRITESHEET_PATH = 'assets/spritesheets/mage';

/**
 * Animation config follows the file naming convention: ACTION_DIRECTION.png
 * Easily extensible — just add a new entry + the matching spritesheet file.
 */
const ANIMATIONS = [
    { key: 'IDLE_LEFT',   file: 'IDLE_LEFT.png',   loop: true,  frameDuration: 150 },
    { key: 'IDLE_RIGHT',  file: 'IDLE_RIGHT.png',  loop: true,  frameDuration: 150 },
    { key: 'WALK_LEFT',   file: 'WALK_LEFT.png',   loop: true,  frameDuration: 100 },
    { key: 'WALK_RIGHT',  file: 'WALK_RIGHT.png',  loop: true,  frameDuration: 100 },
    { key: 'SPELL_LEFT',  file: 'SPELL_LEFT.png',  loop: false, frameDuration: 60 },
    { key: 'SPELL_RIGHT', file: 'SPELL_RIGHT.png', loop: false, frameDuration: 60 },
    { key: 'JUMP_LEFT',   file: 'JUMP_LEFT.png',   loop: false, frameDuration: 100 },
    { key: 'JUMP_RIGHT',  file: 'JUMP_RIGHT.png',  loop: false, frameDuration: 100 },
    { key: 'CROUCH_LEFT',  file: 'CROUCH_LEFT.png',  loop: true, frameDuration: 150 },
    { key: 'CROUCH_RIGHT', file: 'CROUCH_RIGHT.png', loop: true, frameDuration: 150 },
    { key: 'TAKE_DAMAGE_LEFT',  file: 'TAKE_DAMAGE_LEFT.png',  loop: false, frameDuration: 60 },
    { key: 'TAKE_DAMAGE_RIGHT', file: 'TAKE_DAMAGE_RIGHT.png', loop: false, frameDuration: 60 },
    { key: 'BLOCK_LEFT',  file: 'BLOCK_LEFT.png',  loop: true, frameDuration: 150 },
    { key: 'BLOCK_RIGHT', file: 'BLOCK_RIGHT.png', loop: true, frameDuration: 150 },
];

export class Mage extends Character {
    constructor(opts = {}) {
        super({ width: 180, height: 180, speed: 200, ...opts });
        // Tighter hitbox: centered body area, shifted down
        this.hitbox = { offsetX: 0.35, offsetY: 0.35, w: 0.3, h: 0.55 };
    }

    async init() {
        // Load all spritesheets in parallel
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

        // Register states
        this.stateMachine.register('idle',  new IdleState(this));
        this.stateMachine.register('walk',  new WalkState(this));
        this.stateMachine.register('spell', new SpellState(this));
        this.stateMachine.register('jump',  new JumpState(this));
        this.stateMachine.register('crouch', new CrouchState(this));
        this.stateMachine.register('takeDamage', new TakeDamageState(this));
        this.stateMachine.register('block', new BlockState(this));

        // Default state
        this.stateMachine.transition('idle');
    }
}
