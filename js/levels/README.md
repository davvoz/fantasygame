# Levels Module

Sistema scalabile di gestione livelli per il gioco, progettato seguendo i principi **OOP** e **SOLID**.

## Architettura

```
js/levels/
├── index.js         # Export centralizzato del modulo
├── Level.js         # Classe Level - gestisce un singolo livello
├── LevelConfig.js   # Configurazioni deterministiche dei livelli
├── LevelManager.js  # Gestione ciclo di vita e transizioni
└── README.md        # Questa documentazione
```

## Principi SOLID

| Principio | Implementazione |
|-----------|-----------------|
| **S** - Single Responsibility | `LevelConfig` definisce i dati, `Level` gestisce gli asset, `LevelManager` orchestra le transizioni |
| **O** - Open/Closed | Aggiungere nuovi livelli senza modificare il codice esistente |
| **L** - Liskov Substitution | Tutti i Level sono intercambiabili |
| **I** - Interface Segregation | Interfacce minimali e specifiche |
| **D** - Dependency Inversion | Dipendenza da astrazioni, non implementazioni concrete |

## Utilizzo

### Inizializzazione Base

```javascript
import { LevelManager } from './levels/index.js';

const levelManager = new LevelManager(game, canvas.width, canvas.height);
game.levelManager = levelManager;

// Carica il primo livello
const level = await levelManager.loadFirstLevel();
```

### Caricamento per ID

```javascript
const level = await levelManager.loadLevel('FORESTA_BLU_NOTTE');
```

### Caricamento per Ordine

```javascript
const level = await levelManager.loadLevelByOrder(2); // Secondo livello
```

### Progressione

```javascript
// Avanza al livello successivo
const nextLevel = await levelManager.nextLevel();

if (!nextLevel) {
    console.log('Gioco completato!');
}
```

### Callbacks

```javascript
// Notifica cambio livello
levelManager.onLevelChange((newLevel, previousLevel) => {
    console.log(`Passato da ${previousLevel?.name} a ${newLevel.name}`);
    hud.updateTheme(newLevel.theme);
});

// Notifica completamento tutti i livelli
levelManager.onAllLevelsComplete(() => {
    showCredits();
});
```

## Aggiungere un Nuovo Livello

1. **Aggiungi gli asset**:
   - `assets/spritesheets/backgrounds/NOME_LIVELLO.png`
   - `assets/maps/NOME_LIVELLO_heightmap.json`

2. **Registra in LevelConfig.js**:

```javascript
export const LEVELS = {
    // ... livelli esistenti ...

    NOME_LIVELLO: {
        id: 'NOME_LIVELLO',
        name: 'Nome Visualizzato',
        order: 4, // Numero progressivo
        backgroundPath: `${PATHS.BACKGROUNDS}NOME_LIVELLO.png`,
        heightmapPath: `${PATHS.HEIGHTMAPS}NOME_LIVELLO_heightmap.json`,
        ambientConfig: {
            particleCount: 40,
            particleColor: '#ffffff',
            hasFog: true,
            fogColor: '#1a1a1a',
            fogOpacity: 0.2,
        },
        theme: {
            primaryColor: '#00ff00',
            secondaryColor: '#008800',
            backgroundColor: '#001100',
        },
        spawnConfig: {
            maxEnemies: 5,
            spawnDelay: 2000,
            killsToComplete: 25, // Enemies to kill to complete level
        },
    },
};
```

## Livelli Disponibili

| Ordine | ID | Nome | Nemici Max | Spawn Delay | Kill per Completare |
|--------|-----|------|------------|-------------|---------------------|
| 1 | `FORESTA_VERDE_NOTTE` | Green Forest - Night | 3 | 2500ms | 10 |
| 2 | `FORESTA_BLU_NOTTE` | Blue Forest - Night | 4 | 2200ms | 20 |
| 3 | `FORESTA_SANGUE_NOTTE` | Blood Forest - Night | 5 | 2000ms | 30 |

## API Reference

### Level

```typescript
class Level {
    constructor(config: LevelDefinition, canvasWidth: number, canvasHeight: number)
    
    // Loading
    async load(): Promise<void>
    get isLoaded: boolean
    
    // Properties
    get id: string
    get name: string
    get order: number
    get config: LevelDefinition
    get theme: ThemeConfig
    get spawnConfig: SpawnConfig
    
    // Assets
    get background: Background
    get collisionMap: CollisionMap
    getEntities(): Entity[]
    
    // Collision helpers
    getGroundY(x: number): number
    isAboveGround(x: number, y: number): boolean
    
    // Cleanup
    dispose(): void
}
```

### LevelManager

```typescript
class LevelManager {
    constructor(game: Game, canvasWidth: number, canvasHeight: number)
    
    // State
    get currentLevel: Level | null
    get currentLevelOrder: number
    get totalLevels: number
    get isLastLevel: boolean
    get isTransitioning: boolean
    
    // Loading
    async loadLevel(levelId: string, options?): Promise<Level>
    async loadLevelByOrder(order: number, options?): Promise<Level>
    async loadFirstLevel(options?): Promise<Level>
    async nextLevel(options?): Promise<Level | null>
    async reloadCurrentLevel(): Promise<Level>
    
    // Preloading
    async preloadAllLevels(): Promise<void>
    async preloadLevel(levelId: string): Promise<void>
    
    // Callbacks
    onLevelChange(callback: (newLevel, previousLevel) => void): void
    onAllLevelsComplete(callback: () => void): void
    
    // Utils
    getAvailableLevelIds(): string[]
    getLevelList(): Array<{id, name, order}>
    clearCache(): void
}
```

## Estensibilità

Il sistema è progettato per supportare future espansioni:

- **Livelli procedurali**: Estendi `Level` per generare contenuti dinamici
- **Condizioni di completamento**: Aggiungi `completionCriteria` a `LevelConfig`
- **Boss fights**: Aggiungi `bossConfig` per livelli speciali
- **Obiettivi secondari**: Aggiungi `objectives` array per sfide opzionali
- **Segreti**: Aggiungi `secrets` per contenuti nascosti

## Animazione di Transizione

Ogni livello mostra un'animazione intro epica con:
- Numero del livello con effetto glitch
- Nome del livello con animazione elastica
- Obiettivo (es: "DEFEAT 20 ENEMIES")
- Colori del tema del livello
- Particelle ed effetti scanline

L'animazione usa i colori definiti in `theme`:
```javascript
theme: {
    primaryColor: '#39ff14',   // Colore principale (testi, effetti)
    secondaryColor: '#22c55e', // Colore secondario (accenti)
    backgroundColor: '#0a1f0a', // Sfondo dell'intro
},
```

Skip con **SPACE** o **ENTER**.
