import { State } from '../State.js';
import { Actions } from '../../input/Actions.js';

export class BlockState extends State {
    enter() {
        const dir = this.character.direction;
        this.character.animator.play(`BLOCK_${dir}`);
    }

    update(deltaTime, inputManager) {
        if (!inputManager.isActive(Actions.BLOCK)) {
            this.character.stateMachine.transition('idle');
            return;
        }
    }
}
