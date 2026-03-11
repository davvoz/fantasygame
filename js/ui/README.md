# UI Components

Componenti dell'interfaccia utente del gioco.

## Componenti

### HUD

Heads-Up Display minimale che mostra:
- Barre HP dei personaggi
- Nomi dei personaggi (tramite BitmapFont)
- Icone buff attivi (velocità attacco, potenza, triplo colpo, invincibilità)

```js
import { HUD } from './HUD.js';

const hud = new HUD(bitmapFont);
hud.track(player, 'MAGE', '#39ff14');
hud.track(enemy, 'BAT', '#ff4444');

// Nel render loop:
hud.draw(ctx);
```

### Crosshair

Mirino pixel-art che segue il cursore del mouse:
- Quattro linee corte attorno a un gap centrale
- Stile arancione con ombra

```js
import { Crosshair } from './Crosshair.js';

const crosshair = new Crosshair(inputManager);

// Nel render loop:
crosshair.draw(ctx);
```

## Note

- I componenti UI non sono Entity: vengono disegnati esplicitamente dopo la scena
- Il cursore del mouse è nascosto via CSS (`cursor: none`)
- Il HUD usa `BitmapFont` per testo pixel-perfect
