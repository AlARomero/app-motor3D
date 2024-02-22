var WallItem = require('./wall_item');

class WallFloorItem extends WallItem {
    constructor(three, metadata, geometry, material, position, rotation, scale) {
        super(three, metadata, geometry, material, position, rotation, scale);
        this.boundToFloor = true;
        // MOD Rafa. Inicializamos el desfase en altura en 0
        this.desfaseAltura = 0.5 * ( this.geometry.boundingBox.max.y - this.geometry.boundingBox.min.y ) + 1;
    }
}

module.exports = WallFloorItem;
