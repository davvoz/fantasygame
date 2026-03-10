# characters/

Implementazioni concrete dei personaggi.

| File | Responsabilità |
|------|---------------|
| `Mage.js` | Mago — definisce spritesheet, animazioni e stati |

## Aggiungere un personaggio

1. Creare `NomePersonaggio.js` che estende `Character`
2. Definire l'array `ANIMATIONS` seguendo la convenzione `ACTION_DIRECTION`
3. In `init()`: caricare spritesheet, registrare animazioni e stati
4. Aggiungere i file sprite in `assets/spritesheets/nomepersonaggio/`
