# entities/

Gerarchia delle entità di gioco.

| File | Responsabilità |
|------|---------------|
| `Entity.js` | Classe base — posizione, dimensione, `update()`, `draw()` |
| `Character.js` | Entità con Animator + StateMachine + Direction + speed |
| `Direction.js` | Enum `LEFT` / `RIGHT` |

## Convenzione

- Ogni nuovo tipo di personaggio estende `Character` e va in `characters/`
- L'inizializzazione asincrona (caricamento sprite) va in un metodo `init()`
