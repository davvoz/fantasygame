# AI System

Sistema di intelligenza artificiale per controllare i personaggi NPC.

## Architettura

Il sistema AI è basato su un pattern **Behavior Tree semplificato**:

- **AIController** — Orchestratore che gestisce una sequenza di Behavior, eseguendoli in loop
- **Behavior** — Classe base astratta per singoli "task" (pattugliare, aspettare, attaccare...)

## Classi Principali

### AIController

Guida un personaggio attraverso una sequenza di comportamenti:

```js
import { AIController } from './AIController.js';
import { PatrolBehavior, WaitBehavior } from './behaviors/...';

const ai = new AIController(enemy, [
    new PatrolBehavior({ waypoints: [...] }),
    new WaitBehavior(2),
]);

// Nel game loop:
ai.update(deltaTime);
```

### Behavior

Classe base per tutti i comportamenti. Sottoclassi devono:
- Sovrascrivere `onUpdate(character, deltaTime)`
- Chiamare `finish()` quando il task è completato

## Sottocartelle

- `behaviors/` — Implementazioni concrete dei comportamenti

## Flusso Esecuzione

1. `AIController` attiva il primo Behavior con `enter()`
2. Ogni frame chiama `onUpdate()` sul Behavior corrente
3. Quando `finished` diventa `true`, passa al prossimo Behavior
4. Al termine della sequenza, ricomincia dal primo (loop)
