import * as THREE from 'three';
var ItemGroup = require('./itemGroup');

var wallItemUtils = require('../utils/wallItemUtils');

class WallItemGroup extends ItemGroup {
    constructor(three, metadata, geometry, material, position, rotation, scale) {
        super(three, metadata, geometry, material, position, rotation, scale);
        
        this.allowRotate = false;

        // TODO:
        // This caused a huge headache.
        // HalfEdges get destroyed/created every time floorplan is edited.
        // This item should store a reference to a wall and front/back,
        // and grab its edge reference dynamically whenever it needs it.
        this.currentWallEdge = null;

        // used for finding rotations
        this.refVec = new THREE.Vector2(0, 1.0);
        this.wallOffsetScalar = 0;
        this.sizeX = 0;
        this.sizeY = 0;

        this.addToWall = false;
        this.boundToFloor = false;

        this.frontVisible = false;
        this.backVisible = false;

        // MOD Rafa. Inicializamos el desfase en altura en 0
        //this.desfaseAltura = 0.5 * ( this.geometry.boundingBox.max.y - this.geometry.boundingBox.min.y ) + 1;

    }
    
    closestWallEdge() {
        return wallItemUtils.closestWallEdge(this);
    }

    removed() {
        wallItemUtils.removed(this);
    }

    redrawWall() {
        wallItemUtils.redrawWall(this);
    }

    getBoundToFloorInitialAltitude() {
        return wallItemUtils.getBoundToFloorInitialAltitude(this);
    }

    updateEdgeVisibility(visible, front) {
        wallItemUtils.updateEdgeVisibility(this, visible, front);
    }

    updateSize() {
        wallItemUtils.updateSize(this);
    }

    resized() {
        wallItemUtils.resized(this);
        }

    setDesfaseAltura(scale) {
        wallItemUtils.setDesfaseAltura(this,scale);
    }

    placeInRoom() {
        wallItemUtils.placeInRoom(this);
    }

    moveKeyRight(camera){	
        wallItemUtils.moveKeyRight(this,camera);
    }

    moveKeyLeft(camera){
        wallItemUtils.moveKeyLeft(this,camera);
    }

    moveKeyDown(camera){
        wallItemUtils.moveKeyDown(this,camera);
       }

    moveKeyUp(camera){
        wallItemUtils.moveKeyUp(this,camera);
    }

    moveToPosition(vec3, intersection) {
        wallItemUtils.moveToPosition(this, vec3, intersection);
    }

    getWallOffset() {
        return wallItemUtils.getWallOffset(this);
    }

    changeWallEdge(wallEdge) {
        wallItemUtils.changeWallEdge(this, wallEdge);
    }

    // Returns an array of planes to use other than the ground plane
    // for passing intersection to clickPressed and clickDragged
    customIntersectionPlanes() {
        return wallItemUtils.customIntersectionPlanes(this);
    }

    // takes the move vec3, and makes sure object stays
    // bounded on plane
    boundMove = function(vec3) {
        wallItemUtils.boundMove(this,vec3);
    }
}

module.exports = WallItemGroup;