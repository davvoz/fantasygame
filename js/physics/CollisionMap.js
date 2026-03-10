/**
 * Loads a heightmap JSON and provides ground-level queries.
 * The heightmap is an array of Y values (one per canvas X pixel)
 * representing the ground surface.
 */
export class CollisionMap {
    #heightmap = [];
    #canvasWidth = 0;
    #canvasHeight = 0;

    async load(jsonPath) {
        const res = await fetch(jsonPath);
        const data = await res.json();
        this.#heightmap = data.heightmap;
        this.#canvasWidth = data.canvasWidth;
        this.#canvasHeight = data.canvasHeight;
    }

    /**
     * Returns the ground Y for a given X position.
     * Clamps to bounds and interpolates between pixels.
     */
    getGroundY(x) {
        if (this.#heightmap.length === 0) return this.#canvasHeight;

        const clamped = Math.max(0, Math.min(x, this.#canvasWidth - 1));
        const idx = Math.floor(clamped);
        const frac = clamped - idx;

        const y0 = this.#heightmap[idx] ?? this.#canvasHeight;
        const y1 = this.#heightmap[Math.min(idx + 1, this.#heightmap.length - 1)] ?? this.#canvasHeight;

        return y0 + (y1 - y0) * frac;
    }

    /**
     * Returns true if the point is above or at the ground level.
     */
    isAboveGround(x, y) {
        return y <= this.getGroundY(x);
    }
}
