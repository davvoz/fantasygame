import { PowerUpType } from '../entities/PowerUp.js';

const BUFF_ICONS = {
    [PowerUpType.ATTACK_SPEED]:  { label: 'SPD', color: '#ffe033' },
    [PowerUpType.POWER]:         { label: 'POW', color: '#ff4444' },
    [PowerUpType.TRIPLE_SHOT]:   { label: 'TRI', color: '#44aaff' },
    [PowerUpType.INVINCIBILITY]: { label: 'INV', color: '#ffcc00' },
};

/**
 * Minimal HUD — draws HP bars and character names using BitmapFont.
 * Not an Entity: drawn explicitly after the scene by Game.
 */
export class HUD {
    #font;
    #characters = []; // { character, name, barColor }
    #mage = null;

    constructor(font) {
        this.#font = font;
    }

    set mage(m) { this.#mage = m; }

    /**
     * Register a character to track on the HUD.
     * @param {import('../entities/Character.js').Character} character
     * @param {string} name
     * @param {string} barColor - CSS color for HP bar fill
     */
    track(character, name, barColor = '#39ff14') {
        this.#characters.push({ character, name, barColor });
    }

    /** Remove a tracked character. */
    untrack(character) {
        this.#characters = this.#characters.filter(c => c.character !== character);
    }

    /** Replace the tracked character at the given index. */
    updateTracked(index, character) {
        if (this.#characters[index]) this.#characters[index].character = character;
    }

    draw(ctx) {
        // Remove dead entries, but always keep the first slot (mage)
        this.#characters = this.#characters.filter(
            (c, i) => i === 0 || c.character.alive !== false
        );

        const margin = 12;
        const barW = 80;
        const barH = 8;
        let offsetY = margin;

        for (const { character, name, barColor } of this.#characters) {
            const hp = typeof character.hp === 'number' ? character.hp : 1;
            const maxHp = typeof character.maxHp === 'number' ? character.maxHp : 1;
            const ratio = Math.max(0, hp / maxHp);

            // Name
            this.#font.drawText(ctx, name, margin, offsetY, { scale: 0.6 });

            // Bar background
            const barY = offsetY + 20;
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(margin, barY, barW, barH);

            // Bar fill (unified green color for all characters)
            ctx.fillStyle = ratio > 0.3 ? '#39ff14' : '#ff5252';
            ctx.fillRect(margin, barY, barW * ratio, barH);

            // Bar border
            ctx.strokeStyle = '#e0e0e0';
            ctx.lineWidth = 1;
            ctx.strokeRect(margin, barY, barW, barH);

            // HP text
            const hpText = `${Math.ceil(hp)}`;
            this.#font.drawText(ctx, hpText, margin + barW + 6, barY - 2, { scale: 0.4 });

            offsetY += 36;
        }

        // Active buffs display (bottom-left)
        this.#drawBuffs(ctx);
    }

    #drawBuffs(ctx) {
        if (!this.#mage || typeof this.#mage.activeBuffs === 'undefined') return;
        const buffs = this.#mage.activeBuffs;
        if (!buffs || buffs.size === 0) return;

        const startX = 12;
        const y = ctx.canvas.height - 36;
        let x = startX;
        const boxW = 54;
        const boxH = 24;

        for (const [type, remaining] of buffs) {
            const icon = BUFF_ICONS[type];
            if (!icon) continue;

            // Background box
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(x, y, boxW, boxH);
            ctx.strokeStyle = icon.color;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(x, y, boxW, boxH);

            // Icon label
            this.#font.drawText(ctx, icon.label, x + 3, y + 3, { scale: 0.4 });

            // Timer bar
            const maxDur = (type === PowerUpType.ATTACK_SPEED || type === PowerUpType.POWER) ? 8 : 6;
            const ratio = Math.max(0, remaining / maxDur);
            ctx.fillStyle = icon.color;
            ctx.globalAlpha = 0.7;
            ctx.fillRect(x + 1, y + boxH - 4, (boxW - 2) * ratio, 3);
            ctx.globalAlpha = 1;

            x += boxW + 6;
        }
    }
}
