/**
 * Loads a horizontal-strip spritesheet and extracts frames.
 * Auto-detects frame count when frames are roughly square (width ≈ height).
 */
export class SpriteSheet {
    #image;
    #frameWidth;
    #frameHeight;
    #frameCount;
    #loaded = false;
    #loadPromise;
    #masks = null;

    /**
     * @param {string} imagePath  - path to the spritesheet image
     * @param {number|null} frameCount - override auto-detection
     */
    constructor(imagePath, frameCount = null) {
        this.#image = new Image();
        this.#loadPromise = new Promise((resolve, reject) => {
            this.#image.onload = () => {
                this.#frameHeight = this.#image.height;
                if (frameCount) {
                    this.#frameCount = frameCount;
                } else {
                    // Auto-detect: assume each frame is roughly square
                    this.#frameCount = Math.round(this.#image.width / this.#frameHeight);
                }
                // Exact width eliminates progressive drift across frames
                this.#frameWidth = this.#image.width / this.#frameCount;
                this.#buildMasks();
                this.#loaded = true;
                resolve(this);
            };
            this.#image.onerror = () => reject(new Error(`Failed to load: ${imagePath}`));
        });
        this.#image.src = imagePath;
    }

    get loaded() { return this.#loaded; }
    get frameCount() { return this.#frameCount; }
    get frameWidth() { return this.#frameWidth; }
    get frameHeight() { return this.#frameHeight; }

    load() {
        return this.#loadPromise;
    }

    drawFrame(ctx, frameIndex, x, y, width, height) {
        if (!this.#loaded) return;
        // Integer source rect to avoid sub-pixel blurring on non-integer frameWidth
        const sx = Math.floor(frameIndex * this.#frameWidth);
        const sw = Math.floor((frameIndex + 1) * this.#frameWidth) - sx;
        ctx.drawImage(
            this.#image,
            sx, 0, sw, this.#frameHeight,
            x, y, width ?? sw, height ?? this.#frameHeight
        );
    }

    /** Check if a pixel is opaque for a given frame at normalised coords (0-1). */
    isOpaqueAt(frameIndex, fracX, fracY) {
        if (!this.#masks || frameIndex < 0 || frameIndex >= this.#frameCount) return false;
        const m = this.#masks[frameIndex];
        const px = Math.floor(fracX * m.w);
        const py = Math.floor(fracY * m.h);
        if (px < 0 || px >= m.w || py < 0 || py >= m.h) return false;
        return m.data[py * m.w + px] === 1;
    }

    /** Pre-compute per-frame alpha masks from the spritesheet image. */
    #buildMasks() {
        const c = document.createElement('canvas');
        c.width = this.#image.width;
        c.height = this.#image.height;
        const ctx = c.getContext('2d');
        ctx.drawImage(this.#image, 0, 0);
        const imgData = ctx.getImageData(0, 0, c.width, c.height).data;

        this.#masks = [];
        for (let f = 0; f < this.#frameCount; f++) {
            const sx = Math.floor(f * this.#frameWidth);
            const sw = Math.floor((f + 1) * this.#frameWidth) - sx;
            const mask = new Uint8Array(sw * this.#frameHeight);
            for (let y = 0; y < this.#frameHeight; y++) {
                for (let x = 0; x < sw; x++) {
                    const idx = ((y * c.width) + (sx + x)) * 4;
                    mask[y * sw + x] = imgData[idx + 3] > 32 ? 1 : 0;
                }
            }
            this.#masks.push({ data: mask, w: sw, h: this.#frameHeight });
        }
    }
}
