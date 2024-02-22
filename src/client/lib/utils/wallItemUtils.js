/* 
 * To change item license header, choose License Headers in Project Properties.
 * To change item template file, choose Tools | Templates
 * and open the template in the editor.
 */
import * as THREE from 'three';
var wallItemUtils = {};

var utils = require('./utils');


wallItemUtils.closestWallEdge =function(item) {

    var wallEdges = item.model.floorplan.wallEdges();

    var wallEdge = null;
    var minDistance = null; 

    var itemX = item.position.x;
    var itemZ = item.position.z;

    utils.forEach(wallEdges, function(edge) {
        var distance = edge.distanceTo(itemX, itemZ);
        if (minDistance === null || distance < minDistance) {
            minDistance = distance;
            wallEdge = edge;
        }
    });

    return wallEdge;
}

wallItemUtils.removed = function(item) {
    if (item.currentWallEdge != null && item.addToWall) {
        utils.removeValue(item.currentWallEdge.wall.items, item);
        item.redrawWall();
    }
}

wallItemUtils.redrawWall = function(item) {
    if (item.addToWall) {
        item.currentWallEdge.wall.fireRedraw();
    }
}

wallItemUtils.updateEdgeVisibility = function(item, visible, front) {
    if (front) {
        item.frontVisible = visible;
    } else {
        item.backVisible = visible;
    }
    item.visible = (item.frontVisible || item.backVisible);
}

wallItemUtils.updateSize = function(item) {
    item.wallOffsetScalar = (item.geometry.boundingBox.max.z - item.geometry.boundingBox.min.z) * item.scale.z / 2.0;
    item.sizeX = (item.geometry.boundingBox.max.x - item.geometry.boundingBox.min.x) * item.scale.x;
    item.sizeY = (item.geometry.boundingBox.max.y - item.geometry.boundingBox.min.y) * item.scale.y;
}

wallItemUtils.resized = function(item) {
    if (item.boundToFloor) {
        item.position.y = 0.5 * (item.geometry.boundingBox.max.y - item.geometry.boundingBox.min.y)  * item.scale.y + 0.01;        
    } 
    else {
         // MOD. Rafa. Desfase de altura para corregirlo y que se muestre 0
         // Se cambia porque se cambia el tamaño

        var previos_desfase = item.desfaseAltura;
        item.desfaseAltura = 0.5 * (item.geometry.boundingBox.max.y - item.geometry.boundingBox.min.y)*item.scale.y + 1;
        item.position.y += (item.desfaseAltura - previos_desfase);
        //console.log("Cambio de altura, desfase: " +  item.desfaseAltura);
        //console.log(item.geometry.boundingBox);
    }

    item.updateSize();
    item.redrawWall();
}

wallItemUtils.setDesfaseAltura = function(item,scale) {
    var factor = 1;
    if (scale != null) {
        factor = scale.y;
    }
    item.desfaseAltura = 0.5 * (item.geometry.boundingBox.max.y - item.geometry.boundingBox.min.y)*factor + 1;
}

wallItemUtils.placeInRoom = function(item) {
    var closestWallEdge = item.closestWallEdge();
    item.changeWallEdge(closestWallEdge);
    item.updateSize();

    if (!item.position_set) {
        // position not set
        var center = closestWallEdge.interiorCenter();
        var newPos = new THREE.Vector3(
            center.x,
            closestWallEdge.wall.height / 2.0,
            center.y);
        item.boundMove(newPos);
        item.position.copy(newPos);
        item.redrawWall();

    }
    // MOD. Rafa. Desfase de altura para corregirlo y que se muestre 0
    //item.desfaseAltura = 0.5 * (item.geometry.boundingBox.max.y - item.geometry.boundingBox.min.y) + 1;

};

wallItemUtils.moveKeyRight = function(item, camera){	
    camera = camera || null;
    var dir = {x:1,y:0,z:0};
    if (camera != null) {
        dir = utils.getCameraDirection(camera,1,0,0);
    }
    var DESPL = 2;
    dir = {
        x: dir.x*DESPL,
        y: dir.y*DESPL,
        z: dir.z*DESPL
    };

    if (!item.fixed){

        //var dir = getCameraDirection(item);
        //console.log(dir);
            var vec3={
                x: item.position.x+dir.x,
                y: item.position.y+dir.y,
                z: item.position.z+dir.z
            }

            // keys=1 para no mostrar la imagen roja erronea
            var keys=1;
            var newPos = new THREE.Vector3(vec3.x,vec3.y,vec3.z);
            item.moveToPosition(newPos,null,keys);
            item.updateHighlight();
            item.scene.needsUpdate = true;
            item.needsUpdate=true;
    }
}

wallItemUtils.moveKeyLeft = function(item, camera){
    camera = camera || null;
    var dir = {x:-1,y:0,z:0};
    if (camera != null) {
        dir = utils.getCameraDirection(camera,-1,0,0);
    }
    var DESPL = 2;
    dir = {
        x: dir.x*DESPL,
        y: dir.y*DESPL,
        z: dir.z*DESPL
    };

    if (!item.fixed){
            //Compruebo el tipo de objeto a mover
            var tipo = item.metadata.itemType;

            //var dir = getCameraDirection(item);
            //console.log(dir);
            var vec3={
                x: item.position.x+dir.x,
                y: item.position.y+dir.y,
                z: item.position.z+dir.z
            }

            // keys=1 para no mostrar la imagen roja erronea
            var keys=1;
            var newPos = new THREE.Vector3(vec3.x,vec3.y,vec3.z);
            item.moveToPosition(newPos,null,keys);
            item.updateHighlight();
            item.scene.needsUpdate = true;
    }
}

wallItemUtils.moveKeyDown = function(item, camera){
    camera = camera || null;
    var dir = {x:0,y:-1,z:0};
    if (camera != null) {
        dir = utils.getCameraDirection(camera,0,-1,0);
    }
    var DESPL = 2;
    dir = {
        x: dir.x*DESPL,
        y: dir.y*DESPL,
        z: dir.z*DESPL
    };
    if (!item.fixed){
            var vec3={
                    x: item.position.x+dir.x,
                    y: item.position.y+dir.y,
                    z: item.position.z+dir.z
            }

            // keys=1 para no mostrar la imagen roja erronea
            var keys=1;
            var newPos = new THREE.Vector3(vec3.x,vec3.y,vec3.z);
            item.moveToPosition(newPos,null,keys);
            item.updateHighlight();
            item.scene.needsUpdate = true;
    }
}

wallItemUtils.moveKeyUp = function(item, camera){
    camera = camera || null;
    var dir = {x:0,y:1,z:0};
    if (camera != null) {
        dir = utils.getCameraDirection(camera,0,1,0);
    }
    var DESPL = 2;
    dir = {
        x: dir.x*DESPL,
        y: dir.y*DESPL,
        z: dir.z*DESPL
    };
    if (!item.fixed){
            var vec3={
                    x: item.position.x+dir.x,
                    y: item.position.y+dir.y,
                    z: item.position.z+dir.z
            }
            // keys=1 para no mostrar la imagen roja erronea
            var keys=1;
            var newPos = new THREE.Vector3(vec3.x,vec3.y,vec3.z);
            item.moveToPosition(newPos,null,keys);
            item.updateHighlight();
            item.scene.needsUpdate = true;
    }
}

wallItemUtils.moveToPosition = function(item, vec3, intersection) {
    if (intersection != null) {
        item.changeWallEdge(intersection.object.edge);
    }
    //console.log('[Before boundMove] ');
    //console.log(vec3);
    item.boundMove(vec3);
    //console.log('[After boundMove] ');
    //console.log(vec3);
    item.position.copy(vec3);
    item.redrawWall();
}

wallItemUtils.getWallOffset = function(item) {
    return item.wallOffsetScalar;
}

wallItemUtils.changeWallEdge = function(item, wallEdge) {
    if (item.currentWallEdge != null) {
        if (item.addToWall) {
            utils.removeValue(item.currentWallEdge.wall.items, item);
            item.redrawWall();
        } else {
            utils.removeValue(item.currentWallEdge.wall.onItems, item);
        }
    }

    // handle subscription to wall being removed
    if (item.currentWallEdge != null) {
        item.currentWallEdge.wall.dontFireOnDelete(item.remove.bind(item));
    }
    wallEdge.wall.fireOnDelete(item.remove.bind(item));

    // find angle between wall normals
    var normal2 = new THREE.Vector2();
    
    /*const tri = new THREE.Triangle(); // for re-use
    const vertex1 = new THREE.Vector3(); // for re-use
    const vertex2 = new THREE.Vector3(); // for re-use
    const vertex3 = new THREE.Vector3(); // for re-use
    const outNormal = new THREE.Vector3(); // this is the output normal you need

    const positionAttribute = wallEdge.plane.geometry.getAttribute('position');
    vertex1.fromBufferAttribute(positionAttribute, 0);
    vertex2.fromBufferAttribute(positionAttribute, 1);
    vertex3.fromBufferAttribute(positionAttribute, 2);
    
    tri.set(vertex1, vertex2, vertex3);

    tri.getNormal(outNormal);*/
    
    const normalAttribute = wallEdge.plane.geometry.getAttribute('normal');
    var normal3 = new THREE.Vector3(); // for re-use
    normal3.fromBufferAttribute(normalAttribute, 0);
    
    //var normal3 = wallEdge.plane.geometry.faces[0].normal;
    normal2.x = normal3.x;
    normal2.y = normal3.z;

    var angle = utils.angle(
        item.refVec.x, item.refVec.y,
        normal2.x, normal2.y);
    item.rotation.y = angle;

    // update currentWall
    item.currentWallEdge = wallEdge;
    if (item.addToWall) {
        wallEdge.wall.items.push(item);  
        item.redrawWall();      
    } else {
        wallEdge.wall.onItems.push(item);  
    }
}

// Returns an array of planes to use other than the ground plane
// for passing intersection to clickPressed and clickDragged
wallItemUtils.customIntersectionPlanes = function(item) {
    return item.model.floorplan.wallEdgePlanes();
}

// takes the move vec3, and makes sure object stays
// bounded on plane
wallItemUtils.boundMove = function(item, vec3) {

    var tolerance = 1;
    var edge =  item.currentWallEdge;
    vec3.applyMatrix4(edge.interiorTransform);

    if (vec3.x < item.sizeX / 2.0 + tolerance) {
        vec3.x = item.sizeX / 2.0 + tolerance;
    } else if (vec3.x > (edge.interiorDistance() - item.sizeX / 2.0 - tolerance)) {
        vec3.x = edge.interiorDistance() - item.sizeX / 2.0 - tolerance;
    }
    //console.log(item.boundToFloor);
    if (item.boundToFloor) {
        vec3.y = 0.5 * ( item.geometry.boundingBox.max.y - item.geometry.boundingBox.min.y ) * item.scale.y + 0.01;        
    } else {
        if (vec3.y < item.sizeY / 2.0 + tolerance) {
            vec3.y = item.sizeY / 2.0 + tolerance;
        } else if (vec3.y > edge.height - item.sizeY / 2.0 - tolerance) {
            vec3.y = edge.height - item.sizeY / 2.0 - tolerance;
        }
    }

    vec3.z = item.getWallOffset();

    vec3.applyMatrix4(edge.invInteriorTransform);
}


module.exports = wallItemUtils;
