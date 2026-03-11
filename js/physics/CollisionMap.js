/**
 * Loads a heightmap JSON and provides ground-level queries.
 * 
 * Supports two formats:
 *   Single-layer (legacy): { canvasWidth, canvasHeight, heightmap: [y, y, ...] }
 *   Multi-layer:           { canvasWidth, canvasHeight, layers: [[y|null, ...], ...] }
 * 
 * In multi-layer mode each layer is an array of Y values (one per X pixel).
 * null entries mean "no surface at this X" (platform gaps).
 * getGroundY(x, feetY) picks the correct surface for a character at feetY.
 */
export class CollisionMap {
    #layers = [];
    #canvasWidth = 0;
    #canvasHeight = 0;

    async load(jsonPath) {
        const res = await fetch(jsonPath);
        const data = await res.json();
        this.#canvasWidth = data.canvasWidth;
        this.#canvasHeight = data.canvasHeight;

        if (data.layers && data.layers.length > 0) {
            this.#layers = data.layers;
        } else if (data.heightmap) {
            this.#layers = [data.heightmap];
        }
    }

    /**
     * Returns the surface Y for a given X, choosing the platform
     * that best matches the character's current feet position.
     *
     * @param {number} x  - World X coordinate
     * @param {number} [feetY=Infinity] - Character feet Y.
     *        Infinity (default) returns the lowest ground — useful for spawning.
     * @returns {number} Surface Y
     */
    getGroundY(x, feetY = Infinity) {
        if (this.#layers.length === 0) return this.#canvasHeight;

        const clamped = Math.max(0, Math.min(x, this.#canvasWidth - 1));
        const idx = Math.floor(clamped);
        const frac = clamped - idx;
        const nextIdx = Math.min(idx + 1, this.#canvasWidth - 1);
        const SNAP = 8;

        // Collect interpolated surface Y from every layer at this X
        const surfaces = [];
        for (const layer of this.#layers) {
            const y0 = layer[idx];
            if (y0 == null) continue;
            const y1 = layer[nextIdx];
            surfaces.push(y1 != null ? y0 + (y1 - y0) * frac : y0);
        }

        if (surfaces.length === 0) return this.#canvasHeight;

        // Sort ascending (topmost platform = smallest Y first)
        surfaces.sort((a, b) => a - b);

        // First surface at or just below the character's feet
        for (const s of surfaces) {
            if (s >= feetY - SNAP) return s;
        }

        // All surfaces are above the character — return lowest ground
        return surfaces[surfaces.length - 1];
    }

    /**
     * Returns true if the point is above or at the ground level.
     */
    isAboveGround(x, y) {
        return y <= this.getGroundY(x, y);
    }

    /**
     * Draw heightmap lines on the canvas for debug purposes.
     * Each layer gets a distinct color.
     */
    debugDraw(ctx) {
        const colors = ['#ff3333', '#33ccff', '#ffcc33', '#ff33ff', '#33ff99', '#ff9933'];
        ctx.save();
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.7;

        for (let li = 0; li < this.#layers.length; li++) {
            const layer = this.#layers[li];
            ctx.strokeStyle = colors[li % colors.length];
            ctx.beginPath();
            let drawing = false;
            for (let x = 0; x < layer.length; x++) {
                if (layer[x] != null) {
                    if (!drawing) { ctx.moveTo(x, layer[x]); drawing = true; }
                    else ctx.lineTo(x, layer[x]);
                } else {
                    if (drawing) { ctx.stroke(); ctx.beginPath(); drawing = false; }
                }
            }
            if (drawing) ctx.stroke();
        }

        ctx.restore();
    }
}
