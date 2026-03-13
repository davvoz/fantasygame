import { Game } from './core/Game.js';
import { BitmapFont } from './graphics/BitmapFont.js';
import { GameFlowController } from './core/GameFlowController.js';
import { MobileControls } from './input/MobileControls.js';

const canvas = document.getElementById('gameCanvas');
canvas.width  = 960;
canvas.height = 540;

const game = new Game(canvas);

const font = new BitmapFont();
await font.load();
game.font = font;

const controller = new GameFlowController(game, {
    canvas,
    canvasWidth:  canvas.width,
    canvasHeight: canvas.height,
    font,
    isMobile: MobileControls.isMobile(),
});
controller.init();

game.start();
