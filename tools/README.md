# Tools

Strumenti di sviluppo per il gioco.

## Heightmap Editor

**File:** `index.html`

Editor visuale per creare e modificare le heightmap delle mappe di gioco.

### Funzionalità

- Caricamento immagini di sfondo come riferimento
- Disegno di zone di collisione
- Esportazione in formato JSON compatibile con `CollisionMap`

### Utilizzo

1. Aprire `tools/index.html` nel browser
2. Caricare un'immagine di sfondo
3. Disegnare le aree di altezza/collisione
4. Esportare il JSON

### Output

I file generati vengono salvati in `assets/maps/` con naming:
- `NOME_MAPPA_heightmap.json`

Esempio: `FORESTA_BLU_NOTTE_heightmap.json`

### Integrazione

Le heightmap esportate vengono usate dal sistema fisico:

```js
import { CollisionMap } from '../physics/CollisionMap.js';

const heightmap = await fetch('assets/maps/FORESTA_heightmap.json').then(r => r.json());
const collisionMap = new CollisionMap(heightmap);
```
