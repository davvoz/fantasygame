# character/

Stati concreti usati dai personaggi giocabili.

| File | Responsabilità |
|------|---------------|
| `IdleState.js` | Fermo — riproduce `IDLE_DIR`, transisce a walk/spell |
| `WalkState.js` | Cammina — muove il personaggio, gestisce cambio direzione |
| `SpellState.js` | Incantesimo — riproduce animazione one-shot, torna a idle |

## Aggiungere uno stato

1. Creare `NuovoState.js` che estende `State`
2. Implementare `enter()` (play animation), `update()` (logica + transizioni)
3. Registrarlo nella classe del personaggio: `this.stateMachine.register('nome', new NuovoState(this))`
