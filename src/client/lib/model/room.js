var JQUERY = require('jquery');
import * as THREE from 'three';

var utils = require('../utils/utils')

/*
 * TODO var Vec2 = require('vec2') var segseg = require('segseg') var Polygon =
 * require('polygon')
 */

var HalfEdge = require('./half_edge')

var Room = function(floorplan, corners, altitude = 0, transparence = false) {
 
  var scope = this;

  // ordered CCW
  var floorplan = floorplan;
  this.corners = corners;

  this.interiorCorners = [];
  this.edgePointer = null;

  this.altitude = altitude;
  this.transparence = transparence;
  
  // floor plane for intersection testing
  this.floorPlane = null;

  this.customTexture = false;

  var defaultTexture = {
    url: "assets/img/_SUELO_01_TARIMA_GRIS.jpg",
    scale: 300
  }

  var floorChangeCallbacks = JQUERY.Callbacks();

  updateWalls();
  //refineWalls();
  updateInteriorCorners();
  generatePlane();

  this.getUuid = function() {
    var cornerUuids = utils.map(this.corners, function(c) {
      return c.id;
    });
    cornerUuids.sort();
    return cornerUuids.join();
  }

  this.fireOnFloorChange = function(callback) {
    floorChangeCallbacks.add(callback);
  }

  this.getTexture = function() {
    var uuid = this.getUuid();
    var tex = floorplan.getFloorTexture(uuid);
    return tex || defaultTexture;
  }

  this.getFloorplan = function() {
    return floorplan;
  }

  // textureStretch always true, just an argument for consistency with walls
  this.setTexture = function(textureUrl, textureStretch, textureScale,additionalTextures) { 
    var uuid = this.getUuid();
    floorplan.setFloorTexture(uuid, textureUrl, textureScale, additionalTextures);
    floorChangeCallbacks.fire();
  }
  
  this.getCenter = function(center) {
    center = center || false; // otherwise, get size

    var xMin = Infinity;
    var xMax = -Infinity;
    var zMin = Infinity;
    var zMax = -Infinity;
    utils.forEach(this.corners, function(c) {
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
  
  function generatePlane() {
    var points = [];
    utils.forEach( scope.interiorCorners, function(corner) {
        points.push(new THREE.Vector2(
          corner.x, 
          corner.y));
    });
    var shape = new THREE.Shape(points);
    var geometry = new THREE.ShapeGeometry(shape);
    scope.floorPlane = new THREE.Mesh(geometry,
      new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide
      }));
    scope.floorPlane.visible = true;
    scope.floorPlane.position.set(scope.floorPlane.position.x, scope.altitude, scope.floorPlane.position.z);
    scope.floorPlane.rotation.set(Math.PI/2, 0, 0);
    scope.floorPlane.room = scope; // js monkey patch
  }

  function cycleIndex(ind) {
    if (ind < 0) {
      return ind += scope.corners.length;
    } else {
      return ind % scope.corners.length;
    }
  }

  function updateInteriorCorners() {
    var edge = scope.edgePointer;
    while (true) {
      scope.interiorCorners.push(edge.interiorStart());
      edge.generatePlane();
      if (edge.next === scope.edgePointer) {
        break;
      } else {
        edge = edge.next;
      }
    }
  }

  // populates each wall's half edge relating to this room
  // this creates a fancy doubly connected edge list (DCEL)
  function updateWalls() {

    var prevEdge = null;
    var firstEdge = null;

    for (let i = 0; i < corners.length; i++) {

      var firstCorner = corners[i];
      var secondCorner = corners[(i + 1) % corners.length];

      // find if wall is heading in that direction
      var wallTo = firstCorner.wallTo(secondCorner);
      var wallFrom = firstCorner.wallFrom(secondCorner);
      if (wallTo) {
        var edge = new HalfEdge(scope, wallTo, true, scope.altitude);
      } else if (wallFrom) {
        var edge = new HalfEdge(scope, wallFrom, false, scope.altitude);
      } else {
        // something horrible has happened
        console.log("corners arent connected by a wall, uh oh");
      }

      if (i == 0) {
        firstEdge = edge;
      }  else {
        edge.prev = prevEdge;
        prevEdge.next = edge;
        if (i + 1 == corners.length) {
          firstEdge.prev = edge;
          edge.next = firstEdge;
        }
      }
      prevEdge = edge;
    }

    // hold on to an edge reference
    scope.edgePointer = firstEdge;
  }
  
  function contarDifWalls() {
    var contar = 0;
    for (i = 0; i < corners.length; i++) {

        var firstCorner = corners[i];
        var secondCorner = corners[(i + 1) % corners.length];

        // find if wall is heading in that direction
        var wallTo = firstCorner.wallTo(secondCorner);
        var wallFrom = firstCorner.wallFrom(secondCorner);
        var j = i+1;
        if (wallTo) {
          if (wallTo.getFixedInteriorDistance() != -1) {
              d_eje = wallTo.getFixedInteriorDistance();
              var dif = d_eje - wallTo.distanciaParcial();
              console.log(i + " " + j + ": " + d_eje + ", " +wallTo.distanciaParcial() + "; dif: " + dif);  
              
              if (Math.abs(dif) > 0.05) {
                contar++;
              }
          }

        } else if (wallFrom) {
          if (wallFrom.getFixedInteriorDistance() != -1) {
              d_eje = wallFrom.getFixedInteriorDistance();
              var dif = d_eje - wallFrom.distanciaParcial();
              console.log(i + " " + j + ": " + d_eje + ", " +wallFrom.distanciaParcial() + "; dif: " + dif);  
              
              if (Math.abs(dif) > 0.05) {
                contar++;
              }
          }
        } else {
          // something horrible has happened
          console.log("corners arent connected by a wall, uh oh");
        }

    }
    return contar;
  }
  
  function refineWalls2() {
    var walls = floorplan.getWalls();
    if (walls != null) {
        utils.forEach(walls, function(wall) {
          if (wall.getFixedInteriorDistance() != -1) {
            d = wall.getFixedInteriorDistance();  
            console.log("REFINEWALLS2: " + d);
            var len;
            if (wall.backEdge) {
                len = wall.backEdge.interiorDistance();
            } else {
                len = wall.frontEdge.interiorDistance();
            }

            var dif = d - len; 
            wall.moveLeftCorner(dif);
            //updateTarget();
          }
        });
    }
  }
  
  function refineWalls() {
    
    
    var ok = false;
    var cont = 1;
    while (!ok) {
        console.log("----- Vuelta " + cont);
    
        var encontradaDiferencia = false;
        for (i = 0; i < corners.length; i++) {

          var firstCorner = corners[i];
          var secondCorner = corners[(i + 1) % corners.length];

          // find if wall is heading in that direction
          var wallTo = firstCorner.wallTo(secondCorner);
          var wallFrom = firstCorner.wallFrom(secondCorner);
          var j = i+1;
          if (wallTo) {
            var d_eje = wallTo.distanciaEje();
            console.log(i + " " + j + ": " + d_eje);  
            if (wallTo.getFixedInteriorDistance() != -1) {
                d_eje = wallTo.getFixedInteriorDistance();
                console.log("[BEFORE end interior] " + i + " " + j + ": " + wallTo.distanciaParcial());  
                var dif_inicial = d_eje - wallTo.distanciaParcial();
                var dif = dif_inicial;
                console.log("DIF: " + dif); 
                while (Math.abs(dif) > 0.05) {
                    console.log("DIF: " + dif); 
                    wallTo.moveRightCorner(dif.toFixed(3));
                    console.log("[interior] " + i + " " + j + ": " + wallTo.distanciaParcial());  
                    if (Math.abs(dif) < Math.abs(d_eje - wallTo.distanciaParcial())) {
                        dif = - (d_eje - wallTo.distanciaParcial());
                    } else {
                        dif = (d_eje - wallTo.distanciaParcial());
                    }
                }
                if (Math.abs(dif_inicial) > 0.05) {
                    encontradaDiferencia = true;
                    break;
                } 
            }

          } else if (wallFrom) {
            var d_eje = wallFrom.distanciaEje();

            console.log(i + " " + j + ": " + d_eje);  
            if (wallFrom.getFixedInteriorDistance() != -1) {
                d_eje = wallFrom.getFixedInteriorDistance();
                console.log("[BEFORE start interior] " +  i + " " + j + ": " + wallFrom.distanciaParcial()); 
                var dif_inicial = d_eje - wallFrom.distanciaParcial();
                var dif = dif_inicial;
                console.log("DIF: " + dif); 
                while (Math.abs(dif) > 0.05) {
                    console.log("DIF: " + dif); 
                    wallFrom.moveLeftCorner(dif.toFixed(3));
                    console.log("[interior] " +  i + " " + j + ": " + wallFrom.distanciaParcial()); 
                    if (Math.abs(dif) < Math.abs(d_eje - wallFrom.distanciaParcial())) {
                        dif = - (d_eje - wallFrom.distanciaParcial());
                    } else {
                        dif = (d_eje - wallTo.distanciaParcial());
                    }
                }
                if (Math.abs(dif_inicial) > 0.05) {
                    encontradaDiferencia = true;
                    break;
                }
            }
          } else {
            // something horrible has happened
            console.log("corners arent connected by a wall, uh oh");
          }

        }
        var numDifs = contarDifWalls();
        console.log("Num. muros diferentes a la long. interior: " + numDifs);
        ok = numDifs == 0;
        //ok = true;
        cont = cont + 1;
    }
  }
  
  

}

module.exports = Room;