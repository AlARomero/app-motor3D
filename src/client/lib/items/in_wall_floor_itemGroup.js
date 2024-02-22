var InWallItemGroup = require('./in_wall_itemGroup');

class InWallFloorItemGroup extends InWallItemGroup {
    constructor(three, metadata, geometry, material, position, rotation, scale) {
        super(three, metadata, geometry, material, position, rotation, scale);
        this.boundToFloor = true;
    }
    
}

module.exports = InWallFloorItemGroup;