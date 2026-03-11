# AI Behaviors

Implementazioni concrete dei comportamenti AI.

## Comportamenti Disponibili

### PatrolBehavior

Muove il personaggio tra waypoint definiti:

```js
new PatrolBehavior({
    waypoints: [{ x: 100, y: 200 }, { x: 300, y: 200 }],
    loop: true,           // Ripete il percorso
    attackTarget: player, // Opzionale: attacca se in range
    attackRange: 120      // Distanza per attacco (px)
})
```

### AttackBehavior

Attacca un bersaglio se abbastanza vicino:

```js
new AttackBehavior({
    target: player,
    range: 120  // Distanza massima per attacco
})
```

### WaitBehavior

Pausa per una durata specificata:

```js
new WaitBehavior(2)  // Aspetta 2 secondi
```

## Creare Nuovi Behavior

1. Estendere la classe `Behavior`
2. Implementare `onUpdate(character, deltaTime)`
3. Chiamare `this.finish()` quando completato

```js
import { Behavior } from '../Behavior.js';

export class CustomBehavior extends Behavior {
    enter(character) {
        // Setup iniziale
    }

    onUpdate(character, deltaTime) {
        // Logica del comportamento
        if (done) this.finish();
    }
}
```
