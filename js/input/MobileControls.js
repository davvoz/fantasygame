import { Actions } from './Actions.js';

/**
 * Touch controls for mobile devices.
 * Left side: virtual analog joystick (move, jump, crouch)
 * Right side: touch-to-aim+shoot area
 * Bottom-right: block button
 */
export class MobileControls {
    #inputManager;
    #canvas;
    #container;
    #enabled = false;
    #fireTouches = new Set();

    // Joystick state
    #joystickTouchId = null;
    #joystickBase = null;
    #joystickThumb = null;
    #joystickCenterX = 0;
    #joystickCenterY = 0;
    #joystickRadius = 0;
    #stickX = 0; // -1..1
    #stickY = 0; // -1..1
    #activeStickActions = new Set();

    // Thresholds
    static #DEAD_ZONE = 0.25;
    static #JUMP_THRESHOLD = 0.55;
    static #CROUCH_THRESHOLD = 0.55;

    constructor(inputManager, canvas) {
        this.#inputManager = inputManager;
        this.#canvas = canvas;

        if (!MobileControls.isMobile()) return;

        this.#enabled = true;
        this.#init();
    }

    static isMobile() {
        return ('ontouchstart' in window || navigator.maxTouchPoints > 0) &&
               /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    }

    get enabled() { return this.#enabled; }

    #init() {
        const container = document.getElementById('mobileControls');
        container.style.display = 'block';
        this.#container = container;

        // Hide cursor on mobile
        this.#canvas.style.cursor = 'default';

        // Lock orientation where supported
        this.#lockOrientation();

        // Virtual joystick
        this.#setupJoystick();

        // Block button
        this.#setupButton('btnBlock', Actions.BLOCK);

        // Fire zone: aim + shoot
        this.#setupFireZone();

        // Prevent scrolling/zooming on the whole page
        document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    }

    #lockOrientation() {
        try {
            if (screen.orientation && screen.orientation.lock) {
                screen.orientation.lock('landscape').catch(() => {});
            }
        } catch (_) { /* not supported */ }
    }

    /* ═══════════════════════════════════════════
       VIRTUAL JOYSTICK
       ═══════════════════════════════════════════ */

    #setupJoystick() {
        const zone = document.getElementById('joystickZone');
        this.#joystickBase = document.getElementById('joystickBase');
        this.#joystickThumb = document.getElementById('joystickThumb');
        if (!zone || !this.#joystickBase || !this.#joystickThumb) return;

        // Compute base center (relative to viewport)
        this.#recalcJoystickCenter();

        zone.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.#joystickTouchId !== null) return; // already tracking
            const touch = e.changedTouches[0];
            this.#joystickTouchId = touch.identifier;
            this.#recalcJoystickCenter();
            this.#updateJoystick(touch);
            this.#joystickBase.classList.add('active');
        }, { passive: false });

        zone.addEventListener('touchmove', (e) => {
            e.preventDefault();
            for (const touch of e.changedTouches) {
                if (touch.identifier === this.#joystickTouchId) {
                    this.#updateJoystick(touch);
                }
            }
        }, { passive: false });

        const endJoystick = (e) => {
            for (const touch of e.changedTouches) {
                if (touch.identifier === this.#joystickTouchId) {
                    this.#joystickTouchId = null;
                    this.#resetJoystick();
                }
            }
        };

        zone.addEventListener('touchend', (e) => { e.preventDefault(); endJoystick(e); }, { passive: false });
        zone.addEventListener('touchcancel', endJoystick);

        // Recalc center on resize / orientation change
        window.addEventListener('resize', () => this.#recalcJoystickCenter());
    }

    #recalcJoystickCenter() {
        if (!this.#joystickBase) return;
        const rect = this.#joystickBase.getBoundingClientRect();
        this.#joystickCenterX = rect.left + rect.width / 2;
        this.#joystickCenterY = rect.top + rect.height / 2;
        this.#joystickRadius = rect.width / 2;
    }

    #updateJoystick(touch) {
        const dx = touch.clientX - this.#joystickCenterX;
        const dy = touch.clientY - this.#joystickCenterY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = this.#joystickRadius;

        // Clamp to circle
        const clamped = Math.min(dist, maxDist);
        const angle = Math.atan2(dy, dx);
        const clampedX = Math.cos(angle) * clamped;
        const clampedY = Math.sin(angle) * clamped;

        // Normalized -1..1
        this.#stickX = clampedX / maxDist;
        this.#stickY = clampedY / maxDist;

        // Move thumb visually
        this.#joystickThumb.style.transform = `translate(${clampedX}px, ${clampedY}px)`;

        // Map to actions
        this.#mapStickToActions();
    }

    #resetJoystick() {
        this.#stickX = 0;
        this.#stickY = 0;
        this.#joystickThumb.style.transform = 'translate(0, 0)';
        this.#joystickBase.classList.remove('active');
        // Deactivate all stick actions
        for (const action of this.#activeStickActions) {
            this.#inputManager.deactivate(action);
        }
        this.#activeStickActions.clear();
    }

    #mapStickToActions() {
        const dz = MobileControls.#DEAD_ZONE;
        const newActions = new Set();

        // Horizontal
        if (this.#stickX < -dz) newActions.add(Actions.MOVE_LEFT);
        if (this.#stickX > dz) newActions.add(Actions.MOVE_RIGHT);

        // Vertical — up = jump, down = crouch
        if (this.#stickY < -MobileControls.#JUMP_THRESHOLD) newActions.add(Actions.JUMP);
        if (this.#stickY > MobileControls.#CROUCH_THRESHOLD) newActions.add(Actions.CROUCH);

        // Activate new, deactivate old
        for (const action of newActions) {
            if (!this.#activeStickActions.has(action)) {
                this.#inputManager.activate(action);
            }
        }
        for (const action of this.#activeStickActions) {
            if (!newActions.has(action)) {
                this.#inputManager.deactivate(action);
            }
        }
        this.#activeStickActions = newActions;
    }

    /* ═══════════════════════════════════════════
       BLOCK BUTTON
       ═══════════════════════════════════════════ */

    #setupButton(id, action) {
        const btn = document.getElementById(id);
        if (!btn) return;

        let btnTouchId = null;

        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            btnTouchId = e.changedTouches[0].identifier;
            this.#inputManager.activate(action);
            btn.classList.add('active');
        }, { passive: false });

        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            for (const touch of e.changedTouches) {
                if (touch.identifier === btnTouchId) {
                    btnTouchId = null;
                    this.#inputManager.deactivate(action);
                    btn.classList.remove('active');
                }
            }
        }, { passive: false });

        btn.addEventListener('touchcancel', (e) => {
            btnTouchId = null;
            this.#inputManager.deactivate(action);
            btn.classList.remove('active');
        });
    }

    /* ═══════════════════════════════════════════
       FIRE ZONE (aim + shoot)
       ═══════════════════════════════════════════ */

    #setupFireZone() {
        const zone = document.getElementById('fireZone');
        if (!zone) return;

        zone.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            for (const touch of e.changedTouches) {
                this.#fireTouches.add(touch.identifier);
                this.#updateAim(touch);
            }
            this.#inputManager.activate(Actions.SPELL);
        }, { passive: false });

        zone.addEventListener('touchmove', (e) => {
            e.preventDefault();
            for (const touch of e.changedTouches) {
                if (this.#fireTouches.has(touch.identifier)) {
                    this.#updateAim(touch);
                }
            }
        }, { passive: false });

        zone.addEventListener('touchend', (e) => {
            e.preventDefault();
            for (const touch of e.changedTouches) {
                this.#fireTouches.delete(touch.identifier);
            }
            if (this.#fireTouches.size === 0) {
                this.#inputManager.deactivate(Actions.SPELL);
            }
        }, { passive: false });

        zone.addEventListener('touchcancel', (e) => {
            for (const touch of e.changedTouches) {
                this.#fireTouches.delete(touch.identifier);
            }
            if (this.#fireTouches.size === 0) {
                this.#inputManager.deactivate(Actions.SPELL);
            }
        });
    }

    #updateAim(touch) {
        const rect = this.#canvas.getBoundingClientRect();
        const x = (touch.clientX - rect.left) * (this.#canvas.width / rect.width);
        const y = (touch.clientY - rect.top) * (this.#canvas.height / rect.height);
        this.#inputManager.setMousePosition(x, y);
    }
}
