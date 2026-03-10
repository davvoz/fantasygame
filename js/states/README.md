# states/

Macchina a stati finiti generica + stati concreti per i personaggi.

| File | Responsabilità |
|------|---------------|
| `StateMachine.js` | FSM generico — `register()`, `transition()`, `update()` |
| `State.js` | Classe base — `enter()`, `exit()`, `update()` con riferimento al character |

## Convenzione

- Gli stati specifici dei personaggi vanno in `character/`
- Ogni stato decide quale animazione suonare (`enter`) e le transizioni (`update`)
