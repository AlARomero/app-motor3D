var JQUERY = require('jquery');
import * as THREE from 'three';

var Wall = require('./wall');
var Corner = require('./corner');
var Room = require('./room');
var HalfEdge = require('./half_edge');

var utils = require('../utils/utils');

var Floorplan = function() {

  var scope = this;

  var walls = [];
  var corners = [];
  var rooms = [];

  const roomsAltitude = {};  // Room Uuid -> altitude
  
  // For debug
  var interiorPoints = [];
  
  
  // Track floor textures here, since rooms are destroyed and
  // created each time we change the floorplan.
  this.floorTextures = {};

  var new_wall_callbacks = JQUERY.Callbacks();
  var new_corner_callbacks = JQUERY.Callbacks();
  var redraw_callbacks = JQUERY.Callbacks();
  var updated_rooms = JQUERY.Callbacks();
  this.roomLoadedCallbacks = JQUERY.Callbacks();

  var defaultTolerance = 10.0;

  // hack
  this.wallEdges = function() {
    var edges = [];
    utils.forEach(walls, function(wall) {
      if (wall.frontEdge) {
        edges.push(wall.frontEdge);
      }
      if (wall.backEdge) {
        edges.push(wall.backEdge);
      }
    });
    return edges;
  }

  // hack
  this.wallEdgePlanes = function() {
    var planes = [];
    utils.forEach(walls, function(wall) {
      if (wall.frontEdge) {
        planes.push(wall.frontEdge.plane);
      }
      if (wall.backEdge) {
        planes.push(wall.backEdge.plane);
      }
    });
    return planes;
  }

  this.floorPlanes = function() {
    return utils.map(rooms, function(room) {
      return room.floorPlane;
    });
  }

  this.fireOnNewWall = function(callback) {
    new_wall_callbacks.add(callback);
  }

  this.fireOnNewCorner = function(callback) {
    new_corner_callbacks.add(callback);
  }

  this.fireOnRedraw = function(callback) {
    redraw_callbacks.add(callback);
  }

  this.fireOnUpdatedRooms = function(callback) {
    updated_rooms.add(callback);
  }

  this.newWall = function(start, end) {
    var wall = new Wall(start, end);
    walls.push(wall);
    wall.fireOnDelete(removeWall);
    new_wall_callbacks.fire(wall);
    scope.update();
    return wall;
  }
  
  this.mergeWallsWithCommonInteriorPoints = function(wall) {
      // check walls
    for( var i = 0; i < scope.getWalls().length; i++ ) {
      obj = scope.getWalls()[i];
      if (wall != obj) {
         var commonInteriorPoints = obj.matchedInteriorPoints(wall.getInteriorPoints()); 
         if (commonInteriorPoints.length > 1) {
             //rectasParalelas, borramos un muro 
             // obj.remove
             
         } else if (commonInteriorPoints.length > 0) {
             var c1 = obj.getClosestCorner(commonInteriorPoints[0]);
             var c2 = wall.getClosestCorner(commonInteriorPoints[0]);
             
             w1start = obj.oppositeCorner(c1);
             w1end = c1;
             w2start = c2;
             w2end = wall.oppositeCorner(c2);
             
             /*var vec = utils.commonPointTwoLines(w1start,w1end,w2start,w2end,wall.thickness/2);
             var newPoint = {
                 x: c1.x + vec.x,
                 y: c1.y + vec.y
             };*/
             
             var newPoint = utils.lineIntersect2(w1start,w1end,w2start,w2end);
             
                     
                     
             
             //this.newCorner(newPoint.x, newPoint.y, null,0);
             c1.move(newPoint.x,newPoint.y);
             c2.combineWithCorner(c1);
             scope.update();
             return true;
         }
      }
      
       
    }         
  }
  
  this.getHeightWall = function() {
    return walls[0].getHeight();
  }

  function removeWall(wall) {
    utils.removeValue(walls, wall);
    scope.update();
  }

  this.newCorner = function(x, y, id, merge, tolerance) {
    var corner = new Corner(this, x, y, id, merge, tolerance);
    corners.push(corner);
    corner.fireOnDelete(removeCorner);
    new_corner_callbacks.fire(corner);
    return corner;
  }

  function removeCorner(corner) {
    utils.removeValue(corners, corner);
  }

  // for debug  
  this.addInteriorPoint = function(p) {
      interiorPoints.push(p);
  }
  this.getInteriorPoints = function() {
      return interiorPoints;
  }
  
  this.getWalls = function() {
    return walls;
  }

  this.getCorners = function() {
    return corners;
  }

  this.getRooms = function() {
    return rooms;
  }

  this.overlappedCorner = function(x, y, tolerance) {
    tolerance = tolerance || defaultTolerance;
    //console.log("Tolerancia: " + tolerance);
    for (let i = 0; i < corners.length; i++) {
      if (corners[i].distanceFrom(x, y) < tolerance) {
        // console.log("got corner")
        return corners[i];
      }      
    }
    return null;
  }

  this.overlappedWall = function(x, y, tolerance) {
    tolerance = tolerance || defaultTolerance;
    for (let i = 0; i < walls.length; i++) {
      if (walls[i].distanceFrom(x, y) < tolerance) {
        return walls[i];
      }      
    }
    return null;
  }

  // import and export -- cleanup

  this.saveFloorplan = function() {
    var floorplan = {
      corners: {},
      walls: [],
      wallTextures: [],
      floorTextures: {}
    }
    utils.forEach(corners, function(corner) {
      floorplan.corners[corner.id] = {
        'x': corner.x,
        'y': corner.y
      };
    });
    utils.forEach(walls, function(wall) {
      floorplan.walls.push({
        'corner1': wall.getStart().id,
        'corner2': wall.getEnd().id,
        'frontTexture': wall.frontTexture,
        'backTexture': wall.backTexture,
        'height': wall.height
      });
    });
    floorplan.newFloorTextures = this.floorTextures;
    return floorplan;
  }

  this.loadFloorplan = function( floorplan ) {
    this.reset();
    //console.log("Estoy en loadFloorplan");
    var corners = {};
    if (floorplan == null || !('corners' in floorplan) || !('walls' in floorplan)) {
      return
    } 
    for (var id in floorplan.corners) {
      var corner = floorplan.corners[id];
      corners[id] = this.newCorner(corner.x, corner.y, id);
    }
    utils.forEach(floorplan.walls, function(wall) {
      var newWall = scope.newWall(
        corners[wall.corner1], corners[wall.corner2]);
      if (wall.frontTexture) {
        newWall.frontTexture = wall.frontTexture;
      }
      if (wall.backTexture) {
        newWall.backTexture = wall.backTexture;
      }
      if (wall.height) {
          newWall.height = parseFloat(wall.height);
      }
    });

    if ('newFloorTextures' in floorplan) {
      //console.log("Actualizo floorTextures " + floorplan.newFloorTextures);  
      this.floorTextures = floorplan.newFloorTextures;
    }

    this.update();    
    this.roomLoadedCallbacks.fire();
  }

  this.getFloorTexture = function(uuid) {
      //console.log("Estoy en getFloorTexture " + uuid);
      //console.log("Estoy en getFloorTexture " + this.floorTextures);
    if (uuid in this.floorTextures) {
      return this.floorTextures[uuid];
    } else {
      return null;
    }
  }

  this.setFloorTexture = function(uuid, url, scale, additionalTextures) {
    if (additionalTextures !== undefined) {
        this.floorTextures[uuid] = {
          url: url,
          scale: scale,
          url_norm: additionalTextures.texture_NORM,
          url_occ: additionalTextures.texture_OCC,
          url_rough: additionalTextures.texture_ROUGH,
          url_disp: additionalTextures.texture_DISP
        };
    } else {
        this.floorTextures[uuid] = {
          url: url,
          scale: scale
        };
    }
  }

  // clear out obsolete floor textures
  function updateFloorTextures() {
    var uuids = utils.map(rooms, function(room) {
      return room.getUuid();
    });
    for (var uuid in scope.floorTextures) {
      if (!utils.hasValue(uuids, uuid)) {
        delete scope.floorTextures[uuid]
      }
    }
  }

  this.reset = function() {
    var tmpCorners = corners.slice(0);
    var tmpWalls = walls.slice(0);
    utils.forEach(tmpCorners, function(c) {
      c.remove();
    })
    utils.forEach(tmpWalls, function(w) {
      w.remove();
    })
    corners = [];
    walls = [];
  }

  this.changeRoomAltitude = function(uuid, altitude) {
    roomsAltitude[uuid] = altitude;

    this.update();
  }

  function getUuidByCorners(corners) {
    var cornerUuids = utils.map(corners, function(c) {
      return c.id;
    });
    cornerUuids.sort();
    return cornerUuids.join();    
  }

  // update rooms
  this.update = function() {

    utils.forEach(walls, function(wall) {
      wall.resetFrontBack();
    });

    var roomCorners = findRooms(corners);
    rooms = [];
    utils.forEach(roomCorners, function(corners) {
      const newRoom = new Room(scope, corners, roomsAltitude[getUuidByCorners(corners)]);
      console.log(getUuidByCorners(corners))
      rooms.push(newRoom);
    });
    assignOrphanEdges();

    updateFloorTextures();
    updated_rooms.fire();
  }

  // returns the center of the floorplan in the y-plane
  this.getCenter = function() {
    return this.getDimensions(true);
  }

  this.getSize = function() {
    return this.getDimensions(false);
  }

  this.getDimensions = function(center) {
    center = center || false; // otherwise, get size

    var xMin = Infinity;
    var xMax = -Infinity;
    var zMin = Infinity;
    var zMax = -Infinity;
    utils.forEach(corners, function(c) {
      if (c.x < xMin) xMin = c.x;
      if (c.x > xMax) xMax = c.x;
      if (c.y < zMin) zMin = c.y;
      if (c.y > zMax) zMax = c.y;
    });
    var ret;
    if (xMin == Infinity || xMax == -Infinity || zMin == Infinity || zMax == -Infinity) {
        ret = new THREE.Vector3();
    } else {
      if (center) {
        // center
        ret = new THREE.Vector3( (xMin + xMax) * 0.5, 0, (zMin + zMax) * 0.5 );
      } else {
        // size
        ret = new THREE.Vector3( (xMax - xMin), 0, (zMax - zMin) );        
      }
    }
    return ret;
  }


  function assignOrphanEdges() {
    // kinda hacky
    // find orphaned wall segments (i.e. not part of rooms) and
    // give them edges
    var orphanWalls = []
    utils.forEach(walls, function(wall) {
      if (!wall.backEdge && !wall.frontEdge) {
        wall.orphan = true;
        var back = new HalfEdge(null, wall, false);
        back.generatePlane();
        var front = new HalfEdge(null, wall, true);
        front.generatePlane();
        orphanWalls.push(wall);
      }
    });

  }

};

/*
 * Find the "rooms" in our planar straight-line graph. Rooms are set of the
 * smallest (by area) possible cycles in this graph.
 */
// corners has attributes: id, x, y, adjacents
function findRooms(corners) {

  function calculateTheta(previousCorner, currentCorner, nextCorner) {
    var theta = utils.angle2pi(
      previousCorner.x - currentCorner.x,
      previousCorner.y - currentCorner.y,
      nextCorner.x - currentCorner.x,
      nextCorner.y - currentCorner.y);
    return theta;
  }
  
  function removeDuplicateRooms(roomArray) {
    var results = [];
    var lookup = {};
    var hashFunc = function(corner) {
      return corner.id 
    };
    var sep = '-';
    for (var i = 0; i < roomArray.length; i++) {
      // rooms are cycles, shift it around to check uniqueness
      var add = true;
      var room = roomArray[i];
      for (var j = 0; j < room.length; j++) {
        var roomShift = utils.cycle(room, j);
        var str = utils.map(roomShift, hashFunc).join(sep);
        if (lookup.hasOwnProperty(str)) {
          add = false;
        }
      }
      if (add) {
        results.push(roomArray[i]);
        lookup[str] = true;
      }
    }
    return results; 
  }
  
  function findTightestCycle(firstCorner, secondCorner) {
    var stack = [];
    var next = {
      corner: secondCorner,
      previousCorners: [firstCorner]
    };
    var visited = {};
    visited[firstCorner.id] = true;

    while ( next ) {  
      // update previous corners, current corner, and visited corners
      var currentCorner = next.corner;
      visited[currentCorner.id] = true; 
    
      // did we make it back to the startCorner?
      if ( next.corner === firstCorner && currentCorner !== secondCorner ) {
        return next.previousCorners;  
      }
      
      var addToStack = [];
      var adjacentCorners = next.corner.adjacentCorners();  
      for ( var i = 0; i < adjacentCorners.length; i++ ) {
        var nextCorner = adjacentCorners[i];
            
        // is this where we came from?
        // give an exception if its the first corner and we aren't at the second
		// corner
        if ( nextCorner.id in visited &&  
          !( nextCorner === firstCorner && currentCorner !== secondCorner )) {
          continue;
        }
        
        // nope, throw it on the queue
        addToStack.push( nextCorner );  
      }
    
      var previousCorners = next.previousCorners.slice(0);
      previousCorners.push( currentCorner );  
      if (addToStack.length > 1) {  
        // visit the ones with smallest theta first
        var previousCorner = next.previousCorners[next.previousCorners.length - 1];
        addToStack.sort(function(a,b) {
          return (calculateTheta(previousCorner, currentCorner, b) -
              calculateTheta(previousCorner, currentCorner, a));
        });
      }
    
      if (addToStack.length > 0) {
        // add to the stack
        utils.forEach(addToStack, function(corner) {
          stack.push({
            corner: corner,
            previousCorners: previousCorners
          });   
        });
      }
    
      // pop off the next one
      next = stack.pop();
    }
    return [];  
  }

  // find tightest loops, for each corner, for each adjacent
  // TODO: optimize this, only check corners with > 2 adjacents, or isolated
	// cycles
  var loops = [];
  for (var i = 0; i < corners.length; i++) {
    var firstCorner = corners[i];
    var adjacentCorners = firstCorner.adjacentCorners();
    for (var j = 0; j < adjacentCorners.length; j++) {
      var secondCorner = adjacentCorners[j];
      loops.push(findTightestCycle(firstCorner, secondCorner));
    }
  }
  // remove duplicates
  var uniqueLoops = removeDuplicateRooms(loops);
  // remove CW loops
  //console.log("start removeIf");
  var uniqueCCWLoops = utils.removeIf(uniqueLoops, utils.isClockwise);

  // utils.forEach(uniqueCCWLoops, function(loop) {
  // console.log("LOOP");
  // utils.forEach(loop, function(corner) {
  // console.log(corner.id);
  // });
  // });
  return uniqueCCWLoops;
}

module.exports = Floorplan;