import { Entity } from '../Entity.js';

const PX = 3; // Pixel size for effects

/**
 * Epic level transition animation.
 * Shows level number and name with dramatic effects.
 * Configurable per-level theme colors.
 */
export class LevelTransitionAnimation extends Entity {
    #alive = true;
    #age = 0;
    #width;
    #height;
    #onComplete;
    #font;
    #level;
    #phase = 'fadeIn';
    
    // Animation data
    #levelNumChars = [];
    #levelNameChars = [];
    #killsChars = [];
    
    // Effects
    #sparks = [];
    #particles = [];
    #scanlines = [];
    
    // Theme colors (from level config)
    #primaryColor;
    #secondaryColor;
    #backgroundColor;
    
    // Background image
    #bgImage;
    #bgLoaded = false;
    
    // Precomputed
    #levelNumText;
    #levelNameText;
    #killsText;
    
    // Dynamic scales (computed to fit canvas)
    #levelNumScale;
    #levelNameScale;
    #killsScale;
    
    // Multi-line support for level name
    #levelNameLines = [];  // Array of {text, chars} for each line

    /**
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @param {import('../../levels/LevelConfig.js').LevelDefinition} level - Level config
     * @param {BitmapFont} font - Bitmap font
     * @param {Function} onComplete - Called when animation finishes
     */
    constructor(width, height, level, font, onComplete) {
        super(0, 0, width, height);
        this.#width = width;
        this.#height = height;
        this.#level = level;
        this.#font = font;
        this.#onComplete = onComplete;
        
        // Extract theme colors
        this.#primaryColor = level.theme.primaryColor;
        this.#secondaryColor = level.theme.secondaryColor;
        this.#backgroundColor = level.theme.backgroundColor;
        
        // Build text
        this.#levelNumText = `LEVEL ${level.order}`;
        this.#levelNameText = level.name.toUpperCase();
        this.#killsText = `DEFEAT ${level.spawnConfig.killsToComplete} ENEMIES`;
        
        // Load background image
        this.#bgImage = new Image();
        this.#bgImage.onload = () => { this.#bgLoaded = true; };
        this.#bgImage.src = level.backgroundPath;
        
        this.#computeScales();
        this.#initChars();
        this.#initParticles();
        this.#initScanlines();
    }

    get alive() { return this.#alive; }
    set alive(v) { this.#alive = v; }

    skip() {
        this.#alive = false;
        if (this.#onComplete) this.#onComplete();
    }

    /**
     * Compute dynamic scales so text fits within the canvas.
     * Splits the level name into multiple lines if needed.
     */
    #computeScales() {
        const maxW = this.#width * 0.85; // 85% of canvas as max text width
        
        // Level num: ideal 4, clamp to fit
        this.#levelNumScale = this.#fitScale(this.#levelNumText, 4, maxW);
        
        // Kills text: ideal 1.5, clamp to fit
        this.#killsScale = this.#fitScale(this.#killsText, 1.5, maxW);
        
        // Level name: ideal 2.5, try to fit in one line first
        const idealNameScale = 2.5;
        const nameWidth = this.#font && this.#font.loaded
            ? this.#font.measureText(this.#levelNameText, idealNameScale)
            : this.#levelNameText.length * 20 * idealNameScale;
        
        if (nameWidth <= maxW) {
            // Fits in one line
            this.#levelNameScale = idealNameScale;
            this.#levelNameLines = [this.#levelNameText];
        } else {
            // Try wrapping into multiple lines at word boundaries
            this.#levelNameLines = this.#wrapText(this.#levelNameText, idealNameScale, maxW);
            
            if (this.#levelNameLines.length <= 1) {
                // Single long word - scale down to fit
                this.#levelNameScale = this.#fitScale(this.#levelNameText, idealNameScale, maxW);
                this.#levelNameLines = [this.#levelNameText];
            } else {
                // Check each line fits; if not, reduce scale
                this.#levelNameScale = idealNameScale;
                for (const line of this.#levelNameLines) {
                    const lineScale = this.#fitScale(line, idealNameScale, maxW);
                    if (lineScale < this.#levelNameScale) {
                        this.#levelNameScale = lineScale;
                    }
                }
            }
        }
    }

    /**
     * Compute scale that fits text within maxWidth.
     */
    #fitScale(text, idealScale, maxWidth) {
        if (!this.#font || !this.#font.loaded) return idealScale;
        const measured = this.#font.measureText(text, idealScale);
        if (measured <= maxWidth) return idealScale;
        return idealScale * (maxWidth / measured);
    }

    /**
     * Wrap text at word boundaries (split by spaces and hyphens).
     */
    #wrapText(text, scale, maxWidth) {
        const words = text.split(/(?<=[\s\-])/); // split keeping delimiters
        const lines = [];
        let currentLine = '';
        
        for (const word of words) {
            const testLine = currentLine + word;
            const testWidth = this.#font && this.#font.loaded
                ? this.#font.measureText(testLine.trim(), scale)
                : testLine.trim().length * 20 * scale;
            
            if (testWidth > maxWidth && currentLine.length > 0) {
                lines.push(currentLine.trim());
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine.trim().length > 0) {
            lines.push(currentLine.trim());
        }
        return lines.length > 0 ? lines : [text];
    }

    #initChars() {
        // Level number chars (e.g., "LEVEL 2")
        for (let i = 0; i < this.#levelNumText.length; i++) {
            this.#levelNumChars.push({
                char: this.#levelNumText[i],
                alpha: 0,
                scale: 0,
                delay: i * 60,
                offsetY: 0,
                offsetX: 0,
                glitch: 0,
            });
        }
        
        // Level name chars — built per line, flat array with line index
        this.#levelNameChars = [];
        let charIndex = 0;
        for (let lineIdx = 0; lineIdx < this.#levelNameLines.length; lineIdx++) {
            const lineText = this.#levelNameLines[lineIdx];
            for (let i = 0; i < lineText.length; i++) {
                this.#levelNameChars.push({
                    char: lineText[i],
                    alpha: 0,
                    scale: 0,
                    delay: charIndex * 40,
                    offsetY: 0,
                    offsetX: 0,
                    glitch: 0,
                    line: lineIdx,        // which line this char belongs to
                    indexInLine: i,        // char index within its line
                });
                charIndex++;
            }
        }
        
        // Kills text chars
        for (let i = 0; i < this.#killsText.length; i++) {
            this.#killsChars.push({
                char: this.#killsText[i],
                alpha: 0,
                scale: 0,
                delay: i * 25,
                offsetY: 0,
            });
        }
    }

    #initParticles() {
        // Energy particles flying in from sides
        for (let i = 0; i < 60; i++) {
            const fromLeft = Math.random() > 0.5;
            this.#particles.push({
                x: fromLeft ? -50 : this.#width + 50,
                y: this.#height * 0.3 + Math.random() * this.#height * 0.4,
                targetX: this.#width / 2 + (Math.random() - 0.5) * 200,
                targetY: this.#height / 2 + (Math.random() - 0.5) * 100,
                speed: 0.02 + Math.random() * 0.03,
                progress: 0,
                size: 2 + Math.random() * 3,
                alpha: 0,
                delay: Math.random() * 800,
                hue: this.#parseHue(this.#primaryColor),
            });
        }
    }

    #initScanlines() {
        // Horizontal scanlines for retro effect
        for (let i = 0; i < 8; i++) {
            this.#scanlines.push({
                y: Math.random() * this.#height,
                speed: 100 + Math.random() * 200,
                alpha: 0.1 + Math.random() * 0.2,
                height: 1 + Math.random() * 2,
            });
        }
    }

    #parseHue(hexColor) {
        // Extract approximate hue from hex color
        const r = parseInt(hexColor.slice(1, 3), 16) / 255;
        const g = parseInt(hexColor.slice(3, 5), 16) / 255;
        const b = parseInt(hexColor.slice(5, 7), 16) / 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0;
        if (max !== min) {
            const d = max - min;
            if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
            else if (max === g) h = ((b - r) / d + 2) / 6;
            else h = ((r - g) / d + 4) / 6;
        }
        return Math.round(h * 360);
    }

    update(deltaTime) {
        if (!this.#alive) return;
        this.#age += deltaTime;
        const dt = deltaTime / 1000;

        // Update scanlines
        for (const s of this.#scanlines) {
            s.y += s.speed * dt;
            if (s.y > this.#height) s.y = -10;
        }

        // Update particles
        for (const p of this.#particles) {
            if (this.#age > p.delay) {
                p.progress = Math.min(1, p.progress + p.speed * deltaTime);
                p.x = this.#lerp(p.x, p.targetX, p.progress);
                p.y = this.#lerp(p.y, p.targetY, p.progress);
                p.alpha = p.progress < 0.5 ? p.progress * 2 : 2 - p.progress * 2;
            }
        }

        // Update sparks
        for (let i = this.#sparks.length - 1; i >= 0; i--) {
            const s = this.#sparks[i];
            s.x += s.vx;
            s.y += s.vy;
            s.vy += 0.15;
            s.life -= deltaTime;
            if (s.life <= 0) this.#sparks.splice(i, 1);
        }

        // Phase transitions
        const fadeInTime = 300;
        const levelNumTime = 1200;
        const levelNameTime = 2400;
        const killsTime = 3200;
        const holdTime = 3800;
        const fadeOutTime = 4200;

        if (this.#age < fadeInTime) {
            this.#phase = 'fadeIn';
        } else if (this.#age < levelNumTime) {
            this.#phase = 'levelNum';
            this.#updateLevelNumChars();
        } else if (this.#age < levelNameTime) {
            this.#phase = 'levelName';
            this.#updateLevelNameChars();
        } else if (this.#age < killsTime) {
            this.#phase = 'kills';
            this.#updateKillsChars();
        } else if (this.#age < holdTime) {
            this.#phase = 'hold';
        } else if (this.#age < fadeOutTime) {
            this.#phase = 'fadeOut';
        } else {
            this.#alive = false;
            if (this.#onComplete) this.#onComplete();
        }
    }

    #updateLevelNumChars() {
        const phaseAge = this.#age - 300;
        const targetScale = this.#levelNumScale;
        for (const char of this.#levelNumChars) {
            const charAge = phaseAge - char.delay;
            if (charAge > 0) {
                const t = Math.min(1, charAge / 150);
                char.scale = this.#easeOutBack(t) * targetScale;
                char.alpha = Math.min(1, charAge / 100);
                char.offsetY = -Math.sin(t * Math.PI) * 20;
                char.glitch = charAge < 100 ? (Math.random() - 0.5) * 6 : 0;
                
                // Sparks on appear
                if (charAge > 0 && charAge < 25 && Math.random() > 0.6) {
                    const idx = this.#levelNumChars.indexOf(char);
                    const x = this.#getCharX(this.#levelNumText, idx, targetScale) + 40;
                    this.#addSparks(x, this.#height * 0.35, this.#primaryColor);
                }
            }
        }
    }

    #updateLevelNameChars() {
        // Keep level num visible
        const numScale = this.#levelNumScale;
        for (const char of this.#levelNumChars) {
            char.scale = numScale;
            char.alpha = 1;
            char.offsetY = 0;
            char.glitch = 0;
        }
        
        const targetScale = this.#levelNameScale;
        const phaseAge = this.#age - 1200;
        for (const char of this.#levelNameChars) {
            const charAge = phaseAge - char.delay;
            if (charAge > 0) {
                const t = Math.min(1, charAge / 120);
                char.scale = this.#easeOutElastic(t) * targetScale;
                char.alpha = Math.min(1, charAge / 80);
                char.offsetX = charAge < 80 ? (Math.random() - 0.5) * 4 : 0;
                
                // Sparks
                if (charAge > 0 && charAge < 20 && Math.random() > 0.7) {
                    const lineText = this.#levelNameLines[char.line];
                    const x = this.#getCharX(lineText, char.indexInLine, targetScale) + 20;
                    const lineY = this.#getLevelNameLineY(char.line);
                    this.#addSparks(x, lineY, this.#secondaryColor);
                }
            }
        }
    }

    #updateKillsChars() {
        // Keep previous visible
        const numScale = this.#levelNumScale;
        const nameScale = this.#levelNameScale;
        for (const char of this.#levelNumChars) {
            char.scale = numScale;
            char.alpha = 1;
        }
        for (const char of this.#levelNameChars) {
            char.scale = nameScale;
            char.alpha = 1;
            char.offsetX = 0;
        }
        
        const targetScale = this.#killsScale;
        const phaseAge = this.#age - 2400;
        for (const char of this.#killsChars) {
            const charAge = phaseAge - char.delay;
            if (charAge > 0) {
                const t = Math.min(1, charAge / 100);
                char.scale = t * targetScale;
                char.alpha = Math.min(1, charAge / 60);
            }
        }
    }

    #getCharX(text, index, scale) {
        if (!this.#font || !this.#font.loaded) return 0;
        const totalWidth = this.#font.measureText(text, scale);
        const startX = (this.#width - totalWidth) / 2;
        let x = startX;
        for (let i = 0; i < index; i++) {
            x += this.#font.measureText(text[i], scale) + 2 * scale;
        }
        return x;
    }

    #addSparks(x, y, color) {
        for (let i = 0; i < 6; i++) {
            this.#sparks.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 8,
                vy: -Math.random() * 5 - 2,
                color,
                life: 400 + Math.random() * 200,
                size: PX,
            });
        }
    }

    #easeOutBack(t) {
        const c = 1.7;
        return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
    }

    #easeOutElastic(t) {
        if (t === 0 || t === 1) return t;
        return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
    }

    #lerp(a, b, t) {
        return a + (b - a) * t;
    }

    #px(v) { return Math.round(v / PX) * PX; }

    draw(ctx) {
        if (!this.#alive) return;
        
        ctx.save();
        ctx.imageSmoothingEnabled = false;

        // Background with theme color
        this.#drawBackground(ctx);
        
        // Scanlines
        this.#drawScanlines(ctx);
        
        // Particles
        this.#drawParticles(ctx);
        
        // Level number
        if (this.#phase !== 'fadeIn') {
            this.#drawLevelNum(ctx);
        }
        
        // Level name
        if (this.#phase === 'levelName' || this.#phase === 'kills' || this.#phase === 'hold' || this.#phase === 'fadeOut') {
            this.#drawLevelName(ctx);
        }
        
        // Kills text
        if (this.#phase === 'kills' || this.#phase === 'hold' || this.#phase === 'fadeOut') {
            this.#drawKillsText(ctx);
        }
        
        // Sparks
        this.#drawSparks(ctx);
        
        // Decorative lines
        this.#drawDecoLines(ctx);
        
        // Fade overlay
        this.#drawFadeOverlay(ctx);
        
        // Skip hint
        if (this.#age > 800 && this.#phase !== 'fadeOut') {
            this.#drawSkipHint(ctx);
        }

        ctx.restore();
    }

    #drawBackground(ctx) {
        // Solid black base — prevents level entities from showing through
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, this.#width, this.#height);

        // Draw level background image
        if (this.#bgLoaded) {
            ctx.drawImage(this.#bgImage, 0, 0, this.#width, this.#height);
        } else {
            // Fallback while loading
            ctx.fillStyle = this.#backgroundColor;
            ctx.fillRect(0, 0, this.#width, this.#height);
        }
        
        // Dark overlay to make text readable
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, this.#width, this.#height);
        
        // Radial vignette with theme color
        const grd = ctx.createRadialGradient(
            this.#width / 2, this.#height / 2, 0,
            this.#width / 2, this.#height / 2, this.#width * 0.7
        );
        grd.addColorStop(0, 'transparent');
        grd.addColorStop(0.7, 'transparent');
        grd.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, this.#width, this.#height);
        
        // Subtle theme color overlay
        ctx.fillStyle = this.#hexToRgba(this.#primaryColor, 0.08);
        ctx.fillRect(0, 0, this.#width, this.#height);
    }

    #drawScanlines(ctx) {
        ctx.fillStyle = this.#hexToRgba(this.#primaryColor, 0.3);
        for (const s of this.#scanlines) {
            ctx.globalAlpha = s.alpha;
            ctx.fillRect(0, this.#px(s.y), this.#width, s.height);
        }
        ctx.globalAlpha = 1;
    }

    #drawParticles(ctx) {
        ctx.globalCompositeOperation = 'lighter';
        for (const p of this.#particles) {
            if (p.alpha <= 0) continue;
            const color = `hsla(${p.hue}, 100%, 70%, ${p.alpha})`;
            
            // Glow
            const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
            grd.addColorStop(0, color);
            grd.addColorStop(1, 'transparent');
            ctx.fillStyle = grd;
            ctx.fillRect(p.x - p.size * 3, p.y - p.size * 3, p.size * 6, p.size * 6);
            
            // Core
            ctx.fillStyle = `hsla(${p.hue}, 50%, 95%, ${p.alpha})`;
            ctx.fillRect(this.#px(p.x - p.size / 2), this.#px(p.y - p.size / 2), p.size, p.size);
        }
        ctx.globalCompositeOperation = 'source-over';
    }

    #drawLevelNum(ctx) {
        if (!this.#font || !this.#font.loaded) return;
        
        const targetScale = this.#levelNumScale;
        const y = this.#height * 0.35;
        let x = (this.#width - this.#font.measureText(this.#levelNumText, targetScale)) / 2;
        
        for (const char of this.#levelNumChars) {
            if (char.alpha <= 0) continue;
            
            ctx.globalAlpha = char.alpha;
            
            // Glow effect
            ctx.shadowColor = this.#primaryColor;
            ctx.shadowBlur = 20;
            
            // Draw character with glitch offset
            this.#font.drawText(
                ctx,
                char.char,
                this.#px(x + char.glitch),
                this.#px(y + char.offsetY),
                char.scale,
                this.#primaryColor
            );
            
            ctx.shadowBlur = 0;
            x += this.#font.measureText(char.char, char.scale) + 2 * char.scale;
        }
        ctx.globalAlpha = 1;
    }

    /**
     * Get Y position for a given level name line.
     */
    #getLevelNameLineY(lineIdx) {
        const lineCount = this.#levelNameLines.length;
        const lineHeight = this.#levelNameScale * 12; // approximate glyph height
        const totalHeight = lineCount * lineHeight;
        const baseY = this.#height * 0.52 - totalHeight / 2 + lineHeight / 2;
        return baseY + lineIdx * lineHeight;
    }

    #drawLevelName(ctx) {
        if (!this.#font || !this.#font.loaded) return;
        
        const targetScale = this.#levelNameScale;
        
        for (const char of this.#levelNameChars) {
            if (char.alpha <= 0) continue;
            
            const lineText = this.#levelNameLines[char.line];
            const lineY = this.#getLevelNameLineY(char.line);
            const lineStartX = (this.#width - this.#font.measureText(lineText, targetScale)) / 2;
            
            // Compute x offset within the line
            let charX = lineStartX;
            for (let i = 0; i < char.indexInLine; i++) {
                charX += this.#font.measureText(lineText[i], char.scale) + 2 * char.scale;
            }
            
            ctx.globalAlpha = char.alpha;
            
            // Subtle glow
            ctx.shadowColor = this.#secondaryColor;
            ctx.shadowBlur = 10;
            
            this.#font.drawText(
                ctx,
                char.char,
                this.#px(charX + char.offsetX),
                this.#px(lineY + char.offsetY),
                char.scale,
                '#ffffff'
            );
            
            ctx.shadowBlur = 0;
        }
        ctx.globalAlpha = 1;
    }

    #drawKillsText(ctx) {
        if (!this.#font || !this.#font.loaded) return;
        
        const targetScale = this.#killsScale;
        // Position kills text below the last level name line
        const lastLineY = this.#getLevelNameLineY(this.#levelNameLines.length - 1);
        const y = lastLineY + this.#levelNameScale * 14;
        let x = (this.#width - this.#font.measureText(this.#killsText, targetScale)) / 2;
        
        for (const char of this.#killsChars) {
            if (char.alpha <= 0) continue;
            
            ctx.globalAlpha = char.alpha * 0.8;
            
            this.#font.drawText(
                ctx,
                char.char,
                this.#px(x),
                this.#px(y),
                char.scale,
                this.#secondaryColor
            );
            
            x += this.#font.measureText(char.char, char.scale) + 2 * char.scale;
        }
        ctx.globalAlpha = 1;
    }

    #drawSparks(ctx) {
        for (const s of this.#sparks) {
            const alpha = Math.min(1, s.life / 200);
            ctx.fillStyle = s.color;
            ctx.globalAlpha = alpha;
            ctx.fillRect(this.#px(s.x), this.#px(s.y), s.size, s.size);
        }
        ctx.globalAlpha = 1;
    }

    #drawDecoLines(ctx) {
        // Animated horizontal lines that expand from center
        const progress = Math.min(1, this.#age / 1500);
        const lineWidth = progress * (this.#width * 0.7);
        const centerX = this.#width / 2;
        
        ctx.strokeStyle = this.#hexToRgba(this.#primaryColor, 0.6);
        ctx.lineWidth = 2;
        
        // Top line
        const topY = this.#height * 0.25;
        ctx.beginPath();
        ctx.moveTo(centerX - lineWidth / 2, topY);
        ctx.lineTo(centerX + lineWidth / 2, topY);
        ctx.stroke();
        
        // Bottom line
        const bottomY = this.#height * 0.78;
        ctx.beginPath();
        ctx.moveTo(centerX - lineWidth / 2, bottomY);
        ctx.lineTo(centerX + lineWidth / 2, bottomY);
        ctx.stroke();
        
        // Corner accents
        if (progress > 0.5) {
            const accentAlpha = (progress - 0.5) * 2;
            ctx.strokeStyle = this.#hexToRgba(this.#secondaryColor, accentAlpha * 0.4);
            const accentSize = 20;
            
            // Top left
            ctx.beginPath();
            ctx.moveTo(centerX - lineWidth / 2, topY);
            ctx.lineTo(centerX - lineWidth / 2, topY + accentSize);
            ctx.stroke();
            
            // Top right
            ctx.beginPath();
            ctx.moveTo(centerX + lineWidth / 2, topY);
            ctx.lineTo(centerX + lineWidth / 2, topY + accentSize);
            ctx.stroke();
            
            // Bottom left
            ctx.beginPath();
            ctx.moveTo(centerX - lineWidth / 2, bottomY);
            ctx.lineTo(centerX - lineWidth / 2, bottomY - accentSize);
            ctx.stroke();
            
            // Bottom right
            ctx.beginPath();
            ctx.moveTo(centerX + lineWidth / 2, bottomY);
            ctx.lineTo(centerX + lineWidth / 2, bottomY - accentSize);
            ctx.stroke();
        }
    }

    #drawFadeOverlay(ctx) {
        let alpha = 0;
        
        if (this.#phase === 'fadeIn') {
            alpha = 1 - (this.#age / 300);
        } else if (this.#phase === 'fadeOut') {
            alpha = (this.#age - 3800) / 400;
        }
        
        if (alpha > 0) {
            ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
            ctx.fillRect(0, 0, this.#width, this.#height);
        }
    }

    #drawSkipHint(ctx) {
        if (!this.#font || !this.#font.loaded) return;
        
        const text = 'PRESS SPACE TO SKIP';
        const pulse = 0.5 + 0.5 * Math.sin(this.#age / 300);
        ctx.globalAlpha = 0.4 * pulse;
        
        this.#font.drawText(
            ctx,
            text,
            (this.#width - this.#font.measureText(text, 1)) / 2,
            this.#height - 40,
            1,
            '#888888'
        );
        ctx.globalAlpha = 1;
    }

    #hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}
