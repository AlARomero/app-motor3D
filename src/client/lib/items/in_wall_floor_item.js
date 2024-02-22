var InWallItem = require('./in_wall_item');

class InWallFloorItem extends InWallItem {
    constructor(three, metadata, geometry, material, position, rotation, scale) {
        super(three, metadata, geometry, material, position, rotation, scale);
        this.boundToFloor = true;
    }
    
}

module.exports = InWallFloorItem;