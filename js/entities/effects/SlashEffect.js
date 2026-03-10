import { Entity } from '../Entity.js';

const DURATION = 350;  // ms
const PX = 4;          // pixel grid size

/**
 * A flashy, over-the-top pixel-art slash effect.
 * Big sweeping arc with sparks, speed lines, and impact burst.
 */
export class SlashEffect extends Entity {
    #age = 0;
    #alive = true;
    #cx;
    #cy;
    #dirSign;  // +1 = right, -1 = left
    #particles;
    #sparks;
    #speedLines;

    /**
     * @param {number} x      – center X of the slash origin
     * @param {number} y      – center Y of the slash origin
     * @param {string} direction – 'LEFT' or 'RIGHT'
     */
    constructor(x, y, direction) {
        super(x, y, 0, 0);
        this.#cx = x;
        this.#cy = y;
        this.#dirSign = direction === 'RIGHT' ? 1 : -1;
        this.#particles = this.#createArc();
        this.#sparks = this.#createSparks();
        this.#speedLines = this.#createSpeedLines();
    }

    get alive() { return this.#alive; }

    #createArc() {
        const out = [];
        // Main arc — 15 chunky particles
        for (let i = 0; i < 15; i++) {
            const t = i / 14;
            const angle = (t - 0.5) * Math.PI * 0.9; // -81° to +81°
            const reach = 50 + Math.random() * 25;
            const size = PX * 2 + Math.floor(Math.random() * 2) * PX;
            out.push({ angle, reach, size, delay: t * 0.12, type: 'arc' });
        }
        // Secondary inner arc
        for (let i = 0; i < 8; i++) {
            const t = i / 7;
            const angle = (t - 0.5) * Math.PI * 0.6;
            const reach = 25 + Math.random() * 15;
            const size = PX;
            out.push({ angle, reach, size, delay: t * 0.08 + 0.05, type: 'inner' });
        }
        return out;
    }

    #createSparks() {
        const out = [];
        // Explosive sparks flying outward
        for (let i = 0; i < 12; i++) {
            const angle = (Math.random() - 0.5) * Math.PI * 1.2;
            const speed = 150 + Math.random() * 200;
            const size = PX + Math.floor(Math.random() * 2) * PX;
            const life = 0.3 + Math.random() * 0.4;
            out.push({ angle, speed, size, life, delay: Math.random() * 0.1 });
        }
        return out;
    }

    #createSpeedLines() {
        const out = [];
        // Dramatic speed/motion lines
        for (let i = 0; i < 6; i++) {
            const y = (i - 2.5) * 15;
            const length = 40 + Math.random() * 30;
            const delay = Math.random() * 0.05;
            out.push({ y, length, delay });
        }
        return out;
    }

    update(deltaTime) {
        if (!this.#alive) return;
        this.#age += deltaTime;
        if (this.#age >= DURATION) {
            this.#alive = false;
        }
    }

    draw(ctx) {
        if (!this.#alive) return;
        const progress = this.#age / DURATION;
        const t = this.#age / 1000;

        ctx.save();
        ctx.imageSmoothingEnabled = false;

        // ── 1. Background flash burst ──
        if (progress < 0.15) {
            const burstAlpha = 1 - progress / 0.15;
            const burstR = 60 + progress * 200;
            ctx.globalAlpha = burstAlpha * 0.4;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(this.#cx + this.#dirSign * 20, this.#cy, burstR, 0, Math.PI * 2);
            ctx.fill();
        }

        // ── 2. Speed lines (motion blur effect) ──
        if (progress < 0.4) {
            const lineAlpha = 1 - progress / 0.4;
            ctx.globalAlpha = lineAlpha * 0.8;
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = PX;
            for (const line of this.#speedLines) {
                const lp = Math.max(0, (progress - line.delay) / (0.4 - line.delay));
                if (lp <= 0) continue;
                const startX = this.#cx - this.#dirSign * 20;
                const endX = startX + this.#dirSign * line.length * Math.min(1, lp * 2);
                ctx.beginPath();
                ctx.moveTo(startX, this.#cy + line.y);
                ctx.lineTo(endX, this.#cy + line.y);
                ctx.stroke();
            }
        }

        // ── 3. Main arc particles ──
        for (const p of this.#particles) {
            const localProgress = Math.max(0, (progress - p.delay) / (1 - p.delay));
            if (localProgress <= 0) continue;

            // Sweep outward with easing
            const ease = 1 - Math.pow(1 - Math.min(1, localProgress * 1.5), 3);
            const dist = p.reach * ease;
            
            // Fade based on life
            let alpha;
            if (localProgress < 0.5) {
                alpha = 1;
            } else {
                alpha = 1 - (localProgress - 0.5) / 0.5;
            }

            const worldAngle = p.angle + (this.#dirSign === 1 ? 0 : Math.PI);
            const px = this.#cx + Math.cos(worldAngle) * dist;
            const py = this.#cy + Math.sin(worldAngle) * dist;

            // Snap to pixel grid
            const sx = Math.round(px / PX) * PX;
            const sy = Math.round(py / PX) * PX;

            // Color palette: white → cyan → yellow → orange
            let color;
            if (p.type === 'inner') {
                color = localProgress < 0.3 ? '#ffffff' : '#ffeb3b';
            } else {
                const ci = Math.floor(localProgress * 4);
                const colors = ['#ffffff', '#80deea', '#fff176', '#ffab40'];
                color = colors[Math.min(ci, colors.length - 1)];
            }

            ctx.fillStyle = color;
            ctx.globalAlpha = alpha;
            ctx.fillRect(sx - p.size / 2, sy - p.size / 2, p.size, p.size);

            // Trail pixels behind each particle
            if (localProgress > 0.1 && localProgress < 0.7) {
                const trailDist = dist * 0.6;
                const tpx = this.#cx + Math.cos(worldAngle) * trailDist;
                const tpy = this.#cy + Math.sin(worldAngle) * trailDist;
                const tsx = Math.round(tpx / PX) * PX;
                const tsy = Math.round(tpy / PX) * PX;
                ctx.globalAlpha = alpha * 0.5;
                ctx.fillStyle = '#ffcc80';
                ctx.fillRect(tsx - PX / 2, tsy - PX / 2, PX, PX);
            }
        }

        // ── 4. Flying sparks ──
        for (const sp of this.#sparks) {
            const localProgress = Math.max(0, (progress - sp.delay) / sp.life);
            if (localProgress <= 0 || localProgress >= 1) continue;

            const worldAngle = sp.angle + (this.#dirSign === 1 ? 0 : Math.PI);
            const dist = sp.speed * localProgress * (DURATION / 1000);
            const px = this.#cx + Math.cos(worldAngle) * dist;
            const py = this.#cy + Math.sin(worldAngle) * dist + localProgress * 30; // slight gravity

            const sx = Math.round(px / PX) * PX;
            const sy = Math.round(py / PX) * PX;

            const alpha = localProgress < 0.5 ? 1 : 1 - (localProgress - 0.5) / 0.5;
            const sparkColor = localProgress < 0.3 ? '#ffffff' : '#ffd54f';
            
            ctx.globalAlpha = alpha;
            ctx.fillStyle = sparkColor;
            ctx.fillRect(sx - sp.size / 2, sy - sp.size / 2, sp.size, sp.size);
        }

        // ── 5. Central impact cross ──
        if (progress < 0.25) {
            const crossAlpha = 1 - progress / 0.25;
            const crossLen = 25 + progress * 60;
            ctx.globalAlpha = crossAlpha;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = PX * 1.5;
            
            // Diagonal cross
            const ccx = this.#cx + this.#dirSign * 25;
            ctx.beginPath();
            ctx.moveTo(ccx - crossLen, this.#cy - crossLen * 0.7);
            ctx.lineTo(ccx + crossLen, this.#cy + crossLen * 0.7);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(ccx - crossLen, this.#cy + crossLen * 0.7);
            ctx.lineTo(ccx + crossLen, this.#cy - crossLen * 0.7);
            ctx.stroke();
        }

        // ── 6. Impact ring ──
        if (progress > 0.1 && progress < 0.5) {
            const ringProgress = (progress - 0.1) / 0.4;
            const ringR = 20 + ringProgress * 50;
            const ringAlpha = 1 - ringProgress;
            ctx.globalAlpha = ringAlpha * 0.6;
            ctx.strokeStyle = '#fff176';
            ctx.lineWidth = PX;
            ctx.beginPath();
            ctx.arc(this.#cx + this.#dirSign * 30, this.#cy, ringR, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }
}
