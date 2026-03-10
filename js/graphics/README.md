# graphics/

Layer di rendering e animazione sprite.

| File | Responsabilità |
|------|---------------|
| `Renderer.js` | Wrapper del canvas, metodi `clear()` e `resize()` |
| `SpriteSheet.js` | Carica una strip orizzontale di sprite, auto-rileva il numero di frame |
| `Animation.js` | Sequenza animata su uno SpriteSheet (frame duration, loop) |
| `Animator.js` | Registry di animazioni con `play(key)` / `update()` / `draw()` |

## Convenzione nomi animazione

Le chiavi seguono il pattern dei file: **`ACTION_DIRECTION`**
Esempi: `IDLE_LEFT`, `WALK_RIGHT`, `SPELL_LEFT`
