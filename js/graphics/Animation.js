/**
 * A single animation backed by a SpriteSheet.
 * Tracks current frame and elapsed time.
 */
export class Animation {
    #spriteSheet;
    #frameDuration;
    #loop;
    #currentFrame = 0;
    #elapsed = 0;
    #finished = false;

    /**
     * @param {SpriteSheet} spriteSheet
     * @param {object}      opts
     * @param {number}      opts.frameDuration - ms per frame
     * @param {boolean}     opts.loop          - whether to loop
     */
    constructor(spriteSheet, { frameDuration = 100, loop = true } = {}) {
        this.#spriteSheet = spriteSheet;
        this.#frameDuration = frameDuration;
        this.#loop = loop;
    }

    get currentFrame() { return this.#currentFrame; }
    get frameCount() { return this.#spriteSheet.frameCount; }
    get finished() { return this.#finished; }

    reset() {
        this.#currentFrame = 0;
        this.#elapsed = 0;
        this.#finished = false;
    }

    update(deltaTime) {
        if (this.#finished) return;

        this.#elapsed += deltaTime;

        while (this.#elapsed >= this.#frameDuration) {
            this.#elapsed -= this.#frameDuration;
            this.#currentFrame++;

            if (this.#currentFrame >= this.#spriteSheet.frameCount) {
                if (this.#loop) {
                    this.#currentFrame = 0;
                } else {
                    this.#currentFrame = this.#spriteSheet.frameCount - 1;
                    this.#finished = true;
                    break;
                }
            }
        }
    }

    draw(ctx, x, y, width, height) {
        this.#spriteSheet.drawFrame(ctx, this.#currentFrame, x, y, width, height);
    }

    /** Pixel test at normalised coords for the current frame. */
    isOpaqueAt(fracX, fracY) {
        return this.#spriteSheet.isOpaqueAt(this.#currentFrame, fracX, fracY);
    }
}
