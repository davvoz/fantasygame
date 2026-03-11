import { State } from '../State.js';
import { Actions } from '../../input/Actions.js';
import { Direction } from '../../entities/Direction.js';

const JUMP_VELOCITY = -400;   // initial upward velocity (px/s, negative = up)
const GRAVITY       =  1200;  // px/s²

export class JumpState extends State {
    #hasLanded = false;

    enter() {
        this.#hasLanded = false;
        const ch = this.character;
        ch.airborne = true;
        ch.velocityY = ch.jumpVelocity ?? JUMP_VELOCITY;
        ch.animator.play(`JUMP_${ch.direction}`);
    }

    exit() {
        const ch = this.character;
        ch.airborne = false;
        ch.velocityY = 0;
    }

    update(deltaTime, inputManager) {
        const ch = this.character;
        const dt = deltaTime / 1000;

        // Allow horizontal movement in air
        if (inputManager.isActive(Actions.MOVE_LEFT)) {
            ch.direction = Direction.LEFT;
            ch.x -= ch.speed * dt;
        } else if (inputManager.isActive(Actions.MOVE_RIGHT)) {
            ch.direction = Direction.RIGHT;
            ch.x += ch.speed * dt;
        }

        // Apply gravity
        ch.velocityY += GRAVITY * dt;
        ch.y += ch.velocityY * dt;

        // Check landing
        const groundY = ch.getGroundY();
        const feetY = ch.y + ch.height;

        if (feetY >= groundY && ch.velocityY > 0) {
            // Landed
            ch.y = groundY - ch.height;
            ch.velocityY = 0;
            ch.airborne = false;
            this.#hasLanded = true;
            ch.stateMachine.transition('idle');
        }
    }
}
