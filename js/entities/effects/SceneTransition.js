import { Entity } from '../Entity.js';

const PX = 3;

/**
 * Professional scene transition effect (diamond-wipe + pixel dissolve).
 * Plays a full-screen animation that covers the screen, then reveals the next scene.
 *
 * Two halves:
 *  1. coverPhase  (0 → coverDuration): Diamond shards grow from center, covering everything in black.
 *  2. revealPhase (coverDuration → totalDuration): Shards shrink/scatter to reveal the new scene.
 *
 * Designed to sit between CelebrationScene.fadeOut and LevelTransitionAnimation.fadeIn.
 */
export class SceneTransition extends Entity {
    #alive = true;
    #age = 0;
    #width;
    #height;
    #onCovered;   // callback when screen is fully covered (swap scenes here)
    #onComplete;  // callback when transition finishes
    #coveredFired = false;
    #coveredReady = false; // true once async onCovered has resolved

    #primaryColor;

    // Shards (diamond tiles that cover the screen)
    #shards = [];
    #tileSize;
    #cols;
    #rows;

    // Timing
    #coverDuration = 600;    // ms to fully cover
    #holdDuration = 300;     // ms to hold black
    #revealDuration = 600;   // ms to reveal

    // Pixel-dissolve particles during reveal
    #dissolveParticles = [];

    constructor(width, height, primaryColor, onCovered, onComplete) {
        super(0, 0, width, height);
        this.#width = width;
        this.#height = height;
        this.#primaryColor = primaryColor;
        this.#onCovered = onCovered;
        this.#onComplete = onComplete;

        this.#tileSize = PX * 10; // 30px tiles
        this.#cols = Math.ceil(width / this.#tileSize) + 1;
        this.#rows = Math.ceil(height / this.#tileSize) + 1;

        this.#initShards();
    }

    get alive() { return this.#alive; }
    set alive(v) { this.#alive = v; }

    get totalDuration() {
        return this.#coverDuration + this.#holdDuration + this.#revealDuration;
    }

    #initShards() {
        const cx = this.#cols / 2;
        const cy = this.#rows / 2;

        for (let r = 0; r < this.#rows; r++) {
            for (let c = 0; c < this.#cols; c++) {
                // Distance from center determines delay (diamond shape)
                const dist = Math.abs(c - cx) + Math.abs(r - cy);
                const maxDist = cx + cy;
                const coverDelay = (dist / maxDist) * this.#coverDuration * 0.7;
                const revealDelay = ((maxDist - dist) / maxDist) * this.#revealDuration * 0.7;

                this.#shards.push({
                    col: c,
                    row: r,
                    x: c * this.#tileSize,
                    y: r * this.#tileSize,
                    coverDelay,
                    revealDelay,
                    scale: 0,       // 0 = invisible, 1 = full tile
                    alpha: 1,
                });
            }
        }
    }

    update(deltaTime) {
        if (!this.#alive) return;
        this.#age += deltaTime;

        const coverEnd = this.#coverDuration;
        const holdEnd = coverEnd + this.#holdDuration;
        const revealEnd = holdEnd + this.#revealDuration;

        if (this.#age <= coverEnd) {
            // Cover phase — shards grow from center outward
            for (const s of this.#shards) {
                const elapsed = this.#age - s.coverDelay;
                if (elapsed > 0) {
                    const t = Math.min(1, elapsed / (this.#coverDuration * 0.3));
                    s.scale = this.#easeOutQuad(t);
                }
            }
        } else if (!this.#coveredReady) {
            // Fully covered — fire callback once, then wait for it to resolve
            for (const s of this.#shards) s.scale = 1;
            if (!this.#coveredFired) {
                this.#coveredFired = true;
                if (this.#onCovered) {
                    Promise.resolve(this.#onCovered()).then(() => {
                        this.#coveredReady = true;
                        // Reset age to start reveal timing from now
                        this.#age = coverEnd + this.#holdDuration;
                    });
                } else {
                    this.#coveredReady = true;
                    this.#age = coverEnd + this.#holdDuration;
                }
            }
            // Hold black — don't advance phases
        } else if (this.#age <= holdEnd + this.#revealDuration) {
            // Reveal phase — shards shrink from center outward
            const revealAge = this.#age - holdEnd;
            for (const s of this.#shards) {
                const elapsed = revealAge - s.revealDelay;
                if (elapsed > 0) {
                    const t = Math.min(1, elapsed / (this.#revealDuration * 0.3));
                    s.scale = 1 - this.#easeOutQuad(t);
                }
            }
        } else {
            this.#alive = false;
            if (this.#onComplete) this.#onComplete();
        }
    }

    draw(ctx) {
        if (!this.#alive) return;
        ctx.save();
        ctx.imageSmoothingEnabled = false;

        // Full black background — prevents anything underneath from showing through gaps
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, this.#width, this.#height);

        for (const s of this.#shards) {
            if (s.scale <= 0) continue;

            const size = this.#tileSize * s.scale;
            const cx = s.x + this.#tileSize / 2;
            const cy = s.y + this.#tileSize / 2;

            // Main black shard
            ctx.fillStyle = '#000000';
            ctx.fillRect(
                cx - size / 2,
                cy - size / 2,
                size,
                size
            );

            // Colored edge highlight (thin border on growing/shrinking shards)
            if (s.scale > 0.05 && s.scale < 0.95) {
                ctx.strokeStyle = this.#primaryColor;
                ctx.lineWidth = PX;
                ctx.globalAlpha = 0.6;
                ctx.strokeRect(
                    cx - size / 2,
                    cy - size / 2,
                    size,
                    size
                );
                ctx.globalAlpha = 1;
            }
        }

        ctx.restore();
    }

    #easeOutQuad(t) {
        return t * (2 - t);
    }
}
