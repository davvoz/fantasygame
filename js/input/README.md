# input/

Sistema di input astratto. Disaccoppia i tasti fisici dalle azioni di gioco.

| File | Responsabilità |
|------|---------------|
| `Actions.js` | Costanti delle azioni (`MOVE_LEFT`, `MOVE_RIGHT`, `SPELL`, …) |
| `InputManager.js` | Mappa `KeyboardEvent.code` → azione logica, espone `isActive(action)` |

## Aggiungere un'azione

1. Definire la costante in `Actions.js`
2. Aggiungere il binding in `InputManager.#setupDefaultBindings()`
3. Usare `isActive(Actions.NEW_ACTION)` negli stati
