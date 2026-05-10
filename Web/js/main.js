let engine, scene, camera, world, player, ui;
let lastFrameTime = Date.now();
let frameCount = 0;

function init() {
    const canvas = document.getElementById('renderCanvas');
    engine = new BABYLON.Engine(canvas, true);

    scene = new BABYLON.Scene(engine);
    scene.collisionsEnabled = true;
    scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), new BABYLON.CannonJSPlugin());

    const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(1, 1, 0.5), scene);
    light.intensity = 1.2;
    
    const sunLight = new BABYLON.PointLight('sunlight', new BABYLON.Vector3(50, 100, 50), scene);
    sunLight.intensity = 0.8;

    camera = new BABYLON.UniversalCamera('camera', new BABYLON.Vector3(8, 70, 8), scene);
    camera.attachControl(canvas, true);
    camera.inertia = 0.7;
    camera.angularSensibility = 1000;

    const skybox = BABYLON.MeshBuilder.CreateBox('skybox', { size: 1000 }, scene);
    const skyMat = new BABYLON.StandardMaterial('skymat', scene);
    skyMat.emissiveColor = new BABYLON.Color3(0.5, 0.7, 1);
    skybox.material = skyMat;

    const terrainGenerator = new TerrainGenerator();
    world = new World(scene, terrainGenerator);

    player = new Player(world, camera);

    ui = new MobileUI(player);

    window.addEventListener('keydown', (e) => {
        player.keys[e.key] = true;
        if (e.key === ' ') player.jump();
    });

    window.addEventListener('keyup', (e) => {
        player.keys[e.key] = false;
    });

    canvas.addEventListener('click', () => canvas.requestPointerLock());

    engine.runRenderLoop(() => {
        world.updateChunksAroundPlayer(player.position.x, player.position.z);
        player.update();
        scene.render();

        updateFPS();
    });

    window.addEventListener('resize', () => {
        engine.resize();
    });
}

function updateFPS() {
    frameCount++;
    const now = Date.now();
    const deltaTime = now - lastFrameTime;

    if (deltaTime >= 1000) {
        const fps = frameCount;
        document.getElementById('fps-counter').textContent = `FPS: ${fps}`;
        frameCount = 0;
        lastFrameTime = now;
    }
}

window.addEventListener('DOMContentLoaded', init);