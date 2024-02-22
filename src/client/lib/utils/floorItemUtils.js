/* 
 * To change item license header, choose License Headers in Project Properties.
 * To change item template file, choose Tools | Templates
 * and open the template in the editor.
 */
var floorItemUtils = {};

var utils = require('./utils');

import * as THREE from 'three';

floorItemUtils.setDesfaseAltura = function(item, scale) {
    var factor = 1;
    if (scale != null) {
        factor = scale.y;
    }
    item.desfaseAltura = 0.5 * ( item.geometry.boundingBox.max.y - item.geometry.boundingBox.min.y )*factor;
}
 
    
floorItemUtils.placeInRoom = function(item) {
    if (!item.position_set) {
        var center = item.model.floorplan.getCenter();
        item.position.x = center.x;
        item.position.z = center.z;
        var factor = 1;

        item.position.y = 0.5 * ( item.geometry.boundingBox.max.y - item.geometry.boundingBox.min.y)*item.scale.y;

        // Si hay altura inicial
        if (item.metadata.altura_inicial && item.metadata.altura_inicial != 0) {
            y = parseFloat(item.metadata.altura_inicial) +  parseFloat(item.desfaseAltura);
            console.log("[AlturaInicia] y " + y + " desfase: " + item.desfaseAltura);
            item.setPosition(item.position.x, y, item.position.z);
            item.getWallDistance();
        }
        // Se fija a true para que la pieza no se mueva tras la inserción
        //item.position_set = true;

        // MOD. Rafa. Desfase de altura para corregirlo y que se muestre 0
        //item.desfaseAltura = item.position.y; 
        //item.lines.position.copy(item.position);
    }
}
    
floorItemUtils.resized = function(item) {
    var previos_desfase = item.desfaseAltura;
    item.desfaseAltura = 0.5 * (item.geometry.boundingBox.max.y - item.geometry.boundingBox.min.y)*item.scale.y;
    item.position.y += (item.desfaseAltura - previos_desfase);
}   

floorItemUtils.moveToPosition = function(item, vec3, intersection, keys) {
    // tolerance to magnet
    //console.log("FloorItem.moveToPosition");
   var snap;
   var magnet = item.model.scene.magnet;
   if (magnet){
           snap = item.model.scene.magnet_snap;
           snap = parseInt(snap);

           var flag = false;

           var ovx=vec3.x;
           var ovz=vec3.z;	

           //+x
           vec3.x = vec3.x + snap;
           if (!item.isValidPosition(vec3)) {
                   for (var i=0;i<snap;i++){
                           vec3.x = vec3.x - 1;
                           if (item.isValidPosition(vec3)) {
                                   //he pegado la x
                                   //compruebo si tengo que pegar la +z
                                   vec3.z = vec3.z + snap;
                                   if (!item.isValidPosition(vec3)) {
                                           for (var i=0;i<snap;i++){
                                                   vec3.z = vec3.z - 1;
                                                   if (item.isValidPosition(vec3)) {
                                                           break;
                                                   }
                                           }
                                   }else{
                                           //he pegado la x
                                           //compruebo si tengo que pegar la -z
                                           vec3.z = ovz;
                                           vec3.z = vec3.z - snap;
                                           if (!item.isValidPosition(vec3)) {
                                                   for (var i=0;i<snap;i++){
                                                           vec3.z = vec3.z + 1;
                                                           if (item.isValidPosition(vec3)) {
                                                                   break;
                                                           }
                                                   }
                                           }else{
                                                   vec3.z = ovz;
                                           }
                                   }
                                   break;
                           }
                   }
           }else{
                   //-x
                   vec3.x = ovx;
                   vec3.x = vec3.x - snap;
                   if (!item.isValidPosition(vec3)) {
                           for (var i=0;i<snap;i++){
                                   vec3.x = vec3.x + 1;
                                   if (item.isValidPosition(vec3)) {
                                           //he pegado la x
                                           //compruebo si tengo que pegar la +z
                                           vec3.z = vec3.z + snap;
                                           if (!item.isValidPosition(vec3)) {
                                                   for (var i=0;i<snap;i++){
                                                           vec3.z = vec3.z - 1;
                                                           if (item.isValidPosition(vec3)) {
                                                                   break;
                                                           }
                                                   }
                                           }else{
                                                   //he pegado la x
                                                   //compruebo si tengo que pegar la -z
                                                   vec3.z = ovz;
                                                   vec3.z = vec3.z - snap;
                                                   if (!item.isValidPosition(vec3)) {
                                                           for (var i=0;i<snap;i++){
                                                                   vec3.z = vec3.z + 1;
                                                                   if (item.isValidPosition(vec3)) {
                                                                           break;
                                                                   }
                                                           }
                                                   }else{
                                                           vec3.z = ovz;
                                                   }
                                           }
                                           break;
                                   }
                           }
                   }else{
                           vec3.x = ovx;
                           //+z
                           vec3.z = vec3.z + snap;
                           if (!item.isValidPosition(vec3)) {
                                   for (var i=0;i<snap;i++){
                                           vec3.z = vec3.z - 1;
                                           if (item.isValidPosition(vec3)) {
                                                   // he pegado la z
                                                   //compruebo si tengo que pegar la x
                                                   break;
                                           }
                                   }
                           }else{
                                   vec3.z = ovz;
                                   //-y
                                   vec3.z = vec3.z - snap;
                                   if (!item.isValidPosition(vec3)) {
                                           for (var i=0;i<snap;i++){
                                                   vec3.z = vec3.z + 1;
                                                   if (item.isValidPosition(vec3)) {
                                                           break;
                                                   }
                                           }
                                   }else{
                                           vec3.z = ovz;
                                   }
                           }

                   }
           } 
   }

   // keeps the position in the room and on the floor
   if (!item.isValidPosition(vec3,intersection)) {
       //console.log("La posicion (" + vec3.x + "," + vec3.y + "," + vec3.z + ") no es válida");
       // Si keys es 0 es porque se esta moviendo con las teclas
       if (keys==0)
               item.showError(vec3);
       return;
   } else {
       // Si keys es 0 es porque se esta moviendo con las teclas
       if (keys==0)
               item.hideError();
       vec3.y = item.position.y; // keep it on the floor!
       item.position.copy(vec3);
       //item.lines.position.copy(vec3);
   }
//    item.getWallDistance();
}

floorItemUtils.isValidPosition = function(item,vec3,intersection) {
   intersection = intersection || null;
   var corners = item.getCorners('x', 'z', vec3);
//    for (key in corners){
//    	for (val in corners[key])
//    		console.log("key="+key+", val="+val+", value="+corners[key][val])
//    }

   // check if we are in a room
   var rooms = item.model.floorplan.getRooms();
   var isInARoom = false;

   for (var i = 0; i < rooms.length; i++) {
       if(utils.pointInPolygon(vec3.x, vec3.z, rooms[i].interiorCorners,undefined, undefined,item.model.scene) &&
           !utils.polygonPolygonIntersect(corners, rooms[i].interiorCorners,item.model.scene)) {
           isInARoom = true;
           //            console.log("Pieza=vec3.x="+vec3.x+", vec3.z="+vec3.z)
       }
   }
   if (!isInARoom) {
       //console.log('object not in a room');
       /*if (intersection != null) {
           console.log("Antes Pieza=vec3.x="+vec3.x+", vec3.z="+vec3.z)
           item.boundMove(vec3);
           console.log("Despues Pieza=vec3.x="+vec3.x+", vec3.z="+vec3.z)
           item.position.copy(vec3);
       }*/
       //console.log(intersection);
       return false;
   }

   // Comprobar colisiones con los demas objetos del suelo
   var col = item.model.scene.colisiones;
   if (col){
           if (item.obstructFloorMoves) {
               var objects = item.model.scene.getItems();
               for (var i = 0; i < objects.length; i++) {
                   if (objects[i] === item || !objects[i].obstructFloorMoves) {
                       continue;
                   }
                   if (!utils.polygonOutsidePolygon(corners, objects[i].getCorners('x', 'z')) ||
                       utils.polygonPolygonIntersect(corners, objects[i].getCorners('x', 'z'))) {
                       // console.log('object not outside other objects');
                       return false;
                   }
               }
           }
   }

   return true;


   // Comprobar colisiones con los demas objetos del suelo
   /*var col = item.model.scene.colisiones;
   if (col){
           if (item.obstructFloorMoves) {
               var objects = item.model.scene.getItems();

               var objectsToIntersect = [];
               for (var i = 0; i < objects.length; i++) {
                   if (!(objects[i] === item || !objects[i].obstructFloorMoves)) {
                       objectsToIntersect.push(objects[i]);
                   }
               }

               for (var i = 0; i < objects.length; i++) {
                   if (objects[i] === item || !objects[i].obstructFloorMoves) {
                       continue;
                   }
                   //console.log("Item: " + objects[i].metadata.itemName);
                   if (!utils.polygonOutsidePolygon(corners, objects[i].getCorners('x', 'z')) ||
                       utils.polygonPolygonIntersect(corners, objects[i].getCorners('x', 'z'))) {

                       // medir tiempo
                       var t0 = performance.now();
                       var salida = utils.raycastAllVerticesObject(item.geometry.vertices,item.matrix,item.position,objectsToIntersect);
                       var t1 = performance.now();
                       console.log("Raycast: " + (t1 - t0) + " milliseconds.");

                       if (!salida) {
                           console.log('object not outside other objects');
                       }
                       return salida;
                   }
               }
           }
   }

   return true;*/
}

floorItemUtils.boundMove = function(item,vec3) {
   var tolerance = 1;

   var edge =  item.closestWallEdgeCorners(vec3);
   //vec3.applyMatrix4(edge.interiorTransform);

   /*if (vec3.x < item.sizeX / 2.0 + tolerance) {
       vec3.x = item.sizeX / 2.0 + tolerance;
   } else if (vec3.x > (edge.interiorDistance() - item.sizeX / 2.0 - tolerance)) {
       vec3.x = edge.interiorDistance() - item.sizeX / 2.0 - tolerance;
   }

   //console.log(item.boundToFloor);

   if (vec3.y < item.sizeY / 2.0 + tolerance) {
       vec3.y = item.sizeY / 2.0 + tolerance;
   } else if (vec3.y > obj.height - item.sizeY / 2.0 - tolerance) {
       vec3.y = obj.height - item.sizeY / 2.0 - tolerance;
   }*/
   var p1 = edge.interiorStart();
   var p2 = edge.interiorEnd();

   var p_line = utils.closestPointOnLine(vec3.x,vec3.z, 
                           p1.x, p1.y, 
                           p2.x, p2.y);
   vec3.x = p_line.x;
   vec3.z = p_line.y;


       //console.log("idxRoom: " + idxRoom);
       // Nuevos vertices 
       /*var corners = item.getCorners('x', 'z', vec3);

       var cornersOut = [];
       var room = edge.room;
       for (var j=0; j < corners.length; j++) {
           var c = corners[j];
           if(!utils.pointInPolygon(c.x, c.y, room.interiorCorners)) {
               cornersOut.push(c);
           }
       }

       console.log(cornersOut.length);
       var farCorner = null;
       var maxDistance = null; 
       for (var j=0; j < cornersOut.length; j++) {
           var c = cornersOut[j];
           var distance = edge.distanceTo(c.x, c.y);
           if (maxDistance === null || distance > maxDistance) {
               maxDistance = distance;
               farCorner = c;
           }
       }
       vec3.x = vec3.x + (vec3.x - farCorner.x);
       vec3.z = vec3.z + (vec3.z - farCorner.y);*/
   //}        

   //var center = edge.interiorCenter();
   //vec3.z = center.y;

   //vec3.applyMatrix4(edge.invInteriorTransform);
}

floorItemUtils.isValidPosition_new = function(item,vec3) {
   var corners = item.getCorners('x', 'z', vec3);
//    for (key in corners){
//    	for (val in corners[key])
//    		console.log("key="+key+", val="+val+", value="+corners[key][val])
//    }

   // check if we are in a room
   var rooms = item.model.floorplan.getRooms();
   var isInARoom = false;
   for (var i = 0; i < rooms.length; i++) {
       if(utils.pointInPolygon(vec3.x, vec3.z, rooms[i].interiorCorners) &&
           !utils.polygonPolygonIntersect(corners, rooms[i].interiorCorners)) {
           isInARoom = true;

//            console.log("Pieza=vec3.x="+vec3.x+", vec3.z="+vec3.z)

       }
   }
   if (!isInARoom) {
       // console.log('object not in a room');
       return false;
   }

   // Comprobar colisiones con los demas objetos del suelo
   var col = item.model.scene.colisiones;
   if (col){
           if (item.obstructFloorMoves) {

               var objects = item.model.scene.getItems();

               for (var vertexIndex = 0; vertexIndex < item.geometry.vertices.length; vertexIndex++)
               {       
                   var localVertex = item.geometry.vertices[vertexIndex].clone();
                   var globalVertex = item.matrix.multiplyVector3(localVertex);
                   var directionVector = globalVertex.sub( item.position );

                   var raycaster = new THREE.Raycaster(item.position, directionVector.clone().normalize());
                   var collisionResults = raycaster.intersectObjects( objects );
                   if ( collisionResults.length > 0 && collisionResults[0].distance < directionVector.length() ) 
                   {
                       return false;
                   }
               }

           }
   }

   return true;

}

module.exports = floorItemUtils;
