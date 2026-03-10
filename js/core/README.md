# core/

Motore del gioco. Contiene il ciclo principale e l'orchestrazione.

| File | Responsabilità |
|------|---------------|
| `Game.js` | Classe principale — inizializza renderer, input, game loop e gestisce le entità |
| `GameLoop.js` | Ciclo `requestAnimationFrame` con delta-time |

## Estensione

Per aggiungere sistemi globali (audio, scene manager, etc.) registrarli come dipendenze in `Game`.
