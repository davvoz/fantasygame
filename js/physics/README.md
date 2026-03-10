# physics/

Sistema di fisica e collisioni.

| File | Responsabilità |
|------|---------------|
| `CollisionMap.js` | Carica un heightmap JSON e fornisce `getGroundY(x)` per lo snap al terreno |

## Heightmap

Generato da script Python analizzando l'immagine di sfondo.
Formato JSON: `{ canvasWidth, canvasHeight, heightmap: [y_per_pixel_x] }`

Il file heightmap va in `assets/maps/NOME_MAPPA_heightmap.json`.

## Estensione

- Per aggiungere piattaforme: estendere `CollisionMap` con bounding box addizionali
- Per mappe tile-based: creare `TileMap.js` che implementa la stessa interfaccia `getGroundY(x)`
