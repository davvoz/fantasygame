import { State } from '../State.js';
import { Actions } from '../../input/Actions.js';

export class CrouchState extends State {
    enter() {
        const dir = this.character.direction;
        this.character.animator.play(`CROUCH_${dir}`);
    }

    update(deltaTime, inputManager) {
        // Release crouch → idle
        if (!inputManager.isActive(Actions.CROUCH)) {
            this.character.stateMachine.transition('idle');
            return;
        }

        // Can cast spell while crouched
        if (inputManager.isActive(Actions.SPELL)) {
            this.character.stateMachine.transition('spell');
            return;
        }
    }
}
