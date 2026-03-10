import { Entity } from './Entity.js';

/**
 * Base class for all projectiles.
 * Moves at a constant velocity and dies after a lifetime or when off-screen.
 */
export class Projectile extends Entity {
    #vx;
    #vy;
    #lifetime;
    #age = 0;
    #alive = true;
    #owner = null;
    #damage;

    constructor({ x, y, width, height, vx = 0, vy = 0, lifetime = 2000, owner = null, damage = 10 }) {
        super(x, y, width, height);
        this.#vx = vx;
        this.#vy = vy;
        this.#lifetime = lifetime;
        this.#owner = owner;
        this.#damage = damage;
    }

    get alive() { return this.#alive; }
    get owner() { return this.#owner; }
    set owner(o) { this.#owner = o; }
    get vx() { return this.#vx; }
    get vy() { return this.#vy; }
    get damage() { return this.#damage; }

    kill() { this.#alive = false; }

    /** Reverse direction and transfer ownership to the reflector. */
    reflect(newOwner) {
        this.#vx = -this.#vx;
        this.#vy = -this.#vy;
        this.#owner = newOwner;
        this.#age = 0;
    }

    update(deltaTime) {
        if (!this.#alive) return;
        const dt = deltaTime / 1000;
        this.x += this.#vx * dt;
        this.y += this.#vy * dt;
        this.#age += deltaTime;
        if (this.#age >= this.#lifetime) {
            this.#alive = false;
        }
    }
}
