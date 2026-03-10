import { State } from '../State.js';
import { Actions } from '../../input/Actions.js';
import { Direction } from '../../entities/Direction.js';

export class IdleState extends State {
    enter() {
        const dir = this.character.direction;
        this.character.animator.play(`IDLE_${dir}`);
    }

    update(deltaTime, inputManager) {
        if (inputManager.isActive(Actions.JUMP)) {
            this.character.stateMachine.transition('jump');
            return;
        }
        if (inputManager.isActive(Actions.SPELL)) {
            this.character.stateMachine.transition('spell');
            return;
        }
        if (inputManager.isActive(Actions.CROUCH)) {
            this.character.stateMachine.transition('crouch');
            return;
        }
        if (inputManager.isActive(Actions.BLOCK)) {
            this.character.stateMachine.transition('block');
            return;
        }
        if (inputManager.isActive(Actions.MOVE_LEFT)) {
            this.character.direction = Direction.LEFT;
            this.character.stateMachine.transition('walk');
            return;
        }
        if (inputManager.isActive(Actions.MOVE_RIGHT)) {
            this.character.direction = Direction.RIGHT;
            this.character.stateMachine.transition('walk');
            return;
        }
    }
}
