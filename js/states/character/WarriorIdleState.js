import { State } from '../State.js';

export class WarriorIdleState extends State {
    enter() {
        this.character.animator.play(`IDLE_${this.character.direction}`);
    }

    update(deltaTime) {
        // AI controller drives movement; if moving, switch to walk
        // This state is entered when the warrior stops or on init
    }
}
