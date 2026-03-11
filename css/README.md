# Styles

Fogli di stile CSS per il gioco.

## styles.css

Stile principale che gestisce:

### Layout
- Reset CSS (margini, padding, box-sizing)
- Body centrato con flexbox
- Sfondo nero (`#000`)

### Canvas
- Sfondo scuro (`#1a1a2e`)
- Rendering pixel-art (`image-rendering: pixelated`)
- Cursore nascosto (`cursor: none`) — sostituito dal Crosshair in-game
- Scaling responsivo mantenendo aspect ratio 16:9

```css
canvas {
    width: 100vw;
    height: calc(100vw * 9 / 16);
    max-height: 100vh;
    max-width: calc(100vh * 16 / 9);
}
```

## Note

Il gioco scala automaticamente per adattarsi al viewport mantenendo le proporzioni corrette.
