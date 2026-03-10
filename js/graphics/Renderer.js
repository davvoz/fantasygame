export class Renderer {
    #canvas;
    #ctx;

    constructor(canvas) {
        this.#canvas = canvas;
        this.#ctx = canvas.getContext('2d');
        this.#ctx.imageSmoothingEnabled = false;
    }

    get ctx() { return this.#ctx; }
    get width() { return this.#canvas.width; }
    get height() { return this.#canvas.height; }

    clear() {
        this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
    }

    resize(width, height) {
        this.#canvas.width = width;
        this.#canvas.height = height;
    }
}
