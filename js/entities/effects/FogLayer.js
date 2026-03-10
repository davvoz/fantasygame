import { Entity } from '../Entity.js';

/**
 * Atmospheric drifting fog layer with parallax particles.
 */
export class FogLayer extends Entity {

    #canvasW;
    #canvasH;

    #leaves = [];
    #fog = [];

    #lightningTimer = 0;
    #flash = 0;

    constructor(canvasW, canvasH, leafCount = 40) {
        super(0,0,canvasW,canvasH);

        this.#canvasW = canvasW;
        this.#canvasH = canvasH;

        // fog blobs
        for (let i=0;i<6;i++) {
            this.#fog.push({
                x: Math.random()*canvasW,
                y: canvasH*(0.4+Math.random()*0.5),
                r: 200 + Math.random()*200,
                speed: 5 + Math.random()*10
            });
        }

        // falling leaves
        for (let i=0;i<leafCount;i++) {

            this.#leaves.push({
                x: Math.random()*canvasW,
                y: Math.random()*canvasH,

                size: 6 + Math.random()*6,

                speedY: 30 + Math.random()*40,
                speedX: -20 + Math.random()*40,

                rot: Math.random()*Math.PI*2,
                rotSpeed: -2 + Math.random()*4,

                swing: Math.random()*3
            });
        }

        this.#lightningTimer = 3 + Math.random()*6;
    }

    update(deltaTime){

        const dt = deltaTime/1000;

        // fog drift
        for(const f of this.#fog){

            f.x += f.speed*dt;

            if(f.x > this.#canvasW + f.r){
                f.x = -f.r;
            }
        }

        // leaves
        for(const l of this.#leaves){

            l.y += l.speedY * dt;
            l.x += l.speedX * dt + Math.sin(l.y*0.05)*l.swing;

            l.rot += l.rotSpeed * dt;

            if(l.y > this.#canvasH+20){

                l.y = -20;
                l.x = Math.random()*this.#canvasW;
            }

            if(l.x > this.#canvasW+20) l.x=-20;
            if(l.x < -20) l.x=this.#canvasW+20;
        }

        // lightning
        this.#lightningTimer -= dt;

        if(this.#lightningTimer < 0){

            this.#flash = 1;
            this.#lightningTimer = 4 + Math.random()*8;
        }

        this.#flash *= 0.92;
    }

    #drawLightning(ctx){

        const startX = Math.random()*this.#canvasW;
        let x = startX;
        let y = 0;

        ctx.strokeStyle = "rgba(220,240,255,0.9)";
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(x,y);

        while(y < this.#canvasH*0.7){

            x += (Math.random()-0.5)*40;
            y += 20 + Math.random()*40;

            ctx.lineTo(x,y);
        }

        ctx.stroke();
    }

    #drawLeaf(ctx, leaf){

        ctx.save();

        ctx.translate(leaf.x, leaf.y);
        ctx.rotate(leaf.rot);

        ctx.fillStyle="#8fae4a";

        ctx.beginPath();

        ctx.moveTo(0,-leaf.size);
        ctx.quadraticCurveTo(leaf.size,0,0,leaf.size);
        ctx.quadraticCurveTo(-leaf.size,0,0,-leaf.size);

        ctx.fill();

        ctx.restore();
    }

    draw(ctx){

        ctx.save();

        // fog
        for(const f of this.#fog){

            const g = ctx.createRadialGradient(
                f.x,f.y,0,
                f.x,f.y,f.r
            );

            g.addColorStop(0,"rgba(160,190,210,0.05)");
            g.addColorStop(1,"rgba(160,190,210,0)");

            ctx.fillStyle=g;

            ctx.beginPath();
            ctx.arc(f.x,f.y,f.r,0,Math.PI*2);
            ctx.fill();
        }

        // leaves
        for(const l of this.#leaves){
            this.#drawLeaf(ctx,l);
        }

        // lightning flash
        if(this.#flash>0.1){

            this.#drawLightning(ctx);

            ctx.fillStyle=`rgba(200,220,255,${this.#flash*0.2})`;
            ctx.fillRect(0,0,this.#canvasW,this.#canvasH);
        }

        ctx.restore();
    }
}