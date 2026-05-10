class SimplexNoise {
    constructor(seed = 0) {
        this.seed = seed;
    }

    noise2D(x, y) {
        const n = Math.sin(x * 12.9898 + y * 78.233 + this.seed) * 43758.5453;
        return n - Math.floor(n);
    }

    perlin2D(x, y) {
        const xi = Math.floor(x);
        const yi = Math.floor(y);
        const xf = x - xi;
        const yf = y - yi;

        const n00 = this.noise2D(xi, yi);
        const n10 = this.noise2D(xi + 1, yi);
        const n01 = this.noise2D(xi, yi + 1);
        const n11 = this.noise2D(xi + 1, yi + 1);

        const u = xf * xf * (3 - 2 * xf);
        const v = yf * yf * (3 - 2 * yf);

        const nx0 = n00 * (1 - u) + n10 * u;
        const nx1 = n01 * (1 - u) + n11 * u;
        return nx0 * (1 - v) + nx1 * v;
    }
}

class TerrainGenerator {
    constructor(seed = Math.random() * 10000) {
        this.noise = new SimplexNoise(seed);
        this.seed = seed;
    }

    getHeightAt(x, z) {
        let height = 0;
        let amplitude = 1;
        let frequency = 1;
        let maxValue = 0;

        for (let i = 0; i < 4; i++) {
            height += this.noise.perlin2D(x * frequency * 0.01, z * frequency * 0.01) * amplitude;
            maxValue += amplitude;
            amplitude *= 0.5;
            frequency *= 2;
        }

        height = (height / maxValue) * 30 + 40;
        return Math.floor(height);
    }

    generateChunkTerrain(chunkX, chunkZ, chunkSize = 16) {
        const chunk = {};

        for (let x = 0; x < chunkSize; x++) {
            for (let z = 0; z < chunkSize; z++) {
                const worldX = chunkX * chunkSize + x;
                const worldZ = chunkZ * chunkSize + z;
                const height = this.getHeightAt(worldX, worldZ);

                for (let y = 0; y < 256; y++) {
                    const key = `${x},${y},${z}`;
                    
                    if (y > height + 3) {
                        chunk[key] = new Block(x, y, z, BlockType.AIR);
                    } else if (y > height && y <= height + 3) {
                        chunk[key] = new Block(x, y, z, BlockType.GRASS);
                    } else if (y > height - 4 && y <= height) {
                        chunk[key] = new Block(x, y, z, BlockType.DIRT);
                    } else if (y > 30 && y <= height - 4) {
                        chunk[key] = new Block(x, y, z, BlockType.STONE);
                    } else if (y <= 30) {
                        chunk[key] = new Block(x, y, z, BlockType.WATER);
                    }
                }
            }
        }

        return chunk;
    }
}