class Chunk {
    constructor(chunkX, chunkZ, scene, terrainGenerator) {
        this.chunkX = chunkX;
        this.chunkZ = chunkZ;
        this.chunkSize = 16;
        this.blocks = {};
        this.meshes = [];
        this.scene = scene;
        this.terrainGenerator = terrainGenerator;
        this.isLoaded = false;

        this.generateTerrain();
    }

    generateTerrain() {
        this.blocks = this.terrainGenerator.generateChunkTerrain(this.chunkX, this.chunkZ, this.chunkSize);
        this.isLoaded = true;
    }

    getBlock(x, y, z) {
        const key = `${x},${y},${z}`;
        return this.blocks[key] || new Block(x, y, z, BlockType.AIR);
    }

    setBlock(x, y, z, blockType) {
        const key = `${x},${y},${z}`;
        this.blocks[key] = new Block(x, y, z, blockType);
    }

    createMesh() {
        const positions = [];
        const colors = [];
        const indices = [];
        let vertexCount = 0;

        for (const key in this.blocks) {
            const block = this.blocks[key];
            if (block.isAir()) continue;

            const [x, y, z] = key.split(',').map(Number);
            const color = block.getColor();

            const neighbors = {
                top: this.getBlock(x, y + 1, z).isSolid(),
                bottom: this.getBlock(x, y - 1, z).isSolid(),
                front: this.getBlock(x, y, z + 1).isSolid(),
                back: this.getBlock(x, y, z - 1).isSolid(),
                right: this.getBlock(x + 1, y, z).isSolid(),
                left: this.getBlock(x - 1, y, z).isSolid()
            };

            this.addBlockFaces(x, y, z, color, neighbors, positions, colors, indices, vertexCount);
            vertexCount = positions.length / 3;
        }

        if (positions.length === 0) return null;

        const mesh = new BABYLON.Mesh(`chunk_${this.chunkX}_${this.chunkZ}`, this.scene);
        const vertexData = new BABYLON.VertexData();

        vertexData.positions = positions;
        vertexData.colors = colors;
        vertexData.indices = indices;

        vertexData.applyToMesh(mesh);

        const material = new BABYLON.StandardMaterial(`mat_${this.chunkX}_${this.chunkZ}`, this.scene);
        material.useVertexColors = true;
        material.backFaceCulling = true;
        mesh.material = material;

        this.meshes.push(mesh);
        return mesh;
    }

    addBlockFaces(x, y, z, color, neighbors, positions, colors, indices, vertexCount) {
        const size = 1;
        const r = color.r, g = color.g, b = color.b;
        const colorArray = [r, g, b, 1];

        const faceData = [
            { name: 'top', normal: [0, 1, 0], verts: [[0, size, 0], [size, size, 0], [size, size, size], [0, size, size]] },
            { name: 'bottom', normal: [0, -1, 0], verts: [[0, 0, size], [size, 0, size], [size, 0, 0], [0, 0, 0]] },
            { name: 'front', normal: [0, 0, 1], verts: [[0, 0, size], [size, 0, size], [size, size, size], [0, size, size]] },
            { name: 'back', normal: [0, 0, -1], verts: [[size, 0, 0], [0, 0, 0], [0, size, 0], [size, size, 0]] },
            { name: 'right', normal: [1, 0, 0], verts: [[size, 0, 0], [size, 0, size], [size, size, size], [size, size, 0]] },
            { name: 'left', normal: [-1, 0, 0], verts: [[0, 0, size], [0, 0, 0], [0, size, 0], [0, size, size]] }
        ];

        const neighborCheck = { top: neighbors.top, bottom: neighbors.bottom, front: neighbors.front, back: neighbors.back, right: neighbors.right, left: neighbors.left };

        faceData.forEach(face => {
            if (neighborCheck[face.name]) return;

            const startIdx = positions.length / 3;
            face.verts.forEach(vert => {
                positions.push(x + vert[0], y + vert[1], z + vert[2]);
                colors.push(...colorArray);
            });

            indices.push(startIdx, startIdx + 1, startIdx + 2);
            indices.push(startIdx, startIdx + 2, startIdx + 3);
        });
    }

    dispose() {
        this.meshes.forEach(mesh => mesh.dispose());
        this.meshes = [];
    }
}

class World {
    constructor(scene, terrainGenerator) {
        this.chunks = new Map();
        this.scene = scene;
        this.terrainGenerator = terrainGenerator;
        this.chunkSize = 16;
        this.renderDistance = 2;
    }

    loadChunk(chunkX, chunkZ) {
        const key = `${chunkX},${chunkZ}`;
        if (this.chunks.has(key)) return this.chunks.get(key);

        const chunk = new Chunk(chunkX, chunkZ, this.scene, this.terrainGenerator);
        chunk.createMesh();
        this.chunks.set(key, chunk);
        return chunk;
    }

    unloadChunk(chunkX, chunkZ) {
        const key = `${chunkX},${chunkZ}`;
        if (this.chunks.has(key)) {
            this.chunks.get(key).dispose();
            this.chunks.delete(key);
        }
    }

    updateChunksAroundPlayer(playerX, playerZ) {
        const playerChunkX = Math.floor(playerX / this.chunkSize);
        const playerChunkZ = Math.floor(playerZ / this.chunkSize);

        const loadChunks = [];
        for (let x = playerChunkX - this.renderDistance; x <= playerChunkX + this.renderDistance; x++) {
            for (let z = playerChunkZ - this.renderDistance; z <= playerChunkZ + this.renderDistance; z++) {
                loadChunks.push(`${x},${z}`);
                this.loadChunk(x, z);
            }
        }

        const chunksToUnload = [];
        this.chunks.forEach((chunk, key) => {
            if (!loadChunks.includes(key)) {
                chunksToUnload.push(key);
            }
        });

        chunksToUnload.forEach(key => {
            const [x, z] = key.split(',').map(Number);
            this.unloadChunk(x, z);
        });
    }

    getBlockAt(x, y, z) {
        const chunkX = Math.floor(x / this.chunkSize);
        const chunkZ = Math.floor(z / this.chunkSize);
        const chunk = this.chunks.get(`${chunkX},${chunkZ}`);

        if (!chunk) return new Block(x, y, z, BlockType.AIR);

        const localX = x - chunkX * this.chunkSize;
        const localZ = z - chunkZ * this.chunkSize;

        return chunk.getBlock(localX, y, localZ);
    }

    setBlockAt(x, y, z, blockType) {
        const chunkX = Math.floor(x / this.chunkSize);
        const chunkZ = Math.floor(z / this.chunkSize);
        const chunk = this.chunks.get(`${chunkX},${chunkZ}`);

        if (chunk) {
            const localX = x - chunkX * this.chunkSize;
            const localZ = z - chunkZ * this.chunkSize;
            chunk.setBlock(localX, y, localZ, blockType);
            chunk.meshes.forEach(m => m.dispose());
            chunk.meshes = [];
            chunk.createMesh();
        }
    }
}