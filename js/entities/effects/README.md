# Visual Effects

Effetti visivi e particellari del gioco.

## Effetti Disponibili

### Effetti di Combattimento

| Classe | Descrizione |
|--------|-------------|
| `SlashEffect` | Arco di slash con scintille e linee di velocità |
| `PixelExplosion` | Esplosione cartoon con blocchi pixel che volano |

### Effetti Ambientali

| Classe | Descrizione |
|--------|-------------|
| `AmbientParticles` | Particelle fluttuanti (lucciole/spore magiche) |
| `FogLayer` | Strato di nebbia animata |

### Effetti UI/Feedback

| Classe | Descrizione |
|--------|-------------|
| `FloatingLabel` | Testo fluttuante (danni, bonus) |
| `PowerUpEffect` | Effetto raccolta power-up |
| `SpawnEffect` | Animazione di spawn personaggio |

### Effetti Schermo

| Classe | Descrizione |
|--------|-------------|
| `GameOverAnimation` | Animazione fine partita |
| `TitleAnimation` | Animazione titolo iniziale |

## Utilizzo

Gli effetti estendono `Entity` e hanno un ciclo di vita:

```js
import { PixelExplosion } from './effects/PixelExplosion.js';

const explosion = new PixelExplosion(x, y);
game.addEntity(explosion);

// L'effetto si auto-rimuove quando alive === false
```

## Caratteristiche Comuni

- Tutti gli effetti hanno una proprietà `alive` che diventa `false` quando terminati
- Stile pixel-art coerente con il resto del gioco
- Durata definita in millisecondi (costante `DURATION`)
