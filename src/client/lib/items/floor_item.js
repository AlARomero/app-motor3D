var Item = require('./item');

var floorItemUtils = require('../utils/floorItemUtils');

class FloorItem extends Item {
    constructor(three, metadata, geometry, material, position, rotation, scale) {
        super(three, metadata, geometry, material, position, rotation, scale);
        this.boundToFloor = true;
    }
    
    setDesfaseAltura(scale) {
        floorItemUtils.setDesfaseAltura(this,scale);
    }
    
    placeInRoom() {
        floorItemUtils.placeInRoom(this);
    }
    
    resized() {
        floorItemUtils.resized(this);
    }   
    
    moveToPosition(vec3, intersection, keys) {
	return floorItemUtils.moveToPosition(this,vec3,intersection,keys);
    }
    
    isValidPosition(vec3,intersection) {
        return floorItemUtils.isValidPosition(this,vec3,intersection);
    }
    
    boundMove(vec3) {
        floorItemUtils.boundMove(this,vec3);
    }
    
    isValidPosition_new(vec3) {
        return floorItemUtils.isValidPosition_new(this,vec3);

    }
}

module.exports = FloorItem;