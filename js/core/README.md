# core/

Motore del gioco. Contiene il ciclo principale, l'orchestrazione del flusso di gioco e i sotto-sistemi principali.

| File | Responsabilità |
|------|---------------|
| `Game.js` | Classe principale — inizializza renderer, input, game loop e gestisce le entità |
| `GameLoop.js` | Ciclo `requestAnimationFrame` con delta-time |
| `GameFlowController.js` | Orchestratore del flusso di gioco: title → level select → init → level transitions → game over / victory → restart |
| `EnemySpawner.js` | Factory dei nemici — pick pesato per tipo, creazione con spawn effect, logica di posizionamento |
| `InputRouter.js` | Centralizza tutti gli handler keyboard e mobile per ogni fase (title, level select, intro, game over, victory, fullscreen) |

## Architettura

```
main.js  (bootstrap)
  └─ GameFlowController
       ├─ EnemySpawner    (spawn nemici)
       ├─ InputRouter     (input globale per fase)
       ├─ LevelManager    (caricamento livelli)
       └─ Game            (loop, entità, collisioni)
```

- **`GameFlowController`** gestisce l'intero ciclo di vita: dalla title animation alla selezione livello, dall'inizializzazione alla progressione tra livelli, fino al game over e restart. Espone getter pubblici per le animazioni attive, consumati da `InputRouter`.
- **`EnemySpawner`** incapsula la logica di spawn per ogni tipo di nemico (bat, warrior, elf, ken). Per aggiungere un nuovo nemico: creare un metodo `#spawn<Type>()`, aggiungere l'entry in `ENEMY_TYPES` e nel dispatch `spawn()`.
- **`InputRouter`** elimina la duplicazione degli event listener keyboard/touch. Riceve un riferimento al controller e interroga lo stato corrente per decidere quale azione eseguire.

## Estensione

- **Nuove fasi di gioco** (shop, cutscene, etc.): aggiungere un metodo in `GameFlowController` e aggiornare `InputRouter` per gestire l'input della nuova fase.
- **Nuovi tipi di nemici**: estendere `EnemySpawner` con un nuovo metodo privato di spawn e aggiungere il tipo al peso in `ENEMY_TYPES`.
- **Sistemi globali** (audio, scene manager, etc.): registrarli come dipendenze in `Game`.
