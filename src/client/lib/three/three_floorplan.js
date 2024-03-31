import * as THREE from 'three';
var ThreeFloor = require('./three_floor');
var ThreeEdge = require('./three_edge');
var utils = require('../utils/utils')

// THREE.Scene, Blueprint.Floorplan
var ThreeFloorplan = function(scene, floorplan, controls) {

  const scope = this;

  this.scene = scene;
  this.floorplan = floorplan;
  this.controls = controls;

  this.floors = []; // Floor
  this.edges = []; // ThreeEdges

  floorplan.fireOnUpdatedRooms(redraw);

  function redraw() {
    // clear scene
    utils.forEach(scope.floors, function(floor) {
      floor.removeFromScene();
    });
    utils.forEach(scope.edges, function(edge) {
      edge.remove();
    });
    scope.floors = [];
    scope.edges = [];
    scope.mapaTexturas = new Map();

    // draw floors
    utils.forEach(scope.floorplan.getRooms(), function(room) {
      let threeFloor = new ThreeFloor(scene, room);
      scope.floors.push(threeFloor);
      threeFloor.addToScene();
    });

    // draw edges
    utils.forEach(scope.floorplan.wallEdges(), function(edge) { // edge = half-edge
      let threeEdge = new ThreeEdge(
        scene, edge, scope.controls); 
      scope.edges.push(threeEdge);
    });
  }

}

module.exports = ThreeFloorplan;