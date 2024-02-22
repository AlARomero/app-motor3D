var WallItem = require('./wall_item');

class InWallItem extends WallItem {
    constructor(three, metadata, geometry, material, position, rotation, scale) {
        super(three, metadata, geometry, material, position, rotation, scale);
        this.addToWall = true;
    }
    
    getWallOffset() {
        // fudge factor so it saves to the right wall
        return -this.currentWallEdge.offset + 0.5;
    }
}

module.exports = InWallItem;