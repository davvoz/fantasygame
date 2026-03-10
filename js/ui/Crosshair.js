const SIZE = 10;
const GAP  = 4;
const THICK = 2;

/**
 * Pixel-art crosshair that follows the mouse cursor.
 * Drawn as four short lines around a central gap.
 */
export class Crosshair {
    #inputManager;

    constructor(inputManager) {
        this.#inputManager = inputManager;
    }

    update() { /* position comes from inputManager live */ }

    draw(ctx) {
        const mx = this.#inputManager.mouseX;
        const my = this.#inputManager.mouseY;

        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.lineWidth = THICK;
        ctx.strokeStyle = '#ffb347';
        ctx.shadowColor = '#1a0a5e';
        ctx.shadowBlur = 0;

        // Outline (draw thicker behind)
        ctx.lineWidth = THICK + 2;
        ctx.strokeStyle = '#1a0a5e';
        this.#drawLines(ctx, mx, my);

        // Main crosshair
        ctx.lineWidth = THICK;
        ctx.strokeStyle = '#ffb347';
        this.#drawLines(ctx, mx, my);

        // Center dot
        ctx.fillStyle = '#ffb347';
        ctx.fillRect(mx - 1, my - 1, 2, 2);

        ctx.restore();
    }

    #drawLines(ctx, mx, my) {
        ctx.beginPath();
        // top
        ctx.moveTo(mx, my - GAP);
        ctx.lineTo(mx, my - GAP - SIZE);
        // bottom
        ctx.moveTo(mx, my + GAP);
        ctx.lineTo(mx, my + GAP + SIZE);
        // left
        ctx.moveTo(mx - GAP, my);
        ctx.lineTo(mx - GAP - SIZE, my);
        // right
        ctx.moveTo(mx + GAP, my);
        ctx.lineTo(mx + GAP + SIZE, my);
        ctx.stroke();
    }
}
