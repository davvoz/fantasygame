import { State } from '../State.js';
import { Actions } from '../../input/Actions.js';
import { Direction } from '../../entities/Direction.js';

export class WalkState extends State {
    enter() {
        this.character.animator.play(`WALK_${this.character.direction}`);
    }

    update(deltaTime, inputManager) {
        // Jump has priority
        if (inputManager.isActive(Actions.JUMP)) {
            this.character.stateMachine.transition('jump');
            return;
        }
        // Spell has priority
        if (inputManager.isActive(Actions.SPELL)) {
            this.character.stateMachine.transition('spell');
            return;
        }
        // Crouch
        if (inputManager.isActive(Actions.CROUCH)) {
            this.character.stateMachine.transition('crouch');
            return;
        }
        // Block
        if (inputManager.isActive(Actions.BLOCK)) {
            this.character.stateMachine.transition('block');
            return;
        }

        const left  = inputManager.isActive(Actions.MOVE_LEFT);
        const right = inputManager.isActive(Actions.MOVE_RIGHT);

        // No movement → idle
        if (!left && !right) {
            this.character.stateMachine.transition('idle');
            return;
        }

        // Determine direction and move
        const dt = deltaTime / 1000; // seconds

        if (left) {
            if (this.character.direction !== Direction.LEFT) {
                this.character.direction = Direction.LEFT;
                this.character.animator.play(`WALK_${Direction.LEFT}`);
            }
            this.character.x -= this.character.speed * dt;
        }

        if (right) {
            if (this.character.direction !== Direction.RIGHT) {
                this.character.direction = Direction.RIGHT;
                this.character.animator.play(`WALK_${Direction.RIGHT}`);
            }
            this.character.x += this.character.speed * dt;
        }
    }
}
