class Player {
    constructor(world, camera) {
        this.world = world;
        this.camera = camera;
        this.velocity = new BABYLON.Vector3(0, 0, 0);
        this.position = new BABYLON.Vector3(8, 70, 8);
        this.speed = 0.15;
        this.jumpForce = 0.3;
        this.gravity = 0.01;
        this.isGrounded = false;
        this.isCrouching = false;

        this.keys = {};
    }

    update() {
        this.applyGravity();
        this.handleMovement();
        this.updateCamera();
    }

    applyGravity() {
        if (this.isGrounded) {
            this.velocity.y = 0;
        } else {
            this.velocity.y -= this.gravity;
            this.velocity.y = Math.max(this.velocity.y, -0.5);
        }

        this.position.y += this.velocity.y;
        this.checkCollisions();
    }

    checkCollisions() {
        const groundCheck = this.world.getBlockAt(
            Math.floor(this.position.x),
            Math.floor(this.position.y - 1),
            Math.floor(this.position.z)
        );

        this.isGrounded = groundCheck.isSolid() || this.position.y <= 0;

        if (this.position.y < -10) {
            this.position.set(8, 70, 8);
            this.velocity.y = 0;
        }
    }

    handleMovement() {
        const moveDir = new BABYLON.Vector3(0, 0, 0);
        const speed = this.isCrouching ? this.speed * 0.5 : this.speed;

        if (this.keys['w'] || this.keys['W']) moveDir.addInPlace(BABYLON.Vector3.Forward());
        if (this.keys['s'] || this.keys['S']) moveDir.addInPlace(BABYLON.Vector3.Backward());
        if (this.keys['a'] || this.keys['A']) moveDir.addInPlace(BABYLON.Vector3.Left());
        if (this.keys['d'] || this.keys['D']) moveDir.addInPlace(BABYLON.Vector3.Right());

        if (moveDir.length() > 0) {
            moveDir.normalize();
            const rotatedDir = BABYLON.Vector3.TransformCoordinates(
                moveDir,
                BABYLON.Matrix.RotationY(this.camera.rotation.y)
            );
            this.position.addInPlace(rotatedDir.scale(speed));
        }
    }

    jump() {
        if (this.isGrounded) {
            this.velocity.y = this.jumpForce;
            this.isGrounded = false;
        }
    }

    crouch(isCrouching) {
        this.isCrouching = isCrouching;
    }

    updateCamera() {
        this.camera.position = this.position.add(new BABYLON.Vector3(0, 0.6, 0));
    }

    raycast(distance = 10) {
        const origin = this.camera.position;
        const direction = BABYLON.Vector3.Forward();
        const rotatedDir = BABYLON.Vector3.TransformCoordinates(
            direction,
            BABYLON.Matrix.RotationYawPitchRoll(this.camera.rotation.y, this.camera.rotation.x, 0)
        );

        const results = [];
        for (let i = 1; i < distance; i++) {
            const checkPos = origin.add(rotatedDir.scale(i));
            const block = this.world.getBlockAt(
                Math.floor(checkPos.x),
                Math.floor(checkPos.y),
                Math.floor(checkPos.z)
            );

            if (block.isSolid()) {
                return { position: new BABYLON.Vector3(Math.floor(checkPos.x), Math.floor(checkPos.y), Math.floor(checkPos.z)), distance: i, block: block };
            }
        }

        return null;
    }

    breakBlock() {
        const hit = this.raycast();
        if (hit) {
            this.world.setBlockAt(hit.position.x, hit.position.y, hit.position.z, BlockType.AIR);
        }
    }

    placeBlock() {
        const hit = this.raycast();
        if (hit) {
            const normal = new BABYLON.Vector3(0, 0, 0);
            const checkPos = this.camera.position.add(new BABYLON.Vector3(0, 0, 1).scale(hit.distance - 0.5));
            
            const placeX = hit.position.x;
            const placeY = hit.position.y + 1;
            const placeZ = hit.position.z;

            const distance = BABYLON.Vector3.Distance(this.camera.position, new BABYLON.Vector3(placeX, placeY, placeZ));
            if (distance < 10) {
                this.world.setBlockAt(placeX, placeY, placeZ, BlockType.GRASS);
            }
        }
    }
}