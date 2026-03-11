# Assets

Risorse multimediali del gioco.

## Struttura

```
assets/
├── maps/           # Heightmap per collisioni e terreno
├── sounds/         # Effetti sonori e musica
└── spritesheets/   # Sprite e animazioni
```

## Sottocartelle

### maps/
File JSON con dati di heightmap per le mappe:
- `*_heightmap.json` — Dati collisione/terreno generati con l'editor in `tools/`

### sounds/
Effetti sonori e tracce musicali del gioco.

### spritesheets/
Spritesheet organizzati per categoria:
- `backgrounds/` — Sfondi delle scene
- `font/` — Bitmap font per testo pixel-art
- `bat/`, `elf/`, `mage/`, `warrior/` — Sprite dei personaggi

## Formato Sprite

Gli spritesheet usano il formato PNG con trasparenza, organizzati in griglie regolari per le animazioni.
