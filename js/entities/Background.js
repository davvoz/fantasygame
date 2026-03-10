import { Entity } from './Entity.js';

/**
 * A static or scrolling background image.
 * Drawn at z-order 0 (before all other entities) by being first in the entity list.
 */
export class Background extends Entity {
    #image;
    #loaded = false;
    #loadPromise;

    constructor(imagePath, canvasWidth, canvasHeight) {
        super(0, 0, canvasWidth, canvasHeight);
        this.#image = new Image();
        this.#loadPromise = new Promise((resolve, reject) => {
            this.#image.onload = () => {
                this.#loaded = true;
                resolve(this);
            };
            this.#image.onerror = () => reject(new Error(`Failed to load background: ${imagePath}`));
        });
        this.#image.src = imagePath;
    }

    load() {
        return this.#loadPromise;
    }

    draw(ctx) {
        if (!this.#loaded) return;
        ctx.drawImage(this.#image, 0, 0, this.width, this.height);
    }
}
