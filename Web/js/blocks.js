const BlockType = {
    AIR: 0,
    GRASS: 1,
    DIRT: 2,
    STONE: 3,
    SAND: 4,
    WATER: 5,
    WOOD: 6,
    LEAVES: 7
};

const BlockProperties = {
    [BlockType.AIR]: {
        name: 'Air',
        color: new BABYLON.Color3(0, 0, 0),
        solid: false,
        transparent: true
    },
    [BlockType.GRASS]: {
        name: 'Grass',
        color: new BABYLON.Color3(0.2, 0.8, 0.2),
        solid: true,
        transparent: false
    },
    [BlockType.DIRT]: {
        name: 'Dirt',
        color: new BABYLON.Color3(0.6, 0.4, 0.2),
        solid: true,
        transparent: false
    },
    [BlockType.STONE]: {
        name: 'Stone',
        color: new BABYLON.Color3(0.5, 0.5, 0.5),
        solid: true,
        transparent: false
    },
    [BlockType.SAND]: {
        name: 'Sand',
        color: new BABYLON.Color3(0.9, 0.85, 0.5),
        solid: true,
        transparent: false
    },
    [BlockType.WATER]: {
        name: 'Water',
        color: new BABYLON.Color3(0.2, 0.5, 0.9),
        solid: false,
        transparent: true
    },
    [BlockType.WOOD]: {
        name: 'Wood',
        color: new BABYLON.Color3(0.6, 0.3, 0.1),
        solid: true,
        transparent: false
    },
    [BlockType.LEAVES]: {
        name: 'Leaves',
        color: new BABYLON.Color3(0.1, 0.6, 0.1),
        solid: true,
        transparent: false
    }
};

class Block {
    constructor(x, y, z, type = BlockType.AIR) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.type = type;
    }

    isAir() {
        return this.type === BlockType.AIR;
    }

    isSolid() {
        return BlockProperties[this.type].solid;
    }

    getColor() {
        return BlockProperties[this.type].color;
    }

    getName() {
        return BlockProperties[this.type].name;
    }
}