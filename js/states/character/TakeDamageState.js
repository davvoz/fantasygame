import { State } from '../State.js';

export class TakeDamageState extends State {
    enter() {
        const dir = this.character.direction;
        this.character.animator.play(`TAKE_DAMAGE_${dir}`);
    }

    update(deltaTime, inputManager) {
        const anim = this.character.animator.current;
        // If no take-damage animation exists, go back to idle immediately
        if (!anim) {
            this.character.stateMachine.transition('idle');
            return;
        }

        if (anim.finished) {
            this.character.stateMachine.transition('idle');
        }
    }
}
