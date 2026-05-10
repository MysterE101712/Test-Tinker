class MobileUI {
    constructor(player) {
        this.player = player;
        this.joystickCanvas = document.getElementById('joystick-canvas');
        this.joystickCtx = this.joystickCanvas.getContext('2d');
        this.jumpBtn = document.getElementById('jump-btn');
        this.crouchBtn = document.getElementById('crouch-btn');

        this.joystickActive = false;
        this.joystickX = 0;
        this.joystickY = 0;
        this.joystickRadius = 40;
        this.joystickCenterX = this.joystickCanvas.width / 2;
        this.joystickCenterY = this.joystickCanvas.height / 2;

        this.setupEventListeners();
        this.drawJoystick();
    }

    setupEventListeners() {
        this.joystickCanvas.addEventListener('touchstart', (e) => this.joystickTouchStart(e));
        this.joystickCanvas.addEventListener('touchmove', (e) => this.joystickTouchMove(e));
        this.joystickCanvas.addEventListener('touchend', (e) => this.joystickTouchEnd(e));

        this.jumpBtn.addEventListener('touchstart', () => this.player.jump());
        this.jumpBtn.addEventListener('mousedown', () => this.player.jump());

        let crouchActive = false;
        this.crouchBtn.addEventListener('touchstart', () => { crouchActive = true; this.player.crouch(true); });
        this.crouchBtn.addEventListener('touchend', () => { crouchActive = false; this.player.crouch(false); });
        this.crouchBtn.addEventListener('mousedown', () => { crouchActive = true; this.player.crouch(true); });
        this.crouchBtn.addEventListener('mouseup', () => { crouchActive = false; this.player.crouch(false); });

        document.addEventListener('touchstart', (e) => this.handleScreenTouch(e, 'start'));
        document.addEventListener('touchend', (e) => this.handleScreenTouch(e, 'end'));
        document.addEventListener('mousedown', (e) => this.handleScreenTouch(e, 'start'));
        document.addEventListener('mouseup', (e) => this.handleScreenTouch(e, 'end'));

        document.addEventListener('mousemove', (e) => this.handleMouseLook(e));
        document.addEventListener('touchmove', (e) => this.handleTouchLook(e));
    }

    joystickTouchStart(e) {
        e.preventDefault();
        this.joystickActive = true;
        this.updateJoystick(e);
    }

    joystickTouchMove(e) {
        e.preventDefault();
        if (this.joystickActive) {
            this.updateJoystick(e);
        }
    }

    joystickTouchEnd(e) {
        e.preventDefault();
        this.joystickActive = false;
        this.joystickX = 0;
        this.joystickY = 0;
        this.drawJoystick();
    }

    updateJoystick(e) {
        const touch = e.touches[0];
        const rect = this.joystickCanvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        const dx = x - this.joystickCenterX;
        const dy = y - this.joystickCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.joystickRadius) {
            this.joystickX = dx;
            this.joystickY = dy;
        } else {
            this.joystickX = (dx / distance) * this.joystickRadius;
            this.joystickY = (dy / distance) * this.joystickRadius;
        }

        this.applyJoystickMovement();
        this.drawJoystick();
    }

    applyJoystickMovement() {
        const moveDir = new BABYLON.Vector3(this.joystickX, 0, -this.joystickY).normalize();
        const speed = this.player.isCrouching ? this.player.speed * 0.5 : this.player.speed;

        if (moveDir.length() > 0.1) {
            const rotatedDir = BABYLON.Vector3.TransformCoordinates(
                moveDir,
                BABYLON.Matrix.RotationY(this.player.camera.rotation.y)
            );
            this.player.position.addInPlace(rotatedDir.scale(speed * 2));
        }
    }

    drawJoystick() {
        this.joystickCtx.clearRect(0, 0, this.joystickCanvas.width, this.joystickCanvas.height);

        this.joystickCtx.fillStyle = 'rgba(100, 100, 100, 0.3)';
        this.joystickCtx.beginPath();
        this.joystickCtx.arc(this.joystickCenterX, this.joystickCenterY, this.joystickRadius, 0, Math.PI * 2);
        this.joystickCtx.fill();

        this.joystickCtx.fillStyle = 'rgba(200, 200, 200, 0.7)';
        this.joystickCtx.beginPath();
        this.joystickCtx.arc(this.joystickCenterX + this.joystickX, this.joystickCenterY + this.joystickY, 20, 0, Math.PI * 2);
        this.joystickCtx.fill();
    }

    longPressTimer = null;
    isLongPress = false;

    handleScreenTouch(e, type) {
        const canvasRect = document.getElementById('renderCanvas').getBoundingClientRect();
        const x = e.clientX || e.touches?.[0]?.clientX;
        const y = e.clientY || e.touches?.[0]?.clientY;

        if (!x || !y) return;

        const inCanvas = x >= canvasRect.left && x <= canvasRect.right && y >= canvasRect.top && y <= canvasRect.bottom;

        if (type === 'start' && inCanvas) {
            this.isLongPress = false;
            this.longPressTimer = setTimeout(() => {
                this.isLongPress = true;
                this.player.placeBlock();
            }, 300);
        } else if (type === 'end') {
            clearTimeout(this.longPressTimer);
            if (!this.isLongPress && inCanvas) {
                this.player.breakBlock();
            }
            this.isLongPress = false;
        }
    }

    handleMouseLook(e) {
        if (!document.pointerLockElement && !e.buttons) return;

        this.player.camera.rotation.y -= e.movementX * 0.005;
        this.player.camera.rotation.x -= e.movementY * 0.005;

        this.player.camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.player.camera.rotation.x));
    }

    handleTouchLook(e) {
        if (e.touches.length !== 2) return;

        const touch1 = e.touches[0];
        const touch2 = e.touches[1];

        const dx = touch2.clientX - touch1.clientX;
        const dy = touch2.clientY - touch1.clientY;

        this.player.camera.rotation.y -= dx * 0.005;
        this.player.camera.rotation.x -= dy * 0.005;

        this.player.camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.player.camera.rotation.x));
    }
}