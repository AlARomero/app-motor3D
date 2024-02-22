var FloorItemGroup = require('./floor_itemGroup');

class OnFloorItemGroup extends FloorItemGroup {
    constructor(three, metadata, geometry, material, position, rotation, scale) {
        super(three, metadata, geometry, material, position, rotation, scale);
        this.obstructFloorMoves = false;
        this.receiveShadow = true;
    }    
}

module.exports = OnFloorItemGroup;