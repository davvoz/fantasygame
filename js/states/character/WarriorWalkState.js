import { State } from '../State.js';

export class WarriorWalkState extends State {
    enter() {
        this.character.animator.play(`WALK_${this.character.direction}`);
    }

    update(deltaTime) {
        // AI controller drives movement; animation follows direction
    }
}
