var FloorItem = require('./floor_item');

class OnFloorItem extends FloorItem {
    constructor(three, metadata, geometry, material, position, rotation, scale) {
        super(three, metadata, geometry, material, position, rotation, scale);
        this.obstructFloorMoves = false;
        this.receiveShadow = true;
    }    
}

module.exports = OnFloorItem;