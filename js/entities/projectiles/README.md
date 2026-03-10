# projectiles/

Proiettili concreti spawnable dai personaggi.

| File | Responsabilità |
|------|---------------|
| `MagicLaser.js` | Fascio laser magico procedurale — glow, particelle, flash |

## Aggiungere un proiettile

1. Creare `NuovoProiettile.js` che estende `Projectile`
2. Implementare `draw(ctx)` con rendering procedurale o sprite
3. Spawnarlo da uno stato con `this.character.spawn(new NuovoProiettile({...}))`

## Spawn pipeline

`Character.spawn(entity)` → `Game.#update()` chiama `drainSpawnQueue()` → entity aggiunta al game loop.
Le entità con `alive === false` vengono rimosse automaticamente.
