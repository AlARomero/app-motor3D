const WallItemGroup = require('./wall_itemGroup');

class InWallItemGroup extends WallItemGroup {
    constructor(three, metadata, geometry, material, position, rotation, scale) {
        super(three, metadata, geometry, material, position, rotation, scale);
        this.addToWall = true;
    }
    
    getWallOffset() {
        // fudge factor so it saves to the right wall
        return -this.currentWallEdge.offset + 0.5;
    }
}

module.exports = InWallItemGroup;