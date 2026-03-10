import { Entity } from '../Entity.js';

const RISE_SPEED   = 40;  // px/sec upward
const DURATION     = 900; // ms total
const FADE_START   = 500; // ms when alpha begins fading

/**
 * A floating text label that rises and fades out.
 * Used for damage numbers, "BLOCKED!", status text, etc.
 * Requires a shared BitmapFont instance.
 */
export class FloatingLabel extends Entity {
    #text;
    #font;
    #scale;
    #age = 0;
    #alive = true;
    #color;

    /**
     * @param {string} text - the text to display
     * @param {number} x - center x position
     * @param {number} y - starting y position
     * @param {import('../../graphics/BitmapFont.js').BitmapFont} font
     * @param {object} opts
     * @param {number} opts.scale
     * @param {string} opts.color - tint color (not used with bitmap, but reserved)
     */
    constructor(text, x, y, font, { scale = 1 } = {}) {
        super(x, y, 0, 0);
        this.#text = text;
        this.#font = font;
        this.#scale = scale;
    }

    get alive() { return this.#alive; }

    update(deltaTime) {
        if (!this.#alive) return;
        this.#age += deltaTime;
        this.y -= RISE_SPEED * (deltaTime / 1000);
        if (this.#age >= DURATION) this.#alive = false;
    }

    draw(ctx) {
        if (!this.#alive) return;
        const alpha = this.#age < FADE_START
            ? 1
            : 1 - (this.#age - FADE_START) / (DURATION - FADE_START);

        this.#font.drawText(ctx, this.#text, this.x, this.y, {
            scale: this.#scale,
            align: 'center',
            alpha: Math.max(0, alpha),
        });
    }
}
