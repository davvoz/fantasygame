const FONT_PATH = 'assets/spritesheets/font/font3.png';

/**
 * Glyph map: each entry is { x, y, w, h } in the source bitmap.
 * Generated from pixel-art font spritesheet analysis.
 */
const GLYPHS = {
    // Uppercase
    A:{x:64,y:79,w:22,h:30}, B:{x:89,y:79,w:22,h:30}, C:{x:114,y:79,w:22,h:30},
    D:{x:139,y:79,w:22,h:30}, E:{x:163,y:79,w:23,h:30}, F:{x:189,y:79,w:22,h:30},
    G:{x:214,y:79,w:21,h:30}, H:{x:239,y:79,w:22,h:30}, I:{x:264,y:79,w:22,h:30},
    J:{x:288,y:79,w:23,h:30},
    K:{x:64,y:111,w:22,h:30}, L:{x:89,y:111,w:22,h:30}, M:{x:113,y:111,w:31,h:30},
    N:{x:147,y:111,w:23,h:30}, O:{x:172,y:111,w:22,h:30}, P:{x:197,y:111,w:22,h:30},
    Q:{x:222,y:111,w:26,h:30}, R:{x:251,y:111,w:23,h:30}, S:{x:276,y:111,w:22,h:30},
    T:{x:64,y:143,w:22,h:28}, U:{x:89,y:143,w:22,h:28}, V:{x:114,y:143,w:22,h:28},
    W:{x:139,y:143,w:31,h:28}, X:{x:172,y:143,w:29,h:28}, Y:{x:203,y:143,w:22,h:28},
    Z:{x:228,y:143,w:22,h:28},
    // Digits
    0:{x:366,y:143,w:22,h:28}, 1:{x:391,y:143,w:11,h:28}, 2:{x:405,y:143,w:22,h:28},
    3:{x:431,y:143,w:21,h:28}, 4:{x:455,y:143,w:22,h:28}, 5:{x:480,y:143,w:23,h:28},
    6:{x:505,y:143,w:22,h:28}, 7:{x:530,y:143,w:22,h:28}, 8:{x:555,y:143,w:22,h:28},
    9:{x:580,y:143,w:22,h:28},
    // Lowercase
    a:{x:64,y:193,w:18,h:35}, b:{x:85,y:193,w:22,h:35}, c:{x:110,y:193,w:18,h:35},
    d:{x:130,y:193,w:22,h:35}, e:{x:156,y:193,w:17,h:35}, f:{x:176,y:193,w:18,h:35},
    g:{x:197,y:193,w:22,h:35}, h:{x:222,y:193,w:22,h:35}, i:{x:247,y:193,w:9,h:35},
    j:{x:260,y:193,w:14,h:35}, k:{x:276,y:193,w:22,h:35},
    l:{x:64,y:230,w:9,h:35}, m:{x:77,y:230,w:21,h:35}, n:{x:101,y:230,w:16,h:35},
    o:{x:120,y:230,w:22,h:35}, p:{x:145,y:230,w:22,h:35}, q:{x:170,y:230,w:22,h:35},
    r:{x:195,y:230,w:18,h:35}, s:{x:216,y:230,w:18,h:35}, t:{x:236,y:230,w:19,h:35},
    u:{x:257,y:230,w:17,h:35}, v:{x:276,y:230,w:16,h:35},
    w:{x:64,y:268,w:22,h:28}, x:{x:89,y:268,w:18,h:28}, y:{x:110,y:268,w:21,h:28},
    z:{x:135,y:268,w:17,h:28},
    // Symbols
    '!':{x:369,y:195,w:10,h:36}, '-':{x:381,y:195,w:23,h:36},
    '_':{x:405,y:195,w:27,h:36}, '+':{x:433,y:195,w:18,h:36},
    '=':{x:457,y:195,w:21,h:36}, ':':{x:481,y:195,w:9,h:36},
    "'":{x:494,y:195,w:9,h:36}, '#':{x:506,y:195,w:29,h:36},
    '?':{x:537,y:195,w:16,h:36}, ',':{x:556,y:195,w:10,h:36},
    '.':{x:568,y:195,w:10,h:36},
};

const SPACE_WIDTH = 12; // px in source bitmap terms
const LETTER_GAP  = 2;  // px gap between glyphs (source scale)

/**
 * Bitmap font renderer that draws text from a pixel-art spritesheet.
 * Supports variable-width glyphs, scaling, and alignment.
 */
export class BitmapFont {
    #image;
    #outline;
    #loaded = false;
    #loadPromise;

    constructor() {
        this.#image = new Image();
        this.#loadPromise = new Promise((resolve, reject) => {
            this.#image.onload = () => {
                this.#outline = this.#tint(this.#image, '#1a0a5e');
                this.#image = this.#tint(this.#image, '#ffb347');
                this.#loaded = true;
                resolve();
            };
            this.#image.onerror = () => reject(new Error(`Failed to load font: ${FONT_PATH}`));
        });
        this.#image.src = FONT_PATH;
    }

    /** Bake a flat color tint onto the font bitmap, preserving alpha. */
    #tint(img, color) {
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, c.width, c.height);
        return c;
    }

    load() { return this.#loadPromise; }
    get loaded() { return this.#loaded; }

    /**
     * Measure the width of a text string at a given scale.
     * @param {string} text
     * @param {number} scale
     * @returns {number} width in canvas pixels
     */
    measureText(text, scale = 1) {
        let w = 0;
        for (const ch of text) {
            const g = GLYPHS[ch];
            if (g) {
                w += g.w * scale + LETTER_GAP * scale;
            } else if (ch === ' ') {
                w += SPACE_WIDTH * scale;
            }
        }
        return w > 0 ? w - LETTER_GAP * scale : 0;
    }

    /**
     * Draw text on the canvas.
     * @param {CanvasRenderingContext2D} ctx
     * @param {string} text
     * @param {number} x - left edge (or center/right depending on align)
     * @param {number} y - top edge
     * @param {object} opts
     * @param {number} opts.scale - size multiplier (default 1)
     * @param {'left'|'center'|'right'} opts.align - text alignment
     * @param {number} opts.alpha - global alpha
     */
    drawText(ctx, text, x, y, { scale = 1, align = 'left', alpha = 1 } = {}) {
        if (!this.#loaded) return;

        const totalW = this.measureText(text, scale);
        let cursorX = x;
        if (align === 'center') cursorX = x - totalW / 2;
        else if (align === 'right') cursorX = x - totalW;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.imageSmoothingEnabled = false;

        const off = Math.max(1, Math.round(scale));
        const offsets = [
            [-off,0],[off,0],[0,-off],[0,off],
            [-off,-off],[off,-off],[-off,off],[off,off]
        ];

        // Outline pass
        for (const [ox, oy] of offsets) {
            let cx = cursorX;
            for (const ch of text) {
                const g = GLYPHS[ch];
                if (g) {
                    const dw = g.w * scale;
                    const dh = g.h * scale;
                    ctx.drawImage(this.#outline, g.x, g.y, g.w, g.h, cx + ox, y + oy, dw, dh);
                    cx += dw + LETTER_GAP * scale;
                } else if (ch === ' ') {
                    cx += SPACE_WIDTH * scale;
                }
            }
        }

        // Main text pass
        for (const ch of text) {
            const g = GLYPHS[ch];
            if (g) {
                const dw = g.w * scale;
                const dh = g.h * scale;
                ctx.drawImage(this.#image, g.x, g.y, g.w, g.h, cursorX, y, dw, dh);
                cursorX += dw + LETTER_GAP * scale;
            } else if (ch === ' ') {
                cursorX += SPACE_WIDTH * scale;
            }
        }

        ctx.restore();
    }
}
